import { Server } from '@hapi/hapi';
import { ProgramsController } from '../../controllers/admin';
import { createAppContext } from '../../AppContext';

export const registerProgramRoutes = (server: Server) => {
  const context = createAppContext();
  const controller = new ProgramsController(context);

  server.route({
    method: 'GET',
    path: '/api/admin/programs',
    handler: (request) => controller.list(request)
  });

  server.route({
    method: 'GET',
    path: '/api/admin/programs/{id}',
    handler: (request, h) => controller.getById(request, h)
  });

  server.route({
    method: 'POST',
    path: '/api/admin/programs',
    handler: (request, h) => controller.create(request, h)
  });

  server.route({
    method: 'PUT',
    path: '/api/admin/programs/{id}',
    handler: (request, h) => controller.update(request, h)
  });

  server.route({
    method: 'DELETE',
    path: '/api/admin/programs/{id}',
    handler: (request, h) => controller.delete(request, h)
  });
};
