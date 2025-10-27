/**
 * Storage abstraction for reading user JSON files
 * Supports both local filesystem and S3 bucket
 */

import { promises as fs } from 'fs';
import path from 'path';
import { config } from '../config';
import { logger } from './logger';

export interface StorageFile {
  key: string;
  content: string;
}

export interface StorageAdapter {
  listFiles(): Promise<string[]>;
  readFile(key: string): Promise<string>;
  deleteFile(key: string): Promise<void>;
  moveToFailed(key: string): Promise<void>;
}

/**
 * Local filesystem storage adapter
 */
class LocalStorageAdapter implements StorageAdapter {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async listFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.basePath);
      return files.filter(f =>
        f.endsWith('.json') &&
        !f.startsWith('._')  // Skip macOS AppleDouble metadata files
      );
    } catch (error) {
      logger.error('Failed to list files from local storage', error);
      throw error;
    }
  }

  async readFile(key: string): Promise<string> {
    try {
      const filePath = path.join(this.basePath, key);
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      logger.error(`Failed to read file ${key} from local storage`, error);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const filePath = path.join(this.basePath, key);
      await fs.unlink(filePath);
      logger.info(`Deleted file: ${key}`);
    } catch (error) {
      logger.error(`Failed to delete file ${key}`, error);
      throw error;
    }
  }

  async moveToFailed(key: string): Promise<void> {
    try {
      const sourcePath = path.join(this.basePath, key);
      const failedDir = path.join(this.basePath, 'failed');

      await fs.mkdir(failedDir, { recursive: true });

      const targetPath = path.join(failedDir, key);
      await fs.rename(sourcePath, targetPath);

      logger.info(`Moved failed file to: ${targetPath}`);
    } catch (error) {
      logger.error(`Failed to move file ${key} to failed directory`, error);
      throw error;
    }
  }
}

/**
 * S3 storage adapter
 * TODO: Implement when AWS SDK is added
 */
class S3StorageAdapter implements StorageAdapter {
  constructor(
    private bucket: string,
    private region: string,
    private prefix: string
  ) {}

  async listFiles(): Promise<string[]> {
    // TODO: Implement S3 listObjectsV2
    // Will use this.bucket, this.region, this.prefix
    throw new Error('S3 storage not yet implemented. Install @aws-sdk/client-s3');
  }

  async readFile(_key: string): Promise<string> {
    // TODO: Implement S3 getObject
    // Will use this.bucket, this.region, this.prefix
    throw new Error('S3 storage not yet implemented. Install @aws-sdk/client-s3');
  }

  async deleteFile(_key: string): Promise<void> {
    // TODO: Implement S3 deleteObject
    // Will use this.bucket, this.region, this.prefix
    throw new Error('S3 storage not yet implemented. Install @aws-sdk/client-s3');
  }

  async moveToFailed(_key: string): Promise<void> {
    // TODO: Implement S3 copyObject + deleteObject
    // Will use this.bucket, this.region, this.prefix
    throw new Error('S3 storage not yet implemented. Install @aws-sdk/client-s3');
  }
}

/**
 * Get the appropriate storage adapter based on configuration
 */
export function getStorageAdapter(): StorageAdapter {
  if (config.storage.type === 'local') {
    if (!config.storage.local) {
      throw new Error('Local storage configuration is missing');
    }
    return new LocalStorageAdapter(config.storage.local.path);
  }

  if (config.storage.type === 's3') {
    if (!config.storage.s3) {
      throw new Error('S3 storage configuration is missing');
    }
    return new S3StorageAdapter(
      config.storage.s3.bucket,
      config.storage.s3.region,
      config.storage.s3.prefix
    );
  }

  throw new Error(`Unknown storage type: ${config.storage.type}`);
}
