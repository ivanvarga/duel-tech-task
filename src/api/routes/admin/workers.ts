import { Server } from '@hapi/hapi';
import { z } from 'zod';
import { zodValidator } from '../../utils/hapi-zod';
import { WorkersController } from '../../controllers/admin';

export function registerWorkersAdminRoutes(server: Server) {
  const controller = new WorkersController();

  // Extract user files from data.tar.gz
  server.route({
    method: 'POST',
    path: '/api/admin/workers/extract',
    options: {
      description: 'Extract data.tar.gz into users directory (cleans database + files by default)',
      tags: ['api', 'admin', 'workers'],
      cors: {
        origin: ['*'],
        additionalHeaders: ['cache-control', 'x-requested-with', 'content-type']
      },
      validate: {
        payload: zodValidator(z.object({
          archivePath: z.string().optional(),
          targetDir: z.string().optional(),
          cleanTarget: z.boolean().optional(),
          cleanDatabase: z.boolean().optional()
        }).optional())
      }
    },
    handler: (request) => controller.extract(request)
  });

  // Run ETL batch processing
  server.route({
    method: 'POST',
    path: '/api/admin/workers/etl/run',
    options: {
      description: 'Run full ETL batch processing on all user files',
      tags: ['api', 'admin', 'workers'],
      cors: {
        origin: ['*'],
        additionalHeaders: ['cache-control', 'x-requested-with', 'content-type']
      },
      validate: {
        payload: zodValidator(z.object({
          batchSize: z.number().optional(),
          concurrency: z.number().optional()
        }).optional())
      }
    },
    handler: (request) => controller.runETL(request)
  });

  // Get worker status
  server.route({
    method: 'GET',
    path: '/api/admin/workers/status',
    options: {
      description: 'Get status of all registered workers',
      tags: ['api', 'admin', 'workers'],
      cors: {
        origin: ['*'],
        additionalHeaders: ['cache-control', 'x-requested-with']
      }
    },
    handler: () => controller.getStatus()
  });

  // List all workers
  server.route({
    method: 'GET',
    path: '/api/admin/workers',
    options: {
      description: 'List all registered workers with their capabilities',
      tags: ['api', 'admin', 'workers'],
      cors: {
        origin: ['*'],
        additionalHeaders: ['cache-control', 'x-requested-with']
      }
    },
    handler: () => controller.list()
  });
}
