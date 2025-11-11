"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisHomCHModel = void 0;
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
class HisHomCHModel {
    async testConnect(db) {
        const patient = await db('ipt').first();
        return { connection: patient ? true : false };
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
}
exports.HisHomCHModel = HisHomCHModel;
