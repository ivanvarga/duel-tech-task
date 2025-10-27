/**
 * Migration: Create companies collection
 */

import { Db } from 'mongodb';
import { ensureCollectionExists, dropIndexIfExists } from '../scripts/run-migrations';

export const id = '002';
export const name = 'create_companies_collection';

export async function up(db: Db): Promise<void> {
  console.log('[INFO] Setting up companies collection indexes...');

  await ensureCollectionExists(db, 'companies');

  // Drop any existing indexes with different names
  await dropIndexIfExists(db, 'companies', 'company_id_1');
  await dropIndexIfExists(db, 'companies', 'name_1');

  // Create indexes
  await db.collection('companies').createIndex(
    { company_id: 1 },
    { unique: true, name: 'company_id_unique' }
  );

  await db.collection('companies').createIndex(
    { name: 1 },
    { name: 'name_index' }
  );

  console.log('[INFO] ✓ Companies collection indexes created');
}

export async function down(db: Db): Promise<void> {
  console.log('[INFO] Dropping companies indexes...');
  await dropIndexIfExists(db, 'companies', 'company_id_unique');
  await dropIndexIfExists(db, 'companies', 'name_index');
  console.log('[INFO] ✓ Companies indexes dropped');
}
