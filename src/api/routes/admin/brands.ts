import { Server } from '@hapi/hapi';
import { z } from 'zod';
import { zodValidator } from '../../utils/hapi-zod';
import { BrandsController } from '../../controllers/admin';
import { createAppContext } from '../../AppContext';

export async function registerBrandsAdminRoutes(server: Server): Promise<void> {
  const context = createAppContext();
  const controller = new BrandsController(context);

  server.route({
    method: 'GET',
    path: '/api/admin/brands',
    options: {
      description: 'List all brands with pagination',
      tags: ['api', 'admin', 'brands']
    },
    handler: (request, h) => controller.list(request, h)
  });

  server.route({
    method: 'GET',
    path: '/api/admin/brands/{id}',
    options: {
      description: 'Get a single brand by ID',
      tags: ['api', 'admin', 'brands']
    },
    handler: (request) => controller.getById(request)
  });

  server.route({
    method: 'PUT',
    path: '/api/admin/brands/{id}',
    options: {
      description: 'Update a brand',
      tags: ['api', 'admin', 'brands'],
      validate: {
        payload: zodValidator(z.object({
          name: z.string().optional(),
          company_id: z.string().optional(),
          status: z.enum(['active', 'paused', 'ended']).optional(),
          total_advocates: z.number().optional(),
          total_programs: z.number().optional(),
          total_tasks_completed: z.number().optional(),
          total_sales_attributed: z.number().optional(),
          avg_engagement_rate: z.number().optional()
        }))
      }
    },
    handler: (request) => controller.update(request)
  });

  server.route({
    method: 'DELETE',
    path: '/api/admin/brands/{id}',
    options: {
      description: 'Delete a brand',
      tags: ['api', 'admin', 'brands']
    },
    handler: (request) => controller.delete(request)
  });
}
