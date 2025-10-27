import mongoose from 'mongoose';
import { config } from '../config';
import { logger } from '../utils/logger';
import { models } from '../api/models';

// Safely extract database info without credentials
function getSafeDatabaseInfo(uri: string): string {
  try {
    const url = new URL(uri);
    return `${url.protocol}//${url.hostname}:${url.port || '27017'}`;
  } catch {
    return 'MongoDB';
  }
}

export async function connectDatabase(): Promise<typeof mongoose> {
  try {
    const connection = await mongoose.connect(config.database.uri);

    logger.info(`MongoDB connected to ${getSafeDatabaseInfo(config.database.uri)}`);

    // Initialize models
    const modelNames = Object.keys(models);
    logger.info(`Registered ${modelNames.length} models: ${modelNames.join(', ')}`);

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    return connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
