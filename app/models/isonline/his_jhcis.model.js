"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisJhcisModel = void 0;
const dbName = process.env.HIS_DB_NAME;
const maxLimit = 100;
class HisJhcisModel {
    check() {
        return true;
    }
    getTableName(knex) {
        return knex('information_schema.tables')
            .select('TABLE_NAME')
            .where('TABLE_SCHEMA', '=', dbName);
    }
    testConnect(db) {
        return db('person').select('pid as hn').limit(1);
    }
    getPerson(knex, columnName, searchText) {
        columnName = columnName === 'cid' ? 'idcard' : columnName;
        columnName = columnName === 'hn' ? 'pid' : columnName;
        return knex('person')
            .leftJoin('ctitle', 'person.prename', 'ctitle.titlecode')
            .select('pid as hn', 'idcard as cid', 'prename', 'ctitle.titlename', 'fname', 'lname', 'birth as dob', 'sex', 'hnomoi as address', 'mumoi as moo', 'roadmoi as road', 'provcodemoi as province', 'distcodemoi as district', 'subdistcodemoi as subdistrict', 'telephoneperson as tel', 'postcodemoi as zip', 'occupa as occupation')
            .select(knex.raw('concat(provcodemoi, distcodemoi, subdistcodemoi) as addcode'))
            .where(columnName, "=", searchText);
    }
    getOpdService(db, hn, date, columnName = '', searchText = '') {
        columnName = columnName == 'visitNo' || columnName == 'vn' ? 'visitno' : columnName;
        let where = {};
        if (hn)
            where['pid'] = hn;
        if (date)
            where['visitdate'] = date;
        if (columnName && searchText)
            where[columnName] = searchText;
        return db('visit')
            .select('pid as hn', 'visitno', 'visitdate as date', 'timestart as time')
            .select(knex.raw("case when LOCATE('/', pressure) then SUBSTR(pressure,1,LOCATE('/', pressure)-1) else '' end as bp_systolic"))
            .select(knex.raw("case when LOCATE('/', pressure) then SUBSTR(pressure,LOCATE('/', pressure)+1) else '' end as bp_diastolic"))
            .select('pulse as pr', 'respri as rr', 'weight', 'height', 'waist', 'temperature as tem')
            .where(where)
            .orderBy('visitdate', 'desc')
            .limit(maxLimit);
    }
    getDiagnosisOpd(knex, visitno) {
        return knex('opd_dx')
            .select('vn as visitno', 'diag as diagcode', 'type as diag_type')
            .where('vn', "=", visitno);
    }
    getProcedureOpd(knex, columnName, searchNo, hospCode) {
        return knex('procedure_opd')
            .where(columnName, "=", searchNo);
    }
    getChargeOpd(knex, columnName, searchNo, hospCode) {
        return knex('charge_opd')
            .where(columnName, "=", searchNo);
    }
    getDrugOpd(knex, columnName, searchNo, hospCode) {
        return knex('drug_opd')
            .where(columnName, "=", searchNo);
    }
    getAdmission(knex, columnName, searchNo, hospCode) {
        return knex('admission')
            .where(columnName, "=", searchNo);
    }
    getDiagnosisIpd(knex, columnName, searchNo, hospCode) {
        return knex('diagnosis_ipd')
            .where(columnName, "=", searchNo);
    }
    getProcedureIpd(knex, columnName, searchNo, hospCode) {
        return knex('procedure_ipd')
            .where(columnName, "=", searchNo);
    }
    getChargeIpd(knex, columnName, searchNo, hospCode) {
        return knex('charge_ipd')
            .where(columnName, "=", searchNo);
    }
    getDrugIpd(knex, columnName, searchNo, hospCode) {
        return knex('drug_ipd')
            .where(columnName, "=", searchNo);
    }
    getAccident(knex, columnName, searchNo, hospCode) {
        return knex('accident')
            .where(columnName, "=", searchNo);
    }
    getAppointment(knex, columnName, searchNo, hospCode) {
        return knex('appointment')
            .where(columnName, "=", searchNo);
    }
    getData(knex, tableName, columnName, searchNo, hospCode) {
        return knex(tableName)
            .where(columnName, "=", searchNo)
            .limit(5000);
    }
}
exports.HisJhcisModel = HisJhcisModel;
