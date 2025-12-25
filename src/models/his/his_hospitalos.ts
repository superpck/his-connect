import { Knex } from 'knex';
import * as moment from 'moment';
const dbName = process.env.HIS_DB_NAME;

const maxLimit = 250;
let hisHospcode = process.env.HOSPCODE;
export class HisHospitalOsModel {
    constructor() {
    }

    check() {
        return true;
    }

    getTableName(knex: Knex) {
        return knex('information_schema.tables')
            .select('table_name')
            .where('table_catalog', '=', dbName);

    }

    async testConnect(db: Knex) {
        console.log('nRefer: Testing DB connection... from t_patient');
        return await db('t_patient').select('patient_hn').limit(1)
    }

    async testConnect_(db: Knex) {
        const clientType = ((db as any).client?.config?.client || '').toLowerCase();

        const opdConfig = await global.dbHIS('opdconfig').first();
        const hospname = opdConfig?.hospitalname || opdConfig?.hospitalcode || null;

        const patientSample = await db('patient').select('hn').limit(1);
        const connection = Array.isArray(patientSample) ? patientSample.length > 0 : !!patientSample;

        let charset = '';
        try {
            if (clientType.includes('mysql')) {
                const schema = await db('information_schema.SCHEMATA')
                    .select('DEFAULT_CHARACTER_SET_NAME as charset')
                    .where('SCHEMA_NAME', process.env.HIS_DB_NAME)
                    .first();
                charset = schema?.charset || '';
            } else if (clientType.includes('pg')) {
                const result = await db.raw(
                    'SELECT pg_encoding_to_char(encoding) AS charset FROM pg_database LIMIT 1'
                );
                charset = result?.rows?.[0]?.charset || '';
            } else if (clientType.includes('mssql')) {
                const result = await db.raw(
                    'SELECT collation_name AS charset FROM sys.databases WHERE name = ?',
                    [process.env.HIS_DB_NAME]
                );
                charset = result?.recordset?.[0]?.charset || '';
            } else if (clientType.includes('oracledb')) {
                const result = await db.raw(
                    "SELECT value AS charset FROM nls_database_parameters WHERE parameter = 'NLS_CHARACTERSET'"
                );
                charset = result?.rows?.[0]?.CHARSET || result?.rows?.[0]?.charset || '';
            }
        } catch (error) {
            console.warn('testConnect: charset lookup failed', error);
        }

        return { hospname, connection, charset };
    }

    getTableName_(db: Knex, dbName = process.env.HIS_DB_NAME) {
        const clientType = ((db as any).client?.config?.client || '').toLowerCase();
        const schemaName = process.env.HIS_DB_SCHEMA || 'public';
        const dbUser = (process.env.HIS_DB_USER || '').toUpperCase();

        if (clientType.includes('mysql')) {
            return db('information_schema.tables')
                .select('table_name')
                .where('table_schema', dbName);
        }

        if (clientType.includes('pg')) {
            return db('information_schema.tables')
                .select('table_name')
                .where('table_catalog', dbName)
                .andWhere('table_schema', schemaName);
        }

        if (clientType.includes('mssql')) {
            const query = db('INFORMATION_SCHEMA.TABLES')
                .select('TABLE_NAME as table_name')
                .where('TABLE_TYPE', 'BASE TABLE');

            if (dbName) {
                query.andWhere('TABLE_CATALOG', dbName);
            }

            return query;
        }

        if (clientType.includes('oracledb')) {
            const query = db('ALL_TABLES').select('TABLE_NAME as table_name');

            if (dbUser) {
                query.where('OWNER', dbUser);
            }

            return query;
        }

        return db.select(db.raw('NULL as table_name')).whereRaw('1 = 0');
    }

    // รหัสห้องตรวจ
    getDepartment(db: Knex, depCode: string = '', depName: string = '') {
        let sql = db('b_visit_clinic');
        if (depCode) {
            sql.where('b_visit_clinic_id', depCode);
        } else if (depName) {
            sql.whereLike('visit_clinic_description', `%${depName}%`)
        }
        const clientType = ((db as any).client?.config?.client || '').toLowerCase();
        let emergencyExpr = "CASE WHEN LOCATE('ฉุกเฉิน', visit_clinic_description) > 0 THEN 1 ELSE 0 END";

        if (clientType.includes('pg')) {
            emergencyExpr = "CASE WHEN POSITION('ฉุกเฉิน' IN visit_clinic_description) > 0 THEN 1 ELSE 0 END";
        } else if (clientType.includes('mssql')) {
            emergencyExpr = "CASE WHEN CHARINDEX(N'ฉุกเฉิน', visit_clinic_description) > 0 THEN 1 ELSE 0 END";
        } else if (clientType.includes('oracledb')) {
            emergencyExpr = "CASE WHEN INSTR(visit_clinic_description, 'ฉุกเฉิน') > 0 THEN 1 ELSE 0 END";
        }

        return sql
            .select('b_visit_clinic_id as department_code', 'visit_clinic_description as department_name',
                `'-' as moph_code`)
            .select(db.raw(`${emergencyExpr} as emergency`))
            .where('visit_clinic_active', '1')
            .orderBy('visit_clinic_description')
            .limit(maxLimit);
    }

    // รายละเอียดแพทย์
    getDr(db: Knex, drCode: string = '', drName: string = '') {
        let sql = db('b_employee');
        if (drCode) {
            sql.where('b_employee_id', drCode);
        } else if (drName) {
            sql.where(function () {
                this.whereLike('employee_firstname', `%${drName}%`)
                    .orWhereLike('employee_lastname', `%${drName}%`)
            })
        }
        return sql
            .select('b_employee_id as dr_code', 'employee_licenseno as dr_license_code',
                db.raw("concat(employee_firstname, ' ', employee_lastname) as dr_name"), 'employee_resignation_date as expire_date')
            .where('employee_active', '1')
            .limit(maxLimit);
    }

    //select รายชื่อเพื่อแสดงทะเบียน refer
    getReferOut(db: Knex, date: any, hospCode = hisHospcode, visitNo: string = null) {
        let sql = db('t_visit_refer_out as r').innerJoin('t_patient as pt', 'pt.t_patient_id', 'r.t_patient_id')
            .innerJoin('t_visit as v', 'r.t_visit_id', 'v.t_visit_id')
            .leftJoin('b_employee as dr', 'r.visit_refer_out_staff_doctor', 'dr.b_employee_id')
            .select(db.raw(`"${hisHospcode}" as hospcode`));
        if (visitNo) {
            sql.where('v.visit_vn', visitNo);
        } else {
            sql.whereRaw(`concat(to_number(substr(r.visit_refer_out_date_time,1,4),'9999')-543 ,'-',substr(r.visit_refer_out_date_time,6,5)) = ?`, [date]);
        }
        return sql.select('r.visit_refer_out_date_time AS refer_date',
            'r.visit_refer_out_number AS referid', 'r.visit_refer_out_off_id AS hosp_destination',
            'pt.patient_hn AS PID', 'pt.patient_hn AS hn', 'pt.patient_pid AS CID', 'v.visit_vn as vn', 'v.visit_vn as SEQ',
            'v.visit_vn as AN', 'pt.patient_firstname AS fname',
            'pt.patient_lastname as lname', 'pt.patient_birthday AS dob',
            'pt.f_sex_id as sex', 'r.f_visit_refer_out_emergency_type_id as EMERGENCY',
            'r.visit_refer_out_staff_doctor as dr', 'dr.employee_licenseno as provider',
            'v.b_visit_clinic_id as clinic')
            .whereNotNull('v.visit_vn')
            .where('r.visit_refer_out_off_id', '!=', "")
            .whereNotNull('r.visit_refer_out_off_id')
            .where('r.visit_refer_out_off_id', '!=', hisHospcode)
            .orderBy('r.visit_refer_out_date_time');
    }


    async getPerson(db: Knex, columnName, searchText, hospCode = hisHospcode) {
        columnName = columnName == 'hn' ? 'pt.patient_hn' : columnName;
        columnName = columnName == 'cid' ? 'pt.patient_pid' : columnName;
        columnName = columnName == 'name' ? 'pt.patient_firstname' : columnName;

        const result = await db('t_patient as pt')
            .leftJoin('f_patient_prefix as pre', 'pt.f_patient_prefix_id', 'pre.f_patient_prefix_id')
            .leftJoin('f_patient_occupation as occ', 'pt.f_patient_occupation_id', 'occ.f_patient_occupation_id')
            .select(
                db.raw('? as HOSPCODE', [hisHospcode]),
                'pt.patient_hn as HN',
                'pt.patient_hn as PID',
                'pt.patient_pid as CID',
                'pre.patient_prefix_description as PRENAME',
                'pt.patient_firstname as NAME',
                'pt.patient_lastname as LNAME',
                'pt.f_sex_id as SEX',
                'pt.patient_birthday as BIRTH',
                'pt.f_patient_marriage_status_id as MSTATUS',
                'occ.f_patient_occupation_id as OCCUPATION_OLD',
                'occ.f_patient_occupation_id as OCCUPATION_NEW',
                'pt.f_patient_nation_id as NATION',
                'pt.f_patient_race_id as RACE',
                'pt.f_patient_religion_id as RELIGION',
                'pt.f_patient_education_id as EDUCATION',
                'pt.patient_father_firstname as FATHER',
                'pt.patient_mother_firstname as MOTHER',
                'pt.patient_phone_number as MOBILE',
                'pt.patient_record_date_time as D_UPDATE'
            )
            .where(columnName, searchText);

        return result[0];
    }
    async getAddress(db: Knex, columnName, searchText, hospCode = hisHospcode) {
        //columnName => hn
        const sql = `
            SELECT
                "${hisHospcode}" AS hospcode,
                pt.cid,
                pt.hn, pt.hn as pid,
                IF (p.house_regist_type_id IN (1, 2),'1','2') addresstype,
                CASE WHEN h.census_id IS NULL THEN '' ELSE h.census_id END AS house_id,
                IF(p.house_regist_type_id IN (4),'9',h.house_type_id) housetype,
                h.house_condo_roomno roomno,
                h.house_condo_name condo,
                IF(p.house_regist_type_id IN (4),pt.addrpart,h.address) houseno,
                '' soisub,
                '' soimain,
                IF(p.house_regist_type_id IN (4),pt.road,h.road) road,
                IF(p.house_regist_type_id IN (4),'',v.village_name)  villaname,
                IF(p.house_regist_type_id IN (4),pt.moopart,v.village_moo) village,
                IF(p.house_regist_type_id IN (4),pt.tmbpart,t.tmbpart) tambon,
                IF(p.house_regist_type_id IN (4),pt.amppart,t.amppart) ampur,
                IF(p.house_regist_type_id IN (4),pt.chwpart,t.chwpart) changwat,
                p.last_update D_Update
            FROM
                person p
                LEFT JOIN patient pt ON p.cid = pt.cid
                LEFT JOIN house h ON h.house_id = p.house_id
                LEFT JOIN village v ON v.village_id = h.village_id
                LEFT JOIN thaiaddress t ON t.addressid=v.address_id
                LEFT JOIN person_address pa ON pa.person_id = p.person_id

            where ${columnName}=?
        `;
        const result = await db.raw(sql, [searchText]);
        return result[0];
    }
    async getService(db: Knex, columnName: string, searchText: any, hospCode = hisHospcode) {
        columnName = columnName === 'visitNo' ? 'v.visit_vn' : columnName;
        columnName = columnName === 'vn' ? 'v.visit_vn' : columnName;
        columnName = columnName === 'hn' ? 'v.visit_hn' : columnName;

        if (columnName === 'date_serv') {
            columnName = <any>db.raw(`concat(to_number(substr(v.visit_begin_visit_time,1,4),'9999')-543 ,'-',substr(v.visit_begin_visit_time,6,5))`);
        }

        const sql = `
            select 
                ? as HOSPCODE,
                v.visit_hn as PID,
                v.visit_hn as HN,
                pt.patient_pid as CID,
                v.visit_vn as seq_id,
                v.visit_vn as SEQ,
                concat(to_number(substr(v.visit_begin_visit_time,1,4),'9999')-543 ,'-',substr(v.visit_begin_visit_time,6,5)) as DATE_SERV,
                substr(v.visit_begin_visit_time,12,8) as TIME_SERV,
                '1' as LOCATION,
                case v.f_visit_type_id when '1' then '1' else '2' end as INTIME,
                '9100' as INSTYPE,
                '' as MAIN,
                '1' as TYPEIN,
                '' as REFEROUTHOSP,
                '' as CAUSEOUT,
                vs.visit_vital_sign_waist as waist,
                vs.visit_vital_sign_checkup as cc,
                '' as pe,
                v.visit_note as ph,
                v.visit_note as pi,
                v.visit_note as nurse_note,
                '1' as SERVPLACE,
                vs.visit_vital_sign_temperature as BTEMP,
                vs.visit_vital_sign_blood_presure as BP,
                vs.visit_vital_sign_heart_rate as PR,
                vs.visit_vital_sign_respiratory_rate as RR,
                '' as o2sat,
                vs.visit_vital_sign_weight as weight,
                vs.visit_vital_sign_height as height,
                '' as gcs_e, '' as gcs_v, '' as gcs_m, '' as pupil_left, '' as pupil_right,
                '1' as TYPEOUT,
                v.visit_vn as AN,
                dr.b_employee_id as dr,
                dr.employee_licenseno as provider,
                '0.00' as COST,
                '0.00' as PRICE,
                '0.00' as PAYPRICE,
                '0.00' as ACTUALPAY,
                v.visit_begin_visit_time as D_UPDATE,
                '' as hsub
            from 
                t_visit v
                left join t_patient pt on v.t_patient_id = pt.t_patient_id
                left join t_visit_vital_sign vs on v.t_visit_id = vs.t_visit_id
                left join b_employee dr on v.visit_staff_doctor = dr.b_employee_id
            where ${columnName}=?
            `;

        const result = await db.raw(sql, [hisHospcode, searchText]);
        return result[0] || result.rows || result;
    }

    getOpdServiceByVN(db: Knex, vn: any) {
        let sql = db('t_visit as v');
        if (typeof vn === 'string') {
            sql.where('v.visit_vn', vn);
        } else {
            sql.whereIn('v.visit_vn', vn)
        };

        return sql.leftJoin(`t_accident as acc`, 'acc.t_visit_id', 'v.t_visit_id')
            .leftJoin(`t_visit_vital_sign as vs`, 'vs.t_visit_id', 'v.t_visit_id')
            .leftJoin('t_patient as pt', 'v.t_patient_id', 'pt.t_patient_id')
            .leftJoin('b_visit_clinic as c', 'v.b_visit_clinic_id', 'c.b_visit_clinic_id')
            .select('pt.patient_hn as hn', 'v.visit_vn as visitno', 'v.visit_begin_visit_time as time')
            .select(db.raw(`concat(to_number(substr(v.visit_begin_visit_time,1,4),'9999')-543 ,'-',substr(v.visit_begin_visit_time,6,5)) as date,
                vs.visit_vital_sign_blood_presure as bp,
                vs.visit_vital_sign_heart_rate as pr,
                vs.visit_vital_sign_respiratory_rate as rr,
                v.b_visit_clinic_id as clinic_local_code,
                c.visit_clinic_description as clinic_local_name`))
            .limit(maxLimit);
    }

    async getDiagnosisOpd(db: Knex, visitNo, hospCode = hisHospcode) {
        const sql = `
            SELECT ? AS HOSPCODE,
                pt.patient_pid CID,
                v.visit_hn PID,
                v.visit_hn,
                v.visit_vn SEQ, v.visit_vn as VN,
                concat(to_number(substr(v.visit_begin_visit_time,1,4),'9999')-543 ,'-',substr(v.visit_begin_visit_time,6,5)) DATE_SERV,
                CASE WHEN dx.f_visit_diagnosis_type_id IS NULL THEN '' ELSE dx.f_visit_diagnosis_type_id END AS DIAGTYPE,
                dx.visit_diagnosis_icd10 DIAGCODE,
                v.b_visit_clinic_id AS CLINIC,
                dx.visit_diagnosis_staff_record PROVIDER,
                dx.visit_diagnosis_record_date_time D_UPDATE
            FROM
                t_visit v
            LEFT JOIN t_visit_diagnosis dx ON dx.t_visit_id = v.t_visit_id
            LEFT JOIN t_patient pt ON pt.t_patient_id = v.t_patient_id
            WHERE
                v.visit_vn =?
                AND dx.visit_diagnosis_icd10 IS NOT NULL
            `;
        const result = await db.raw(sql, [hisHospcode, visitNo]);
        return result[0] || result.rows || result;
    }
    async getDiagnosisOpdAccident(db: Knex, dateStart: any, dateEnd: any, hospCode = hisHospcode) {
        if (dateStart && dateEnd) {
            return db('t_visit_diagnosis as dx')
                .leftJoin('t_visit as v', 'dx.t_visit_id', 'v.t_visit_id')
                .whereBetween(<any>db.raw(`concat(to_number(substr(dx.visit_diagnosis_record_date_time,1,4),'9999')-543 ,'-',substr(dx.visit_diagnosis_record_date_time,6,5))`), [dateStart, dateEnd])
                .whereRaw(`left(visit_diagnosis_icd10,1) in ('V','W','X','Y')`)
                .limit(maxLimit);
        } else {
            throw new Error('Invalid parameters');
        }
    }
    async getDiagnosisOpdVWXY(db: Knex, date: any) {
        let sql = `SELECT pt.patient_hn as hn, v.visit_vn AS visitno, 
                concat(to_number(substr(dx.visit_diagnosis_record_date_time,1,4),'9999')-543 ,'-',substr(dx.visit_diagnosis_record_date_time,6,5)) as date, 
                dx.visit_diagnosis_icd10 AS diagcode,
                icd.icd10_description AS diag_name,
                dx.f_visit_diagnosis_type_id AS diag_type, 
                dx.visit_diagnosis_staff_record AS dr,
                'IT' as codeset, 
                dx.visit_diagnosis_record_date_time as d_update
            FROM t_visit_diagnosis as dx
                LEFT JOIN b_icd10 as icd ON dx.visit_diagnosis_icd10 = icd.icd10_number
                INNER JOIN t_visit as v ON dx.t_visit_id = v.t_visit_id
                LEFT JOIN t_patient pt ON pt.t_patient_id = v.t_patient_id
            WHERE v.t_visit_id IN (
                SELECT t_visit_id FROM t_visit_diagnosis as dx
                WHERE concat(to_number(substr(dx.visit_diagnosis_record_date_time,1,4),'9999')-543 ,'-',substr(dx.visit_diagnosis_record_date_time,6,5)) = ? 
                    AND LEFT(dx.visit_diagnosis_icd10,1) IN ('V','W','X','Y'))
                AND LEFT(dx.visit_diagnosis_icd10,1) IN ('S','T','V','W','X','Y')
            ORDER BY v.visit_vn, dx.f_visit_diagnosis_type_id, dx.visit_diagnosis_record_date_time LIMIT ` + maxLimit;

        const result = await db.raw(sql, [date]);
        return result?.rows || result[0] || result;
    }
    async getDiagnosisSepsisOpd(db: Knex, date: any) {
        let sql = `SELECT pt.patient_hn as hn, v.visit_vn AS visitno, 
                concat(to_number(substr(dx.visit_diagnosis_record_date_time,1,4),'9999')-543 ,'-',substr(dx.visit_diagnosis_record_date_time,6,5)) as date, 
                dx.visit_diagnosis_icd10 AS diagcode,
                icd.icd10_description AS diag_name,
                dx.f_visit_diagnosis_type_id AS diag_type, 
                dx.visit_diagnosis_staff_record AS dr,
                'IT' as codeset, 
                dx.visit_diagnosis_record_date_time as d_update
            FROM t_visit_diagnosis as dx
                LEFT JOIN b_icd10 as icd ON dx.visit_diagnosis_icd10 = icd.icd10_number
                INNER JOIN t_visit as v ON dx.t_visit_id = v.t_visit_id
                LEFT JOIN t_patient pt ON pt.t_patient_id = v.t_patient_id
            WHERE v.t_visit_id IN (
                SELECT t_visit_id FROM t_visit_diagnosis as dx
                WHERE concat(to_number(substr(dx.visit_diagnosis_record_date_time,1,4),'9999')-543 ,'-',substr(dx.visit_diagnosis_record_date_time,6,5)) = ? 
                    AND (LEFT(dx.visit_diagnosis_icd10,4) IN ('R651','R572') OR LEFT(dx.visit_diagnosis_icd10,3) IN ('A40','A41')))
            ORDER BY v.visit_vn, dx.f_visit_diagnosis_type_id, dx.visit_diagnosis_record_date_time LIMIT ` + maxLimit;

        const result = await db.raw(sql, [date]);
        return result?.rows || result[0] || result;
    }
    async getDiagnosisSepsisIpd(db: Knex, dateStart: any, dateEnd: any) {
        let sql = `SELECT pt.patient_hn as hn, v.visit_vn AS visitno, v.visit_vn as an, 
                concat(to_number(substr(v.visit_financial_discharge_time,1,4),'9999')-543 ,'-',substr(v.visit_financial_discharge_time,6,5)) as date,
                dx.visit_diagnosis_icd10 AS diagcode,
                icd.icd10_description AS diag_name,
                dx.f_visit_diagnosis_type_id AS diag_type, 
                dx.visit_diagnosis_staff_record AS dr,
                pre.patient_prefix_description AS patient_prename,
                pt.patient_firstname AS patient_fname,
                pt.patient_lastname AS patient_lastname,
                v.b_visit_ward_id as wardcode, ward.visit_ward_description as wardname,
                'IT' as codeset, dx.visit_diagnosis_record_date_time as d_update
            FROM t_visit_diagnosis as dx
                LEFT JOIN b_icd10 as icd ON dx.visit_diagnosis_icd10 = icd.icd10_number
                INNER JOIN t_visit as v ON dx.t_visit_id = v.t_visit_id
                LEFT JOIN t_patient pt on v.t_patient_id = pt.t_patient_id
                LEFT JOIN f_patient_prefix pre on pt.f_patient_prefix_id = pre.f_patient_prefix_id
                LEFT JOIN b_visit_ward ward on v.b_visit_ward_id = ward.b_visit_ward_id
                WHERE v.t_visit_id IN (
                    SELECT t_visit_id FROM t_visit_diagnosis as dx
                    INNER JOIN t_visit as v2 on dx.t_visit_id = v2.t_visit_id
                    WHERE v2.f_visit_type_id = '1' AND 
                        concat(to_number(substr(v2.visit_financial_discharge_time,1,4),'9999')-543 ,'-',substr(v2.visit_financial_discharge_time,6,5)) BETWEEN ? AND ? 
                        AND (LEFT(dx.visit_diagnosis_icd10,4) IN ('R651','R572') OR LEFT(dx.visit_diagnosis_icd10,3) IN ('A40','A41')))
            ORDER BY v.visit_vn, dx.f_visit_diagnosis_type_id, v.visit_begin_visit_time LIMIT ` + maxLimit;
        const result = await db.raw(sql, [dateStart, dateEnd]);
        return result?.rows || result[0] || result;
    }

    getInvestigation(db: Knex, columnName: string, searchNo: string, hospCode = hisHospcode) {
        return this.getLabResult(db, columnName, searchNo);
    }
    async getLabRequest(db: Knex, columnName: string, searchNo: string, hospCode = hisHospcode) {
        columnName = columnName === 'visitNo' ? 'v.visit_vn' : columnName;
        columnName = columnName === 'hn' ? 'pt.patient_hn' : columnName;
        columnName = columnName === 'cid' ? 'pt.patient_pid' : columnName;

        return db('t_lab_order as lo')
            .leftJoin('t_visit as v', 'lo.t_visit_id', 'v.t_visit_id')
            .leftJoin('t_patient as pt', 'v.t_patient_id', 'pt.t_patient_id')
            .select(db.raw(`'${hisHospcode}' as HOSPCODE, 'LAB' as INVESTTYPE`))
            .select('v.visit_vn as vn', 'v.visit_vn as visitno', 'v.visit_vn as SEQ',
                'pt.patient_hn as PID', 'pt.patient_pid as CID',
                'lo.t_lab_order_id as request_id',
                'lo.b_item_id as LOCALCODE',
                'lo.lab_order_common_name as INVESTNAME',
                'lo.lab_order_staff_record as PROVIDER',
                'lo.lab_order_order_date_time as DATETIME_INVEST')
            .where(columnName, searchNo)
            .limit(maxLimit);
    }

    async getLabResult(db: Knex, columnName: string, searchNo: string, hospCode = hisHospcode) {
        columnName = columnName === 'visitNo' ? 'v.visit_vn' : columnName;
        columnName = columnName === 'hn' ? 'pt.patient_hn' : columnName;

        return db('t_lab_result as lr')
            .leftJoin('t_lab_order as lo', 'lr.t_lab_order_id', 'lo.t_lab_order_id')
            .leftJoin('t_visit as v', 'lo.t_visit_id', 'v.t_visit_id')
            .leftJoin('t_patient as pt', 'v.t_patient_id', 'pt.t_patient_id')
            .select(db.raw(`'${hisHospcode}' as HOSPCODE`))
            .select('pt.patient_hn as PID', 'v.visit_vn as SEQ', 'v.visit_vn as VN', 'pt.patient_pid as CID',
                'lo.t_lab_order_id as request_id',
                'lr.lab_result_lab_test_description as INVESTNAME',
                'lr.lab_result_lab_test_result as INVESTVALUE',
                'lr.lab_result_lab_test_unit as UNIT',
                'lo.lab_order_order_date_time as DATETIME_INVEST',
                'lr.lab_result_record_date_time as D_UPDATE')
            .where(columnName, searchNo)
            .limit(maxLimit);
    }

    async getDrugOpd(db: Knex, visitNo, hospCode = hisHospcode) {
        const sql = `
            SELECT ? as HOSPCODE,
                pt.patient_hn as PID, pt.patient_pid as CID,
                v.visit_vn as seq_id, v.visit_vn as SEQ, v.visit_vn as vn,
                concat(to_number(substr(v.visit_begin_visit_time,1,4),'9999')-543 ,'-',substr(v.visit_begin_visit_time,6,5)) as date_serv,
                v.b_visit_clinic_id as clinic,
                item.b_item_id as DID, item.item_common_name as DID_TMT,
                item.b_item_id as dcode, item.item_common_name as dname,
                o.order_qty as amount,
                '' as unit,
                '' as unit_packing,
                o.b_item_drug_uom_id_usage as usage_code,
                o.order_common_name as drug_usage,
                '' as caution,
                o.order_price as drugprice, 
                o.order_cost as drugcost, 
                o.visit_order_staff_doctor as provider,
                o.order_executed_date_time as d_update
                
            FROM
                t_order o
                left join t_visit v on o.t_visit_id = v.t_visit_id
                left join t_patient pt on v.t_patient_id = pt.t_patient_id
                inner join b_item item on o.b_item_id = item.b_item_id
            WHERE 
                v.f_visit_type_id = '0'
                and o.f_order_status_id <> '3'
                and v.visit_vn = ?
        `;
        const result = await db.raw(sql, [hisHospcode, visitNo]);
        return result[0] || result.rows || result;
    }

    async getAdmission(db: Knex, columnName: string, searchValue: any, hospCode = hisHospcode) {
        columnName = columnName === 'an' ? 'v.visit_vn' : columnName;
        columnName = columnName === 'hn' ? 'pt.patient_hn' : columnName;
        columnName = columnName === 'visitNo' ? 'v.visit_vn' : columnName;
        columnName = columnName === 'dateadmit' ? 'v.visit_begin_visit_time' : columnName;
        columnName = columnName === 'datedisc' ? 'v.visit_financial_discharge_time' : columnName;

        let sqlCommand = db('t_visit as v')
            .leftJoin('t_patient as pt', 'v.t_patient_id', 'pt.t_patient_id')
            .leftJoin('b_visit_ward as ward', 'v.b_visit_ward_id', 'ward.b_visit_ward_id')
            .leftJoin('b_employee as dr', 'v.visit_staff_doctor', 'dr.b_employee_id');

        if (Array.isArray(searchValue)) {
            sqlCommand.whereIn(columnName, searchValue);
        } else {
            sqlCommand.where(columnName, searchValue);
        }

        return sqlCommand.select(
            db.raw('? as HOSPCODE', [hisHospcode]),
            'pt.patient_hn as PID',
            'v.visit_vn as SEQ', 'v.visit_vn as AN', 'pt.patient_pid as CID', 'pt.f_sex_id as SEX',
            'v.visit_begin_visit_time as datetime_admit',
            'v.b_visit_ward_id as WARD_LOCAL',
            'ward.visit_ward_description as WARDADMITNAME',
            'v.visit_financial_discharge_time as datetime_disch',
            'dr.b_employee_id as dr', 'dr.employee_licenseno as provider',
            'v.visit_record_date_time as d_update'
        );
    }

    async getProcedureIpd(db: Knex, an: string, hospCode = hisHospcode) {
        const sql = `
            SELECT ? as HOSPCODE,
                pt.patient_hn as PID,
                v.visit_vn as AN, v.visit_vn as SEQ,
                concat(to_number(substr(v.visit_begin_visit_time,1,4),'9999')-543 ,'-',substr(v.visit_begin_visit_time,6,5)) as date_serv,
                v.b_visit_clinic_id as clinic,
                dx.visit_diagnosis_icd10 as procedcode,
                icd.icd10_description as procedname,
                dx.visit_diagnosis_staff_record as provider,
                v.visit_begin_visit_time as start_date,
                v.visit_begin_visit_time as start_time,
                v.visit_financial_discharge_time as finish_date,
                v.visit_financial_discharge_time as finish_time,
                v.visit_record_date_time as d_update
            FROM
                t_visit_diagnosis dx
                left join t_visit v on dx.t_visit_id = v.t_visit_id
                left join t_patient pt on v.t_patient_id = pt.t_patient_id
                left join b_icd10 icd on dx.visit_diagnosis_icd10 = icd.icd10_number
            WHERE v.visit_vn = ?
                AND dx.f_visit_diagnosis_type_id = '1'
        `;
        const result = await db.raw(sql, [hisHospcode, an]);
        return result[0] || result.rows || result;
    }

    async getChargeIpd(db: Knex, an: string, hospCode = hisHospcode) {
        const sql = `
            SELECT ? as HOSPCODE,
                pt.patient_hn as PID,
                v.visit_vn as AN, v.visit_vn as SEQ,
                v.visit_begin_visit_time as date_serv,
                item.b_item_id as chargecode,
                item.item_common_name as chargename,
                o.order_qty as quantity,
                v.b_visit_clinic_id as clinic,
                o.order_price as unitprice,
                o.order_price * o.order_qty as chargeprice,
                o.visit_order_staff_doctor as provider,
                o.order_executed_date_time as d_update
            FROM
                t_order o
                left join t_visit v on o.t_visit_id = v.t_visit_id
                left join t_patient pt on v.t_patient_id = pt.t_patient_id
                inner join b_item item on o.b_item_id = item.b_item_id
            WHERE v.visit_vn = ?
                and o.f_order_status_id <> '3'
        `;
        const result = await db.raw(sql, [hisHospcode, an]);
        return result[0] || result.rows || result;
    }

    async getDrugIpd(db: Knex, an: string, hospCode = hisHospcode) {
        const sql = `
            SELECT ? as HOSPCODE,
                pt.patient_hn as PID,
                v.visit_vn as AN, v.visit_vn as SEQ,
                v.visit_begin_visit_time as date_serv,
                v.b_visit_clinic_id as clinic,
                item.b_item_id as DID, item.item_common_name as DID_TMT,
                item.b_item_id as dcode, item.item_common_name as dname,
                o.order_qty as amount,
                '' as unit,
                '' as unit_packing,
                o.b_item_drug_uom_id_usage as usage_code,
                o.order_common_name as drug_usage,
                '' as caution,
                o.order_price as drugprice, 
                o.order_cost as drugcost, 
                o.visit_order_staff_doctor as provider,
                o.order_executed_date_time as d_update
            FROM
                t_order o
                left join t_visit v on o.t_visit_id = v.t_visit_id
                left join t_patient pt on v.t_patient_id = pt.t_patient_id
                inner join b_item item on o.b_item_id = item.b_item_id
            WHERE v.visit_vn = ?
                and o.f_order_status_id <> '3'
        `;
        const result = await db.raw(sql, [hisHospcode, an]);
        return result[0] || result.rows || result;
    }

    async getDiagnosisIpd(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
        columnName = columnName === 'visitNo' ? 'v.visit_vn' : columnName;
        columnName = columnName === 'an' ? 'v.visit_vn' : columnName;
        const sql = `
            select 
                ? as hospcode,
                pt.patient_hn as pid,
                v.visit_vn as an,
                v.visit_begin_visit_time as datetime_admit,
                v.b_visit_ward_id as warddiag,
                dx.f_visit_diagnosis_type_id as diagtype,
                dx.visit_diagnosis_icd10 as diagcode, 
                icd.icd10_description AS diagname,
                dx.visit_diagnosis_staff_record as provider,
                dx.visit_diagnosis_record_date_time d_update,
                pt.patient_pid as CID
                
            from 
                t_visit_diagnosis dx
                left join t_visit v on v.t_visit_id = dx.t_visit_id
                left join t_patient pt on pt.t_patient_id = v.t_patient_id
                left join b_icd10 icd on icd.icd10_number = dx.visit_diagnosis_icd10
            where ${columnName} = ?
            order by v.visit_vn, dx.f_visit_diagnosis_type_id`;
        const result = await db.raw(sql, [hisHospcode, searchNo]);
        return result[0] || result.rows || result;
    }
    async getDiagnosisIpdAccident(db: Knex, dateStart: any, dateEnd: any, hospCode = hisHospcode) {
        if (dateStart && dateEnd) {
            return db('t_visit_diagnosis as dx')
                .innerJoin('t_visit as v', 'dx.t_visit_id', 'v.t_visit_id')
                .select('dx.*')
                .whereBetween(<any>db.raw(`concat(to_number(substr(dx.visit_diagnosis_record_date_time,1,4),'9999')-543 ,'-',substr(dx.visit_diagnosis_record_date_time,6,5))`), [dateStart, dateEnd])
                .whereRaw(`LEFT(dx.visit_diagnosis_icd10,1) IN ('V','W','X','Y')`)
                .where('v.f_visit_type_id', '1')
                .limit(maxLimit);
        } else {
            throw new Error('Invalid parameters');
        }
    }

    async getAccident(db: Knex, visitNo, hospCode = hisHospcode) {
        return db('t_visit as v')
            .leftJoin('t_accident as acc', 'acc.t_visit_id', 'v.t_visit_id')
            .leftJoin('t_visit_vital_sign as vs', 'vs.t_visit_id', 'v.t_visit_id')
            .select('v.visit_vn as vn', 'v.visit_hn as hn', 'v.visit_begin_visit_time as adate',
                'v.visit_begin_visit_time as atime',
                'vs.visit_vital_sign_blood_presure as bp1',
                'acc.accident_eye_id as e', 'acc.accident_speak_id as v', 'acc.accident_movement_id as m')
            .where('v.visit_vn', visitNo);
    }

    async getDrugAllergy(db: Knex, hn, hospCode = hisHospcode) {
        return db('t_patient_drug_allergy as al')
            .leftJoin('t_patient as pt', 'al.t_patient_id', 'pt.t_patient_id')
            .select(db.raw('? as HOSPCODE', [hisHospcode]))
            .select('pt.patient_hn as PID', 'pt.patient_pid as CID', 'al.drug_allergy_drug_name as DRUGALLERGY',
                'al.drug_allergy_drug_name as DNAME', 'al.f_drug_allergy_symtom_level_id as ALEVE',
                'al.drug_allergy_symtom as DETAIL', 'al.drug_allergy_staff_record as INFORMANT',
                'al.drug_allergy_record_date_time as DATERECORD',
                db.raw('? as INFORMHOSP', [hisHospcode]),
                'al.f_drug_allergy_symtom_level_id as TYPEDX',
                'al.drug_allergy_symtom as SYMPTOM',
                'al.drug_allergy_record_date_time as D_UPDATE')
            .where('pt.patient_hn', hn);
    }

    getAppointment(db: Knex, visitNo: any, hospCode = hisHospcode) {
        return db('t_patient_appointment as a')
            .innerJoin('t_visit as v', 'a.t_visit_id', 'v.t_visit_id')
            .innerJoin('t_patient as pt', 'v.t_patient_id', 'pt.t_patient_id')
            .select(db.raw('? as hospcode', [hisHospcode]))
            .select('pt.patient_hn as hn', 'v.visit_vn as vn', 'a.patient_appointment_date as apdate',
                'a.patient_appointment_time as aptime', 'a.patient_appointment_clinic_description as department',
                'a.patient_appointment_notice as reason', 'a.patient_appointment_staff_record as dr')
            .where('v.visit_vn', visitNo)
            .limit(maxLimit);
    }

    async getReferHistory(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
        columnName = columnName === 'visitNo' ? 'v.visit_vn' : columnName;
        columnName = columnName === 'vn' ? 'v.visit_vn' : columnName;
        columnName = columnName === 'referNo' ? 'ro.visit_refer_out_number' : columnName;

        return db('t_visit_refer_out as ro')
            .innerJoin('t_visit as v', 'ro.t_visit_id', 'v.t_visit_id')
            .innerJoin('t_patient as pt', 'v.t_patient_id', 'pt.t_patient_id')
            .leftJoin('b_employee as dr', 'ro.visit_refer_out_staff_doctor', 'dr.b_employee_id')
            .select(db.raw('? as HOSPCODE', [hisHospcode]))
            .select('ro.visit_refer_out_number as REFERID',
                'pt.patient_hn as PID', 'pt.patient_pid as CID', 'v.visit_vn as SEQ', 'v.visit_vn as AN',
                'v.visit_begin_visit_time as DATETIME_SERV',
                'ro.visit_refer_out_date_time as DATETIME_REFER',
                'v.b_visit_clinic_id as CLINIC_REFER',
                'ro.visit_refer_out_off_id as HOSP_DESTINATION',
                'ro.f_visit_refer_out_emergency_type_id as EMERGENCY',
                'dr.employee_licenseno as provider',
                'ro.visit_refer_out_record_date_time as D_UPDATE')
            .where(columnName, searchNo)
            .whereNotNull('ro.visit_refer_out_off_id')
            .whereNot('ro.visit_refer_out_off_id', '');
    }



    async getClinicalRefer(db: Knex, referNo, hospCode = hisHospcode) {
        return db('t_visit_refer_out as ro')
            .leftJoin('t_visit as v', 'ro.t_visit_id', 'v.t_visit_id')
            .leftJoin('t_visit_vital_sign as vs', 'v.t_visit_id', 'vs.t_visit_id')
            .select(db.raw(`'${hisHospcode}' as hospcode`))
            .select('ro.visit_refer_out_number as refer_no', 'vs.visit_vital_sign_blood_presure as bp',
                'vs.visit_vital_sign_heart_rate as pr', 'vs.visit_vital_sign_respiratory_rate as rr',
                'vs.visit_vital_sign_temperature as temp')
            .where('ro.visit_refer_out_number', referNo)
            .limit(maxLimit);
    }

    async getInvestigationRefer(db: Knex, referNo, hospCode = hisHospcode) {
        return db('t_lab_result as lr')
            .innerJoin('t_lab_order as lo', 'lr.t_lab_order_id', 'lo.t_lab_order_id')
            .innerJoin('t_visit_refer_out as ro', 'lo.t_visit_id', 'ro.t_visit_id')
            .select(db.raw(`'${hisHospcode}' as hospcode`))
            .select('ro.visit_refer_out_number as refer_no', 'lr.lab_result_lab_test_description as investname',
                'lr.lab_result_lab_test_result as investvalue', 'lr.lab_result_lab_test_unit as unit')
            .where('ro.visit_refer_out_number', referNo)
            .limit(maxLimit);
    }

    async getCareRefer(db: Knex, referNo, hospCode = hisHospcode) {
        return db('t_visit_refer_out as ro')
            .select(db.raw(`'${hisHospcode}' as hospcode`))
            .select('ro.visit_refer_out_number as referid', 'ro.visit_refer_out_record_date_time as d_update')
            .where('ro.visit_refer_out_number', referNo);
    }

    getReferResult(db: Knex, visitDate: string, hospCode = hisHospcode) {
        visitDate = moment(visitDate).format('YYYY-MM-DD');
        return db('t_visit_refer_in as ri')
            .leftJoin('t_visit as v', 'ri.t_visit_id', 'v.t_visit_id')
            .leftJoin('t_patient as pt', 'v.t_patient_id', 'pt.t_patient_id')
            .select(db.raw(`'${hisHospcode}' as HOSPCODE`))
            .select('ri.visit_refer_in_off_id as HOSP_SOURCE',
                'pt.patient_pid as CID_IN',
                'pt.patient_hn as PID_IN', 'v.visit_vn as SEQ_IN', 'ri.visit_refer_in_number as REFERID',
                'v.visit_begin_visit_time as DATETIME_REFER', 'ri.visit_refer_in_icd10 as detail')
            .select(db.raw(`ri.visit_refer_in_number as REFERID_SOURCE`))
            .select(db.raw(`v.visit_begin_visit_time as DATETIME_IN, '1' as REFER_RESULT`))
            .select('v.visit_record_date_time as D_UPDATE')
            .whereRaw(`concat(to_number(substr(v.visit_begin_visit_time,1,4),'9999')-543 ,'-',substr(v.visit_begin_visit_time,6,5)) = ?`, [visitDate])
            .limit(maxLimit);
    }

    async getProvider(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
        columnName = columnName === 'licenseNo' ? 'employee_licenseno' : columnName;

        return db('b_employee')
            .select(db.raw(`'${hisHospcode}' as hospcode`))
            .select('b_employee_id as provider', 'employee_licenseno as registerno',
                'employee_firstname as name', 'employee_lastname as lname')
            .where(columnName, searchNo)
            .limit(maxLimit);
    }

    getProviderDr(db: Knex, drList: any[]) {
        return db('b_employee')
            .select(db.raw(`'${hisHospcode}' as hospcode`))
            .select('b_employee_id as provider', 'employee_licenseno as registerno',
                'employee_firstname as name', 'employee_lastname as lname')
            .whereIn('b_employee_id', drList);
    }

    getData(db: Knex, tableName, columnName, searchNo, hospCode = hisHospcode) {
        return db(tableName)
            .select(db.raw(`'${hisHospcode}' as hospcode`))
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }

    // Report Zone
    sumReferOut(db: Knex, dateStart: any, dateEnd: any) {
        return db('t_visit_refer_out as r')
            .select(db.raw(`concat(to_number(substr(r.visit_refer_out_date_time,1,4),'9999')-543 ,'-',substr(r.visit_refer_out_date_time,6,5)) as refer_date`))
            .count('r.t_visit_refer_out_id as cases')
            .whereBetween(<any>db.raw(`concat(to_number(substr(r.visit_refer_out_date_time,1,4),'9999')-543 ,'-',substr(r.visit_refer_out_date_time,6,5))`), [dateStart, dateEnd])
            .where('r.visit_refer_out_off_id', '!=', "")
            .whereNotNull('r.visit_refer_out_off_id')
            .where('r.visit_refer_out_off_id', '!=', hisHospcode)
            .groupByRaw(`concat(to_number(substr(r.visit_refer_out_date_time,1,4),'9999')-543 ,'-',substr(r.visit_refer_out_date_time,6,5))`)
            .orderBy('refer_date');
    }

    sumReferIn(db: Knex, dateStart: any, dateEnd: any) {
        return db('t_visit_refer_in as r')
            .select(db.raw(`concat(to_number(substr(r.visit_refer_in_date_time,1,4),'9999')-543 ,'-',substr(r.visit_refer_in_date_time,6,5)) as refer_date`))
            .count('r.t_visit_refer_in_id as cases')
            .whereBetween(<any>db.raw(`concat(to_number(substr(r.visit_refer_in_date_time,1,4),'9999')-543 ,'-',substr(r.visit_refer_in_date_time,6,5))`), [dateStart, dateEnd])
            .where('r.visit_refer_in_off_id', '!=', hisHospcode)
            .whereNotNull('r.visit_refer_in_off_id')
            .groupByRaw(`concat(to_number(substr(r.visit_refer_in_date_time,1,4),'9999')-543 ,'-',substr(r.visit_refer_in_date_time,6,5))`)
            .orderBy('refer_date');
    }
    concurrentIPDByWard(db: Knex, date: any) {
        let sql = db('t_visit as v')
            .leftJoin('b_visit_ward as ward', 'v.b_visit_ward_id', 'ward.b_visit_ward_id')
            .select('v.b_visit_ward_id as wardcode', 'ward.visit_ward_description as wardname',
                db.raw(`sum(case when concat(to_number(substr(v.visit_begin_visit_time,1,4),'9999')-543 ,'-',substr(v.visit_begin_visit_time,6,5)) = ? then 1 else 0 end) as new_case`, [date]),
                db.raw(`sum(case when concat(to_number(substr(v.visit_financial_discharge_time,1,4),'9999')-543 ,'-',substr(v.visit_financial_discharge_time,6,5)) = ? then 1 else 0 end) as discharge`, [date]),
                db.raw(`sum(case when v.f_visit_ipd_discharge_status_id IN ('8','9') then 1 else 0 end) as death`))
            .count('v.t_visit_id as cases')
            .whereRaw(`concat(to_number(substr(v.visit_begin_visit_time,1,4),'9999')-543 ,'-',substr(v.visit_begin_visit_time,6,5)) <= ?`, [date])
            .where('v.f_visit_type_id', '1')
            .andWhere(function () {
                this.whereNull('v.visit_financial_discharge_time').orWhereRaw(`concat(to_number(substr(v.visit_financial_discharge_time,1,4),'9999')-543 ,'-',substr(v.visit_financial_discharge_time,6,5)) >= ?`, [date]);
            });
        return sql.groupBy('v.b_visit_ward_id').orderBy('v.b_visit_ward_id');
    }
    concurrentIPDByClinic(db: Knex, date: any) {
        let sql = db('t_visit as v')
            .leftJoin('b_visit_clinic as clinic', 'v.b_visit_clinic_id', 'clinic.b_visit_clinic_id')
            .select('v.b_visit_clinic_id as cliniccode', 'clinic.visit_clinic_description as clinicname',
                db.raw(`sum(case when concat(to_number(substr(v.visit_begin_visit_time,1,4),'9999')-543 ,'-',substr(v.visit_begin_visit_time,6,5)) = ? then 1 else 0 end) as new_case`, [date]),
                db.raw(`sum(case when concat(to_number(substr(v.visit_financial_discharge_time,1,4),'9999')-543 ,'-',substr(v.visit_financial_discharge_time,6,5)) = ? then 1 else 0 end) as discharge`, [date]),
                db.raw(`sum(case when v.f_visit_ipd_discharge_status_id IN ('8','9') then 1 else 0 end) as death`))
            .count('v.t_visit_id as cases')
            .whereRaw(`concat(to_number(substr(v.visit_begin_visit_time,1,4),'9999')-543 ,'-',substr(v.visit_begin_visit_time,6,5)) <= ?`, [date])
            .where('v.f_visit_type_id', '1')
            .andWhere(function () {
                this.whereNull('v.visit_financial_discharge_time').orWhereRaw(`concat(to_number(substr(v.visit_financial_discharge_time,1,4),'9999')-543 ,'-',substr(v.visit_financial_discharge_time,6,5)) >= ?`, [date]);
            });
        return sql.groupBy('v.b_visit_clinic_id').orderBy('v.b_visit_clinic_id');
    }
    sumOpdVisitByClinic(db: Knex, date: any) {
        let sql = db('t_visit as v')
            .leftJoin('b_visit_clinic as clinic', 'v.b_visit_clinic_id', 'clinic.b_visit_clinic_id')
            .select(db.raw(`concat(to_number(substr(v.visit_begin_visit_time,1,4),'9999')-543 ,'-',substr(v.visit_begin_visit_time,6,5)) as date`),
                'v.b_visit_clinic_id as cliniccode',
                db.raw("SUM(CASE WHEN v.f_visit_type_id = '1' THEN 1 ELSE 0 END) AS admit"))
            .count('v.t_visit_id as cases')
            .whereRaw(`concat(to_number(substr(v.visit_begin_visit_time,1,4),'9999')-543 ,'-',substr(v.visit_begin_visit_time,6,5)) = ?`, [date]);
        return sql.groupBy('v.b_visit_clinic_id').orderBy('v.b_visit_clinic_id');
    }


    // ผ่านการ Verify แล้ว ==============================================

    // MOPH ERP
    getWard(db: Knex, wardCode: string = '', wardName: string = '') {
        let sql = db('b_visit_ward as ward');
        if (wardCode) {
            sql.where('visit_ward_number', wardCode);
        } else if (wardName) {
            sql.whereLike('visit_ward_description', `%${wardName}%`)
        }
        return sql
            .select('visit_ward_number as wardcode', 'visit_ward_description as wardname',
                'visit_ward_active as isactive')
            .orderBy('visit_ward_number')
            .limit(maxLimit);
    }

    countBedNo(db: Knex) {
        return db('b_visit_bed as bed').count('bed.bed_number as total_bed')
            .leftJoin('b_visit_ward as ward', 'bed.b_visit_ward_id', 'ward.b_visit_ward_id')
            .where({ 'bed.active': '1', 'ward.visit_ward_active': '1' }).first();
    }
    async getBedNo(db: Knex, bedno: any = null, start = -1, limit: number = 1000) {
        const clientType = ((db as any).client?.config?.client || '').toLowerCase();
        const createQueryConcat = (wardCode: string, bedNumber: string): any => {
            switch (clientType) {
                case 'pg':
                case 'postgres':
                case 'postgresql':
                    return db.raw(`${wardCode}::text || '-' || ${bedNumber}::text`);
                case 'mssql':
                    return db.raw(`CAST(${wardCode} AS VARCHAR) + '-' + CAST(${bedNumber} AS VARCHAR)`);
                case 'oracledb':
                    return db.raw(`${wardCode} || '-' || ${bedNumber}`);
                default:
                    return db.raw(`CONCAT(${wardCode}, '-', ${bedNumber})`);
            }
        };
        const BedNnumberSql = createQueryConcat('ward.visit_ward_number', 'bed.bed_number');
        let sql = db('b_visit_bed as bed')
            .leftJoin('b_visit_room as room', 'bed.b_visit_room_id', 'room.b_visit_room_id')
            .leftJoin('b_visit_ward as ward', 'bed.b_visit_ward_id', 'ward.b_visit_ward_id')
            .select('bed.bed_number', 'bed.active as isactive',
                db.raw(`${BedNnumberSql} as bedno`),
                'bed.b_visit_ward_id', 'ward.visit_ward_active',
                'ward.visit_ward_number as wardcode', 'ward.visit_ward_description as wardname',
                'room.room_number as roomno',
                db.raw(`
                        CASE 
                            WHEN LOWER(ward.visit_ward_description) LIKE '%icu%' OR LOWER(ward.visit_ward_description) LIKE '%ไอซียู%' THEN 'ICU'
                            WHEN LOWER(ward.visit_ward_description) LIKE '%ห้องคลอด%' OR LOWER(ward.visit_ward_description) LIKE '%รอคลอด%' THEN 'LR'
                            WHEN LOWER(ward.visit_ward_description) LIKE '%พิเศษ%' THEN 'S'
                            WHEN LOWER(ward.visit_ward_description) LIKE '%Home Ward%' THEN 'HW'
                            ELSE 'N'
                        END as bed_type
                    `)
            ).where({ 'bed.active': '1', 'ward.visit_ward_active': '1' })
        if (bedno) {
            sql = sql.where('bedno', bedno);
        }
        if (start >= 0) {
            sql = sql.offset(start).limit(limit);
        }
        return sql.orderBy('bedno');
    }
    async getVisitForMophAlert(db: Knex, date: any, isRowCount: boolean = false, limit: number = 1000, start = -1) {
        try {
            date = moment(date).locale('TH').format('YYYY-MM-DD');
            if (isRowCount) {
                const result = await db('t_visit')
                    .whereRaw(`concat(to_number(substr(visit_begin_visit_time,1,4),'9999')-543 ,'-',substr(visit_begin_visit_time,6,5)) = ?`, [date])
                    .count('t_visit_id as row_count').first();
                return result;
            } else {
                let sql = db('t_visit as v')
                    .leftJoin('t_patient as p', 'v.t_patient_id', 'p.t_patient_id')
                    .leftJoin('b_visit_clinic as c', 'v.b_visit_clinic_id', 'c.b_visit_clinic_id')
                    .select('p.patient_hn as hn', 'v.visit_vn as vn', 'p.patient_pid as cid',
                        db.raw(`? as department_type`, ['OPD']),
                        'v.b_visit_clinic_id as department_code',
                        'c.visit_clinic_description as department_name',
                        db.raw(`concat(to_number(substr(v.visit_begin_visit_time,1,4),'9999')-543 ,'-',substr(v.visit_begin_visit_time,6,5)) as date_service`),
                        db.raw(`substr(v.visit_begin_visit_time,12,8) as time_service`),
                        db.raw(`v.f_visit_opd_discharge_status_id as service_status`),
                        db.raw(`v.f_visit_opd_discharge_status_id as service_status_name`))
                    .whereRaw(`concat(to_number(substr(v.visit_begin_visit_time,1,4),'9999')-543 ,'-',substr(v.visit_begin_visit_time,6,5)) = ?`, [date]);
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
