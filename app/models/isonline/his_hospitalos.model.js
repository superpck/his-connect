"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisHospitalOsModel = void 0;
const moment = require("moment");
const dbName = process.env.HIS_DB_NAME;
const maxLimit = 100;
let hospcode = process.env.HOSPCODE;
class HisHospitalOsModel {
    getTableName(knex) {
        return knex('information_schema.tables')
            .select('table_name')
            .where('table_catalog', '=', dbName);
    }
    async testConnect(db) {
        try {
            let result = await db('b_site').first();
            const hospname = result?.site_full_name || null;
            hospcode = result?.b_visit_office_id || hospcode;
            result = await db('t_patient').select('patient_hn').first();
            const connection = result && (result.patient_hn) ? true : false;
            let charset = '';
            const resultRaw = await db.raw('SELECT pg_encoding_to_char(encoding) AS charset FROM pg_database LIMIT 1');
            charset = resultRaw?.rows?.[0]?.charset || '';
            return { connection, hospname, charset };
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async getPerson(knex, columnName, searchText) {
        if (!columnName || !searchText) {
            throw new Error('Invalid parameters: columnName and searchText are required');
        }
        const result = await knex.raw('SELECT * FROM his_connect.fn_get_person_model(?, ?)', [columnName, searchText]);
        return result.rows;
    }
    async getOpdService(knex, hn, date, columnName = '', searchText = '') {
        if (!date) {
            throw new Error('Invalid parameters: date is required');
        }
        const formattedDate = moment(date).locale('TH').format('YYYY-MM-DD');
        const result = await knex.raw('SELECT * FROM his_connect.fn_get_opd_service_model(?, ?, ?, ?, ?)', [hn || null, formattedDate, columnName || null, searchText || null, maxLimit]);
        return result.rows;
    }
    async getOpdServiceByVN(db, vn) {
        if (!vn) {
            throw new Error('Invalid parameters: vn is required');
        }
        const vnArray = typeof vn === 'string' ? [vn] : vn;
        const result = await db.raw('SELECT * FROM his_connect.fn_get_opd_service_by_vn_model(?, ?)', [vnArray, maxLimit]);
        return result.rows;
    }
    async getDiagnosisOpdVWXY(db, date) {
        if (!date) {
            throw new Error('Invalid parameters: date is required');
        }
        const formattedDate = moment(date).locale('TH').format('YYYY-MM-DD');
        const result = await db.raw('SELECT * FROM his_connect.fn_get_diagnosis_opd_vwxy_model(?, ?)', [formattedDate, maxLimit]);
        return result.rows;
    }
    async getDiagnosisOpd(knex, visitno) {
        if (!visitno) {
            throw new Error('Invalid parameters: visitno is required');
        }
        const result = await knex.raw('SELECT * FROM his_connect.fn_get_diagnosis_opd_model(?)', [visitno]);
        return result.rows;
    }
    getProcedureOpd(knex, columnName, searchNo, hospCode) {
        return [];
    }
    getChargeOpd(knex, columnName, searchNo, hospCode) {
        return [];
    }
    getDrugOpd(knex, columnName, searchNo, hospCode) {
        return [];
    }
    getAdmission(knex, columnName, searchNo, hospCode) {
        return [];
    }
    getDiagnosisIpd(knex, columnName, searchNo, hospCode) {
        return [];
    }
    getProcedureIpd(knex, columnName, searchNo, hospCode) {
        return [];
    }
    getChargeIpd(knex, columnName, searchNo, hospCode) {
        return [];
    }
    getDrugIpd(knex, columnName, searchNo, hospCode) {
        return [];
    }
    getAccident(knex, visitno) {
        return [];
    }
    getAppointment(knex, columnName, searchNo, hospCode) {
        return [];
    }
    getData(knex, tableName, columnName, searchNo, hospCode) {
        return knex(tableName)
            .where(columnName, "=", searchNo)
            .limit(5000);
    }
}
exports.HisHospitalOsModel = HisHospitalOsModel;
