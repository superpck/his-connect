import { Knex } from 'knex';

const maxLimit = 250;
const hcode = process.env.HOSPCODE;

export class HisHomCHModel {
    async testConnect(db: Knex) {
        const row = await db('Ward').first();
        return { connection: row ? true : false };
    }

    getWard(db: Knex, wardCode: string = '', wardName: string = '') {
        const clientType = (db.client?.config?.client || '').toLowerCase();
        const isMssql = clientType === 'mssql';

        let sql = db('Ward as wx');
        if (wardCode) {
            sql.where('ward_id', wardCode);
        } else if (wardName) {
            sql.whereILike('ward_name', `%${wardName}%`);
        }

        const unicodePrefix = isMssql ? 'N' : '';
        return sql
            .select(
                db.raw("? as Hospcode", [hcode]),
                'wx.ward_id as wardcode',
                'wx.ward_name as wardname',
                'wx.MAP_CODE_ERP as std_code',

                db.raw(`CASE WHEN UPPER(wx.ward_name) LIKE ${unicodePrefix}'%ICU%' THEN wx.QTY_BED_ERP ELSE 0 END as bed_normal`),
                db.raw(`CASE WHEN UPPER(wx.ward_name) LIKE ${unicodePrefix}'%พิเศษ%' THEN wx.QTY_BED_ERP ELSE 0 END as bed_special`),
                db.raw(`CASE WHEN UPPER(wx.ward_name) LIKE ${unicodePrefix}'%ICU%' THEN wx.QTY_BED_ERP ELSE 0 END as bed_icu`),
                db.raw(`CASE WHEN UPPER(wx.ward_name) LIKE ${unicodePrefix}'%SEMI ICU%' THEN wx.QTY_BED_ERP ELSE 0 END as bed_semi`),
                db.raw(`CASE WHEN UPPER(wx.ward_name) LIKE ${unicodePrefix}'%STROKE%' THEN wx.QTY_BED_ERP ELSE 0 END as bed_stroke`),
                db.raw(`CASE WHEN UPPER(wx.ward_name) LIKE ${unicodePrefix}'%BURN%' THEN wx.QTY_BED_ERP ELSE 0 END as bed_burn`),
                db.raw(`CASE WHEN UPPER(wx.ward_name) LIKE ${unicodePrefix}'%ธนารักษ์%' THEN wx.QTY_BED_ERP ELSE 0 END as bed_minithanyaruk`),
                db.raw(`CASE WHEN UPPER(wx.ward_name) LIKE ${unicodePrefix}'%งเสริม%' THEN wx.QTY_BED_ERP ELSE 0 END as bed_extra`),
                db.raw(`CASE WHEN UPPER(wx.ward_name) LIKE ${unicodePrefix}'%คลอด%' THEN wx.QTY_BED_ERP ELSE 0 END as lr`),
                db.raw("0 as clip"),
                db.raw(`CASE WHEN UPPER(wx.ward_name) LIKE ${unicodePrefix}'%HOME%' THEN wx.QTY_BED_ERP ELSE 0 END as homeward`),
                db.raw("? as isactive", [1]))
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
    getVisitForMophAlert(db: Knex, date: any, isRowCount: boolean = false, limit: number = 1000, start = -1) {
        if (isRowCount) {
            return { row_count: 0 };
        } else {
            return [];
        }
    }
}