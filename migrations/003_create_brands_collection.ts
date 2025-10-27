/**
 * Migration: Create brands collection
 */

import { Db } from 'mongodb';
import { ensureCollectionExists, dropIndexIfExists } from '../scripts/run-migrations';

export const id = '003';
export const name = 'create_brands_collection';

export async function up(db: Db): Promise<void> {
  console.log('[INFO] Setting up brands collection indexes...');

  await ensureCollectionExists(db, 'brands');

  // Drop any existing indexes with different names
  await dropIndexIfExists(db, 'brands', 'brand_id_1');
  await dropIndexIfExists(db, 'brands', 'company_id_1');
  await dropIndexIfExists(db, 'brands', 'name_1');

  // Create indexes
  await db.collection('brands').createIndex(
    { brand_id: 1 },
    { unique: true, name: 'brand_id_unique' }
  );

  await db.collection('brands').createIndex(
    { company_id: 1 },
    { name: 'company_id_index' }
  );

  await db.collection('brands').createIndex(
    { name: 1 },
    { name: 'name_index' }
  );

  console.log('[INFO] ✓ Brands collection indexes created');
}

export async function down(db: Db): Promise<void> {
  console.log('[INFO] Dropping brands indexes...');
  await dropIndexIfExists(db, 'brands', 'brand_id_unique');
  await dropIndexIfExists(db, 'brands', 'company_id_index');
  await dropIndexIfExists(db, 'brands', 'name_index');
  console.log('[INFO] ✓ Brands indexes dropped');
}
