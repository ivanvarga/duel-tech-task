/**
 * Extract Files Worker
 * Extracts data.tar.gz from project root into the users directory
 * Cleans database and files directory before extraction
 */

import { BaseWorker, WorkerContext, WorkerResult } from '../BaseWorker';
import { promises as fs } from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../../utils/logger';
import { config } from '../../config';
import { models } from '../../api/models';

const execAsync = promisify(exec);

export interface ExtractFilesInput {
  archivePath?: string;
  targetDir?: string;
  cleanTarget?: boolean;
  cleanDatabase?: boolean;
}

export interface ExtractFilesOutput {
  archivePath: string;
  extractedTo: string;
  filesExtracted: number;
  archiveSize: number;
}

export class ExtractFilesWorker extends BaseWorker<ExtractFilesInput, ExtractFilesOutput> {
  static readonly id = 'extract-files';
  readonly name = 'ExtractFilesWorker';

  async execute(
    input: ExtractFilesInput,
    context: WorkerContext
  ): Promise<WorkerResult & { data?: ExtractFilesOutput }> {
    const { targetDir, cleanTarget = true, cleanDatabase = true } = input;

    try {
      const archivePath = input.archivePath || path.join(process.cwd(), 'data.tar.gz');
      const extractDir = targetDir || config.storage.local?.path || './users';

      logger.info(`[${context.jobId}] Starting extraction from: ${archivePath}`);
      logger.info(`[${context.jobId}] Target directory: ${extractDir}`);

      try {
        await fs.access(archivePath);
      } catch (error) {
        throw new Error(`Archive file not found: ${archivePath}. Please place data.tar.gz in the project root directory.`);
      }

      const stats = await fs.stat(archivePath);
      const archiveSize = stats.size;
      logger.info(`[${context.jobId}] Archive size: ${archiveSize} bytes`);

      if (cleanDatabase) {
        logger.info(`[${context.jobId}] Cleaning database...`);
        await this.cleanDatabase(context.jobId);
      }

      await fs.mkdir(extractDir, { recursive: true });

      if (cleanTarget) {
        logger.info(`[${context.jobId}] Cleaning target directory...`);
        await this.cleanDirectory(extractDir);
      }

      logger.info(`[${context.jobId}] Extracting archive...`);
      const filesExtracted = await this.extractTarGz(archivePath, extractDir, context.jobId);

      logger.info(`[${context.jobId}] Extraction complete: ${filesExtracted} files extracted`);

      return {
        success: true,
        message: `Successfully extracted ${filesExtracted} files`,
        data: {
          archivePath,
          extractedTo: extractDir,
          filesExtracted,
          archiveSize
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[${context.jobId}] Extraction failed:`, error);

      return {
        success: false,
        message: 'Extraction failed',
        error: errorMessage
      };
    }
  }

  /**
   * Extract tar.gz file
   */
  private async extractTarGz(filePath: string, targetDir: string, jobId: string): Promise<number> {
    try {
      logger.info(`[${jobId}] Extracting tar.gz file...`);

      // --strip-components=1 removes top-level directory (e.g. archive.tar.gz/mixed/*.json)
      // COPYFILE_DISABLE=1 prevents macOS from creating ._* AppleDouble metadata files
      const command = `COPYFILE_DISABLE=1 tar -xzf "${filePath}" -C "${targetDir}" --strip-components=1`;
      await execAsync(command);

      const count = await this.countFiles(targetDir);
      return count;

    } catch (error) {
      logger.error(`[${jobId}] tar extraction failed:`, error);
      throw new Error(`Failed to extract tar.gz: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Count files in directory recursively
   * Excludes macOS AppleDouble metadata files (._*)
   */
  private async countFiles(dir: string): Promise<number> {
    let count = 0;

    async function countRecursive(currentDir: string): Promise<void> {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          await countRecursive(fullPath);
        } else if (!entry.name.startsWith('._')) {
          // Skip macOS AppleDouble metadata files
          count++;
        }
      }
    }

    await countRecursive(dir);
    return count;
  }

  /**
   * Clean directory (remove all files but keep directory)
   */
  private async cleanDirectory(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await fs.rm(fullPath, { recursive: true, force: true });
        } else {
          await fs.unlink(fullPath);
        }
      }

      logger.info(`Cleaned directory: ${dir}`);
    } catch (error) {
      logger.error(`Failed to clean directory ${dir}:`, error);
      throw error;
    }
  }

  /**
   * Clean all database collections
   */
  private async cleanDatabase(jobId: string): Promise<void> {
    try {
      const collections = [
        { name: 'users', model: models.User },
        { name: 'brands', model: models.Brand },
        { name: 'programs', model: models.Program },
        { name: 'program_memberships', model: models.ProgramMembership },
        { name: 'tasks', model: models.Task },
        { name: 'failedimports', model: models.FailedImport }
      ];

      logger.info(`[${jobId}] Cleaning ${collections.length} database collections...`);

      for (const collection of collections) {
        const count = await collection.model.countDocuments();
        if (count > 0) {
          await (collection.model as any).deleteMany({});
          logger.info(`[${jobId}] Deleted ${count} documents from ${collection.name}`);
        }
      }

      logger.info(`[${jobId}] Database cleaned successfully`);
    } catch (error) {
      logger.error(`[${jobId}] Failed to clean database:`, error);
      throw new Error(`Database cleaning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  protected async validateInput(input: ExtractFilesInput): Promise<void> {
    await super.validateInput(input);
  }
}
