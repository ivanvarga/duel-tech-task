/**
 * Process File Worker
 * Reads a user JSON file, validates, transforms, and saves to database
 */

import { BaseWorker, WorkerContext, WorkerResult } from '../BaseWorker';
import { getStorageAdapter } from '../../utils/storage';
import { userSchema, SourceUser } from '../../types/schemas';
import { logger } from '../../utils/logger';
import { parseJSON } from '../../utils/json-repair';

export interface ProcessFileInput {
  fileName: string;
}

export interface ProcessFileOutput {
  userId?: string;
  fileName: string;
  status: 'success' | 'failed';
  dataQuality?: {
    is_clean: boolean;
    issues: string[];
  };
}

export class ProcessFileWorker extends BaseWorker<ProcessFileInput, ProcessFileOutput> {
  static readonly id = 'process-file';
  readonly name = 'ProcessFileWorker';

  async execute(
    input: ProcessFileInput,
    context: WorkerContext
  ): Promise<WorkerResult & { data?: ProcessFileOutput }> {
    const { fileName } = input;
    const storage = getStorageAdapter();

    try {
      logger.info(`[${context.jobId}] Reading file: ${fileName}`);
      const rawData = await storage.readFile(fileName);

      const parseResult = parseJSON(rawData);

      if (!parseResult.success) {
        await this.saveFailedImport(
          context,
          fileName,
          rawData,
          'json_parse_error',
          parseResult.error || 'Parse error'
        );

        await storage.moveToFailed(fileName);

        return {
          success: false,
          message: `Failed to parse JSON: ${fileName}`,
          error: 'JSON_PARSE_ERROR',
          data: {
            fileName,
            status: 'failed'
          }
        };
      }

      const parsed = parseResult.data;

      if (parseResult.repaired) {
        logger.info(`[${context.jobId}] Repaired JSON for ${fileName}: ${parseResult.repairs?.join(', ')}`);
      }

      let user: SourceUser;
      try {
        user = userSchema.parse(parsed) as SourceUser;
      } catch (validationError) {
        let errorMessage = 'Validation error';
        if (validationError instanceof Error && 'issues' in validationError) {
          const zodError = validationError as any;
          const errors = zodError.issues.map((issue: any) => {
            const path = issue.path.join('.');
            return `${path}: ${issue.message}`;
          });
          errorMessage = `Validation failed:\n${errors.join('\n')}`;
        } else if (validationError instanceof Error) {
          errorMessage = validationError.message;
        }

        await this.saveFailedImport(
          context,
          fileName,
          rawData,
          'validation_error',
          errorMessage
        );

        await storage.moveToFailed(fileName);

        return {
          success: false,
          message: `Validation failed: ${fileName}`,
          error: 'VALIDATION_ERROR',
          data: {
            fileName,
            status: 'failed'
          }
        };
      }

      const issues: string[] = [];
      if (user.advocacy_programs.length === 0) issues.push('no_programs');

      const dataQuality = {
        is_clean: issues.length === 0,
        issues,
        severity: (issues.length > 0 ? 'warning' : 'clean') as 'clean' | 'warning' | 'error'
      };

      try {
        const userDoc = await context.services.user.upsert(user.user_id, {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          instagram_handle: user.instagram_handle,
          tiktok_handle: user.tiktok_handle,
          joined_at: user.joined_at,
          status: 'active',
          data_quality: dataQuality
        });

        await this.processAdvocacyPrograms(context, user);

        await storage.deleteFile(fileName);

        logger.info(`[${context.jobId}] Successfully processed: ${fileName}`);

        return {
          success: true,
          message: `Successfully processed: ${fileName}`,
          data: {
            userId: userDoc?.user_id || user.user_id,
            fileName,
            status: 'success',
            dataQuality: {
              is_clean: dataQuality.is_clean,
              issues: dataQuality.issues
            }
          }
        };

      } catch (dbError) {
        await this.saveFailedImport(
          context,
          fileName,
          rawData,
          'database_error',
          dbError instanceof Error ? dbError.message : 'Database error'
        );

        await storage.moveToFailed(fileName);

        return {
          success: false,
          message: `Database error: ${fileName}`,
          error: 'DATABASE_ERROR',
          data: {
            fileName,
            status: 'failed'
          }
        };
      }

    } catch (error) {
      logger.error(`[${context.jobId}] Unexpected error processing ${fileName}:`, error);

      return {
        success: false,
        message: `Unexpected error: ${fileName}`,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          fileName,
          status: 'failed'
        }
      };
    }
  }

  /**
   * Process advocacy programs into normalized collections:
   * - Companies
   * - Brands
   * - Programs
   * - ProgramMemberships
   * - Tasks
   */
  private async processAdvocacyPrograms(
    context: WorkerContext,
    user: SourceUser
  ): Promise<void> {
    for (const program of user.advocacy_programs) {
      if (!program.program_id || !program.brand) {
        continue;
      }

      try {
        const brandName = program.brand;

        const brand = await context.services.brand.findOrCreate(brandName);
        const brandId = brand.brand_id;

        await context.services.program.upsert(program.program_id, brandId);

        const tasksCount = program.tasks_completed?.length || 0;
        const joinedAt = user.joined_at || new Date();

        await context.services.programMembership.upsert(user.user_id, program.program_id, {
          brand_id: brandId,
          tasks_completed: tasksCount,
          sales_attributed: program.total_sales_attributed || 0,
          joined_at: joinedAt
        });

        if (program.tasks_completed && Array.isArray(program.tasks_completed)) {
          for (const task of program.tasks_completed) {
            if (!task.task_id) continue;

            const taskEngagement = (task.likes || 0) + (task.comments || 0) + (task.shares || 0);
            const taskReach = task.reach || 0;
            const engagementRate = taskReach > 0 ? taskEngagement / taskReach : 0;

            await context.services.task.upsert(task.task_id, {
              task_id: task.task_id,
              user_id: user.user_id,
              program_id: program.program_id,
              membership_id: `${user.user_id}-${program.program_id}`,
              brand_id: brandId,
              brand_name: brandName,
              platform: task.platform || 'Instagram',
              post_url: task.post_url ?? undefined,
              likes: task.likes || 0,
              comments: task.comments || 0,
              shares: task.shares || 0,
              reach: task.reach || 0,
              engagement_rate: engagementRate,
              submitted_at: new Date()
            });
          }
        }

        logger.info(`[${context.jobId}] Processed program: ${brandName} (${program.program_id})`);
      } catch (error) {
        logger.error(`[${context.jobId}] Failed to process program ${program.program_id}:`, error);
      }
    }
  }

  /**
   * Save failed import to database for review
   */
  private async saveFailedImport(
    context: WorkerContext,
    fileName: string,
    rawData: string,
    errorType: 'json_parse_error' | 'validation_error' | 'transformation_error' | 'database_error',
    errorMessage: string
  ): Promise<void> {
    try {
      await context.services.failedImport.create({
        file_name: fileName,
        file_path: fileName,
        raw_data: rawData,
        error_type: errorType,
        error_message: errorMessage,
        attempted_at: new Date(),
        retry_count: 0,
        status: 'failed'
      });

      logger.info(`Saved failed import: ${fileName}`);
    } catch (error) {
      logger.error(`Failed to save failed import for ${fileName}:`, error);
    }
  }
}
