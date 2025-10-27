import { Server } from '@hapi/hapi';
import { z } from 'zod';
import { zodValidator } from '../../utils/hapi-zod';
import { FailedImportsController } from '../../controllers/admin';
import { createAppContext } from '../../AppContext';

export function registerFailedImportsAdminRoutes(server: Server) {
  const context = createAppContext();
  const controller = new FailedImportsController(context);

  server.route({
    method: 'GET',
    path: '/api/admin/failed-imports',
    options: {
      description: 'List failed imports with filters',
      tags: ['api', 'admin', 'failed-imports']
    },
    handler: (request, h) => controller.list(request, h)
  });

  server.route({
    method: 'GET',
    path: '/api/admin/failed-imports/{id}',
    options: {
      description: 'Get failed import details',
      tags: ['api', 'admin', 'failed-imports'],
      validate: {
        params: zodValidator(z.object({
          id: z.string()
        }))
      }
    },
    handler: (request) => controller.getById(request)
  });

  server.route({
    method: 'PUT',
    path: '/api/admin/failed-imports/{id}',
    options: {
      description: 'Edit raw JSON of failed import',
      tags: ['api', 'admin', 'failed-imports'],
      validate: {
        params: zodValidator(z.object({
          id: z.string()
        })),
        payload: zodValidator(z.object({
          raw_data: z.string(),
          notes: z.string().optional()
        }))
      }
    },
    handler: (request) => controller.update(request)
  });

  server.route({
    method: 'POST',
    path: '/api/admin/failed-imports/{id}/retry',
    options: {
      description: 'Retry processing a failed import',
      tags: ['api', 'admin', 'failed-imports']
    },
    handler: (request) => controller.retry(request)
  });

  server.route({
    method: 'POST',
    path: '/api/admin/failed-imports/batch-retry',
    options: {
      description: 'Retry multiple failed imports',
      tags: ['api', 'admin', 'failed-imports'],
      validate: {
        payload: zodValidator(z.object({
          ids: z.array(z.string()).min(1).max(100),
          force: z.boolean().optional().default(false)
        }))
      }
    },
    handler: (request) => controller.batchRetry(request)
  });

  server.route({
    method: 'POST',
    path: '/api/admin/failed-imports/{id}/ignore',
    options: {
      description: 'Mark failed import as ignored',
      tags: ['api', 'admin', 'failed-imports'],
      validate: {
        payload: zodValidator(z.object({
          notes: z.string().optional()
        }))
      }
    },
    handler: (request) => controller.ignore(request)
  });

  server.route({
    method: 'DELETE',
    path: '/api/admin/failed-imports/{id}',
    options: {
      description: 'Delete failed import',
      tags: ['api', 'admin', 'failed-imports']
    },
    handler: (request) => controller.delete(request)
  });

  server.route({
    method: 'GET',
    path: '/api/admin/failed-imports/stats',
    options: {
      description: 'Get failed imports statistics',
      tags: ['api', 'admin', 'failed-imports']
    },
    handler: () => controller.getStats()
  });
}
