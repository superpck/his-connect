import { Knex } from 'knex';
import * as moment from 'moment';
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
    // ใช้ view_department
    // รหัสห้องตรวจ
    getDepartment(db: Knex, depCode: string = '', depName: string = '') {
        let sql = db('his_connect.view_department')
            .select(
                db.raw('? as hospcode', [hisHospcode]),
                'department_code', 'department_name', 'moph_code', 'emergency'
            )
            .where('isactive', '1');
        
        if (depCode) {
            sql.where('department_code', depCode);
        } else if (depName) {
            sql.whereLike('department_name', `%${depName}%`);
        }
        
        return sql.orderBy('department_name').limit(maxLimit);
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts
    // ใช้ view_dr
    // รายละเอียดแพทย์
    getDr(db: Knex, drCode: string = '', drName: string = '') {
        let sql = db('his_connect.view_dr')
            .select(
                db.raw('? as hospcode', [hisHospcode]),
                'dr_code', 'dr_license_code', 'dr_name', 'expire_date'
            )
            .where('isactive', '1');
        
        if (drCode) {
            sql.where('dr_code', drCode);
        } else if (drName) {
            sql.where(function () {
                this.whereLike('employee_firstname', `%${drName}%`)
                    .orWhereLike('employee_lastname', `%${drName}%`);
            });
        }
        
        return sql.limit(maxLimit);
    }

    // ✅ เรียกใช้: routes/refer/crontab.ts, routes/his/index.ts
    // ใช้ view_refer_out
    //select รายชื่อเพื่อแสดงทะเบียน refer
    getReferOut(db: Knex, date: any, hospCode = hisHospcode, visitNo: string = null) {
        let sql = db('his_connect.view_refer_out')
            .select(
                db.raw('? as hospcode', [hisHospcode]),
                'refer_date', 'referid', 'hosp_destination',
                'PID', 'hn', 'CID', 'vn', 'SEQ', 'AN',
                'fname', 'lname', 'dob', 'sex', 'EMERGENCY', 'dr', 'provider', 'clinic'
            );
        
        if (visitNo) {
            sql.where('visit_vn', visitNo);
        } else {
            sql.where('refer_date_formatted', date);
        }
        
        return sql
            .whereNot('visit_refer_out_off_id', hisHospcode)
            .orderBy('refer_date');
    }


    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts, routes/pcc/index.ts
    // ใช้ view_person
    async getPerson(db: Knex, columnName, searchText, hospCode = hisHospcode) {
        columnName = columnName == 'hn' ? 'HN' : columnName;
        columnName = columnName == 'cid' ? 'CID' : columnName;
        columnName = columnName == 'name' ? 'NAME' : columnName;

        const result = await db('his_connect.view_person')
            .select(
                db.raw('? as HOSPCODE', [hisHospcode]),
                'HID', 'CID', 'PRENAME', 'NAME', 'LNAME', 'HN', 'PID', 'SEX', 'BIRTH',
                'MSTATUS', 'OCCUPATION_OLD', 'OCCUPATION_NEW', 'NATION', 'RACE',
                'RELIGION', 'EDUCATION', 'FATHER', 'MOTHER', 'MOBILE', 'D_UPDATE'
            )
            .where(columnName, searchText)
            .first();

        return result;
    }
    // ✅ เรียกใช้: routes/refer/crontab.ts
    // ใช้ view_address
    async getAddress(db: Knex, columnName, searchText, hospCode = hisHospcode) {
        columnName = columnName === 'hn' ? 'patient_hn' : columnName;
        
        return db('his_connect.view_address')
            .select(
                db.raw('? as hospcode', [hisHospcode]),
                'cid', 'hn', 'pid', 'addresstype', 'house_id', 'housetype',
                'roomno', 'condo', 'houseno', 'soisub', 'soimain', 'road',
                'villaname', 'village', 'tambon', 'ampur', 'changwat', 'd_update'
            )
            .where(columnName, searchText);
    }
    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts, routes/refer/crontab.ts
    // ใช้ view_service
    async getService(db: Knex, columnName: string, searchText: any, hospCode = hisHospcode) {
        columnName = columnName === 'visitNo' ? 'visit_vn' : columnName;
        columnName = columnName === 'vn' ? 'visit_vn' : columnName;
        columnName = columnName === 'hn' ? 'visit_hn' : columnName;
        columnName = columnName === 'date_serv' ? 'DATE_SERV' : columnName;

        return db('his_connect.view_service')
            .select(
                db.raw('? as HOSPCODE', [hisHospcode]),
                'PID', 'HN', 'CID', 'seq_id', 'SEQ', 'DATE_SERV', 'TIME_SERV',
                'LOCATION', 'INTIME', 'INSTYPE', 'MAIN', 'TYPEIN', 'REFEROUTHOSP', 'CAUSEOUT',
                'waist', 'cc', 'pe', 'ph', 'pi', 'nurse_note', 'SERVPLACE',
                'BTEMP', 'BP', 'PR', 'RR', 'o2sat', 'weight', 'height',
                'gcs_e', 'gcs_v', 'gcs_m', 'pupil_left', 'pupil_right',
                'TYPEOUT', 'AN', 'dr', 'provider',
                'COST', 'PRICE', 'PAYPRICE', 'ACTUALPAY', 'D_UPDATE', 'hsub'
            )
            .where(columnName, searchText);
    }

    // ❌ ไม่พบการเรียกใช้จาก models/his (routes/isonline/his.ts ใช้ isonline model)
    getOpdServiceByVN(db: Knex, vn: any) {
        let sql = db('his_connect.view_opd_service_by_vn');
        if (typeof vn === 'string') {
            sql.where('visit_vn', vn);
        } else {
            sql.whereIn('visit_vn', vn)
        };
        return sql.limit(maxLimit);
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts, routes/refer/crontab.ts
    // ใช้ view_diagnosis_opd
    async getDiagnosisOpd(db: Knex, visitNo, hospCode = hisHospcode) {
        return db('his_connect.view_diagnosis_opd')
            .select(
                db.raw('? as HOSPCODE', [hisHospcode]),
                'CID', 'PID', 'visit_vn as visit_hn', 'seq_id', 'SEQ', 'VN',
                'DATE_SERV', 'DIAGTYPE', 'DIAGCODE', 'CLINIC', 'PROVIDER', 'D_UPDATE'
            )
            .where('visit_vn', visitNo);
    }
    // ✅ เรียกใช้: routes/his/index.ts
    // ใช้ view_diagnosis_opd_accident
    async getDiagnosisOpdAccident(db: Knex, dateStart: any, dateEnd: any, hospCode = hisHospcode) {
        if (dateStart && dateEnd) {
            return db('his_connect.view_diagnosis_opd_accident')
                .select(
                    db.raw('? as hospcode', [hisHospcode]),
                    't_visit_diagnosis_id', 't_visit_id', 'visit_diagnosis_icd10',
                    'f_visit_diagnosis_type_id', 'visit_diagnosis_staff_record',
                    'visit_diagnosis_record_date_time', 'visit_vn', 'visit_hn', 'diagnosis_date'
                )
                .whereBetween('diagnosis_date', [dateStart, dateEnd])
                .limit(maxLimit);
        } else {
            throw new Error('Invalid parameters');
        }
    }
    // ✅ เรียกใช้: routes/his/index.ts
    // ใช้ view_diagnosis_opd_vwxy - view กรอง S,T,V,W,X,Y ไว้แล้ว และมี is_primary_vwxy flag
    async getDiagnosisOpdVWXY(db: Knex, date: any) {
        // ค้นหา visit_id ที่มี primary ค่า (V,W,X,Y) ในวันที่กำหนด
        const subquery = db('his_connect.view_diagnosis_opd_vwxy')
            .select('t_visit_id')
            .where('date', date)
            .where('is_primary_vwxy', true);

        // ดึงข้อมูลทั้งหมดสำหรับ visit_id ที่พบ (S,T,V,W,X,Y ถูก filter ใน view แล้ว)
        return db('his_connect.view_diagnosis_opd_vwxy')
            .select('hn', 'visitno', 'date', 'diagcode', 'diag_name', 'diag_type', 'dr', 'episode', 'codeset', 'd_update')
            .whereIn('t_visit_id', subquery)
            .orderBy(['visitno', 'diag_type', 'd_update'])
            .limit(maxLimit);
    }
    // ✅ เรียกใช้: routes/his/index.ts
    // ใช้ view_diagnosis_sepsis_opd
    async getDiagnosisSepsisOpd(db: Knex, date: any) {
        // ค้นหา visit_id ที่มี sepsis code (R651, R572, A40, A41) ในวันที่กำหนด
        const subquery = db('his_connect.view_diagnosis_sepsis_opd')
            .select('t_visit_id')
            .where('date', date)
            .where('is_sepsis_code', true);

        return db('his_connect.view_diagnosis_sepsis_opd')
            .select(
                db.raw('? as hospcode', [hisHospcode]),
                'hn', 'visitno', 'date', 'diagcode', 'diag_name', 'diag_type', 'dr', 'episode', 'codeset', 'd_update'
            )
            .whereIn('t_visit_id', subquery)
            .orderBy(['visitno', 'diag_type', 'd_update'])
            .limit(maxLimit);
    }
    // ✅ เรียกใช้: routes/his/index.ts
    // ใช้ view_diagnosis_sepsis_ipd
    async getDiagnosisSepsisIpd(db: Knex, dateStart: any, dateEnd: any) {
        // ค้นหา visit_id ที่เป็น IPD และมี sepsis code
        const subquery = db('his_connect.view_diagnosis_sepsis_ipd')
            .select('t_visit_id')
            .where('f_visit_type_id', '1')
            .whereBetween('date', [dateStart, dateEnd])
            .where('is_sepsis_code', true);

        return db('his_connect.view_diagnosis_sepsis_ipd')
            .select(
                db.raw('? as hospcode', [hisHospcode]),
                'hn', 'visitno', 'an', 'date', 'diagcode', 'diag_name', 'diag_type', 'dr',
                'patient_prename', 'patient_fname', 'patient_lname',
                'wardcode', 'wardname', 'codeset', 'd_update'
            )
            .whereIn('t_visit_id', subquery)
            .orderBy(['visitno', 'diag_type', 'd_update'])
            .limit(maxLimit);
    }

    // ✅ เรียกใช้: routes/his/index.ts (ผ่าน getLabResult)
    getInvestigation(db: Knex, columnName: string, searchNo: string, hospCode = hisHospcode) {
        return this.getLabResult(db, columnName, searchNo);
    }
    // ❌ ไม่พบการเรียกใช้งาน
    // ใช้ view_lab_request
    // Columns based on column_description.md getLabRequest
    async getLabRequest(db: Knex, columnName: string, searchNo: string, hospCode = hisHospcode) {
        columnName = columnName === 'visitNo' ? 'visit_vn' : columnName;
        columnName = columnName === 'hn' ? 'patient_hn' : columnName;
        columnName = columnName === 'cid' ? 'patient_pid' : columnName;

        return db('his_connect.view_lab_request')
            .select(
                db.raw('? as hospcode', [hisHospcode]),
                'visitno', 'hn', 'an', 'request_id', 'LOCALCODE', 'INVESTNAME',
                'loinc', 'icdcm', 'cgd', 'cost', 'price', 'DATETIME_REPORT'
            )
            .where(columnName, searchNo)
            .limit(maxLimit);
    }

    // ⚙️ Internal - เรียกจาก getInvestigation()
    // ใช้ view_lab_result
    async getLabResult(db: Knex, columnName: string, searchNo: string, hospCode = hisHospcode) {
        columnName = columnName === 'visitNo' ? 'visit_vn' : columnName;
        columnName = columnName === 'hn' ? 'patient_hn' : columnName;

        return db('his_connect.view_lab_result')
            .select(
                db.raw('? as HOSPCODE', [hisHospcode]),
                'PID', 'SEQ', 'VN', 'CID', 'request_id',
                'INVESTNAME', 'INVESTVALUE', 'UNIT', 'DATETIME_INVEST', 'D_UPDATE'
            )
            .where(columnName, searchNo)
            .limit(maxLimit);
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/qdrugstore/index.ts, routes/refer/v3.ts
    // ใช้ view_drug_opd
    async getDrugOpd(db: Knex, visitNo, hospCode = hisHospcode) {
        return db('his_connect.view_drug_opd')
            .select(
                db.raw('? as HOSPCODE', [hisHospcode]),
                'PID', 'CID', 'seq_id', 'SEQ', 'vn', 'date_serv', 'clinic',
                'DID', 'DID_TMT', 'dcode', 'dname', 'amount', 'unit', 'unit_packing',
                'usage_code', 'drug_usage', 'caution', 'drugprice', 'drugcost', 'provider', 'd_update'
            )
            .where('visit_vn', visitNo);
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts, routes/refer/crontab.ts
    // ใช้ view_admission
    async getAdmission(db: Knex, columnName: string, searchValue: any, hospCode = hisHospcode) {
        columnName = columnName === 'an' ? 'visit_vn' : columnName;
        columnName = columnName === 'hn' ? 'patient_hn' : columnName;
        columnName = columnName === 'visitNo' ? 'visit_vn' : columnName;
        columnName = columnName === 'dateadmit' ? 'visit_begin_visit_time' : columnName;
        columnName = columnName === 'datedisc' ? 'visit_financial_discharge_time' : columnName;

        let sqlCommand = db('his_connect.view_admission')
            .select(
                db.raw('? as HOSPCODE', [hisHospcode]),
                'PID', 'SEQ', 'AN', 'CID', 'SEX',
                'datetime_admit', 'WARD_LOCAL', 'WARDADMITNAME',
                'datetime_disch', 'dr', 'provider', 'd_update'
            );

        if (Array.isArray(searchValue)) {
            sqlCommand.whereIn(columnName, searchValue);
        } else {
            sqlCommand.where(columnName, searchValue);
        }

        return sqlCommand;
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts, routes/refer/crontab.ts
    // ใช้ view_procedure_ipd
    async getProcedureIpd(db: Knex, an: string, hospCode = hisHospcode) {
        return db('his_connect.view_procedure_ipd')
            .select(
                db.raw('? as HOSPCODE', [hisHospcode]),
                'PID', 'AN', 'SEQ', 'date_serv', 'clinic', 'procedcode', 'procedname',
                'provider', 'start_date', 'start_time', 'finish_date', 'finish_time', 'd_update'
            )
            .where('visit_vn', an)
            .where('f_visit_diagnosis_type_id', '1');
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/qdrugstore/index.ts, routes/refer/v3.ts
    // ใช้ view_charge_ipd
    async getChargeIpd(db: Knex, an: string, hospCode = hisHospcode) {
        return db('his_connect.view_charge_ipd')
            .select(
                db.raw('? as HOSPCODE', [hisHospcode]),
                'PID', 'AN', 'SEQ', 'date_serv', 'chargecode', 'chargename',
                'quantity', 'clinic', 'unitprice', 'chargeprice', 'provider', 'd_update'
            )
            .where('visit_vn', an);
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts, routes/refer/crontab.ts
    // ใช้ view_drug_ipd
    async getDrugIpd(db: Knex, an: string, hospCode = hisHospcode) {
        return db('his_connect.view_drug_ipd')
            .select(
                db.raw('? as HOSPCODE', [hisHospcode]),
                'PID', 'AN', 'SEQ', 'date_serv', 'clinic',
                'DID', 'DID_TMT', 'dcode', 'dname', 'amount', 'unit', 'unit_packing',
                'usage_code', 'drug_usage', 'caution', 'drugprice', 'drugcost', 'provider', 'd_update'
            )
            .where('visit_vn', an);
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts, routes/refer/crontab.ts
    // ใช้ view_diagnosis_ipd
    async getDiagnosisIpd(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
        columnName = columnName === 'visitNo' ? 'visit_vn' : columnName;
        columnName = columnName === 'an' ? 'visit_vn' : columnName;

        return db('his_connect.view_diagnosis_ipd')
            .select(
                db.raw('? as hospcode', [hisHospcode]),
                'pid', 'an', 'datetime_admit', 'warddiag', 'diagtype',
                'diagcode', 'diagname', 'provider', 'd_update', 'CID'
            )
            .where(columnName, searchNo)
            .orderBy(['an', 'diagtype']);
    }
    // ✅ เรียกใช้: routes/his/index.ts
    // ใช้ view_diagnosis_ipd_accident
    async getDiagnosisIpdAccident(db: Knex, dateStart: any, dateEnd: any, hospCode = hisHospcode) {
        if (dateStart && dateEnd) {
            return db('his_connect.view_diagnosis_ipd_accident')
                .select(
                    db.raw('? as hospcode', [hisHospcode]),
                    't_visit_diagnosis_id', 't_visit_id', 'visit_diagnosis_icd10',
                    'f_visit_diagnosis_type_id', 'visit_diagnosis_staff_record',
                    'visit_diagnosis_record_date_time', 'visit_vn', 'visit_hn', 'diagnosis_date'
                )
                .whereBetween('diagnosis_date', [dateStart, dateEnd])
                .limit(maxLimit);
        } else {
            throw new Error('Invalid parameters');
        }
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/qdrugstore/index.ts, routes/refer/v3.ts
    // ใช้ view_accident
    async getAccident(db: Knex, visitNo, hospCode = hisHospcode) {
        return db('his_connect.view_accident')
            .select(
                db.raw('? as HOSPCODE', [hisHospcode]),
                'vn', 'hn', 'adate', 'atime', 'bp1', 'e', 'verbal', 'm'
            )
            .where('visit_vn', visitNo);
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts, routes/refer/crontab.ts, routes/pcc/index.ts
    // ใช้ view_drug_allergy
    async getDrugAllergy(db: Knex, hn, hospCode = hisHospcode) {
        return db('his_connect.view_drug_allergy')
            .select(
                db.raw('? as HOSPCODE', [hisHospcode]),
                'PID', 'CID', 'DRUGALLERGY', 'DNAME', 'ALEVE', 'DETAIL', 'INFORMANT',
                'DATERECORD',
                db.raw('? as INFORMHOSP', [hisHospcode]),
                'TYPEDX', 'SYMPTOM', 'D_UPDATE'
            )
            .where('patient_hn', hn);
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/qdrugstore/index.ts, routes/refer/v3.ts
    // ใช้ view_appointment
    getAppointment(db: Knex, visitNo: any, hospCode = hisHospcode) {
        return db('his_connect.view_appointment')
            .select(
                db.raw('? as hospcode', [hisHospcode]),
                'hn', 'vn', 'apdate', 'aptime', 'department', 'reason', 'dr'
            )
            .where('visit_vn', visitNo)
            .limit(maxLimit);
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/qdrugstore/index.ts, routes/refer/v3.ts
    // ใช้ view_refer_history
    async getReferHistory(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
        columnName = columnName === 'visitNo' ? 'visit_vn' : columnName;
        columnName = columnName === 'vn' ? 'visit_vn' : columnName;
        columnName = columnName === 'referNo' ? 'visit_refer_out_number' : columnName;

        return db('his_connect.view_refer_history')
            .select(
                db.raw('? as HOSPCODE', [hisHospcode]),
                'REFERID', 'PID', 'CID', 'SEQ', 'AN', 'DATETIME_SERV',
                'DATETIME_REFER', 'CLINIC_REFER', 'HOSP_DESTINATION', 'EMERGENCY', 'provider', 'D_UPDATE'
            )
            .where(columnName, searchNo);
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/qdrugstore/index.ts, routes/refer/v3.ts
    // ใช้ view_clinical_refer
    async getClinicalRefer(db: Knex, referNo, hospCode = hisHospcode) {
        return db('his_connect.view_clinical_refer')
            .select(
                db.raw('? as hospcode', [hisHospcode]),
                'refer_no', 'bp', 'pr', 'rr', 'temp'
            )
            .where('visit_refer_out_number', referNo)
            .limit(maxLimit);
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/qdrugstore/index.ts, routes/refer/v3.ts
    // ใช้ view_investigation_refer
    async getInvestigationRefer(db: Knex, referNo, hospCode = hisHospcode) {
        return db('his_connect.view_investigation_refer')
            .select(
                db.raw('? as hospcode', [hisHospcode]),
                'refer_no', 'investname', 'investvalue', 'unit'
            )
            .where('visit_refer_out_number', referNo)
            .limit(maxLimit);
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/qdrugstore/index.ts, routes/refer/v3.ts
    // ใช้ view_care_refer
    async getCareRefer(db: Knex, referNo, hospCode = hisHospcode) {
        return db('his_connect.view_care_refer')
            .select(
                db.raw('? as hospcode', [hisHospcode]),
                'referid', 'd_update'
            )
            .where('referid', referNo);
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts, routes/refer/crontab.ts
    // ใช้ view_refer_result
    getReferResult(db: Knex, visitDate: string, hospCode = hisHospcode) {
        visitDate = moment(visitDate).format('YYYY-MM-DD');
        return db('his_connect.view_refer_result')
            .select(
                db.raw('? as HOSPCODE', [hisHospcode]),
                'HOSP_SOURCE', 'CID_IN', 'PID_IN', 'SEQ_IN', 'REFERID',
                'DATETIME_REFER', 'detail', 'REFERID_SOURCE', 'DATETIME_IN', 'REFER_RESULT', 'D_UPDATE'
            )
            .where('visit_date', visitDate)
            .limit(maxLimit);
    }

    // ✅ เรียกใช้: routes/his/index.ts, routes/qdrugstore/index.ts, routes/refer/v3.ts
    // ใช้ view_provider
    async getProvider(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
        columnName = columnName === 'licenseNo' ? 'registerno' : columnName;

        return db('his_connect.view_provider')
            .select(
                db.raw('? as hospcode', [hisHospcode]),
                'provider', 'registerno', 'name', 'lname'
            )
            .where(columnName, searchNo)
            .limit(maxLimit);
    }

    // ✅ เรียกใช้: routes/refer/crontab.ts
    // ใช้ view_provider
    getProviderDr(db: Knex, drList: any[]) {
        return db('his_connect.view_provider')
            .select(
                db.raw('? as hospcode', [hisHospcode]),
                'provider', 'registerno', 'name', 'lname'
            )
            .whereIn('provider', drList);
    }

    // ❌ ไม่พบการเรียกใช้งาน (มีแค่ reportModel.getData ซึ่งเป็นคนละ model)
    getData(db: Knex, tableName, columnName, searchNo, hospCode = hisHospcode) {
        return db(tableName)
            .select(db.raw(`'${hisHospcode}' as hospcode`))
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }

    // ✅ เรียกใช้: routes/refer/v3.ts
    // ใช้ view_refer_out_summary
    // Report Zone
    sumReferOut(db: Knex, dateStart: any, dateEnd: any) {
        return db('his_connect.view_refer_out_summary')
            .select('refer_date')
            .count('t_visit_refer_out_id as cases')
            .whereBetween('refer_date', [dateStart, dateEnd])
            .whereNot('visit_refer_out_off_id', hisHospcode)
            .groupBy('refer_date')
            .orderBy('refer_date');
    }

    // ✅ เรียกใช้: routes/refer/v3.ts
    // ใช้ view_refer_in_summary
    sumReferIn(db: Knex, dateStart: any, dateEnd: any) {
        return db('his_connect.view_refer_in_summary')
            .select('refer_date')
            .count('t_visit_refer_in_id as cases')
            .whereBetween('refer_date', [dateStart, dateEnd])
            .whereNot('visit_refer_in_off_id', hisHospcode)
            .groupBy('refer_date')
            .orderBy('refer_date');
    }
    // ✅ เรียกใช้: task/moph-erp.ts
    // ใช้ view_ipd_concurrent
    concurrentIPDByWard(db: Knex, date: any) {
        return db('his_connect.view_ipd_concurrent')
            .select(
                'wardcode', 'wardname',
                db.raw(`SUM(CASE WHEN begin_date = ? THEN 1 ELSE 0 END) as new_case`, [date]),
                db.raw(`SUM(CASE WHEN discharge_date = ? THEN 1 ELSE 0 END) as discharge`, [date]),
                db.raw(`SUM(CASE WHEN discharge_status IN ('8','9') THEN 1 ELSE 0 END) as death`)
            )
            .count('t_visit_id as cases')
            .where('begin_date', '<=', date)
            .andWhere(function () {
                this.where('is_not_discharged', true)
                    .orWhere('discharge_date', '>=', date);
            })
            .groupBy('wardcode', 'wardname')
            .orderBy('wardcode');
    }

    // ✅ เรียกใช้: task/moph-erp.ts
    // ใช้ view_ipd_concurrent
    concurrentIPDByClinic(db: Knex, date: any) {
        return db('his_connect.view_ipd_concurrent')
            .select(
                'cliniccode', 'clinicname',
                db.raw(`SUM(CASE WHEN begin_date = ? THEN 1 ELSE 0 END) as new_case`, [date]),
                db.raw(`SUM(CASE WHEN discharge_date = ? THEN 1 ELSE 0 END) as discharge`, [date]),
                db.raw(`SUM(CASE WHEN discharge_status IN ('8','9') THEN 1 ELSE 0 END) as death`)
            )
            .count('t_visit_id as cases')
            .where('begin_date', '<=', date)
            .andWhere(function () {
                this.where('is_not_discharged', true)
                    .orWhere('discharge_date', '>=', date);
            })
            .groupBy('cliniccode', 'clinicname')
            .orderBy('cliniccode');
    }

    // ✅ เรียกใช้: task/moph-erp.ts
    // ใช้ view_opd_visit_summary
    sumOpdVisitByClinic(db: Knex, date: any) {
        return db('his_connect.view_opd_visit_summary')
            .select(
                'visit_date as date',
                'cliniccode',
                db.raw(`SUM(CASE WHEN visit_type = '1' THEN 1 ELSE 0 END) AS admit`)
            )
            .count('t_visit_id as cases')
            .where('visit_date', date)
            .groupBy('visit_date', 'cliniccode')
            .orderBy('cliniccode');
    }


    // ผ่านการ Verify แล้ว ==============================================

    // ✅ เรียกใช้: routes/his/index.ts, routes/refer/v3.ts, task/moph-erp.ts
    // ใช้ view_ward
    // MOPH ERP
    // Columns based on column_description.md getWard
    getWard(db: Knex, wardCode: string = '', wardName: string = '') {
        let sql = db('his_connect.view_ward')
            .select(
                db.raw('? as hospcode', [hisHospcode]),
                'wardcode', 'wardname', 'std_code',
                'bed_normal', 'bed_special', 'bed_icu', 'bed_semi', 'bed_stroke', 'bed_burn',
                'bed_minithanyaruk', 'bed_extra', 'lr', 'clip', 'imc', 'homeward', 'isactive'
            );
        
        if (wardCode) {
            sql.where('wardcode', wardCode);
        } else if (wardName) {
            sql.whereLike('wardname', `%${wardName}%`);
        }
        
        return sql.orderBy('wardcode').limit(maxLimit);
    }

    // ✅ เรียกใช้: task/moph-erp.ts
    // ใช้ view_bed
    countBedNo(db: Knex) {
        return db('his_connect.view_bed')
            .count('bedno as total_bed')
            .where('isactive', 1)
            .first();
    }
    // ✅ เรียกใช้: task/moph-erp.ts
    // ใช้ view_bed
    // Columns based on column_description.md getBedNo
    async getBedNo(db: Knex, bedno: any = null, start = -1, limit: number = 1000) {
        let sql = db('his_connect.view_bed')
            .select(
                db.raw('? as hospcode', [hisHospcode]),
                'bedno', 'bedname', 'roomno', 'wardcode', 'std_code', 'isactive'
            )
            .where('isactive', 1);
        
        if (bedno) {
            sql = sql.where('bedno', bedno);
        }
        if (start >= 0) {
            sql = sql.offset(start).limit(limit);
        }
        
        return sql.orderBy('bedno');
    }
    // ✅ เรียกใช้: task/moph-alert.ts
    // ใช้ view_visit_opd
    async getVisitForMophAlert(db: Knex, date: any, isRowCount: boolean = false, limit: number = 1000, start = -1) {
        try {
            date = moment(date).locale('TH').format('YYYY-MM-DD');
            if (isRowCount) {
                const result = await db('his_connect.view_visit_opd')
                    .where('date_service', date)
                    .count('t_visit_id as row_count')
                    .first();
                return result;
            } else {
                let sql = db('his_connect.view_visit_opd')
                    .select(
                        db.raw('? as hospcode', [hisHospcode]),
                        'hn', 'vn', 'cid', 'department_type', 'department_code',
                        'department_name', 'date_service', 'time_service',
                        'service_status', 'service_status_name'
                    )
                    .where('date_service', date);
                
                if (start >= 0) {
                    sql = sql.offset(start).limit(limit);
                }
                
                const rows = await sql;
                return rows;
            }
        } catch (error) {
            throw error;
        }
    }
}
