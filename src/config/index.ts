import dotenv from 'dotenv';

// Load .env file
dotenv.config();

export type StorageType = 'local' | 's3';

export interface Config {
  // Server configuration
  server: {
    port: number;
    host: string;
    cors: {
      origin: string[];
    };
  };

  // Database configuration
  database: {
    uri: string;
  };

  // Logging configuration
  logging: {
    level: string;
  };

  // Storage configuration (for user JSON files)
  storage: {
    type: StorageType;
    local?: {
      path: string;
    };
    s3?: {
      bucket: string;
      region: string;
      prefix: string; // e.g., "user-uploads/"
      accessKeyId?: string;
      secretAccessKey?: string;
    };
  };

  // Feature flags (route exposure)
  features: {
    adminRoutes: boolean;
    workerRoutes: boolean;
    webRoutes: boolean;
  };

  // Environment
  env: string;
}

// Get feature flags from environment variables
function getFeatureFlags(): Config['features'] {
  // Default to all routes enabled for development
  const defaultEnabled = process.env.NODE_ENV !== 'production';

  return {
    adminRoutes: process.env.ENABLE_ADMIN_ROUTES === 'true' ||
                 (process.env.ENABLE_ADMIN_ROUTES === undefined && defaultEnabled),
    workerRoutes: process.env.ENABLE_WORKER_ROUTES === 'true' ||
                  (process.env.ENABLE_WORKER_ROUTES === undefined && defaultEnabled),
    webRoutes: process.env.ENABLE_WEB_ROUTES === 'true' ||
               (process.env.ENABLE_WEB_ROUTES === undefined && defaultEnabled)
  };
}

// Parse CORS origins
function parseCorsOrigins(): string[] {
  const origin = process.env.CORS_ORIGIN || '*';

  if (origin === '*') {
    return ['*'];
  }

  return origin.split(',').map(o => o.trim());
}

// Build configuration
function buildConfig(): Config {
  const env = process.env.NODE_ENV || 'development';
  const storageType = (process.env.STORAGE_TYPE || 'local') as StorageType;

  const config: Config = {
    server: {
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || '0.0.0.0',
      cors: {
        origin: parseCorsOrigins()
      }
    },

    database: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/advocacy_platform?maxPoolSize=10&minPoolSize=2'
    },

    logging: {
      level: process.env.LOG_LEVEL || 'info'
    },

    storage: {
      type: storageType,
      local: storageType === 'local' ? {
        path: process.env.USER_FILES_PATH || './users'
      } : undefined,
      s3: storageType === 's3' ? {
        bucket: process.env.S3_BUCKET || '',
        region: process.env.S3_REGION || 'us-east-1',
        prefix: process.env.S3_PREFIX || 'user-uploads/',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      } : undefined
    },

    features: getFeatureFlags(),

    env
  };

  return config;
}

// Export singleton config
export const config = buildConfig();

// Export helper to log active configuration
export function logConfig(): void {
  console.log('='.repeat(60));
  console.log('SERVICE CONFIGURATION');
  console.log('='.repeat(60));
  console.log(`Environment:     ${config.env}`);
  console.log(`Server:          ${config.server.host}:${config.server.port}`);
  console.log(`Database:        Connected`);
  console.log(`Log Level:       ${config.logging.level}`);
  console.log(`Storage Type:    ${config.storage.type}`);
  if (config.storage.type === 'local') {
    console.log(`  Local Path:    ${config.storage.local?.path}`);
  } else if (config.storage.type === 's3') {
    console.log(`  S3 Bucket:     ${config.storage.s3?.bucket}`);
    console.log(`  S3 Region:     ${config.storage.s3?.region}`);
    console.log(`  S3 Prefix:     ${config.storage.s3?.prefix}`);
  }
  console.log(`\nRoute Exposure:`);
  console.log(`  Admin Routes:  ${config.features.adminRoutes ? '✓ ENABLED' : '✗ DISABLED'}`);
  console.log(`  Worker Routes: ${config.features.workerRoutes ? '✓ ENABLED' : '✗ DISABLED'}`);
  console.log(`  Web Routes:    ${config.features.webRoutes ? '✓ ENABLED' : '✗ DISABLED'}`);
  console.log('='.repeat(60));
}
