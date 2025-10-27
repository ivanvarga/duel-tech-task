# Worker Guidelines

**Scope**: `src/workers/**/*.ts`

## Pattern

All workers follow the BaseWorker pattern:

```typescript
export class MyWorker extends BaseWorker<MyInput, MyOutput> {
  static readonly id = 'my-worker';     // Registry key
  readonly name = 'MyWorker';           // Display name

  async execute(
    input: MyInput,
    context: WorkerContext
  ): Promise<WorkerResult & { data?: MyOutput }> {
    // Implementation
  }

  protected async validateInput(input: MyInput): Promise<void> {
    await super.validateInput(input);
    // Custom validation
  }
}
```

## Comment Rules

### ❌ Avoid

```typescript
// STEP 1: Read file from storage
const file = await storage.readFile(fileName);

// STEP 2: Parse JSON
const parsed = JSON.parse(file);

// Process in batches
for (let i = 0; i < items.length; i += batchSize) {
  // ...
}
```

### ✅ Prefer

```typescript
const file = await storage.readFile(fileName);
const parsed = JSON.parse(file);

for (let i = 0; i < items.length; i += batchSize) {
  // ...
}
```

### ✅ Keep Explanatory Comments

```typescript
// --strip-components=1 removes top-level directory
const command = `tar -xzf "${filePath}" -C "${targetDir}" --strip-components=1`;

// Message will be retried based on SQS settings
if (!result.success) {
  logger.error(`Processing failed: ${message.MessageId}`);
}
```

## Logging

Always include jobId in logs:

```typescript
logger.info(`[${context.jobId}] Starting extraction from: ${archivePath}`);
logger.error(`[${context.jobId}] Extraction failed:`, error);
```

## Error Handling

Return WorkerResult, don't throw:

```typescript
try {
  // Work...
  return {
    success: true,
    message: 'Task completed',
    data: { ... }
  };
} catch (error) {
  return {
    success: false,
    message: 'Task failed',
    error: error instanceof Error ? error.message : 'Unknown error'
  };
}
```

## TypeScript Exceptions

Use `as any` for Mongoose model unions:

```typescript
// TypeScript can't reconcile union of different model types
for (const collection of collections) {
  await (collection.model as any).deleteMany({});
}
```

## Registration

Register in `src/workers/index.ts`:

```typescript
import { MyWorker } from './MyWorker';
workerRegistry.register(MyWorker);
export { MyWorker };
```

## Testing

Mock storage and database:

```typescript
describe('MyWorker', () => {
  let worker: MyWorker;

  beforeEach(() => {
    worker = new MyWorker();
    // Setup mocks
  });

  it('should process valid input', async () => {
    const result = await worker.run(validInput, 'test-job-123');
    expect(result.success).toBe(true);
  });
});
```
