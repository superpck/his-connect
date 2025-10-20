import { Knex } from 'knex';
import * as moment from 'moment';

const maxLimit = 250;
const hcode = process.env.HOSPCODE;
const dbName = process.env.HIS_DB_NAME;
const dbClient = process.env.HIS_DB_CLIENT;

export class HisSsbHModel {
    async getAdmission(knex, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'vn' : columnName;
        // return [];
        return knex
            .select('*')
            .from('VW_PHER_ADMISSION')
            .where(columnName, "=", searchNo);
    }
    getWard(db: Knex, wardCode: string = '', wardName: string = '') {

        let sql = db('lib_ward');
        if (wardCode) {
            sql.where('code', wardCode);
        } else if (wardName) {
            sql.whereLike('ward', `%${wardName}%`)
        } else {
            sql.where('isactive', 1)
        }
        return sql
            .select('code as ward_code', 'ward as ward_name',
                'standard as moph_code')
            .limit(maxLimit);
    }
}
