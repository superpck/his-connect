import { Knex } from 'knex';
import * as moment from 'moment';

const maxLimit = 250;
const hcode = process.env.HOSPCODE;
const dbName = process.env.HIS_DB_NAME;
const dbClient = process.env.HIS_DB_CLIENT;

export class HisSsbHModel {
    async testConnect(db: Knex) {
        let result: any;
        result = await global.dbHIS('opdconfig').first();
        const hospname = result?.hospitalname || result?.hospitalcode || null;

        result = await db('patient').first();
        const connection = result ? true : false;

        return { hospname, connection };
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

    // MOPH ERP ========================================================================
    countBedNo(db: Knex) {
        return { total_bed: 0 };
    }

    async getBedNo(db: Knex, bedno: any = null, start = -1, limit: number = 1000) {
        return [];
    }

    concurrentIPDByWard(db: Knex, date: any) {
        return [];
    }
    concurrentIPDByClinic(db: Knex, date: any) {
        return [];
    }
    sumOpdVisitByClinic(db: Knex, date: any) {
        return [];
    }
    getMophAlertOPDVisit(db: Knex, date: any) {
        // cid,hn,vn,date_service,time_service, clinic_code (local), clinic_name (local)
        return [];
    }
}
