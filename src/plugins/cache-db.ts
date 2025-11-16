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

// Create SQLite connection using Knex
const cacheDb: Knex = knex({
  client: 'better-sqlite3',
  connection: {
    filename: DB_PATH
  },
  useNullAsDefault: true
});

/**
 * Initialize the cache database and create table if not exists
 */
export const initializeCacheDb = async () => {
  try {
    const hasTable = await cacheDb.schema.hasTable('moph_alert_sent');
    
    if (!hasTable) {
      await cacheDb.schema.createTable('moph_alert_sent', (table) => {
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
    console.error('Error initializing cache database:', error.message);
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
    if (!vns || vns.length === 0) {
      return [];
    }
    
    const results = await cacheDb('moph_alert_sent')
      .select('vn')
      .whereIn('vn', vns)
      .andWhere('hospcode', hospcode);
    
    return results.map(row => row.vn);
  } catch (error) {
    console.error('Error checking existing VNs in cache:', error.message);
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
    if (!vns || vns.length === 0) {
      return true;
    }
    
    const dateSent = moment().format('YYYY-MM-DD HH:mm:ss');
    const records = vns.map(vn => ({
      vn,
      hospcode,
      date_sent: dateSent
    }));
    
    await cacheDb('moph_alert_sent').insert(records);
    console.log(`Inserted ${vns.length} VNs into cache`);
    
    return true;
  } catch (error) {
    console.error('Error inserting VNs into cache:', error.message);
    return false;
  }
};

/**
 * Clean up old records (older than specified days)
 * @param days Number of days to keep records (default: 2)
 */
export const cleanupOldRecords = async (days: number = 2): Promise<number> => {
  try {
    const cutoffDate = moment().subtract(days, 'days').format('YYYY-MM-DD HH:mm:ss');
    
    const deletedCount = await cacheDb('moph_alert_sent')
      .where('date_sent', '<', cutoffDate)
      .del();
    
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} old records from cache (older than ${days} days)`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old records:', error.message);
    return 0;
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
  try {
    const totalRecords = await cacheDb('moph_alert_sent').count('id as count').first();
    const oldestRecord = await cacheDb('moph_alert_sent')
      .select('date_sent')
      .orderBy('date_sent', 'asc')
      .first();
    const newestRecord = await cacheDb('moph_alert_sent')
      .select('date_sent')
      .orderBy('date_sent', 'desc')
      .first();
    
    return {
      totalRecords: totalRecords?.count || 0,
      oldestRecord: oldestRecord?.date_sent || null,
      newestRecord: newestRecord?.date_sent || null
    };
  } catch (error) {
    console.error('Error getting cache stats:', error.message);
    return null;
  }
};

export default cacheDb;
