"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisModel = void 0;
const dbName = process.env.HIS_DB_NAME;
const dbClient = process.env.HIS_DB_CLIENT;
const maxLimit = 100;
class HisModel {
    getTableName(db, dbname = dbName) {
        return __awaiter(this, void 0, void 0, function* () {
            const whereDB = dbClient === 'mssql' ? 'TABLE_CATALOG' : 'TABLE_SCHEMA';
            const result = yield db('information_schema.tables')
                .where(whereDB, dbname);
            return result;
        });
    }
    testConnect(db) {
        return __awaiter(this, void 0, void 0, function* () {
            return db('hospdata.patient').select('hn').limit(1);
        });
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
            .select('hn', 'vn as visitno', 'date', 'time', 'time_drug as time_end', 'pttype_std2 as pttype', 'insclass as payment', 'dep_standard as clinic', 'dr', 'bp as bp_systolic', 'bp1 as bp_diastolic', 'puls as pr', 'rr', 'fu as appoint', 'status as result', 'refer as referin')
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
exports.HisModel = HisModel;
