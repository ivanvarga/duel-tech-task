import { Server } from '@hapi/hapi';
import { z } from 'zod';
import Boom from '@hapi/boom';
import { zodValidator } from '../../utils/hapi-zod';
import { handleWorkerJob } from '../../../workers';
import { workerRegistry } from '../../../workers';

export async function registerWorkerRoutes(server: Server): Promise<void> {
  // Worker status endpoint
  server.route({
    method: 'GET',
    path: '/api/worker/status',
    options: {
      description: 'Worker API status',
      tags: ['api', 'worker']
    },
    handler: async () => {
      const workers = workerRegistry.getWorkerIds();

      return {
        status: 'ok',
        message: 'Worker API is running',
        timestamp: new Date().toISOString(),
        workers: {
          registered: workers,
          count: workers.length
        }
      };
    }
  });

  // Execute any worker by ID
  server.route({
    method: 'POST',
    path: '/api/worker/execute',
    options: {
      description: 'Execute a worker job',
      tags: ['api', 'worker'],
      validate: {
        payload: zodValidator(z.object({
          workerId: z.string(),
          input: z.any(),
          jobId: z.string().optional()
        }))
      }
    },
    handler: async (request) => {
      const { workerId, input, jobId } = request.payload as any;

      // Check if worker exists
      if (!workerRegistry.hasWorker(workerId)) {
        throw Boom.notFound(`Worker '${workerId}' not found`);
      }

      // Execute worker
      const result = await handleWorkerJob({
        workerId,
        input,
        jobId,
        source: 'api'
      });

      // Return appropriate status code
      if (!result.success) {
        throw Boom.badRequest(result.message, result);
      }

      return result;
    }
  });

  // Run ETL pipeline (convenience endpoint)
  server.route({
    method: 'POST',
    path: '/api/worker/etl/run',
    options: {
      description: 'Run the full ETL pipeline',
      tags: ['api', 'worker'],
      cors: {
        origin: ['*'],
        additionalHeaders: ['cache-control', 'x-requested-with']
      }
    },
    handler: async (_request) => {
      const result = await handleWorkerJob({
        workerId: 'etl-batch',
        input: {},
        source: 'api'
      });

      if (!result.success) {
        throw Boom.badRequest(result.message, result);
      }

      return result;
    }
  });

  // ETL status endpoint
  server.route({
    method: 'GET',
    path: '/api/worker/etl/status',
    options: {
      description: 'Get ETL pipeline status',
      tags: ['api', 'worker'],
      cors: {
        origin: ['*'],
        additionalHeaders: ['cache-control', 'x-requested-with']
      }
    },
    handler: async () => {
      return {
        status: 'ready',
        message: 'ETL pipeline is ready to run',
        timestamp: new Date().toISOString()
      };
    }
  });

  // Process single file (convenience endpoint for process-file worker)
  server.route({
    method: 'POST',
    path: '/api/worker/process-file',
    options: {
      description: 'Process a single user file',
      tags: ['api', 'worker'],
      cors: {
        origin: ['*'],
        additionalHeaders: ['cache-control', 'x-requested-with']
      },
      validate: {
        payload: zodValidator(z.object({
          file_name: z.string().optional(),
          fileName: z.string().optional()
        }))
      }
    },
    handler: async (request) => {
      const payload = request.payload as any;
      let fileName = payload.file_name || payload.fileName;

      if (!fileName) {
        throw Boom.badRequest('file_name or fileName is required');
      }

      // Auto-append .json if not present
      if (!fileName.endsWith('.json')) {
        fileName = `${fileName}.json`;
      }

      const result = await handleWorkerJob({
        workerId: 'process-file',
        input: { fileName },
        source: 'api'
      });

      if (!result.success) {
        throw Boom.badRequest(result.message, result);
      }

      return result;
    }
  });

  // Extract files (convenience endpoint for extract-files worker)
  server.route({
    method: 'POST',
    path: '/api/worker/extract',
    options: {
      description: 'Extract data.tar.gz (cleans database + files by default)',
      tags: ['api', 'worker'],
      cors: {
        origin: ['*'],
        additionalHeaders: ['cache-control', 'x-requested-with']
      },
      validate: {
        payload: zodValidator(z.object({
          archivePath: z.string().optional(),
          targetDir: z.string().optional(),
          cleanTarget: z.boolean().optional(),
          cleanDatabase: z.boolean().optional()
        }))
      }
    },
    handler: async (request) => {
      const { archivePath, targetDir, cleanTarget, cleanDatabase } = request.payload as any;

      const result = await handleWorkerJob({
        workerId: 'extract-files',
        input: { archivePath, targetDir, cleanTarget, cleanDatabase },
        source: 'api'
      });

      if (!result.success) {
        throw Boom.badRequest(result.message, result);
      }

      return result;
    }
  });

  // List all registered workers
  server.route({
    method: 'GET',
    path: '/api/worker/list',
    options: {
      description: 'List all registered workers',
      tags: ['api', 'worker']
    },
    handler: async () => {
      const workers = workerRegistry.getWorkerIds();

      return {
        workers: workers.map(id => ({
          id,
          endpoint: `/api/worker/execute`,
          method: 'POST',
          payload: {
            workerId: id,
            input: '...'
          }
        })),
        count: workers.length
      };
    }
  });
}
