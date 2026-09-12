/*
import { Knex } from 'knex';

const createWhere = (query: Knex.QueryBuilder<any, any>, whereConditions: any) => {
  Supports multiple SQL clients: MySQL, PostgreSQL, SQLite, MSSQL, Oracle
*/

import { Knex } from 'knex';

export class SqlFn {
  private db: Knex;
  private client: string;

  constructor(db: Knex) {
    this.db = db;
    this.client = db.client.config.client;
  }

  private isMySQL = () => ['mysql', 'mysqld'].includes(this.client);
  private isPostgreSQL = () => ['pg', 'postgres', 'postgresql'].includes(this.client);
  private isSQLite = () => ['sqlite3', 'sqlite'].includes(this.client);
  private isMsSQL = () => ['mssql', 'sqlserver'].includes(this.client);
  private isOracle = () => ['oracledb', 'oracle'].includes(this.client);

  /**
   * รวมค่าของหลายคอลัมน์หรือค่าคงที่เป็นสตริงเดียว
   * @param {...string[]} args
   */
  concat = (...args: string[]) => {
    if (this.isMySQL() || this.isSQLite()) {
      return this.db.raw(`CONCAT(${args.join(', ')})`);
    } else if (this.isPostgreSQL()) {
      return this.db.raw(`CONCAT(${args.join(', ')})`);
    } else if (this.isMsSQL()) {
      return this.db.raw(`CONCAT(${args.join(', ')})`);
    } else if (this.isOracle()) {
      return this.db.raw(`CONCAT(${args.join(', ')})`);
    } else {
      throw new Error('Unsupported SQL client for concat');
    }
  }

  /**
   * ดึงค่าปี (Year) จากคอลัมน์วันที่
   * @param {string} column
   */
  year = (column: string) => {
    if (this.isMySQL() || this.isSQLite()) {
      return this.db.raw(`YEAR(${column})`);
    } else if (this.isPostgreSQL()) {
      return this.db.raw(`EXTRACT(YEAR FROM ${column})`);
    } else if (this.isMsSQL()) {
      return this.db.raw(`YEAR(${column})`);
    } else if (this.isOracle()) {
      return this.db.raw(`EXTRACT(YEAR FROM ${column})`);
    } else {
      throw new Error('Unsupported SQL client for year');
    }
  }

  /**
   * ดึงค่าเดือน (Month) จากคอลัมน์วันที่ (ได้ค่า 1 - 12)
   * @param {string} column
   */
  month = (column: string) => {
    if (this.isMySQL() || this.isSQLite()) {
      return this.db.raw(`MONTH(${column})`);
    } else if (this.isPostgreSQL()) {
      return this.db.raw(`EXTRACT(MONTH FROM ${column})`);
    } else if (this.isMsSQL()) {
      return this.db.raw(`MONTH(${column})`);
    } else if (this.isOracle()) {
      return this.db.raw(`EXTRACT(MONTH FROM ${column})`);
    } else {
      throw new Error('Unsupported SQL client for month');
    }
  }

  /**
   * ดึงค่าวัน (Day) จากคอลัมน์วันที่
   * @param {string} column
   */
  day = (column: string) => {
    if (this.isMySQL() || this.isSQLite()) {
      return this.db.raw(`DAY(${column})`);
    } else if (this.isPostgreSQL()) {
      return this.db.raw(`EXTRACT(DAY FROM ${column})`);
    } else if (this.isMsSQL()) {
      return this.db.raw(`DAY(${column})`);
    } else if (this.isOracle()) {
      return this.db.raw(`EXTRACT(DAY FROM ${column})`);
    } else {
      throw new Error('Unsupported SQL client for day');
    }
  }

  /**
   * คำนวณความต่างของวันที่ในหน่วยวัน
   * @param {string} startColumn
   * @param {string} endColumn
   **/
  dateDiffInDays = (startColumn: string, endColumn: string) => {
    if (this.isMySQL() || this.isSQLite()) {
      return this.db.raw(`DATEDIFF(${endColumn}, ${startColumn})`);
    } else if (this.isPostgreSQL()) {
      return this.db.raw(`DATE_PART('day', ${endColumn} - ${startColumn})`);
    } else if (this.isMsSQL()) {
      return this.db.raw(`DATEDIFF(DAY, ${startColumn}, ${endColumn})`);
    } else if (this.isOracle()) {
      return this.db.raw(`(${endColumn} - ${startColumn})`);
    } else {
      throw new Error('Unsupported SQL client for dateDiffInDays');
    }
  }

  /**
   * เพิ่มจำนวนวันให้กับคอลัมน์วันที่
   * @param {string} column
   * @param {number} days
   **/
  addDays = (column: string, days: number) => {
    if (this.isMySQL() || this.isSQLite()) {
      return this.db.raw(`DATE_ADD(${column}, INTERVAL ${days} DAY)`);
    } else if (this.isPostgreSQL()) {
      return this.db.raw(`(${column} + INTERVAL '${days} DAY')`);
    } else if (this.isMsSQL()) {
      return this.db.raw(`DATEADD(DAY, ${days}, ${column})`);
    } else if (this.isOracle()) {
      return this.db.raw(`(${column} + ${days})`);
    } else {
      throw new Error('Unsupported SQL client for addDays');
    }
  }

  /**
   * แปลงคอลัมน์วันที่เป็นวันที่เท่านั้น (ตัดเวลาออก)
   * @param {string} column
   */
  toDate = (column: string) => {
    if (this.isMySQL() || this.isSQLite()) {
      return this.db.raw(`DATE(${column})`);
    } else if (this.isPostgreSQL()) {
      return this.db.raw(`DATE(${column})`);
    } else if (this.isMsSQL()) {
      return this.db.raw(`CAST(${column} AS DATE)`);
    } else if (this.isOracle()) {
      return this.db.raw(`TRUNC(${column})`);
    } else {
      throw new Error('Unsupported SQL client for toDate');
    }
  }

  /**
   * แปลงคอลัมน์วันที่เป็นวันที่และเวลา
   * @param {string} column
   */
  toDateTime = (column: string) => {
    if (this.isMySQL() || this.isSQLite()) {
      return this.db.raw(`DATETIME(${column})`);
    } else if (this.isPostgreSQL()) {
      return this.db.raw(`TIMESTAMP(${column})`);
    } else if (this.isMsSQL()) {
      return this.db.raw(`CAST(${column} AS DATETIME)`);
    } else if (this.isOracle()) {
      return this.db.raw(`TO_TIMESTAMP(${column})`);
    } else {
      throw new Error('Unsupported SQL client for toDateTime');
    }
  }

  /**
   * จัดการค่า Null (ถ้า null ให้ใช้ค่า Default แทน)
   * @param {string} column
   * @param {any} defaultValue
   */
  ifNull = (column: string, defaultValue: any) => {
    return this.db.raw(`COALESCE(${column}, ${defaultValue})`);
  }


  /*
  แปลง array ให้เป็น where
  const whereConditions = {
    date: ['..','..'],
    date: { BETWEEN, ['..','..'] }
    date: { IN, ['..','..'] }
    date: { NOT_IN, ['..','..'] }
    name: { LIKE, '%..%' }
    name: { NOT_LIKE, '%..%' }
    name: 'EMPTY' -> null or ''
    name: 'NOT_EMPTY' -> not null and not ''
    raw: '..'
  }
  */
}

export const createWhere = (query: Knex.QueryBuilder<any, any>, whereConditions: any) => {
  // Implement the logic to convert the whereConditions object into SQL WHERE clause
  if (!whereConditions) {
    return query;
  }
  // Further implementation to handle different types of where conditions would go here.
  for (const key in whereConditions) {
    const conditionValue: any = whereConditions[key];
    if (Array.isArray(conditionValue) && conditionValue.length === 2) {
      query = query.whereBetween(key, conditionValue as [any, any]);
    } else if (Array.isArray(conditionValue) && conditionValue.length !== 2) {
      query = query.whereIn(key, conditionValue as any[]);
    } else if (typeof conditionValue === 'object') {
      const operator = Object.keys(conditionValue)[0];
      const value = conditionValue[operator];
      switch (operator.toUpperCase()) {
        case 'BETWEEN':
          query = query.whereBetween(key, value as [any, any]);
          break;
        case 'IN':
          query = query.whereIn(key, value as any[]);
          break;
        case 'NOT_IN':
          query = query.whereNotIn(key, value as any[]);
          break;
        case 'LIKE':
          query = query.where(key, 'like', value);
          break;
        case 'NOT_LIKE':
          query = query.where(key, 'not like', value);
          break;
        case 'EMPTY':
          query = query.where(function () {
            this.whereNull(key).orWhere(key, '');
          });
          break;
        case 'NOT_EMPTY':
          query = query.where(function () {
            this.whereNotNull(key).andWhere(key, '!=', '');
          });
          break;
        case 'RAW':
          query = query.whereRaw(value);
          break;
        default:
          throw new Error(`Unsupported operator: ${operator}`);
      }
    } else {
      query = query.where(key, conditionValue);
    }
  }
  return query;
}
