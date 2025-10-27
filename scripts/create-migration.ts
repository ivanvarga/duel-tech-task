#!/usr/bin/env ts-node

/**
 * Migration File Creator
 * Usage: yarn migrate:create <migration-name>
 */

import * as fs from 'fs';
import * as path from 'path';

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Usage: yarn migrate:create <migration-name>');
  console.error('Example: yarn migrate:create add_user_indexes');
  process.exit(1);
}

// Create migrations directory if it doesn't exis
const migrationsDir = path.join(__dirname, '..', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Get the next migration number
const existingFiles = fs.readdirSync(migrationsDir)
  .filter((file: string) => file.endsWith('.ts'))
  .sort();

let nextNumber = 1;
if (existingFiles.length > 0) {
  const lastFile = existingFiles[existingFiles.length - 1];
  const lastNumber = parseInt(lastFile.split('_')[0]);
  nextNumber = lastNumber + 1;
}

const paddedNumber = nextNumber.toString().padStart(3, '0');
const fileName = `${paddedNumber}_${migrationName}.ts`;

// Migration template
const migrationTemplate = `import { logger } from '../src/utils/logger';

export const up = async (): Promise<void> => {
  logger.info('Running migration: ${migrationName}');

  // Add your migration logic here
  // Example:
  // await db.collection('users').createIndex({ email: 1 });
  // await db.collection('users').createIndex({ createdAt: 1 });
};

export const down = async (): Promise<void> => {
  logger.info('Rolling back migration: ${migrationName}');

  // Add your rollback logic here
  // Example:
  // await db.collection('users').dropIndex({ email: 1 });
  // await db.collection('users').dropIndex({ createdAt: 1 });
};
`;

// Write migration file
const filePath = path.join(migrationsDir, fileName);
fs.writeFileSync(filePath, migrationTemplate);

console.log(`✓ Migration created: ${fileName}`);
console.log(`  Location: ${filePath}`);
console.log('');
console.log('Next steps:');
console.log('1. Edit the migration file with your logic');
console.log('2. Run: yarn migrate:up');
console.log('');
console.log('Migration commands:');
console.log('  yarn migrate:up     - Run pending migrations');
console.log('  yarn migrate:down   - Rollback last migration');
console.log('  yarn migrate:status - Show migration status');
