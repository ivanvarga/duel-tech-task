#!/usr/bin/env ts-node

/**
 * Database Migration Runner
 * Reads migration files from migrations/ folder and tracks which have been run
 * Usage: yarn migrate:up, yarn migrate:down, yarn migrate:status
 */

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Db } from 'mongodb';
import { config } from '../src/config';
import { logger } from '../src/utils/logger';

interface MigrationFile {
  id: string;
  name: string;
  filename: string;
  up: (db: Db) => Promise<void>;
  down: (db: Db) => Promise<void>;
}

// Utility functions for migrations
export async function ensureCollectionExists(db: Db, collectionName: string): Promise<void> {
  const collections = await db.listCollections({ name: collectionName }).toArray();
  if (collections.length === 0) {
    await db.createCollection(collectionName);
    console.log(`[INFO] Created collection: ${collectionName}`);
  } else {
    console.log(`[INFO] Collection already exists: ${collectionName}`);
  }
}

export async function dropIndexIfExists(db: Db, collectionName: string, indexName: string): Promise<void> {
  try {
    const collection = db.collection(collectionName);
    const indexes = await collection.indexes();
    const indexExists = indexes.some(idx => idx.name === indexName);

    if (indexExists) {
      await collection.dropIndex(indexName);
      console.log(`[INFO] Dropped index: ${indexName} from ${collectionName}`);
    }
  } catch (error) {
    // Ignore errors if collection or index doesn't exist
    console.log(`[INFO] Index ${indexName} does not exist on ${collectionName}`);
  }
}


// Migration tracking collection
const MigrationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  filename: { type: String, required: true },
  executedAt: { type: Date, default: Date.now }
});

const MigrationModel = mongoose.model('Migration', MigrationSchema);

async function runMigrations(): Promise<void> {
  try {
    // Connect directly without loading models
    await mongoose.connect(config.database.uri);
    logger.info('Database connected successfully');

    const command = process.argv[2];

    switch (command) {
      case 'up':
        await migrateUp();
        break;
      case 'down':
        await migrateDown();
        break;
      case 'status':
        await showStatus();
        break;
      default:
        logger.error('Usage: yarn migrate:up, yarn migrate:down, or yarn migrate:status');
        await mongoose.disconnect();
        process.exit(1);
    }

    // Disconnect from database after migrations complete
    await mongoose.disconnect();
    logger.info('Disconnected from database');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

async function loadMigrations(): Promise<MigrationFile[]> {
  const migrationsDir = path.join(__dirname, '..', 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    logger.info('No migrations folder found, creating empty migrations directory');
    fs.mkdirSync(migrationsDir, { recursive: true });
    return [];
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.ts'))
    .sort(); // Sort to ensure correct order

  const migrations: MigrationFile[] = [];

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const migrationId = file.split('_')[0];
    const migrationName = file.replace('.ts', '').replace(`${migrationId}_`, '');

    try {
      // Clear require cache to ensure fresh impor
      delete require.cache[require.resolve(filePath)];
      const migration = require(filePath);

      if (!migration.up || !migration.down) {
        logger.warn(`Skipping ${file}: missing up/down functions`);
        continue;
      }

      migrations.push({
        id: migrationId,
        name: migrationName,
        filename: file,
        up: migration.up,
        down: migration.down
      });
    } catch (error) {
      logger.error(`Error loading migration ${file}:`, error);
    }
  }

  return migrations;
}

async function getExecutedMigrations(): Promise<Set<string>> {
  try {
    const records = await MigrationModel.find({}).exec();
    return new Set(records.map(record => record.id));
  } catch (error) {
    logger.warn('Could not fetch executed migrations, assuming none have been run');
    return new Set();
  }
}

async function markMigrationAsExecuted(migration: MigrationFile): Promise<void> {
  try {
    await MigrationModel.create({
      id: migration.id,
      name: migration.name,
      filename: migration.filename,
      executedAt: new Date()
    });
  } catch (error) {
    logger.error(`Failed to mark migration ${migration.id} as executed:`, error);
    throw error;
  }
}

async function markMigrationAsRolledBack(migration: MigrationFile): Promise<void> {
  try {
    await MigrationModel.deleteOne({ id: migration.id });
  } catch (error) {
    logger.error(`Failed to mark migration ${migration.id} as rolled back:`, error);
    throw error;
  }
}

async function migrateUp(): Promise<void> {
  logger.info('Running migrations up...');

  const migrations = await loadMigrations();
  const executedMigrations = await getExecutedMigrations();

  const pendingMigrations = migrations.filter(m => !executedMigrations.has(m.id));

  if (pendingMigrations.length === 0) {
    logger.info('No pending migrations found');
    return;
  }

  logger.info(`Found ${pendingMigrations.length} pending migrations`);

  // Get MongoDB native db instance
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  for (const migration of pendingMigrations) {
    try {
      logger.info(`Running migration ${migration.id}: ${migration.name}`);
      await migration.up(db);
      await markMigrationAsExecuted(migration);
      logger.info(`✓ Migration ${migration.id} completed`);
    } catch (error) {
      logger.error(`✗ Migration ${migration.id} failed:`, error);
      throw error;
    }
  }

  logger.info('All migrations completed successfully');
}

async function migrateDown(): Promise<void> {
  logger.info('Running migrations down...');

  const migrations = await loadMigrations();
  const executedMigrations = await getExecutedMigrations();

  const executedMigrationsList = migrations.filter(m => executedMigrations.has(m.id));

  if (executedMigrationsList.length === 0) {
    logger.info('No executed migrations found');
    return;
  }

  // Run migrations in reverse order
  const migrationsToRollback = executedMigrationsList.reverse();

  logger.info(`Found ${migrationsToRollback.length} migrations to rollback`);

  // Get MongoDB native db instance
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  for (const migration of migrationsToRollback) {
    try {
      logger.info(`Rolling back migration ${migration.id}: ${migration.name}`);
      await migration.down(db);
      await markMigrationAsRolledBack(migration);
      logger.info(`✓ Migration ${migration.id} rolled back`);
    } catch (error) {
      logger.error(`✗ Migration ${migration.id} rollback failed:`, error);
      throw error;
    }
  }

  logger.info('All migrations rolled back successfully');
}

async function showStatus(): Promise<void> {
  logger.info('Migration Status:');
  logger.info('================');

  const migrations = await loadMigrations();
  const executedMigrations = await getExecutedMigrations();

  if (migrations.length === 0) {
    logger.info('No migration files found in migrations/ folder');
    return;
  }

  for (const migration of migrations) {
    const status = executedMigrations.has(migration.id) ? '✓ EXECUTED' : '○ PENDING';
    logger.info(`${status} ${migration.id}: ${migration.name}`);
  }

  const pendingCount = migrations.filter(m => !executedMigrations.has(m.id)).length;
  const executedCount = migrations.filter(m => executedMigrations.has(m.id)).length;

  logger.info(`\nTotal migrations: ${migrations.length}`);
  logger.info(`Executed: ${executedCount}`);
  logger.info(`Pending: ${pendingCount}`);
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}