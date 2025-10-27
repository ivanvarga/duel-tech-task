import { Server } from '@hapi/hapi';
import { config } from '../../../config';

export async function registerCoreRoutes(server: Server): Promise<void> {
  // Health check endpoint
  server.route({
    method: 'GET',
    path: '/health',
    options: {
      description: 'Health check endpoint',
      tags: ['api', 'core'],
      auth: false
    },
    handler: async () => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.env,
        features: config.features
      };
    }
  });

  // Version endpoint
  server.route({
    method: 'GET',
    path: '/version',
    options: {
      description: 'API version information',
      tags: ['api', 'core'],
      auth: false
    },
    handler: async () => {
      return {
        version: '1.0.0',
        features: config.features
      };
    }
  });

  // Root endpoint
  server.route({
    method: 'GET',
    path: '/',
    options: {
      description: 'API root',
      tags: ['api', 'core'],
      auth: false
    },
    handler: async () => {
      return {
        name: 'Advocacy Platform API',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          version: '/version',
          admin: config.features.adminRoutes ? '/api/admin/*' : null,
          worker: config.features.workerRoutes ? '/api/worker/*' : null,
          web: config.features.webRoutes ? '/api/analytics/*' : null
        }
      };
    }
  });
}
