import { Knex } from 'knex';
import * as moment from 'moment-timezone';
const dbName = process.env.HIS_DB_NAME;

const maxLimit = 250;
let hisHospcode = process.env.HOSPCODE;
export class HisHospitalOsModel {
    constructor() {
    }

    // ❌ ไม่พบการเรียกใช้งาน
    check() {
        return true;
    }

    // ✅ เรียกใช้: routes/his/index.ts
    getTableName(knex: Knex) {
        return knex('information_schema.tables')
            .select('table_name')
            .where('table_catalog', '=', dbName);

    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/isonline/his.ts (hisReferModel)
    async testConnect(db: Knex) {
        console.log('nRefer: Testing DB connection... from t_patient');
        return await db('t_patient').select('patient_hn').limit(1)
    }

    // ⚙️ Internal - เรียกจาก testConnect()
    async testConnect_(db: Knex) {
        const opdConfig = await global.dbHIS('opdconfig').first();
        const hospname = opdConfig?.hospitalname || opdConfig?.hospitalcode || null;

        const patientSample = await db('patient').select('hn').limit(1);
        const connection = Array.isArray(patientSample) ? patientSample.length > 0 : !!patientSample;

        let charset = '';
        try {
            const result = await db.raw(
                'SELECT pg_encoding_to_char(encoding) AS charset FROM pg_database LIMIT 1'
            );
            charset = result?.rows?.[0]?.charset || '';
        } catch (error) {
            console.warn('testConnect: charset lookup failed', error);
        }

        return { hospname, connection, charset };
    }

    // ⚙️ Internal - เรียกจาก getTableName()
    getTableName_(db: Knex, dbName = process.env.HIS_DB_NAME) {
        const schemaName = process.env.HIS_DB_SCHEMA || 'public';
        return db('information_schema.tables')
            .select('table_name')
            .where('table_catalog', dbName)
            .andWhere('table_schema', schemaName);
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts
    // ใช้ fn_get_department
    async getDepartment(db: Knex, depCode: string = '', depName: string = '') {
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_department(?, ?, ?)',
            [depCode || null, depName || null, maxLimit]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts
    // ใช้ fn_get_dr
    async getDr(db: Knex, drCode: string = '', drName: string = '') {
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_dr(?, ?, ?)',
            [drCode || null, drName || null, maxLimit]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/refer/crontab.ts, routes/his/index.ts
    // ใช้ fn_get_refer_out
    async getReferOut(db: Knex, date: any, hospCode = hisHospcode, visitNo: string = null) {
        if (!date) {
            throw new Error('Invalid parameters: date is required');
        }
        const formattedDate = moment(date).locale('TH').format('YYYY-MM-DD');
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_refer_out(?, ?, ?)',
            [visitNo ? null : formattedDate, visitNo || null, hisHospcode]
        );
        return result.rows;
    }


    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts, routes/pcc/index.ts
    // ใช้ fn_get_person
    async getPerson(db: Knex, columnName, searchText, hospCode = hisHospcode) {
        if (!columnName || !searchText) {
            throw new Error('Invalid parameters: columnName and searchText are required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_person(?, ?, ?)',
            [columnName, searchText, hisHospcode]
        );
        return result.rows;
    }
    // ✅ เรียกใช้: routes/refer/crontab.ts
    // ใช้ fn_get_address
    async getAddress(db: Knex, columnName, searchText, hospCode = hisHospcode) {
        if (!columnName || !searchText) {
            throw new Error('Invalid parameters: columnName and searchText are required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_address(?, ?, ?)',
            [columnName, searchText, hisHospcode]
        );
        return result.rows;
    }
    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts, routes/refer/crontab.ts
    // ใช้ fn_get_service
    async getService(db: Knex, columnName: string, searchText: any, hospCode = hisHospcode) {
        if (!columnName || !searchText) {
            throw new Error('Invalid parameters: columnName and searchText are required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_service(?, ?, ?)',
            [columnName, searchText, hisHospcode]
        );
        return result.rows;
    }

    // ❌ ไม่พบการเรียกใช้จาก models/his (routes/isonline/his.ts ใช้ isonline model)
    async getOpdServiceByVN(db: Knex, vn: any) {
        return [];
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts, routes/refer/crontab.ts
    // ใช้ fn_get_diagnosis_opd
    async getDiagnosisOpd(db: Knex, visitNo, hospCode = hisHospcode) {
        if (!visitNo) {
            throw new Error('Invalid parameters: visitNo is required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_diagnosis_opd(?, ?)',
            [visitNo, hisHospcode]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts
    // ใช้ fn_get_diagnosis_opd_accident
    async getDiagnosisOpdAccident(db: Knex, dateStart: any, dateEnd: any, hospCode = hisHospcode) {
        if (!dateStart || !dateEnd) {
            throw new Error('Invalid parameters: dateStart and dateEnd are required');
        }
        const tz = 'Asia/Bangkok';
        const start = moment.tz(dateStart, tz).startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const end = moment.tz(dateEnd, tz).endOf('day').format('YYYY-MM-DD HH:mm:ss');
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_diagnosis_opd_accident(?, ?, ?, ?)',
            [start, end, hisHospcode, maxLimit]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts
    // ใช้ fn_get_diagnosis_opd_vwxy
    async getDiagnosisOpdVWXY(db: Knex, date: any) {
        if (!date) {
            throw new Error('Invalid parameters: date is required');
        }
        const formattedDate = moment(date).locale('TH').format('YYYY-MM-DD');
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_diagnosis_opd_vwxy(?, ?)',
            [formattedDate, maxLimit]
        );
        return result.rows;
    }
    // ✅ เรียกใช้: routes/his/index.ts
    // ใช้ fn_get_diagnosis_sepsis_opd
    async getDiagnosisSepsisOpd(db: Knex, date: any) {
        if (!date) {
            throw new Error('Invalid parameters: date is required');
        }
        const formattedDate = moment(date).locale('TH').format('YYYY-MM-DD');
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_diagnosis_sepsis_opd(?, ?)',
            [formattedDate, maxLimit]
        );
        return result.rows;
    }
    // ✅ เรียกใช้: routes/his/index.ts
    // ใช้ fn_get_diagnosis_sepsis_ipd
    async getDiagnosisSepsisIpd(db: Knex, dateStart: any, dateEnd: any) {
        if (!dateStart || !dateEnd) {
            throw new Error('Invalid parameters: dateStart and dateEnd are required');
        }
        const tz = 'Asia/Bangkok';
        const start = moment.tz(dateStart, tz).startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const end = moment.tz(dateEnd, tz).endOf('day').format('YYYY-MM-DD HH:mm:ss');
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_diagnosis_sepsis_ipd(?, ?, ?, ?)',
            [start, end, hisHospcode, maxLimit]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts (ผ่าน getLabResult)
    getInvestigation(db: Knex, columnName: string, searchNo: string, hospCode = hisHospcode) {
        return this.getLabResult(db, columnName, searchNo);
    }
    // ❌ ไม่พบการเรียกใช้งาน
    // ใช้ fn_get_lab_request
    async getLabRequest(db: Knex, columnName: string, searchNo: string, hospCode = hisHospcode) {
        if (!columnName || !searchNo) {
            throw new Error('Invalid parameters: columnName and searchNo are required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_lab_request(?, ?, ?, ?)',
            [columnName, searchNo, hisHospcode, maxLimit]
        );
        return result.rows;
    }

    // ⚙️ Internal - เรียกจาก getInvestigation()
    // ใช้ fn_get_lab_result
    async getLabResult(db: Knex, columnName: string, searchNo: string, hospCode = hisHospcode) {
        if (!columnName || !searchNo) {
            throw new Error('Invalid parameters: columnName and searchNo are required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_lab_result(?, ?, ?, ?)',
            [columnName, searchNo, hisHospcode, maxLimit]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/qdrugstore/index.ts, routes/refer/v3.ts
    // ใช้ fn_get_drug_opd
    async getDrugOpd(db: Knex, visitNo, hospCode = hisHospcode) {
        if (!visitNo) {
            throw new Error('Invalid parameters: visitNo is required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_drug_opd(?, ?)',
            [visitNo, hisHospcode]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/qdrugstore/index.ts, routes/refer/v3.ts, routes/refer/crontab.ts
    // ใช้ fn_get_procedure_opd
    async getProcedureOpd(db: Knex, visitNo, hospCode = hisHospcode) {
        if (!visitNo) {
            throw new Error('Invalid parameters: visitNo is required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_procedure_opd(?, ?)',
            [visitNo, hisHospcode]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/qdrugstore/index.ts, routes/refer/v3.ts
    // ใช้ fn_get_charge_opd
    async getChargeOpd(db: Knex, visitNo, hospCode = hisHospcode) {
        if (!visitNo) {
            throw new Error('Invalid parameters: visitNo is required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_charge_opd(?, ?)',
            [visitNo, hisHospcode]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts, routes/refer/crontab.ts
    // ใช้ fn_get_admission
    async getAdmission(db: Knex, columnName: string, searchValue: any, hospCode = hisHospcode) {
        if (!columnName || !searchValue) {
            throw new Error('Invalid parameters: columnName and searchValue are required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_admission(?, ?, ?)',
            [columnName, Array.isArray(searchValue) ? searchValue[0] : searchValue, hisHospcode]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts, routes/refer/crontab.ts
    // ใช้ fn_get_procedure_ipd
    async getProcedureIpd(db: Knex, an: string, hospCode = hisHospcode) {
        if (!an) {
            throw new Error('Invalid parameters: an is required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_procedure_ipd(?, ?)',
            [an, hisHospcode]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/qdrugstore/index.ts, routes/refer/v3.ts
    // ใช้ fn_get_charge_ipd
    async getChargeIpd(db: Knex, an: string, hospCode = hisHospcode) {
        if (!an) {
            throw new Error('Invalid parameters: an is required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_charge_ipd(?, ?)',
            [an, hisHospcode]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts, routes/refer/crontab.ts
    // ใช้ fn_get_drug_ipd
    async getDrugIpd(db: Knex, an: string, hospCode = hisHospcode) {
        if (!an) {
            throw new Error('Invalid parameters: an is required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_drug_ipd(?, ?)',
            [an, hisHospcode]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts, routes/refer/crontab.ts
    // ใช้ fn_get_diagnosis_ipd
    async getDiagnosisIpd(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
        if (!columnName || !searchNo) {
            throw new Error('Invalid parameters: columnName and searchNo are required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_diagnosis_ipd(?, ?, ?)',
            [columnName, searchNo, hisHospcode]
        );
        return result.rows;
    }
    // ✅ เรียกใช้: routes/his/index.ts
    // ใช้ fn_get_diagnosis_ipd_accident
    async getDiagnosisIpdAccident(db: Knex, dateStart: any, dateEnd: any, hospCode = hisHospcode) {
        if (!dateStart || !dateEnd) {
            throw new Error('Invalid parameters: dateStart and dateEnd are required');
        }
        const tz = 'Asia/Bangkok';
        const start = moment.tz(dateStart, tz).startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const end = moment.tz(dateEnd, tz).endOf('day').format('YYYY-MM-DD HH:mm:ss');
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_diagnosis_ipd_accident(?, ?, ?, ?)',
            [start, end, hisHospcode, maxLimit]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/qdrugstore/index.ts, routes/refer/v3.ts
    // ใช้ fn_get_accident
    async getAccident(db: Knex, visitNo, hospCode = hisHospcode) {
        if (!visitNo) {
            throw new Error('Invalid parameters: visitNo is required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_accident(?, ?)',
            [visitNo, hisHospcode]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts, routes/refer/crontab.ts, routes/pcc/index.ts
    // ใช้ fn_get_drug_allergy
    async getDrugAllergy(db: Knex, hn, hospCode = hisHospcode) {
        if (!hn) {
            throw new Error('Invalid parameters: hn is required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_drug_allergy(?, ?)',
            [hn, hisHospcode]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/qdrugstore/index.ts, routes/refer/v3.ts
    // ใช้ fn_get_appointment
    async getAppointment(db: Knex, visitNo: any, hospCode = hisHospcode) {
        if (!visitNo) {
            throw new Error('Invalid parameters: visitNo is required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_appointment(?, ?, ?)',
            [visitNo, hisHospcode, maxLimit]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/qdrugstore/index.ts, routes/refer/v3.ts
    // ใช้ fn_get_refer_history
    async getReferHistory(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
        if (!columnName || !searchNo) {
            throw new Error('Invalid parameters: columnName and searchNo are required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_refer_history(?, ?, ?)',
            [columnName, searchNo, hisHospcode]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/qdrugstore/index.ts, routes/refer/v3.ts
    // ใช้ fn_get_clinical_refer
    async getClinicalRefer(db: Knex, referNo, hospCode = hisHospcode) {
        if (!referNo) {
            throw new Error('Invalid parameters: referNo is required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_clinical_refer(?, ?, ?)',
            [referNo, hisHospcode, maxLimit]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/qdrugstore/index.ts, routes/refer/v3.ts
    // ใช้ fn_get_investigation_refer
    async getInvestigationRefer(db: Knex, referNo, hospCode = hisHospcode) {
        if (!referNo) {
            throw new Error('Invalid parameters: referNo is required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_investigation_refer(?, ?, ?)',
            [referNo, hisHospcode, maxLimit]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/qdrugstore/index.ts, routes/refer/v3.ts
    // ใช้ fn_get_care_refer
    async getCareRefer(db: Knex, referNo, hospCode = hisHospcode) {
        if (!referNo) {
            throw new Error('Invalid parameters: referNo is required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_care_refer(?, ?)',
            [referNo, hisHospcode]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts, routes/refer/crontab.ts
    // ใช้ fn_get_refer_result
    async getReferResult(db: Knex, visitDate: string, hospCode = hisHospcode) {
        if (!visitDate) {
            throw new Error('Invalid parameters: visitDate is required');
        }
        visitDate = moment(visitDate).format('YYYY-MM-DD');
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_refer_result(?, ?, ?)',
            [visitDate, hisHospcode, maxLimit]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/qdrugstore/index.ts, routes/refer/v3.ts
    // ใช้ fn_get_provider
    async getProvider(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
        if (!columnName || !searchNo) {
            throw new Error('Invalid parameters: columnName and searchNo are required');
        }
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_provider(?, ?, ?, ?)',
            [columnName, searchNo, hisHospcode, maxLimit]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/refer/crontab.ts
    // ใช้ fn_get_provider_dr
    async getProviderDr(db: Knex, drList: any[]) {
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_provider_dr(?, ?)',
            [drList, hisHospcode]
        );
        return result.rows;
    }

    // ❌ ไม่พบการเรียกใช้งาน (มีแค่ reportModel.getData ซึ่งเป็นคนละ model)
    getData(db: Knex, tableName, columnName, searchNo, hospCode = hisHospcode) {
        return db(tableName)
            .select(db.raw(`'${hisHospcode}' as hospcode`))
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }

    // ✅ เรียกใช้: routes/refer/v3.ts
    // ใช้ fn_sum_refer_out
    async sumReferOut(db: Knex, dateStart: any, dateEnd: any) {
        if (!dateStart || !dateEnd) {
            throw new Error('Invalid parameters: dateStart and dateEnd are required');
        }
        const tz = 'Asia/Bangkok';
        const start = moment.tz(dateStart, tz).startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const end = moment.tz(dateEnd, tz).endOf('day').format('YYYY-MM-DD HH:mm:ss');
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_sum_refer_out(?, ?, ?)',
            [start, end, hisHospcode]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/refer/v3.ts
    // ใช้ fn_sum_refer_in
    async sumReferIn(db: Knex, dateStart: any, dateEnd: any) {
        if (!dateStart || !dateEnd) {
            throw new Error('Invalid parameters: dateStart and dateEnd are required');
        }
        const tz = 'Asia/Bangkok';
        const start = moment.tz(dateStart, tz).startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const end = moment.tz(dateEnd, tz).endOf('day').format('YYYY-MM-DD HH:mm:ss');
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_sum_refer_in(?, ?, ?)',
            [start, end, hisHospcode]
        );
        return result.rows;
    }
    // ✅ เรียกใช้: task/moph-erp.ts ทุกๆ 1 ชั่วโมง ส่งเลยย้อนหลัง 1 ชั่วโมง
    // ใช้ fn_concurrent_ipd_by_ward
    async concurrentIPDByWard(db: Knex, date: any) {
        if (!date) {
            throw new Error('Invalid parameters: date is required');
        }
        // =====  เตรียมช่วงเวลา (1 ชั่วโมง) ตาม hosxp v4 =====
        const tz = 'Asia/Bangkok';
        const dateStart = moment.tz(date, tz)
            .locale('TH')
            .startOf('hour')
            .format('YYYY-MM-DD HH:mm:ss');

        const dateEnd = moment.tz(date, tz)
            .locale('TH')
            .endOf('hour')
            .format('YYYY-MM-DD HH:mm:ss');
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_concurrent_ipd_by_ward(?, ?, ?)',
            [dateStart, dateEnd, hisHospcode]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: task/moph-erp.ts ทุกๆ 1 ชั่วโมง ส่งเลยย้อนหลัง 1 ชั่วโมง
    // ใช้ fn_concurrent_ipd_by_clinic
    async concurrentIPDByClinic(db: Knex, date: any) {
        if (!date) {
            throw new Error('Invalid parameters: date is required');
        }
        // =====  เตรียมช่วงเวลา (1 ชั่วโมง) ตาม hosxp v4 =====
        const tz = 'Asia/Bangkok';
        const dateStart = moment.tz(date, tz)
            .locale('TH')
            .startOf('hour')
            .format('YYYY-MM-DD HH:mm:ss');

        const dateEnd = moment.tz(date, tz)
            .locale('TH')
            .endOf('hour')
            .format('YYYY-MM-DD HH:mm:ss');
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_concurrent_ipd_by_clinic(?, ?, ?)',
            [dateStart, dateEnd, hisHospcode]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: task/moph-erp.ts
    // ใช้ fn_sum_opd_visit_by_clinic
    async sumOpdVisitByClinic(db: Knex, date: any) {
        if (!date) {
            throw new Error('Invalid parameters: date is required');
        }
        const formattedDate = moment(date).locale('TH').format('YYYY-MM-DD');
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_sum_opd_visit_by_clinic(?, ?)',
            [formattedDate, hisHospcode]
        );
        return result.rows;
    }


    // ผ่านการ Verify แล้ว ==============================================

    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts, task/moph-erp.ts
    // ใช้ fn_get_ward
    async getWard(db: Knex, wardCode: string = '', wardName: string = '') {
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_ward(?, ?, ?, ?)',
            [wardCode || null, wardName || null, hisHospcode, maxLimit]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: task/moph-erp.ts
    // ใช้ fn_count_bed_no
    async countBedNo(db: Knex) {
        const result = await db.raw('SELECT * FROM his_connect.fn_count_bed_no()');
        return result.rows?.[0] || { total_bed: 0 };
    }
    // ✅ เรียกใช้: task/moph-erp.ts
    // ใช้ fn_get_bed_no
    async getBedNo(db: Knex, bedno: any = null, start = -1, limit: number = 1000) {
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_bed_no(?, ?, ?, ?)',
            [bedno || null, hisHospcode, start, limit]
        );
        return result.rows;
    }
    // ✅ เรียกใช้: task/moph-alert.ts
    // ใช้ fn_get_visit_for_moph_alert / fn_count_visit_for_moph_alert
    async getVisitForMophAlert(db: Knex, date: any, isRowCount: boolean = false, limit: number = 1000, start = -1) {
        if (!date) {
            throw new Error('Invalid parameters: date is required');
        }
        try {
            const formattedDate = moment(date).locale('TH').format('YYYY-MM-DD');
            if (isRowCount) {
                const result = await db.raw(
                    'SELECT * FROM his_connect.fn_count_visit_for_moph_alert(?)',
                    [formattedDate]
                );
                return result.rows?.[0] || { row_count: 0 };
            } else {
                const result = await db.raw(
                    'SELECT * FROM his_connect.fn_get_visit_for_moph_alert(?, ?, ?, ?)',
                    [formattedDate, hisHospcode, start, limit]
                );
                return result.rows;
            }
        } catch (error) {
            throw error;
        }
    }
}
