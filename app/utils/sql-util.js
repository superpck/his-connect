"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWhere = exports.SqlFn = void 0;
class SqlFn {
    constructor(db) {
        this.isMySQL = () => ['mysql', 'mysqld'].includes(this.client);
        this.isPostgreSQL = () => ['pg', 'postgres', 'postgresql'].includes(this.client);
        this.isSQLite = () => ['sqlite3', 'sqlite'].includes(this.client);
        this.isMsSQL = () => ['mssql', 'sqlserver'].includes(this.client);
        this.isOracle = () => ['oracledb', 'oracle'].includes(this.client);
        this.concat = (...args) => {
            if (this.isMySQL() || this.isSQLite()) {
                return this.db.raw(`CONCAT(${args.join(', ')})`);
            }
            else if (this.isPostgreSQL()) {
                return this.db.raw(`CONCAT(${args.join(', ')})`);
            }
            else if (this.isMsSQL()) {
                return this.db.raw(`CONCAT(${args.join(', ')})`);
            }
            else if (this.isOracle()) {
                return this.db.raw(`CONCAT(${args.join(', ')})`);
            }
            else {
                throw new Error('Unsupported SQL client for concat');
            }
        };
        this.year = (column) => {
            if (this.isMySQL() || this.isSQLite()) {
                return this.db.raw(`YEAR(${column})`);
            }
            else if (this.isPostgreSQL()) {
                return this.db.raw(`EXTRACT(YEAR FROM ${column})`);
            }
            else if (this.isMsSQL()) {
                return this.db.raw(`YEAR(${column})`);
            }
            else if (this.isOracle()) {
                return this.db.raw(`EXTRACT(YEAR FROM ${column})`);
            }
            else {
                throw new Error('Unsupported SQL client for year');
            }
        };
        this.month = (column) => {
            if (this.isMySQL() || this.isSQLite()) {
                return this.db.raw(`MONTH(${column})`);
            }
            else if (this.isPostgreSQL()) {
                return this.db.raw(`EXTRACT(MONTH FROM ${column})`);
            }
            else if (this.isMsSQL()) {
                return this.db.raw(`MONTH(${column})`);
            }
            else if (this.isOracle()) {
                return this.db.raw(`EXTRACT(MONTH FROM ${column})`);
            }
            else {
                throw new Error('Unsupported SQL client for month');
            }
        };
        this.day = (column) => {
            if (this.isMySQL() || this.isSQLite()) {
                return this.db.raw(`DAY(${column})`);
            }
            else if (this.isPostgreSQL()) {
                return this.db.raw(`EXTRACT(DAY FROM ${column})`);
            }
            else if (this.isMsSQL()) {
                return this.db.raw(`DAY(${column})`);
            }
            else if (this.isOracle()) {
                return this.db.raw(`EXTRACT(DAY FROM ${column})`);
            }
            else {
                throw new Error('Unsupported SQL client for day');
            }
        };
        this.dateDiffInDays = (startColumn, endColumn) => {
            if (this.isMySQL() || this.isSQLite()) {
                return this.db.raw(`DATEDIFF(${endColumn}, ${startColumn})`);
            }
            else if (this.isPostgreSQL()) {
                return this.db.raw(`DATE_PART('day', ${endColumn} - ${startColumn})`);
            }
            else if (this.isMsSQL()) {
                return this.db.raw(`DATEDIFF(DAY, ${startColumn}, ${endColumn})`);
            }
            else if (this.isOracle()) {
                return this.db.raw(`(${endColumn} - ${startColumn})`);
            }
            else {
                throw new Error('Unsupported SQL client for dateDiffInDays');
            }
        };
        this.addDays = (column, days) => {
            if (this.isMySQL() || this.isSQLite()) {
                return this.db.raw(`DATE_ADD(${column}, INTERVAL ${days} DAY)`);
            }
            else if (this.isPostgreSQL()) {
                return this.db.raw(`(${column} + INTERVAL '${days} DAY')`);
            }
            else if (this.isMsSQL()) {
                return this.db.raw(`DATEADD(DAY, ${days}, ${column})`);
            }
            else if (this.isOracle()) {
                return this.db.raw(`(${column} + ${days})`);
            }
            else {
                throw new Error('Unsupported SQL client for addDays');
            }
        };
        this.toDate = (column) => {
            if (this.isMySQL() || this.isSQLite()) {
                return this.db.raw(`DATE(${column})`);
            }
            else if (this.isPostgreSQL()) {
                return this.db.raw(`DATE(${column})`);
            }
            else if (this.isMsSQL()) {
                return this.db.raw(`CAST(${column} AS DATE)`);
            }
            else if (this.isOracle()) {
                return this.db.raw(`TRUNC(${column})`);
            }
            else {
                throw new Error('Unsupported SQL client for toDate');
            }
        };
        this.toDateTime = (column) => {
            if (this.isMySQL() || this.isSQLite()) {
                return this.db.raw(`DATETIME(${column})`);
            }
            else if (this.isPostgreSQL()) {
                return this.db.raw(`TIMESTAMP(${column})`);
            }
            else if (this.isMsSQL()) {
                return this.db.raw(`CAST(${column} AS DATETIME)`);
            }
            else if (this.isOracle()) {
                return this.db.raw(`TO_TIMESTAMP(${column})`);
            }
            else {
                throw new Error('Unsupported SQL client for toDateTime');
            }
        };
        this.ifNull = (column, defaultValue) => {
            return this.db.raw(`COALESCE(${column}, ${defaultValue})`);
        };
        this.db = db;
        this.client = db.client.config.client;
    }
}
exports.SqlFn = SqlFn;
const createWhere = (query, whereConditions) => {
    if (!whereConditions) {
        return query;
    }
    for (const key in whereConditions) {
        const conditionValue = whereConditions[key];
        if (Array.isArray(conditionValue) && conditionValue.length === 2) {
            query = query.whereBetween(key, conditionValue);
        }
        else if (Array.isArray(conditionValue) && conditionValue.length !== 2) {
            query = query.whereIn(key, conditionValue);
        }
        else if (typeof conditionValue === 'object') {
            const operator = Object.keys(conditionValue)[0];
            const value = conditionValue[operator];
            switch (operator.toUpperCase()) {
                case 'BETWEEN':
                    query = query.whereBetween(key, value);
                    break;
                case 'IN':
                    query = query.whereIn(key, value);
                    break;
                case 'NOT_IN':
                    query = query.whereNotIn(key, value);
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
        }
        else {
            query = query.where(key, conditionValue);
        }
    }
    return query;
};
exports.createWhere = createWhere;
