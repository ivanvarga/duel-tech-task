/**
 * Worker module exports
 * Auto-registers all workers
 */

export { BaseWorker, WorkerServices, WorkerContext, WorkerResult } from './BaseWorker';
export { workerRegistry } from './WorkerRegistry';
export { handleWorkerJob, processSQSMessage } from './WorkerHandler';

// Import all worker implementations
import { ProcessFileWorker } from './implementations/ProcessFileWorker';
import { ETLBatchWorker } from './implementations/ETLBatchWorker';
import { ExtractFilesWorker } from './implementations/ExtractFilesWorker';
import { workerRegistry } from './WorkerRegistry';

// Auto-register all workers
workerRegistry.register(ProcessFileWorker);
workerRegistry.register(ETLBatchWorker);
workerRegistry.register(ExtractFilesWorker);

// Export worker classes for direct use
export { ProcessFileWorker, ETLBatchWorker, ExtractFilesWorker };
