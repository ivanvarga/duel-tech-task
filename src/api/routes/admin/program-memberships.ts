import { Server } from '@hapi/hapi';
import { ProgramMembershipsController } from '../../controllers/admin';
import { createAppContext } from '../../AppContext';

export const registerProgramMembershipRoutes = (server: Server) => {
  const context = createAppContext();
  const controller = new ProgramMembershipsController(context);

  server.route({
    method: 'GET',
    path: '/api/admin/program-memberships',
    handler: (request, h) => controller.list(request, h)
  });

  server.route({
    method: 'GET',
    path: '/api/admin/program-memberships/{id}',
    handler: (request, h) => controller.getById(request, h)
  });

  server.route({
    method: 'PUT',
    path: '/api/admin/program-memberships/{id}',
    handler: (request, h) => controller.update(request, h)
  });

  server.route({
    method: 'DELETE',
    path: '/api/admin/program-memberships/{id}',
    handler: (request, h) => controller.delete(request, h)
  });
};
