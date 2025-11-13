"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisVpmHModel = void 0;
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
class HisVpmHModel {
    async testConnect(db) {
        const row = await db('Ward').first();
        return { connection: row ? true : false };
    }
    getWard(db, wardCode = '', wardName = '') {
        const clientType = (db.client?.config?.client || '').toLowerCase();
        const isMssql = clientType === 'mssql';
        let sql = db('Ward as wx');
        if (wardCode) {
            sql.where('ward_id', wardCode);
        }
        else if (wardName) {
            sql.whereILike('ward_name', `%${wardName}%`);
        }
        const unicodePrefix = isMssql ? 'N' : '';
        return sql
            .select(db.raw("? as Hospcode", [hcode]), 'wx.ward_id as wardcode', 'wx.ward_name as wardname', 'wx.MAP_CODE_ERP as std_code', db.raw(`CASE WHEN UPPER(wx.ward_name) LIKE ${unicodePrefix}'%ICU%' THEN wx.QTY_BED_ERP ELSE 0 END as bed_normal`), db.raw(`CASE WHEN UPPER(wx.ward_name) LIKE ${unicodePrefix}'%พิเศษ%' THEN wx.QTY_BED_ERP ELSE 0 END as bed_special`), db.raw(`CASE WHEN UPPER(wx.ward_name) LIKE ${unicodePrefix}'%ICU%' THEN wx.QTY_BED_ERP ELSE 0 END as bed_icu`), db.raw(`CASE WHEN UPPER(wx.ward_name) LIKE ${unicodePrefix}'%SEMI ICU%' THEN wx.QTY_BED_ERP ELSE 0 END as bed_semi`), db.raw(`CASE WHEN UPPER(wx.ward_name) LIKE ${unicodePrefix}'%STROKE%' THEN wx.QTY_BED_ERP ELSE 0 END as bed_stroke`), db.raw(`CASE WHEN UPPER(wx.ward_name) LIKE ${unicodePrefix}'%BURN%' THEN wx.QTY_BED_ERP ELSE 0 END as bed_burn`), db.raw(`CASE WHEN UPPER(wx.ward_name) LIKE ${unicodePrefix}'%ธนารักษ์%' THEN wx.QTY_BED_ERP ELSE 0 END as bed_minithanyaruk`), db.raw(`CASE WHEN UPPER(wx.ward_name) LIKE ${unicodePrefix}'%งเสริม%' THEN wx.QTY_BED_ERP ELSE 0 END as bed_extra`), db.raw(`CASE WHEN UPPER(wx.ward_name) LIKE ${unicodePrefix}'%คลอด%' THEN wx.QTY_BED_ERP ELSE 0 END as lr`), db.raw("0 as clip"), db.raw(`CASE WHEN UPPER(wx.ward_name) LIKE ${unicodePrefix}'%HOME%' THEN wx.QTY_BED_ERP ELSE 0 END as homeward`), db.raw("? as isactive", [1]))
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
    getMophAlertOPDVisit(db, date) {
        return [];
    }
}
exports.HisVpmHModel = HisVpmHModel;
