/**
 * Worker Registry
 * Central registry for all workers with ID-based lookup
 */

import { BaseWorker, WorkerResult } from './BaseWorker';
import { logger } from '../utils/logger';

type WorkerConstructor = new () => BaseWorker;

class WorkerRegistry {
  private workers: Map<string, WorkerConstructor> = new Map();

  /**
   * Register a worker class
   */
  register(workerClass: WorkerConstructor): void {
    const id = (workerClass as any).id;

    if (!id) {
      throw new Error(`Worker class ${workerClass.name} must have a static 'id' property`);
    }

    if (this.workers.has(id)) {
      throw new Error(`Worker with id '${id}' is already registered`);
    }

    this.workers.set(id, workerClass);
    logger.info(`Registered worker: ${id} (${workerClass.name})`);
  }

  /**
   * Get a worker class by ID
   */
  getWorker(id: string): WorkerConstructor | undefined {
    return this.workers.get(id);
  }

  /**
   * Check if a worker is registered
   */
  hasWorker(id: string): boolean {
    return this.workers.has(id);
  }

  /**
   * Get all registered worker IDs
   */
  getWorkerIds(): string[] {
    return Array.from(this.workers.keys());
  }

  /**
   * Execute a worker by ID
   */
  async executeWorker(workerId: string, input: any, jobId?: string): Promise<WorkerResult> {
    const WorkerClass = this.getWorker(workerId);

    if (!WorkerClass) {
      logger.error(`Worker not found: ${workerId}`);
      return {
        success: false,
        message: `Worker '${workerId}' not found`,
        error: 'WORKER_NOT_FOUND'
      };
    }

    const worker = new WorkerClass();
    return await worker.run(input, jobId);
  }
}

export const workerRegistry = new WorkerRegistry();
