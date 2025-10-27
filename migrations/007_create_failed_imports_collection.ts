/**
 * Migration: Create failedimports collection
 */

import { Db } from 'mongodb';
import { ensureCollectionExists, dropIndexIfExists } from '../scripts/run-migrations';

export const id = '007';
export const name = 'create_failed_imports_collection';

export async function up(db: Db): Promise<void> {
  console.log('[INFO] Setting up failedimports collection indexes...');

  await ensureCollectionExists(db, 'failedimports');

  // Drop any existing indexes with different names
  await dropIndexIfExists(db, 'failedimports', 'file_name_1');
  await dropIndexIfExists(db, 'failedimports', 'error_type_1');
  await dropIndexIfExists(db, 'failedimports', 'status_1');
  await dropIndexIfExists(db, 'failedimports', 'attempted_at_-1');

  // Create indexes
  await db.collection('failedimports').createIndex(
    { file_name: 1 },
    { name: 'file_name_index' }
  );

  await db.collection('failedimports').createIndex(
    { error_type: 1 },
    { name: 'error_type_index' }
  );

  await db.collection('failedimports').createIndex(
    { status: 1 },
    { name: 'status_index' }
  );

  await db.collection('failedimports').createIndex(
    { attempted_at: -1 },
    { name: 'attempted_at_desc' }
  );

  console.log('[INFO] ✓ Failed imports collection indexes created');
}

export async function down(db: Db): Promise<void> {
  console.log('[INFO] Dropping failedimports indexes...');
  await dropIndexIfExists(db, 'failedimports', 'file_name_index');
  await dropIndexIfExists(db, 'failedimports', 'error_type_index');
  await dropIndexIfExists(db, 'failedimports', 'status_index');
  await dropIndexIfExists(db, 'failedimports', 'attempted_at_desc');
  console.log('[INFO] ✓ Failed imports indexes dropped');
}
