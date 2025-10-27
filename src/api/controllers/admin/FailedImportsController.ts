import { Request, ResponseToolkit } from '@hapi/hapi';
import Boom from '@hapi/boom';
import { AppContext } from '../../AppContext';
import { userSchema } from '../../../types/schemas';
import { logger } from '../../../utils/logger';

export class FailedImportsController {
  constructor(private context: AppContext) {}

  async list(request: Request, h: ResponseToolkit) {
    const query = request.query as any;

    const range = query.range ? JSON.parse(query.range) : [0, 19];
    const sort = query.sort ? JSON.parse(query.sort) : ['attempted_at', 'DESC'];
    const filter = query.filter ? JSON.parse(query.filter) : {};

    const [start, end] = range;
    const limit = end - start + 1;
    const skip = start;
    const [sortField, sortOrder] = sort;

    const result = await this.context.services.failedImport.findAll(
      filter,
      { skip, limit },
      { field: sortField, order: sortOrder }
    );

    const response = h.response(result);
    response.header('Content-Range', `failed-imports ${start}-${end}/${result.total}`);
    response.header('Access-Control-Expose-Headers', 'Content-Range');

    return response;
  }

  async getById(request: Request) {
    try {
      const failedImport = await this.context.services.failedImport.findById(request.params.id);
      return { data: failedImport };
    } catch (error) {
      throw Boom.notFound('Failed import not found');
    }
  }

  async update(request: Request) {
    const { raw_data, notes } = request.payload as any;

    try {
      JSON.parse(raw_data);
    } catch (error) {
      throw Boom.badRequest('Invalid JSON: ' + (error instanceof Error ? error.message : 'Parse error'));
    }

    try {
      const updated = await this.context.services.failedImport.update(request.params.id, {
        raw_data,
        notes,
        status: 'failed'
      });

      logger.info(`Admin edited failed import ${request.params.id}`);

      return { data: updated };
    } catch (error) {
      throw Boom.notFound('Failed import not found');
    }
  }

  async retry(request: Request) {
    let failedImport;
    try {
      failedImport = await this.context.services.failedImport.findById(request.params.id);
    } catch (error) {
      throw Boom.notFound('Failed import not found');
    }

    await this.context.services.failedImport.incrementRetryCount(request.params.id);

    try {
      let parsed;
      try {
        parsed = JSON.parse(failedImport.raw_data);
      } catch (parseError) {
        throw new Error('JSON parse failed: ' + (parseError instanceof Error ? parseError.message : 'Unknown error'));
      }

      logger.info('Parsed data:', JSON.stringify(parsed, null, 2));

      let user;
      try {
        user = userSchema.parse(parsed);
      } catch (validationError) {
        if (validationError instanceof Error && 'issues' in validationError) {
          const zodError = validationError as any;
          const errors = zodError.issues.map((issue: any) => {
            const path = issue.path.join('.');
            return `${path}: ${issue.message}`;
          });
          throw new Error(`Validation failed:\n${errors.join('\n')}`);
        }
        throw new Error('Validation failed: ' + (validationError instanceof Error ? validationError.message : 'Unknown error'));
      }

      const issues: string[] = [];
      if (user.advocacy_programs.length === 0) issues.push('no_programs');

      const dataQuality = {
        is_clean: issues.length === 0,
        issues,
        severity: (issues.length > 0 ? 'warning' : 'clean') as 'clean' | 'warning' | 'error'
      };

      await this.context.services.user.upsert(user.user_id, {
        ...user,
        data_quality: dataQuality
      });

      await this.context.services.failedImport.markAsFixed(request.params.id);

      logger.info(`Successfully retried failed import ${request.params.id} (${failedImport.file_name})`);

      return {
        success: true,
        message: 'Import successful',
        user_id: user.user_id,
        data_quality: dataQuality
      };

    } catch (error) {
      await this.context.services.failedImport.update(request.params.id, {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        last_retry_at: new Date()
      });

      logger.error(`Failed to retry import ${request.params.id}:`, error);

      throw Boom.badRequest('Retry failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async batchRetry(request: Request) {
    const { ids, force } = request.payload as any;

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as Array<{ id: string; error: string }>
    };

    for (const id of ids) {
      try {
        let failedImport;
        try {
          failedImport = await this.context.services.failedImport.findById(id);
        } catch (error) {
          results.skipped++;
          continue;
        }

        if (['fixed', 'ignored'].includes(failedImport.status)) {
          results.skipped++;
          continue;
        }

        if (!force && failedImport.retry_count >= 3) {
          results.skipped++;
          results.errors.push({
            id,
            error: 'Max retries exceeded (use force=true to override)'
          });
          continue;
        }

        await this.context.services.failedImport.incrementRetryCount(id);

        const parsed = JSON.parse(failedImport.raw_data);
        const user = userSchema.parse(parsed);

        await this.context.services.user.upsert(user.user_id, {
          ...user
        });

        await this.context.services.failedImport.markAsFixed(id);

        results.success++;

      } catch (error) {
        results.failed++;
        results.errors.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        await this.context.services.failedImport.update(id, {
          status: 'failed'
        });
      }
    }

    logger.info(`Batch retry completed: ${results.success} success, ${results.failed} failed, ${results.skipped} skipped`);

    return {
      success: true,
      results
    };
  }

  async ignore(request: Request) {
    const { notes } = request.payload as any;

    try {
      const updated = await this.context.services.failedImport.update(request.params.id, {
        status: 'ignored',
        notes
      });

      logger.info(`Failed import ${request.params.id} marked as ignored`);

      return {
        success: true,
        message: 'Failed import marked as ignored',
        data: updated
      };
    } catch (error) {
      throw Boom.notFound('Failed import not found');
    }
  }

  async delete(request: Request) {
    try {
      await this.context.services.failedImport.delete(request.params.id);

      logger.info(`Failed import ${request.params.id} deleted`);

      return {
        success: true,
        message: 'Failed import deleted'
      };
    } catch (error) {
      throw Boom.notFound('Failed import not found');
    }
  }

  async getStats() {
    return await this.context.services.failedImport.getStats();
  }
}
