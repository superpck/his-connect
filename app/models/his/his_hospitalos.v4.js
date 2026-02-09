"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisHospitalOsV4Model = void 0;
const moment = require("moment-timezone");
const dbName = process.env.HIS_DB_NAME;
const maxLimit = 250;
let hisHospcode = process.env.HOSPCODE;
class HisHospitalOsV4Model {
    constructor() {
    }
    async tableExist(db, tableName, dbName = '') {
        if (dbName) {
            return await db.schema
                .withSchema(dbName)
                .hasTable(tableName);
        }
        else {
            return await db.schema.hasTable(tableName);
        }
    }
    async columnExist(db, columnName, tableName, dbName = '') {
        if (!columnName || !tableName) {
            throw new Error('Invalid parameters: columnName and tableName are required');
        }
        const client = (db.client?.config?.client || '').toString().toLowerCase();
        const connection = db.client?.config?.connection || {};
        const database = dbName || connection.database || connection.dbname || process.env.HIS_DB_NAME;
        const schema = dbName || connection.schema || process.env.HIS_DB_SCHEMA || (client.includes('mssql') ? 'dbo' : 'public');
        if (client.includes('mysql')) {
            const result = await db('information_schema.columns')
                .where({ table_schema: database, table_name: tableName, column_name: columnName })
                .count('* as total');
            return Number(result?.[0]?.total || 0) > 0;
        }
        if (client.includes('pg')) {
            const result = await db('information_schema.columns')
                .where({ table_schema: schema, table_name: tableName, column_name: columnName })
                .count('* as total');
            return Number(result?.[0]?.total || 0) > 0;
        }
        if (client.includes('mssql') || client.includes('sqlserver')) {
            const result = await db('information_schema.columns')
                .where({ table_catalog: database, table_schema: schema, table_name: tableName, column_name: columnName })
                .count('* as total');
            return Number(result?.[0]?.total || 0) > 0;
        }
        if (dbName) {
            return await db.schema.withSchema(dbName).hasColumn(tableName, columnName);
        }
        return await db.schema.hasColumn(tableName, columnName);
    }
    check() {
        return true;
    }
    getTableName(db) {
        return db('information_schema.tables')
            .select('table_name')
            .where('table_catalog', '=', dbName);
    }
    async testConnect(db) {
        let patientTable = 't_patient';
        if (!(await this.tableExist(db, 't_person'))) {
            patientTable = 't_person';
        }
        console.log(`nRefer: Testing DB connection... from ${patientTable}`);
        return await db(patientTable).select('patient_hn').limit(1);
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
        const columnExist = await this.columnExist(db, 'std_code', 'b_visit_bed');
        if (!columnExist) {
            return { status: 500, message: 'not found std_code column in b_visit_bed table' };
        }
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
        const admitLimit = moment.tz(date, tz)
            .locale('TH')
            .subtract(6, 'months')
            .format('YYYY-MM-DD HH:mm:ss');
        let query = ` SELECT ? as hospcode,ward.visit_ward_number AS wardcode,
                ward.visit_ward_description AS wardname,
                COUNT(*)::integer as cases,
                SUM(case when t_visit.visit_begin_admit_date_time between ? and ? then 1 else 0 end)::integer as new_case,
                SUM(case when t_visit.visit_ipd_discharge_date_time between ? and ? then 1 else 0 end)::integer as discharge,
                SUM(case when substring(bed.std_code,4,1)::text not in ('2','3','4','5') and  substring(bed.std_code,4,3)::text not in ('606','607','608','609') then 1 else 0 end)::integer as normal,
                SUM(case when substring(bed.std_code,4,1)='2' then 1 else 0 end)::integer as icu,
                SUM(case when substring(bed.std_code,4,1)='3' then 1 else 0 end)::integer as semi,
                SUM(case when substring(bed.std_code,4,1)='4' then 1 else 0 end)::integer as stroke,
                SUM(case when substring(bed.std_code,4,1)='5' then 1 else 0 end)::integer as burn,
                SUM(case when substring(bed.std_code,4,3)='606' then 1 else 0 end)::integer as special,
                SUM(case when substring(bed.std_code,4,3)='607' then 1 else 0 end)::integer as homeward,
                SUM(case when substring(bed.std_code,4,3)='608' then 1 else 0 end)::integer as lr,
                SUM(case when substring(bed.std_code,4,3)='609' then 1 else 0 end)::integer as clip
            FROM t_visit
                LEFT JOIN b_visit_ward ward ON t_visit.b_visit_ward_id::text = ward.b_visit_ward_id::text
                LEFT JOIN b_visit_room room ON t_visit.b_visit_room_id::text = room.b_visit_room_id::text
                LEFT JOIN b_visit_bed bed on ward.b_visit_ward_id::text =bed.b_visit_ward_id::text and t_visit.visit_bed = bed.b_visit_bed_id 
                LEFT JOIN b_visit_clinic clinic ON t_visit.b_visit_clinic_id::text = clinic.b_visit_clinic_id::text
            WHERE t_visit.f_visit_status_id::text <> '4'::text AND t_visit.f_visit_type_id::text = '1'::text
            and (t_visit.visit_ipd_discharge_date_time is null or t_visit.visit_ipd_discharge_date_time >=?)
            and t_visit.visit_begin_admit_date_time between ? and ?
            group by ward.visit_ward_number,  ward.visit_ward_description
            `;
        const result = await db.raw(query, [hisHospcode, dateStart, dateEnd, dateStart, dateEnd, dateEnd, admitLimit, dateEnd]);
        const rows = result.rows.map((row) => {
            row.normal = parseInt(row.cases) -
                (parseInt(row.icu) + parseInt(row.semi) + parseInt(row.stroke) + parseInt(row.burn) + parseInt(row.special) + parseInt(row.homeward) + parseInt(row.lr) + parseInt(row.clip));
            return row;
        });
        return rows;
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
    async getWard_(db, wardCode = '', wardName = '') {
        const result = await db.raw('SELECT * FROM his_connect.fn_get_ward(?, ?, ?, ?)', [wardCode || null, wardName || null, hisHospcode, maxLimit]);
        return result.rows;
    }
    async getWard(db, wardCode = '', wardName = '') {
        const columnExist = await this.columnExist(db, 'std_code', 'b_visit_bed');
        if (!columnExist) {
            return { status: 500, message: 'not found std_code column in b_visit_bed table' };
        }
        let sql = `select ? as hospcode, b_visit_bed.b_visit_ward_id, b_visit_ward.visit_ward_number as wardcode,
                b_visit_ward.visit_ward_description as wardname, count(*) as bed_count 
                , sum(case when substring(b_visit_bed.std_code,4,3)='603' then 1 else 0 end) as bed_extra
                , sum(case when substring(b_visit_bed.std_code,4,3)='607' then 1 else 0 end) as homeward
                , sum(case when substring(b_visit_bed.std_code,4,3)='604' then 1 else 0 end) as bed_minithanyaruk
                , sum(case when substring(b_visit_bed.std_code,4,3) in ('601','602') then 1 else 0 end) as imc
                , sum(case when substring(b_visit_bed.std_code,4,1)='2' then 1 else 0 end) as bed_icu
                , sum(case when substring(b_visit_bed.std_code,4,1)='3' then 1 else 0 end) as bed_semi
                , sum(case when substring(b_visit_bed.std_code,4,1)='4' then 1 else 0 end) as bed_stroke
                , sum(case when substring(b_visit_bed.std_code,4,1)='5' then 1 else 0 end) as bed_burn
                , sum(case when substring(b_visit_bed.std_code,4,3)='606' then 1 else 0 end) as bed_special
                , sum(case when substring(b_visit_bed.std_code,4,3)='608' then 1 else 0 end) as lr
                , sum(case when substring(b_visit_bed.std_code,4,3)='609' then 1 else 0 end) as clip
                , sum(case when substring(b_visit_bed.std_code,4,1)='7' then 1 else 0 end) as bed_negative
                , b_visit_ward.visit_ward_active as isactive
            from b_visit_bed
                inner join b_visit_ward on b_visit_bed.b_visit_ward_id=b_visit_ward.b_visit_ward_id
            where b_visit_bed.active = '1' and b_visit_ward.visit_ward_active ='1'
            group by b_visit_bed.b_visit_ward_id, b_visit_ward.visit_ward_number, b_visit_ward.visit_ward_description
            `;
        const result = await db.raw(sql, [hisHospcode]);
        let rows = result.rows.map((row) => {
            row.bed_normal = parseInt(row.bed_count) -
                (parseInt(row.bed_icu) + parseInt(row.bed_semi) + parseInt(row.bed_stroke) + parseInt(row.bed_burn) + parseInt(row.bed_special) + parseInt(row.homeward) + parseInt(row.lr) + parseInt(row.clip) + parseInt(row.bed_extra));
            return row;
        });
        return rows;
    }
    async countBedNo(db) {
        const result = await db.raw('SELECT * FROM his_connect.fn_count_bed_no()');
        return result.rows?.[0] || { total_bed: 0 };
    }
    async getBedNo(db, bedno = null, start = -1, limit = 1000) {
        const result = await db.raw('SELECT * FROM his_connect.fn_get_bed_no(?, ?, ?, ?)', [bedno || null, hisHospcode, start, limit]);
        return result.rows;
    }
    async getVisitForMophAlert(db, date, isRowCount, limit = 1000, start = -1) {
        let patientTable = 't_patient';
        if (!(await this.tableExist(db, 't_person'))) {
            patientTable = 't_person';
        }
        try {
            const dateStr = moment(date).format("YYYY-MM-DD");
            let query = db("t_visit as v")
                .innerJoin(`${patientTable} as pt`, "v.t_patient_id", "pt.t_patient_id")
                .whereRaw("(substr(v.visit_begin_visit_time, 1, 4)::numeric - 543 || substr(v.visit_begin_visit_time, 5, 6)) = ?", [dateStr])
                .andWhere("v.f_visit_status_id", "3");
            if (isRowCount) {
                const result = await query.count("v.t_visit_id as row_count").first();
                return result;
            }
            else {
                query
                    .leftJoin("b_service_point as sp", "v.b_service_point_id", "sp.b_service_point_id")
                    .leftJoin("f_visit_opd_discharge_status as s", "v.f_visit_opd_discharge_status_id", "s.f_visit_opd_discharge_status_id")
                    .select("pt.patient_hn as hn", "v.visit_vn as vn", "pt.patient_pid as cid", db.raw("'OPD' as department_type"), "sp.service_point_number as department_code", "sp.service_point_description as department_name", db.raw("(substr(v.visit_begin_visit_time, 1, 4)::numeric - 543 || substr(v.visit_begin_visit_time, 5, 6))::date as date_service"), db.raw("substr(v.visit_begin_visit_time, 11, 6)::time as time_service"), "s.visit_opd_discharge_status_description as service_status", "s.visit_opd_discharge_status_description as service_status_name")
                    .where((builder) => {
                    builder.where("s.visit_opd_discharge_status_description", "like", "%ตรวจและกลับบ้าน%")
                        .orWhere("s.visit_opd_discharge_status_description", "like", "%รอรับยา%")
                        .orWhere("s.visit_opd_discharge_status_description", "like", "%จำหน่าย%")
                        .orWhere("s.visit_opd_discharge_status_description", "like", "%Refer%")
                        .orWhere("s.visit_opd_discharge_status_description", "like", "%เสร็จสิ้น%");
                });
                if (start >= 0) {
                    query.offset(start).limit(limit);
                }
                else {
                    query.limit(limit);
                }
                const rows = await query;
                return rows;
            }
        }
        catch (err) {
            console.error("Error in getVisitForMophAlert:", err);
            throw err;
        }
    }
}
exports.HisHospitalOsV4Model = HisHospitalOsV4Model;
