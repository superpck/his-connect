"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferModel = void 0;
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
const dbName = process.env.REFER_DB_NAME;
const dbClient = process.env.REFER_DB_CLIENT;
class ReferModel {
    check() {
        return true;
    }
    getTableName(db, dbname = dbName) {
        const whereDB = dbClient === 'mssql' ? 'TABLE_CATALOG' : 'TABLE_SCHEMA';
        return db('information_schema.tables')
            .where(whereDB, '=', dbname);
    }
}
exports.ReferModel = ReferModel;
