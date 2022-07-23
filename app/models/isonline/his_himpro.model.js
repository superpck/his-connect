"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisHimproModel = void 0;
const dbName = process.env.HIS_DB_NAME;
const maxLimit = 250;
class HisHimproModel {
    getTableName(knex) {
        return knex
            .select('TABLE_NAME')
            .from('information_schema.tables')
            .where('TABLE_SCHEMA', '=', dbName);
    }
    getPerson(knex, columnName, searchText) {
        return knex
            .select('hn', 'no_card as cid', 'title as prename', 'name as fname', 'surname as lname', 'birth as dob', 'sex', 'address', 'moo', 'road', 'add as addcode', 'tel', 'zip', 'occupa as occupation')
            .from('hospdata.patient')
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
        return knex
            .select('vn as visitno', 'diag as diagcode', 'type as diag_type')
            .from('opd_dx')
            .where('vn', "=", visitno);
    }
    getProcedureOpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('procedure_opd')
            .where(columnName, "=", searchNo);
    }
    getChargeOpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('charge_opd')
            .where(columnName, "=", searchNo);
    }
    getDrugOpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('drug_opd')
            .where(columnName, "=", searchNo);
    }
    getAdmission(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('admission')
            .where(columnName, "=", searchNo);
    }
    getDiagnosisIpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('diagnosis_ipd')
            .where(columnName, "=", searchNo);
    }
    getProcedureIpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('procedure_ipd')
            .where(columnName, "=", searchNo);
    }
    getChargeIpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('charge_ipd')
            .where(columnName, "=", searchNo);
    }
    getDrugIpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('drug_ipd')
            .where(columnName, "=", searchNo);
    }
    getAccident(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('accident')
            .where(columnName, "=", searchNo);
    }
    getAppointment(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('appointment')
            .where(columnName, "=", searchNo);
    }
    getData(knex, tableName, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from(tableName)
            .where(columnName, "=", searchNo)
            .limit(5000);
    }
}
exports.HisHimproModel = HisHimproModel;
