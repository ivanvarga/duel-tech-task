/**
 * Migration: Create tasks collection
 */

import { Db } from 'mongodb';
import { ensureCollectionExists, dropIndexIfExists } from '../scripts/run-migrations';

export const id = '006';
export const name = 'create_tasks_collection';

export async function up(db: Db): Promise<void> {
  console.log('[INFO] Setting up tasks collection indexes...');

  await ensureCollectionExists(db, 'tasks');

  // Drop any existing indexes with different names
  await dropIndexIfExists(db, 'tasks', 'task_id_1');
  await dropIndexIfExists(db, 'tasks', 'user_id_1');
  await dropIndexIfExists(db, 'tasks', 'program_id_1');
  await dropIndexIfExists(db, 'tasks', 'membership_id_1');
  await dropIndexIfExists(db, 'tasks', 'brand_id_1');
  await dropIndexIfExists(db, 'tasks', 'platform_1');

  // Create indexes
  await db.collection('tasks').createIndex(
    { task_id: 1 },
    { unique: true, name: 'task_id_unique' }
  );

  await db.collection('tasks').createIndex(
    { user_id: 1 },
    { name: 'user_id_index' }
  );

  await db.collection('tasks').createIndex(
    { program_id: 1 },
    { name: 'program_id_index' }
  );

  await db.collection('tasks').createIndex(
    { membership_id: 1 },
    { name: 'membership_id_index' }
  );

  await db.collection('tasks').createIndex(
    { brand_id: 1 },
    { name: 'brand_id_index' }
  );

  await db.collection('tasks').createIndex(
    { platform: 1 },
    { name: 'platform_index' }
  );

  console.log('[INFO] ✓ Tasks collection indexes created');
}

export async function down(db: Db): Promise<void> {
  console.log('[INFO] Dropping tasks indexes...');
  await dropIndexIfExists(db, 'tasks', 'task_id_unique');
  await dropIndexIfExists(db, 'tasks', 'user_id_index');
  await dropIndexIfExists(db, 'tasks', 'program_id_index');
  await dropIndexIfExists(db, 'tasks', 'membership_id_index');
  await dropIndexIfExists(db, 'tasks', 'brand_id_index');
  await dropIndexIfExists(db, 'tasks', 'platform_index');
  console.log('[INFO] ✓ Tasks indexes dropped');
}
