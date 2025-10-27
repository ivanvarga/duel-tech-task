/**
 * Migration: Create users collection
 */

import { Db } from 'mongodb';
import { ensureCollectionExists, dropIndexIfExists } from '../scripts/run-migrations';

export const id = '001';
export const name = 'create_users_collection';

export async function up(db: Db): Promise<void> {
  console.log('[INFO] Setting up users collection indexes...');

  await ensureCollectionExists(db, 'users');

  // Drop any existing indexes with different names to avoid conflicts
  await dropIndexIfExists(db, 'users', 'user_id_1');
  await dropIndexIfExists(db, 'users', 'email_1');

  // Create indexes
  await db.collection('users').createIndex(
    { user_id: 1 },
    { unique: true, name: 'user_id_unique' }
  );

  await db.collection('users').createIndex(
    { email: 1 },
    { unique: true, name: 'email_unique' }
  );

  await db.collection('users').createIndex(
    { status: 1 },
    { name: 'status_index' }
  );

  console.log('[INFO] ✓ Users collection indexes created');
}

export async function down(db: Db): Promise<void> {
  console.log('[INFO] Dropping users indexes...');
  await dropIndexIfExists(db, 'users', 'user_id_unique');
  await dropIndexIfExists(db, 'users', 'email_unique');
  await dropIndexIfExists(db, 'users', 'status_index');
  console.log('[INFO] ✓ Users indexes dropped');
}
