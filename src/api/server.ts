import Hapi from '@hapi/hapi';
import { config, logConfig } from '../config';
import { connectDatabase } from '../database/connection';
import { logger } from '../utils/logger';

// Route registration functions
import { registerAdminRoutes } from './routes/admin';
import { registerWorkerRoutes } from './routes/worker';
import { registerWebRoutes } from './routes/web';
import { registerCoreRoutes } from './routes/core';

export async function createServer(): Promise<Hapi.Server> {
  const server = Hapi.server({
    port: config.server.port,
    host: config.server.host,
    routes: {
      cors: {
        origin: config.server.cors.origin,
        credentials: true
      },
      validate: {
        failAction: async (_request, _h, err) => {
          if (config.env === 'development') {
            // In development, show full error details
            throw err;
          }

          // In production, hide implementation details
          throw new Error('Invalid request');
        }
      }
    }
  });

  // Register logging plugin
  await server.register({
    plugin: require('./plugins/logging')
  });

  // Register routes based on configuration
  await registerRoutes(server);

  return server;
}

async function registerRoutes(server: Hapi.Server): Promise<void> {
  logger.info('Registering routes based on service mode...');

  // Core routes (always enabled)
  await registerCoreRoutes(server);
  logger.info('✓ Core routes registered');

  // Admin routes
  if (config.features.adminRoutes) {
    await registerAdminRoutes(server);
    logger.info('✓ Admin routes registered');
  } else {
    logger.info('✗ Admin routes disabled');
  }

  // Worker routes
  if (config.features.workerRoutes) {
    await registerWorkerRoutes(server);
    logger.info('✓ Worker routes registered');
  } else {
    logger.info('✗ Worker routes disabled');
  }

  // Web routes
  if (config.features.webRoutes) {
    await registerWebRoutes(server);
    logger.info('✓ Web routes registered');
  } else {
    logger.info('✗ Web routes disabled');
  }

  // Log all registered routes (development only)
  if (config.env === 'development') {
    logger.debug('Registered routes:');
    server.table().forEach(route => {
      logger.debug(`  ${route.method.toUpperCase().padEnd(6)} ${route.path}`);
    });
  }
}

export async function startServer(): Promise<Hapi.Server> {
  try {
    // Log configuration
    logConfig();

    // Connect to database
    logger.info('Connecting to database...');
    await connectDatabase();
    logger.info('✓ Database connected');

    // Create and start server
    const server = await createServer();
    await server.start();

    logger.info(`Server running on ${server.info.uri}`);

    return server;

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

// Start server if running directly
if (require.main === module) {
  startServer();
}
