"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisSsbModel = void 0;
const dbName = process.env.HIS_DB_NAME;
const maxLimit = 100;
class HisSsbModel {
    getTableName(knex) {
        return knex('information_schema.tables')
            .select('TABLE_NAME')
            .where('TABLE_CATALOG', '=', dbName);
    }
    testConnect(db) {
        return db('VW_IS_PERSON').select('hn').limit(1);
    }
    getPerson(knex, columnName, searchText) {
        return knex('VW_IS_PERSON')
            .where(columnName, "=", searchText);
    }
    getOpdService(db, hn, date, columnName = '', searchText = '') {
        columnName = columnName == 'visitNo' ? 'vn' : columnName;
        let where = {};
        if (hn)
            where['hn'] = hn;
        if (date)
            where['adate'] = date;
        if (columnName && searchText)
            where[columnName] = searchText;
        return db('VW_PHER_SERVICE')
            .select('*', 'htime AS time', 'hdate AS date')
            .where(where)
            .orderBy('date', 'desc')
            .limit(maxLimit);
    }
    getDiagnosisOpd(knex, visitno) {
        return knex('VW_PHER_DIAGNOSIS').where('vn', "=", visitno);
    }
    getDiagnosisOpdVWXY(knex, date) {
        return knex('VW_PHER_DIAGNOSIS').where('hdate', "=", date)
            .andWhere(function () {
            this.whereIn(knex.raw("LEFT(icd10,1)"), ['V', 'W', 'X', 'Y'])
                .orWhereIn(knex.raw("LEFT(icd10,1)"), ['S', 'T', 'V', 'W', 'X', 'Y']);
        });
    }
    getProcedureOpd(knex, columnName, searchNo, hospCode) {
        return knex('procedure_opd')
            .select('*')
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
exports.HisSsbModel = HisSsbModel;
