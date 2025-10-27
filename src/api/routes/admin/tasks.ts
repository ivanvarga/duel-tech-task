import { Server } from '@hapi/hapi';
import { TasksController } from '../../controllers/admin';
import { createAppContext } from '../../AppContext';

export const registerTaskRoutes = (server: Server) => {
  const context = createAppContext();
  const controller = new TasksController(context);

  server.route({
    method: 'GET',
    path: '/api/admin/tasks',
    handler: (request, h) => controller.list(request, h)
  });

  server.route({
    method: 'GET',
    path: '/api/admin/tasks/{id}',
    handler: (request, h) => controller.getById(request, h)
  });

  server.route({
    method: 'PUT',
    path: '/api/admin/tasks/{id}',
    handler: (request, h) => controller.update(request, h)
  });

  server.route({
    method: 'DELETE',
    path: '/api/admin/tasks/{id}',
    handler: (request, h) => controller.delete(request, h)
  });
};
