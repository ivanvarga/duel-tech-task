import { Plugin } from '@hapi/hapi';
import { logger } from '../../utils/logger';

export const loggingPlugin: Plugin<{}> = {
  name: 'logging-plugin',
  version: '1.0.0',
  register: async (server) => {
    // Log all requests
    server.events.on('response', (request) => {
      const { method, path, response } = request;
      const statusCode = (response as any).statusCode;
      const responseTime = request.info.responded - request.info.received;

      logger.info({
        method: method.toUpperCase(),
        path,
        statusCode,
        responseTime
      });
    });

    // Log errors
    server.events.on('request', (_request, event, tags) => {
      if (tags.error) {
        logger.error('Request error:', event);
      }
    });
  }
};

module.exports = loggingPlugin;
