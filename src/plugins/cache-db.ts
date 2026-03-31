import knex, { Knex } from 'knex';
import path = require('path');
import fs = require('fs');
import moment = require('moment');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'moph_alert_cache.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let cacheDb: Knex = null;
let cacheAvailable = true;
let cacheDisabledMessageLogged = false;

function isNativeModuleError(error: any): boolean {
  const message = error?.message || String(error || '');
  return message.includes('Module did not self-register')
    || message.includes('better_sqlite3.node')
    || message.includes('NODE_MODULE_VERSION');
}

function getCacheDb(): Knex | null {
  if (!cacheAvailable) {
    return null;
  }

  if (cacheDb) {
    return cacheDb;
  }

  try {
    cacheDb = knex({
      client: 'better-sqlite3',
      connection: {
        filename: DB_PATH
      },
      useNullAsDefault: true
    });
    return cacheDb;
  } catch (error) {
    cacheAvailable = false;
    console.error('Cache DB disabled: failed to initialize better-sqlite3:', error?.message || error);
    return null;
  }
}

function handleCacheError(action: string, error: any) {
  const message = error?.message || 'unknown error';
  if (isNativeModuleError(error)) {
    cacheAvailable = false;
    if (!cacheDisabledMessageLogged) {
      console.error(`Cache DB disabled due to native module error while ${action}: ${message}`);
      cacheDisabledMessageLogged = true;
    }
    return;
  }

  console.error(`Error ${action}:`, message);
}

/**
 * Initialize the cache database and create table if not exists
 */
export const initializeCacheDb = async () => {
  try {
    const db = getCacheDb();
    if (!db) {
      return false;
    }

    const hasTable = await db.schema.hasTable('moph_alert_sent');
    
    if (!hasTable) {
      await db.schema.createTable('moph_alert_sent', (table) => {
        table.increments('id').primary();
        table.string('vn', 50).notNullable();
        table.string('hospcode', 10).notNullable();
        table.datetime('date_sent').notNullable();
        
        // Create index on vn for faster lookups
        table.index(['vn'], 'idx_vn');
        // Composite index for vn + hospcode for better filtering
        table.index(['vn', 'hospcode'], 'idx_vn_hospcode');
      });
      
      console.log('Cache table "moph_alert_sent" created successfully');
    }
    
    return true;
  } catch (error) {
    handleCacheError('initializing cache database', error);
    return false;
  }
};

/**
 * Check if VNs exist in cache
 * @param vns Array of VN strings
 * @param hospcode Hospital code
 * @returns Array of VNs that exist in cache
 */
export const getExistingVns = async (vns: string[], hospcode: string): Promise<string[]> => {
  try {
    const db = getCacheDb();
    if (!db) {
      return [];
    }

    if (!vns || vns.length === 0) {
      return [];
    }
    
    const results = await db('moph_alert_sent')
      .select('vn')
      .whereIn('vn', vns)
      .andWhere('hospcode', hospcode);
    
    return results.map(row => row.vn);
  } catch (error) {
    handleCacheError('checking existing VNs in cache', error);
    return [];
  }
};

/**
 * Insert sent VNs into cache
 * @param vns Array of VN strings
 * @param hospcode Hospital code
 */
export const insertSentVns = async (vns: string[], hospcode: string): Promise<boolean> => {
  try {
    const db = getCacheDb();
    if (!db) {
      return false;
    }

    if (!vns || vns.length === 0) {
      return true;
    }
    
    const dateSent = moment().format('YYYY-MM-DD HH:mm:ss');
    const records = vns.map(vn => ({
      vn,
      hospcode,
      date_sent: dateSent
    }));
    
    await db('moph_alert_sent').insert(records);
    console.log(`Inserted ${vns.length} VNs into cache`);
    
    return true;
  } catch (error) {
    handleCacheError('inserting VNs into cache', error);
    return false;
  }
};

/**
 * Clean up old records (older than specified days)
 * @param days Number of days to keep records (default: 2)
 */
export const cleanupOldRecords = async (days: number = 2): Promise<number> => {
  try {
    const db = getCacheDb();
    if (!db) {
      return 0;
    }

    const cutoffDate = moment().subtract(days, 'days').format('YYYY-MM-DD HH:mm:ss');
    
    const deletedCount = await db('moph_alert_sent')
      .where('date_sent', '<', cutoffDate)
      .del();
    
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} old records from cache (older than ${days} days)`);
    }
    
    return deletedCount;
  } catch (error) {
    handleCacheError('cleaning up old records', error);
    return 0;
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
  try {
    const db = getCacheDb();
    if (!db) {
      return null;
    }

    const totalRecords = await db('moph_alert_sent').count('id as count').first();
    const oldestRecord = await db('moph_alert_sent')
      .select('date_sent')
      .orderBy('date_sent', 'asc')
      .first();
    const newestRecord = await db('moph_alert_sent')
      .select('date_sent')
      .orderBy('date_sent', 'desc')
      .first();
    
    return {
      totalRecords: totalRecords?.count || 0,
      oldestRecord: oldestRecord?.date_sent || null,
      newestRecord: newestRecord?.date_sent || null
    };
  } catch (error) {
    handleCacheError('getting cache stats', error);
    return null;
  }
};

export default cacheDb;
