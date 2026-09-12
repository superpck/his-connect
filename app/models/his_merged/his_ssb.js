"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisSsbHModel = void 0;
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
const dbName = process.env.HIS_DB_NAME;
const dbClient = process.env.HIS_DB_CLIENT;
class HisSsbHModel {
    async testConnect(db) {
        let result;
        result = await global.dbHIS('opdconfig').first();
        const hospname = result?.hospitalname || result?.hospitalcode || null;
        result = await db('patient').first();
        const connection = result ? true : false;
        return { hospname, connection };
    }
    getWard(db, wardCode = '', wardName = '') {
        let sql = db('lib_ward');
        if (wardCode) {
            sql.where('code', wardCode);
        }
        else if (wardName) {
            sql.whereLike('ward', `%${wardName}%`);
        }
        else {
            sql.where('isactive', 1);
        }
        return sql
            .select('code as ward_code', 'ward as ward_name', 'standard as moph_code')
            .limit(maxLimit);
    }
    countBedNo(db) {
        return { total_bed: 0 };
    }
    async getBedNo(db, bedno = null, start = -1, limit = 1000) {
        return [];
    }
    concurrentIPDByWard(db, date) {
        return [];
    }
    concurrentIPDByClinic(db, date) {
        return [];
    }
    sumOpdVisitByClinic(db, date) {
        return [];
    }
    getVisitForMophAlert(db, date) {
        return [];
    }
}
exports.HisSsbHModel = HisSsbHModel;
