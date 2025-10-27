/**
 * ETL Batch Worker
 * Processes all user JSON files from storage in batches
 */

import { BaseWorker, WorkerContext, WorkerResult, WorkerServices } from '../BaseWorker';
import { ProcessFileWorker } from './ProcessFileWorker';
import { getStorageAdapter } from '../../utils/storage';
import { logger } from '../../utils/logger';

export interface ETLBatchInput {
  batchSize?: number;
  concurrency?: number;
}

export interface ETLBatchOutput {
  total: number;
  successful: number;
  failed: number;
  duration: number;
  files: {
    successful: string[];
    failed: { fileName: string; error: string }[];
  };
}

export class ETLBatchWorker extends BaseWorker<ETLBatchInput, ETLBatchOutput> {
  static readonly id = 'etl-batch';
  readonly name = 'ETLBatchWorker';

  async execute(
    input: ETLBatchInput,
    context: WorkerContext
  ): Promise<WorkerResult & { data?: ETLBatchOutput }> {
    const startTime = Date.now();
    const batchSize = input.batchSize || 100;
    const concurrency = input.concurrency || 5;

    try {
      logger.info(`[${context.jobId}] Starting ETL batch processing...`);
      const storage = getStorageAdapter();
      const files = await storage.listFiles();

      if (files.length === 0) {
        logger.info(`[${context.jobId}] No files to process`);
        return {
          success: true,
          message: 'No files to process',
          data: {
            total: 0,
            successful: 0,
            failed: 0,
            duration: Date.now() - startTime,
            files: { successful: [], failed: [] }
          }
        };
      }

      logger.info(`[${context.jobId}] Found ${files.length} files to process`);

      const results = {
        total: files.length,
        successful: 0,
        failed: 0,
        files: {
          successful: [] as string[],
          failed: [] as { fileName: string; error: string }[]
        }
      };

      const processFileWorker = new ProcessFileWorker();

      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        logger.info(`[${context.jobId}] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)} (${batch.length} files)`);

        const batchResults = await this.processBatchWithConcurrency(
          batch,
          processFileWorker,
          concurrency,
          context.jobId,
          context.services
        );

        for (const result of batchResults) {
          if (result.success) {
            results.successful++;
            results.files.successful.push(result.fileName);
          } else {
            results.failed++;
            results.files.failed.push({
              fileName: result.fileName,
              error: result.error || 'Unknown error'
            });
          }
        }

        logger.info(`[${context.jobId}] Progress: ${results.successful + results.failed}/${files.length} (${results.successful} successful, ${results.failed} failed)`);
      }

      const duration = Date.now() - startTime;

      logger.info(`[${context.jobId}] ETL batch processing completed in ${duration}ms`);
      logger.info(`[${context.jobId}] Total: ${results.total}, Successful: ${results.successful}, Failed: ${results.failed}`);

      return {
        success: true,
        message: `Processed ${results.total} files: ${results.successful} successful, ${results.failed} failed`,
        data: {
          ...results,
          duration
        }
      };

    } catch (error) {
      logger.error(`[${context.jobId}] ETL batch processing error:`, error);

      return {
        success: false,
        message: 'ETL batch processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process batch of files with concurrency limit
   */
  private async processBatchWithConcurrency(
    files: string[],
    worker: ProcessFileWorker,
    concurrency: number,
    jobId: string,
    services: WorkerServices
  ): Promise<Array<{ success: boolean; fileName: string; error?: string }>> {
    const results: Array<{ success: boolean; fileName: string; error?: string }> = [];

    for (let i = 0; i < files.length; i += concurrency) {
      const chunk = files.slice(i, i + concurrency);

      const chunkResults = await Promise.allSettled(
        chunk.map(async (fileName) => {
          try {
            const result = await worker.run(
              { fileName },
              `${jobId}-${fileName}`,
              services
            );

            return {
              success: result.success,
              fileName,
              error: result.error
            };
          } catch (error) {
            logger.error(`[${jobId}] Error processing ${fileName}:`, error);
            return {
              success: false,
              fileName,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );

      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          logger.error(`[${jobId}] Unexpected rejection:`, result.reason);
        }
      }
    }

    return results;
  }

  /**
   * Validate input
   */
  protected async validateInput(input: ETLBatchInput): Promise<void> {
    await super.validateInput(input);

    if (input.batchSize !== undefined && input.batchSize <= 0) {
      throw new Error('batchSize must be greater than 0');
    }

    if (input.concurrency !== undefined && input.concurrency <= 0) {
      throw new Error('concurrency must be greater than 0');
    }
  }
}
