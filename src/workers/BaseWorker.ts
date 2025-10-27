/**
 * Base Worker class
 * All workers extend this class and register with a unique ID
 */

import { logger } from '../utils/logger';
import {
  UserService,
  BrandService,
  ProgramService,
  ProgramMembershipService,
  TaskService,
  FailedImportService
} from '../api/services';

export interface WorkerServices {
  user: UserService;
  brand: BrandService;
  program: ProgramService;
  programMembership: ProgramMembershipService;
  task: TaskService;
  failedImport: FailedImportService;
}

export interface WorkerContext {
  workerId: string;
  jobId: string;
  timestamp: Date;
  services: WorkerServices;
}

export interface WorkerResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export abstract class BaseWorker<TInput = any, TOutput = any> {
  /**
   * Unique identifier for this worker type
   * Must be overridden by each worker implementation
   */
  static readonly id: string;

  /**
   * Worker name for logging
   */
  abstract readonly name: string;

  /**
   * Execute the worker job
   * @param input - Job input parameters
   * @param context - Worker execution context
   */
  abstract execute(input: TInput, context: WorkerContext): Promise<WorkerResult & { data?: TOutput }>;

  /**
   * Validate input before execution
   * Override to add custom validation
   */
  protected async validateInput(input: TInput): Promise<void> {
    if (input === null || input === undefined) {
      throw new Error('Input cannot be null or undefined');
    }
  }

  /**
   * Run the worker with error handling and logging
   */
  async run(
    input: TInput,
    jobId: string = this.generateJobId(),
    services?: WorkerServices
  ): Promise<WorkerResult & { data?: TOutput }> {
    const workerServices = services || this.createDefaultServices();

    const context: WorkerContext = {
      workerId: (this.constructor as typeof BaseWorker).id,
      jobId,
      timestamp: new Date(),
      services: workerServices
    };

    logger.info(`[${this.name}] Starting job ${jobId}`);

    try {
      await this.validateInput(input);

      const result = await this.execute(input, context);

      if (result.success) {
        logger.info(`[${this.name}] Job ${jobId} completed successfully`);
      } else {
        logger.warn(`[${this.name}] Job ${jobId} completed with warnings: ${result.message}`);
      }

      return result;

    } catch (error) {
      logger.error(`[${this.name}] Job ${jobId} failed:`, error);

      return {
        success: false,
        message: 'Worker execution failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create default service instances
   */
  private createDefaultServices(): WorkerServices {
    return {
      user: new UserService(),
      brand: new BrandService(),
      program: new ProgramService(),
      programMembership: new ProgramMembershipService(),
      task: new TaskService(),
      failedImport: new FailedImportService()
    };
  }

  /**
   * Generate a unique job ID
   */
  private generateJobId(): string {
    return `${(this.constructor as typeof BaseWorker).id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
