/**
 * SQS Message Processor
 * Production worker that polls SQS queue and processes messages
 *
 * Usage:
 *   ts-node src/workers/sqs-processor.ts
 *
 * Environment variables:
 *   AWS_REGION - AWS region (default: us-east-1)
 *   SQS_QUEUE_URL - SQS queue URL
 *   MAX_MESSAGES - Max messages to fetch per poll (default: 10)
 *   POLL_INTERVAL - Polling interval in ms (default: 5000)
 */

import { processSQSMessage } from './WorkerHandler';
import { logger } from '../utils/logger';

// TODO: Install @aws-sdk/client-sqs
// import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';

interface SQSProcessorConfig {
  queueUrl: string;
  region: string;
  maxMessages: number;
  pollInterval: number;
  waitTimeSeconds: number;
}

class SQSProcessor {
  private config: SQSProcessorConfig;
  private isRunning: boolean = false;
  // private sqsClient: SQSClient;

  constructor(config: SQSProcessorConfig) {
    this.config = config;
    // this.sqsClient = new SQSClient({ region: config.region });
  }

  /**
   * Start polling SQS queue
   */
  async start(): Promise<void> {
    this.isRunning = true;
    logger.info('SQS Processor started');
    logger.info(`Queue URL: ${this.config.queueUrl}`);
    logger.info(`Region: ${this.config.region}`);
    logger.info(`Max Messages: ${this.config.maxMessages}`);

    while (this.isRunning) {
      try {
        await this.poll();
      } catch (error) {
        logger.error('Error polling SQS:', error);
      }

      await this.sleep(this.config.pollInterval);
    }
  }

  /**
   * Stop polling
   */
  stop(): void {
    this.isRunning = false;
    logger.info('SQS Processor stopped');
  }

  /**
   * Poll SQS queue for messages
   */
  private async poll(): Promise<void> {
    logger.info('Polling SQS queue...');

    // TODO: Implement SQS polling when @aws-sdk/client-sqs is installed
    /*
    const command = new ReceiveMessageCommand({
      QueueUrl: this.config.queueUrl,
      MaxNumberOfMessages: this.config.maxMessages,
      WaitTimeSeconds: this.config.waitTimeSeconds,
      MessageAttributeNames: ['All']
    });

    const response = await this.sqsClient.send(command);

    if (!response.Messages || response.Messages.length === 0) {
      logger.info('No messages in queue');
      return;
    }

    logger.info(`Received ${response.Messages.length} messages`);

    // Process messages in parallel
    const results = await Promise.allSettled(
      response.Messages.map(message => this.processMessage(message))
    );

    // Log results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    logger.info(`Processed ${successful} successfully, ${failed} failed`);
    */

    logger.warn('SQS processing not yet implemented. Install @aws-sdk/client-sqs');
  }

  /**
   * Process a single SQS message
   */
  private async processMessage(message: any): Promise<void> {
    try {
      const result = await processSQSMessage(message);

      if (result.success) {
        logger.info(`Message processed successfully: ${message.MessageId}`);
        await this.deleteMessage(message.ReceiptHandle);
      } else {
        logger.error(`Message processing failed: ${message.MessageId}`, result.error);
        // Message will be retried based on SQS settings
      }

    } catch (error) {
      logger.error(`Error processing message ${message.MessageId}:`, error);
      throw error;
    }
  }

  /**
   * Delete message from queue
   */
  private async deleteMessage(_receiptHandle: string): Promise<void> {
    // TODO: Implement when @aws-sdk/client-sqs is installed
    /*
    const command = new DeleteMessageCommand({
      QueueUrl: this.config.queueUrl,
      ReceiptHandle: receiptHandle
    });

    await this.sqsClient.send(command);
    logger.info('Message deleted from queue');
    */
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run if called directly
if (require.main === module) {
  const config: SQSProcessorConfig = {
    queueUrl: process.env.SQS_QUEUE_URL || '',
    region: process.env.AWS_REGION || 'us-east-1',
    maxMessages: parseInt(process.env.MAX_MESSAGES || '10', 10),
    pollInterval: parseInt(process.env.POLL_INTERVAL || '5000', 10),
    waitTimeSeconds: 20 // Long polling
  };

  if (!config.queueUrl) {
    console.error('SQS_QUEUE_URL environment variable is required');
    process.exit(1);
  }

  const processor = new SQSProcessor(config);

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down...');
    processor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down...');
    processor.stop();
    process.exit(0);
  });

  // Start processor
  processor.start().catch(error => {
    logger.error('Fatal error in SQS processor:', error);
    process.exit(1);
  });
}

export { SQSProcessor };
