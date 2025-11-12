import { Knex } from 'knex';

const maxLimit = 250;
const hcode = process.env.HOSPCODE;

export class HisHomCHModel {
    async testConnect(db: Knex) {
        const patient = await db('ipt').first();
        return { connection: patient ? true : false };
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

    // MOPH ERP
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
}
