import { Request } from '@hapi/hapi';
import Boom from '@hapi/boom';
import { handleWorkerJob, workerRegistry } from '../../../workers';
import { logger } from '../../../utils/logger';

export class WorkersController {
  async extract(request: Request) {
    const payload = (request.payload || {}) as any;
    const { archivePath, targetDir, cleanTarget, cleanDatabase } = payload;

    logger.info('[Admin] Triggering extract worker', {
      archivePath: archivePath || 'data.tar.gz (project root)',
      cleanTarget: cleanTarget ?? true,
      cleanDatabase: cleanDatabase ?? true
    });

    const result = await handleWorkerJob({
      workerId: 'extract-files',
      input: { archivePath, targetDir, cleanTarget, cleanDatabase },
      source: 'admin-api'
    });

    if (!result.success) {
      throw Boom.badRequest(result.message, result);
    }

    return result;
  }

  async runETL(request: Request) {
    const payload = (request.payload || {}) as any;

    logger.info('[Admin] Triggering ETL batch worker', payload);

    const result = await handleWorkerJob({
      workerId: 'etl-batch',
      input: payload,
      source: 'admin-api'
    });

    if (!result.success) {
      throw Boom.badRequest(result.message, result);
    }

    return result;
  }

  async getStatus() {
    const workers = workerRegistry.getWorkerIds();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      workers: {
        registered: workers,
        count: workers.length,
        details: {
          'extract-files': {
            id: 'extract-files',
            description: 'Extracts data.tar.gz from project root into users directory',
            defaultBehavior: 'Cleans database + files directory before extraction',
            archiveLocation: 'data.tar.gz (project root)',
            options: {
              archivePath: 'optional (defaults to data.tar.gz in project root)',
              targetDir: 'optional (defaults to ./users)',
              cleanTarget: 'default: true',
              cleanDatabase: 'default: true'
            }
          },
          'etl-batch': {
            id: 'etl-batch',
            description: 'Processes all user JSON files in batch',
            defaultBatchSize: 100,
            defaultConcurrency: 5
          },
          'process-file': {
            id: 'process-file',
            description: 'Processes a single user JSON file'
          }
        }
      }
    };
  }

  async list() {
    const workers = workerRegistry.getWorkerIds();

    return {
      data: workers.map(id => ({
        id,
        name: id,
        endpoint: `/api/admin/workers/${id}/execute`,
        status: 'available'
      })),
      total: workers.length
    };
  }
}
