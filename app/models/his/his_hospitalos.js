"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisHospitalOsModel = void 0;
const moment = require("moment-timezone");
const dbName = process.env.HIS_DB_NAME;
const maxLimit = 250;
let hisHospcode = process.env.HOSPCODE;
class HisHospitalOsModel {
    constructor() {
    }
    check() {
        return true;
    }
    getTableName(knex) {
        return knex('information_schema.tables')
            .select('table_name')
            .where('table_catalog', '=', dbName);
    }
    async testConnect(db) {
        console.log('nRefer: Testing DB connection... from t_patient');
        return await db('t_patient').select('patient_hn').limit(1);
    }
    async testConnect_(db) {
        const opdConfig = await global.dbHIS('opdconfig').first();
        const hospname = opdConfig?.hospitalname || opdConfig?.hospitalcode || null;
        const patientSample = await db('patient').select('hn').limit(1);
        const connection = Array.isArray(patientSample) ? patientSample.length > 0 : !!patientSample;
        let charset = '';
        try {
            const result = await db.raw('SELECT pg_encoding_to_char(encoding) AS charset FROM pg_database LIMIT 1');
            charset = result?.rows?.[0]?.charset || '';
        }
        catch (error) {
            console.warn('testConnect: charset lookup failed', error);
        }
        return { hospname, connection, charset };
    }
    getTableName_(db, dbName = process.env.HIS_DB_NAME) {
        const schemaName = process.env.HIS_DB_SCHEMA || 'public';
        return db('information_schema.tables')
            .select('table_name')
            .where('table_catalog', dbName)
            .andWhere('table_schema', schemaName);
    }
    async getDepartment(db, depCode = '', depName = '') {
        const result = await db.raw('SELECT * FROM his_connect.fn_get_department(?, ?, ?)', [depCode || null, depName || null, maxLimit]);
        return result.rows;
    }
    async getDr(db, drCode = '', drName = '') {
        const result = await db.raw('SELECT * FROM his_connect.fn_get_dr(?, ?, ?)', [drCode || null, drName || null, maxLimit]);
        return result.rows;
    }
    async getReferOut(db, date, hospCode = hisHospcode, visitNo = null) {
        if (!date) {
            throw new Error('Invalid parameters: date is required');
        }
        const formattedDate = moment(date).locale('TH').format('YYYY-MM-DD');
        const result = await db.raw('SELECT * FROM his_connect.fn_get_refer_out(?, ?, ?)', [visitNo ? null : formattedDate, visitNo || null, hisHospcode]);
        return result.rows;
    }
    async getPerson(db, columnName, searchText, hospCode = hisHospcode) {
        if (!columnName || !searchText) {
            throw new Error('Invalid parameters: columnName and searchText are required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_person(?, ?, ?)', [columnName, searchText, hisHospcode]);
        return result.rows;
    }
    async getAddress(db, columnName, searchText, hospCode = hisHospcode) {
        if (!columnName || !searchText) {
            throw new Error('Invalid parameters: columnName and searchText are required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_address(?, ?, ?)', [columnName, searchText, hisHospcode]);
        return result.rows;
    }
    async getService(db, columnName, searchText, hospCode = hisHospcode) {
        if (!columnName || !searchText) {
            throw new Error('Invalid parameters: columnName and searchText are required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_service(?, ?, ?)', [columnName, searchText, hisHospcode]);
        return result.rows;
    }
    async getOpdServiceByVN(db, vn) {
        return [];
    }
    async getDiagnosisOpd(db, visitNo, hospCode = hisHospcode) {
        if (!visitNo) {
            throw new Error('Invalid parameters: visitNo is required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_diagnosis_opd(?, ?)', [visitNo, hisHospcode]);
        return result.rows;
    }
    async getDiagnosisOpdAccident(db, dateStart, dateEnd, hospCode = hisHospcode) {
        if (!dateStart || !dateEnd) {
            throw new Error('Invalid parameters: dateStart and dateEnd are required');
        }
        const tz = 'Asia/Bangkok';
        const start = moment.tz(dateStart, tz).startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const end = moment.tz(dateEnd, tz).endOf('day').format('YYYY-MM-DD HH:mm:ss');
        const result = await db.raw('SELECT * FROM his_connect.fn_get_diagnosis_opd_accident(?, ?, ?, ?)', [start, end, hisHospcode, maxLimit]);
        return result.rows;
    }
    async getDiagnosisOpdVWXY(db, date) {
        if (!date) {
            throw new Error('Invalid parameters: date is required');
        }
        const formattedDate = moment(date).locale('TH').format('YYYY-MM-DD');
        const result = await db.raw('SELECT * FROM his_connect.fn_get_diagnosis_opd_vwxy(?, ?)', [formattedDate, maxLimit]);
        return result.rows;
    }
    async getDiagnosisSepsisOpd(db, date) {
        if (!date) {
            throw new Error('Invalid parameters: date is required');
        }
        const formattedDate = moment(date).locale('TH').format('YYYY-MM-DD');
        const result = await db.raw('SELECT * FROM his_connect.fn_get_diagnosis_sepsis_opd(?, ?)', [formattedDate, maxLimit]);
        return result.rows;
    }
    async getDiagnosisSepsisIpd(db, dateStart, dateEnd) {
        if (!dateStart || !dateEnd) {
            throw new Error('Invalid parameters: dateStart and dateEnd are required');
        }
        const tz = 'Asia/Bangkok';
        const start = moment.tz(dateStart, tz).startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const end = moment.tz(dateEnd, tz).endOf('day').format('YYYY-MM-DD HH:mm:ss');
        const result = await db.raw('SELECT * FROM his_connect.fn_get_diagnosis_sepsis_ipd(?, ?, ?, ?)', [start, end, hisHospcode, maxLimit]);
        return result.rows;
    }
    getInvestigation(db, columnName, searchNo, hospCode = hisHospcode) {
        return this.getLabResult(db, columnName, searchNo);
    }
    async getLabRequest(db, columnName, searchNo, hospCode = hisHospcode) {
        if (!columnName || !searchNo) {
            throw new Error('Invalid parameters: columnName and searchNo are required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_lab_request(?, ?, ?, ?)', [columnName, searchNo, hisHospcode, maxLimit]);
        return result.rows;
    }
    async getLabResult(db, columnName, searchNo, hospCode = hisHospcode) {
        if (!columnName || !searchNo) {
            throw new Error('Invalid parameters: columnName and searchNo are required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_lab_result(?, ?, ?, ?)', [columnName, searchNo, hisHospcode, maxLimit]);
        return result.rows;
    }
    async getDrugOpd(db, visitNo, hospCode = hisHospcode) {
        if (!visitNo) {
            throw new Error('Invalid parameters: visitNo is required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_drug_opd(?, ?)', [visitNo, hisHospcode]);
        return result.rows;
    }
    async getProcedureOpd(db, visitNo, hospCode = hisHospcode) {
        if (!visitNo) {
            throw new Error('Invalid parameters: visitNo is required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_procedure_opd(?, ?)', [visitNo, hisHospcode]);
        return result.rows;
    }
    async getChargeOpd(db, visitNo, hospCode = hisHospcode) {
        if (!visitNo) {
            throw new Error('Invalid parameters: visitNo is required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_charge_opd(?, ?)', [visitNo, hisHospcode]);
        return result.rows;
    }
    async getAdmission(db, columnName, searchValue, hospCode = hisHospcode) {
        if (!columnName || !searchValue) {
            throw new Error('Invalid parameters: columnName and searchValue are required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_admission(?, ?, ?)', [columnName, Array.isArray(searchValue) ? searchValue[0] : searchValue, hisHospcode]);
        return result.rows;
    }
    async getProcedureIpd(db, an, hospCode = hisHospcode) {
        if (!an) {
            throw new Error('Invalid parameters: an is required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_procedure_ipd(?, ?)', [an, hisHospcode]);
        return result.rows;
    }
    async getChargeIpd(db, an, hospCode = hisHospcode) {
        if (!an) {
            throw new Error('Invalid parameters: an is required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_charge_ipd(?, ?)', [an, hisHospcode]);
        return result.rows;
    }
    async getDrugIpd(db, an, hospCode = hisHospcode) {
        if (!an) {
            throw new Error('Invalid parameters: an is required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_drug_ipd(?, ?)', [an, hisHospcode]);
        return result.rows;
    }
    async getDiagnosisIpd(db, columnName, searchNo, hospCode = hisHospcode) {
        if (!columnName || !searchNo) {
            throw new Error('Invalid parameters: columnName and searchNo are required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_diagnosis_ipd(?, ?, ?)', [columnName, searchNo, hisHospcode]);
        return result.rows;
    }
    async getDiagnosisIpdAccident(db, dateStart, dateEnd, hospCode = hisHospcode) {
        if (!dateStart || !dateEnd) {
            throw new Error('Invalid parameters: dateStart and dateEnd are required');
        }
        const tz = 'Asia/Bangkok';
        const start = moment.tz(dateStart, tz).startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const end = moment.tz(dateEnd, tz).endOf('day').format('YYYY-MM-DD HH:mm:ss');
        const result = await db.raw('SELECT * FROM his_connect.fn_get_diagnosis_ipd_accident(?, ?, ?, ?)', [start, end, hisHospcode, maxLimit]);
        return result.rows;
    }
    async getAccident(db, visitNo, hospCode = hisHospcode) {
        if (!visitNo) {
            throw new Error('Invalid parameters: visitNo is required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_accident(?, ?)', [visitNo, hisHospcode]);
        return result.rows;
    }
    async getDrugAllergy(db, hn, hospCode = hisHospcode) {
        if (!hn) {
            throw new Error('Invalid parameters: hn is required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_drug_allergy(?, ?)', [hn, hisHospcode]);
        return result.rows;
    }
    async getAppointment(db, visitNo, hospCode = hisHospcode) {
        if (!visitNo) {
            throw new Error('Invalid parameters: visitNo is required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_appointment(?, ?, ?)', [visitNo, hisHospcode, maxLimit]);
        return result.rows;
    }
    async getReferHistory(db, columnName, searchNo, hospCode = hisHospcode) {
        if (!columnName || !searchNo) {
            throw new Error('Invalid parameters: columnName and searchNo are required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_refer_history(?, ?, ?)', [columnName, searchNo, hisHospcode]);
        return result.rows;
    }
    async getClinicalRefer(db, referNo, hospCode = hisHospcode) {
        if (!referNo) {
            throw new Error('Invalid parameters: referNo is required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_clinical_refer(?, ?, ?)', [referNo, hisHospcode, maxLimit]);
        return result.rows;
    }
    async getInvestigationRefer(db, referNo, hospCode = hisHospcode) {
        if (!referNo) {
            throw new Error('Invalid parameters: referNo is required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_investigation_refer(?, ?, ?)', [referNo, hisHospcode, maxLimit]);
        return result.rows;
    }
    async getCareRefer(db, referNo, hospCode = hisHospcode) {
        if (!referNo) {
            throw new Error('Invalid parameters: referNo is required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_care_refer(?, ?)', [referNo, hisHospcode]);
        return result.rows;
    }
    async getReferResult(db, visitDate, hospCode = hisHospcode) {
        if (!visitDate) {
            throw new Error('Invalid parameters: visitDate is required');
        }
        visitDate = moment(visitDate).format('YYYY-MM-DD');
        const result = await db.raw('SELECT * FROM his_connect.fn_get_refer_result(?, ?, ?)', [visitDate, hisHospcode, maxLimit]);
        return result.rows;
    }
    async getProvider(db, columnName, searchNo, hospCode = hisHospcode) {
        if (!columnName || !searchNo) {
            throw new Error('Invalid parameters: columnName and searchNo are required');
        }
        const result = await db.raw('SELECT * FROM his_connect.fn_get_provider(?, ?, ?, ?)', [columnName, searchNo, hisHospcode, maxLimit]);
        return result.rows;
    }
    async getProviderDr(db, drList) {
        const result = await db.raw('SELECT * FROM his_connect.fn_get_provider_dr(?, ?)', [drList, hisHospcode]);
        return result.rows;
    }
    getData(db, tableName, columnName, searchNo, hospCode = hisHospcode) {
        return db(tableName)
            .select(db.raw(`'${hisHospcode}' as hospcode`))
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
    async sumReferOut(db, dateStart, dateEnd) {
        if (!dateStart || !dateEnd) {
            throw new Error('Invalid parameters: dateStart and dateEnd are required');
        }
        const tz = 'Asia/Bangkok';
        const start = moment.tz(dateStart, tz).startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const end = moment.tz(dateEnd, tz).endOf('day').format('YYYY-MM-DD HH:mm:ss');
        const result = await db.raw('SELECT * FROM his_connect.fn_sum_refer_out(?, ?, ?)', [start, end, hisHospcode]);
        return result.rows;
    }
    async sumReferIn(db, dateStart, dateEnd) {
        if (!dateStart || !dateEnd) {
            throw new Error('Invalid parameters: dateStart and dateEnd are required');
        }
        const tz = 'Asia/Bangkok';
        const start = moment.tz(dateStart, tz).startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const end = moment.tz(dateEnd, tz).endOf('day').format('YYYY-MM-DD HH:mm:ss');
        const result = await db.raw('SELECT * FROM his_connect.fn_sum_refer_in(?, ?, ?)', [start, end, hisHospcode]);
        return result.rows;
    }
    async concurrentIPDByWard(db, date) {
        if (!date) {
            throw new Error('Invalid parameters: date is required');
        }
        const tz = 'Asia/Bangkok';
        const dateStart = moment.tz(date, tz)
            .locale('TH')
            .startOf('hour')
            .format('YYYY-MM-DD HH:mm:ss');
        const dateEnd = moment.tz(date, tz)
            .locale('TH')
            .endOf('hour')
            .format('YYYY-MM-DD HH:mm:ss');
        const result = await db.raw('SELECT * FROM his_connect.fn_concurrent_ipd_by_ward(?, ?, ?)', [dateStart, dateEnd, hisHospcode]);
        return result.rows;
    }
    async concurrentIPDByClinic(db, date) {
        if (!date) {
            throw new Error('Invalid parameters: date is required');
        }
        const tz = 'Asia/Bangkok';
        const dateStart = moment.tz(date, tz)
            .locale('TH')
            .startOf('hour')
            .format('YYYY-MM-DD HH:mm:ss');
        const dateEnd = moment.tz(date, tz)
            .locale('TH')
            .endOf('hour')
            .format('YYYY-MM-DD HH:mm:ss');
        const result = await db.raw('SELECT * FROM his_connect.fn_concurrent_ipd_by_clinic(?, ?, ?)', [dateStart, dateEnd, hisHospcode]);
        return result.rows;
    }
    async sumOpdVisitByClinic(db, date) {
        if (!date) {
            throw new Error('Invalid parameters: date is required');
        }
        const formattedDate = moment(date).locale('TH').format('YYYY-MM-DD');
        const result = await db.raw('SELECT * FROM his_connect.fn_sum_opd_visit_by_clinic(?, ?)', [formattedDate, hisHospcode]);
        return result.rows;
    }
    async getWard(db, wardCode = '', wardName = '') {
        const result = await db.raw('SELECT * FROM his_connect.fn_get_ward(?, ?, ?, ?)', [wardCode || null, wardName || null, hisHospcode, maxLimit]);
        return result.rows;
    }
    async countBedNo(db) {
        const result = await db.raw('SELECT * FROM his_connect.fn_count_bed_no()');
        return result.rows?.[0] || { total_bed: 0 };
    }
    async getBedNo(db, bedno = null, start = -1, limit = 1000) {
        const result = await db.raw('SELECT * FROM his_connect.fn_get_bed_no(?, ?, ?, ?)', [bedno || null, hisHospcode, start, limit]);
        return result.rows;
    }
    async getVisitForMophAlert(db, date, isRowCount = false, limit = 1000, start = -1) {
        if (!date) {
            throw new Error('Invalid parameters: date is required');
        }
        try {
            const formattedDate = moment(date).locale('TH').format('YYYY-MM-DD');
            if (isRowCount) {
                const result = await db.raw('SELECT * FROM his_connect.fn_count_visit_for_moph_alert(?)', [formattedDate]);
                return result.rows?.[0] || { row_count: 0 };
            }
            else {
                const result = await db.raw('SELECT * FROM his_connect.fn_get_visit_for_moph_alert(?, ?, ?, ?)', [formattedDate, hisHospcode, start, limit]);
                return result.rows;
            }
        }
        catch (error) {
            throw error;
        }
    }
}
exports.HisHospitalOsModel = HisHospitalOsModel;
