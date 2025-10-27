import { Server } from '@hapi/hapi';
import { AnalyticsController } from '../../controllers/web';
import { createAppContext } from '../../AppContext';

export async function registerWebRoutes(server: Server): Promise<void> {
  const context = createAppContext();
  const controller = new AnalyticsController(context);

  server.route({
    method: 'GET',
    path: '/api/analytics/status',
    options: {
      description: 'Web API status',
      tags: ['api', 'web']
    },
    handler: () => controller.getStatus()
  });

  server.route({
    method: 'GET',
    path: '/api/analytics/stats',
    options: {
      description: 'Get analytics statistics',
      tags: ['api', 'web', 'analytics']
    },
    handler: (request, h) => controller.getStats(request, h)
  });

  // Brand analytics endpoint
  server.route({
    method: 'GET',
    path: '/api/analytics/brands',
    options: {
      description: 'Get analytics per brand',
      tags: ['api', 'web', 'analytics']
    },
    handler: (request, h) => controller.getBrands(request, h)
  });

  // Platform analytics endpoint
  server.route({
    method: 'GET',
    path: '/api/analytics/platforms',
    options: {
      description: 'Get analytics per platform',
      tags: ['api', 'web', 'analytics']
    },
    handler: (request, h) => controller.getPlatforms(request, h)
  });

  // User analytics endpoint - Top Advocates
  server.route({
    method: 'GET',
    path: '/api/analytics/users',
    options: {
      description: 'Get top advocates analytics',
      tags: ['api', 'web', 'analytics']
    },
    handler: (request, h) => controller.getUsers(request, h)
  });

  // Individual user analytics endpoint
  server.route({
    method: 'GET',
    path: '/api/analytics/users/{userId}',
    options: {
      description: 'Get detailed analytics for a specific user',
      tags: ['api', 'web', 'analytics']
    },
    handler: (request, h) => controller.getUserDetail(request, h)
  });

  // Program analytics endpoint
  server.route({
    method: 'GET',
    path: '/api/analytics/programs',
    options: {
      description: 'Get analytics per program',
      tags: ['api', 'web', 'analytics']
    },
    handler: (request, h) => controller.getPrograms(request, h)
  });

  // Brand + Platform cross analytics endpoint
  server.route({
    method: 'GET',
    path: '/api/analytics/brands-platforms',
    options: {
      description: 'Get analytics per brand per platform',
      tags: ['api', 'web', 'analytics']
    },
    handler: (request, h) => controller.getBrandsPlatforms(request, h)
  });
}
