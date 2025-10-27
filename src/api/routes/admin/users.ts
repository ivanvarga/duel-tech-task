import { Server } from '@hapi/hapi';
import { z } from 'zod';
import { zodValidator } from '../../utils/hapi-zod';
import { UsersController } from '../../controllers/admin';
import { createAppContext } from '../../AppContext';

export async function registerUsersAdminRoutes(server: Server): Promise<void> {
  const context = createAppContext();
  const controller = new UsersController(context);

  server.route({
    method: 'GET',
    path: '/api/admin/users',
    options: {
      description: 'List all users with pagination',
      tags: ['api', 'admin', 'users']
    },
    handler: (request, h) => controller.list(request, h)
  });

  server.route({
    method: 'GET',
    path: '/api/admin/users/{id}',
    options: {
      description: 'Get a single user by ID',
      tags: ['api', 'admin', 'users']
    },
    handler: (request) => controller.getById(request)
  });

  server.route({
    method: 'PUT',
    path: '/api/admin/users/{id}',
    options: {
      description: 'Update a user',
      tags: ['api', 'admin', 'users'],
      validate: {
        payload: zodValidator(z.object({
          name: z.string().optional(),
          email: z.string().email().optional(),
          instagram_handle: z.string().nullable().optional(),
          tiktok_handle: z.string().nullable().optional(),
          joined_at: z.string().optional(),
          advocacy_programs: z.array(z.any()).optional()
        }))
      }
    },
    handler: (request) => controller.update(request)
  });

  server.route({
    method: 'DELETE',
    path: '/api/admin/users/{id}',
    options: {
      description: 'Delete a user',
      tags: ['api', 'admin', 'users']
    },
    handler: (request) => controller.delete(request)
  });
}
