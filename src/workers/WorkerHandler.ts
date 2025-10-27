/**
 * Unified Worker Handler
 * Handles worker execution from both API calls and SQS messages
 */

import { workerRegistry } from './WorkerRegistry';
import { WorkerResult } from './BaseWorker';
import { logger } from '../utils/logger';

export interface WorkerJob {
  workerId: string;
  input: any;
  jobId?: string;
  source?: 'api' | 'sqs' | 'admin-api';
  metadata?: Record<string, any>;
}

export interface WorkerJobResult extends WorkerResult {
  jobId: string;
  workerId: string;
  executedAt: Date;
  duration: number; // milliseconds
}

/**
 * Handle worker execution
 * Works for both API calls and SQS message processing
 */
export async function handleWorkerJob(job: WorkerJob): Promise<WorkerJobResult> {
  const startTime = Date.now();
  const jobId = job.jobId || generateJobId();
  const source = job.source || 'api';

  logger.info(`Handling worker job from ${source}: ${job.workerId} (${jobId})`);

  try {
    const result = await workerRegistry.executeWorker(
      job.workerId,
      job.input,
      jobId
    );

    const duration = Date.now() - startTime;

    return {
      ...result,
      jobId,
      workerId: job.workerId,
      executedAt: new Date(),
      duration
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Worker job failed: ${job.workerId} (${jobId})`, error);

    return {
      success: false,
      message: 'Worker job execution failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      jobId,
      workerId: job.workerId,
      executedAt: new Date(),
      duration
    };
  }
}

/**
 * Process SQS message
 * Convert SQS message format to WorkerJob and execute
 */
export async function processSQSMessage(message: any): Promise<WorkerJobResult> {
  try {
    const body = typeof message.Body === 'string'
      ? JSON.parse(message.Body)
      : message.Body;

    const job: WorkerJob = {
      workerId: body.workerId,
      input: body.input,
      jobId: body.jobId || message.MessageId,
      source: 'sqs',
      metadata: {
        messageId: message.MessageId,
        receiptHandle: message.ReceiptHandle
      }
    };

    return await handleWorkerJob(job);

  } catch (error) {
    logger.error('Failed to process SQS message:', error);

    return {
      success: false,
      message: 'Failed to parse SQS message',
      error: error instanceof Error ? error.message : 'Unknown error',
      jobId: message.MessageId || 'unknown',
      workerId: 'unknown',
      executedAt: new Date(),
      duration: 0
    };
  }
}

/**
 * Generate a unique job ID
 */
function generateJobId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}
