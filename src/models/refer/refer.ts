import * as Knex from 'knex';
import * as moment from 'moment';
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
const dbName = process.env.REFER_DB_NAME;
const dbClient = process.env.REFER_DB_CLIENT;

export class ReferModel {
    check() {
        return true;
    }

    getTableName(db: Knex, dbname = dbName) {
        const whereDB = dbClient === 'mssql' ? 'TABLE_CATALOG' : 'TABLE_SCHEMA';
        return db('information_schema.tables')
            .where(whereDB, '=', dbname);
    }
}
