"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisHiModel = void 0;
const dbName = process.env.HIS_DB_NAME;
const maxLimit = 250;
class HisHiModel {
    getTableName(knex) {
        return knex('information_schema.tables')
            .select('TABLE_NAME')
            .where('TABLE_SCHEMA', '=', dbName);
    }
    testConnect(db) {
        return db('hospdata.patient').select('hn').limit(1);
    }
    getPerson(knex, columnName, searchText) {
        return knex('hospdata.patient')
            .select('hn', 'no_card as cid', 'title as prename', 'name as fname', 'surname as lname', 'birth as dob', 'sex', 'address', 'moo', 'road', 'add as addcode', 'tel', 'zip', 'occupa as occupation')
            .where(columnName, "=", searchText);
    }
    getOpdService(db, hn, date, columnName = '', searchText = '') {
        columnName = columnName == 'visitNo' ? 'vn' : columnName;
        let where = {};
        if (hn)
            where['hn'] = hn;
        if (date)
            where['date'] = date;
        if (columnName && searchText)
            where[columnName] = searchText;
        return db('view_opd_visit')
            .select('hn', 'vn as visitno', 'date', 'time', 'bp as bp_systolic', 'bp1 as bp_diastolic', 'puls as pr', 'rr')
            .where(where)
            .orderBy('date', 'desc')
            .limit(maxLimit);
    }
    getDiagnosisOpd(knex, visitno) {
        return knex('opd_dx')
            .select('vn as visitno', 'diag as diagcode', 'type as diag_type')
            .where('vn', "=", visitno);
    }
    getProcedureOpd(knex, columnName, searchNo, hospCode) {
        return knex('procedure_opd')
            .select('*')
            .where(columnName, "=", searchNo);
    }
    getChargeOpd(knex, columnName, searchNo, hospCode) {
        return knex('charge_opd')
            .select('*')
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
exports.HisHiModel = HisHiModel;
