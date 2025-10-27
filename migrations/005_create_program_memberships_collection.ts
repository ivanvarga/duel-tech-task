/**
 * Migration: Create program_memberships collection
 */

import { Db } from 'mongodb';
import { ensureCollectionExists, dropIndexIfExists } from '../scripts/run-migrations';

export const id = '005';
export const name = 'create_program_memberships_collection';

export async function up(db: Db): Promise<void> {
  console.log('[INFO] Setting up program_memberships collection indexes...');

  await ensureCollectionExists(db, 'program_memberships');

  // Drop any existing indexes with different names
  await dropIndexIfExists(db, 'program_memberships', 'membership_id_1');
  await dropIndexIfExists(db, 'program_memberships', 'program_id_1');
  await dropIndexIfExists(db, 'program_memberships', 'user_id_1');
  await dropIndexIfExists(db, 'program_memberships', 'brand_id_1');
  await dropIndexIfExists(db, 'program_memberships', 'company_id_1');
  await dropIndexIfExists(db, 'program_memberships', 'user_id_1_program_id_1');

  // Create indexes
  await db.collection('program_memberships').createIndex(
    { membership_id: 1 },
    { unique: true, name: 'membership_id_unique' }
  );

  await db.collection('program_memberships').createIndex(
    { program_id: 1 },
    { name: 'program_id_index' }
  );

  await db.collection('program_memberships').createIndex(
    { user_id: 1 },
    { name: 'user_id_index' }
  );

  await db.collection('program_memberships').createIndex(
    { brand_id: 1 },
    { name: 'brand_id_index' }
  );

  await db.collection('program_memberships').createIndex(
    { company_id: 1 },
    { name: 'company_id_index' }
  );

  // Compound unique index for user + program
  await db.collection('program_memberships').createIndex(
    { user_id: 1, program_id: 1 },
    { unique: true, name: 'user_program_unique' }
  );

  console.log('[INFO] ✓ Program memberships collection indexes created');
}

export async function down(db: Db): Promise<void> {
  console.log('[INFO] Dropping program_memberships indexes...');
  await dropIndexIfExists(db, 'program_memberships', 'membership_id_unique');
  await dropIndexIfExists(db, 'program_memberships', 'program_id_index');
  await dropIndexIfExists(db, 'program_memberships', 'user_id_index');
  await dropIndexIfExists(db, 'program_memberships', 'brand_id_index');
  await dropIndexIfExists(db, 'program_memberships', 'company_id_index');
  await dropIndexIfExists(db, 'program_memberships', 'user_program_unique');
  console.log('[INFO] ✓ Program memberships indexes dropped');
}
