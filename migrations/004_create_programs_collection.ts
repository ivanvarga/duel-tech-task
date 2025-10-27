/**
 * Migration: Create programs collection
 */

import { Db } from 'mongodb';
import { ensureCollectionExists, dropIndexIfExists } from '../scripts/run-migrations';

export const id = '004';
export const name = 'create_programs_collection';

export async function up(db: Db): Promise<void> {
  console.log('[INFO] Setting up programs collection indexes...');

  await ensureCollectionExists(db, 'programs');

  // Drop any existing indexes with different names
  await dropIndexIfExists(db, 'programs', 'program_id_1');
  await dropIndexIfExists(db, 'programs', 'brand_id_1');
  await dropIndexIfExists(db, 'programs', 'company_id_1');
  await dropIndexIfExists(db, 'programs', 'status_1');

  // Create indexes
  await db.collection('programs').createIndex(
    { program_id: 1 },
    { unique: true, name: 'program_id_unique' }
  );

  await db.collection('programs').createIndex(
    { brand_id: 1 },
    { name: 'brand_id_index' }
  );

  await db.collection('programs').createIndex(
    { company_id: 1 },
    { name: 'company_id_index' }
  );

  await db.collection('programs').createIndex(
    { status: 1 },
    { name: 'status_index' }
  );

  console.log('[INFO] ✓ Programs collection indexes created');
}

export async function down(db: Db): Promise<void> {
  console.log('[INFO] Dropping programs indexes...');
  await dropIndexIfExists(db, 'programs', 'program_id_unique');
  await dropIndexIfExists(db, 'programs', 'brand_id_index');
  await dropIndexIfExists(db, 'programs', 'company_id_index');
  await dropIndexIfExists(db, 'programs', 'status_index');
  console.log('[INFO] ✓ Programs indexes dropped');
}
