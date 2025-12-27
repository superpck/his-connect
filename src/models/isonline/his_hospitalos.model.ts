import { Knex } from 'knex';
const dbName = process.env.HIS_DB_NAME;
const maxLimit = 100;
let hospcode = process.env.HOSPCODE;

export class HisHospitalOsModel {
    // ✅ เรียกใช้: routes/isonline/his.ts (L146, L180)
    getTableName(knex: Knex) {
        return knex('information_schema.tables')
            .select('table_name')
            .where('table_catalog', '=', dbName);

    }

    // ✅ เรียกใช้: routes/isonline/his.ts (L118)
    async testConnect(db: Knex) {
        try {
            let result = await db('b_site').first();
            const hospname = result?.site_full_name || null;
            hospcode = result?.b_visit_office_id || hospcode;

            result = await db('t_patient').select('patient_hn').first();
            const connection = result && (result.patient_hn) ? true : false;

            let charset = '';
            const resultRaw = await db.raw(
                'SELECT pg_encoding_to_char(encoding) AS charset FROM pg_database LIMIT 1'
            );
            charset = resultRaw?.rows?.[0]?.charset || '';
            
            return { connection, hospname, charset };
        } catch (error) {
            throw new Error(error);
        }
    }

    // ✅ เรียกใช้: routes/isonline/his.ts (L199)
    // Columns based on column_description.md getPerson
    getPerson(knex: Knex, columnName, searchText) {
        columnName = columnName == 'hn' ? 'HN' : columnName;
        columnName = columnName == 'cid' ? 'CID' : columnName;
        return knex('his_connect.view_person')
            .select(
                knex.raw(`? as HOSPCODE`, [process.env.HOSPCODE || '']),
                'HID', 'CID', 'PRENAME', 'NAME', 'LNAME', 'HN', 'PID', 'SEX', 'BIRTH',
                'MSTATUS', 'FSTATUS', 'OCCUPATION_OLD', 'OCCUPATION_NEW',
                'RACE', 'NATION', 'RELIGION', 'EDUCATION',
                'FATHER', 'MOTHER', 'COUPLE', 'VSTATUS', 'MOVEIN',
                'DISCHARGE', 'DDISCHARGE', 'ABOGROUP', 'RHGROUP',
                'LABOR', 'PASSPORT', 'TYPEAREA', 'MOBILE', 'dead', 'D_UPDATE'
            )
            .where(columnName, "=", searchText)
            .orderBy('addcode');
    }

    // ✅ เรียกใช้: routes/isonline/his.ts (L218)
    // ใช้ view_opd_service - มี service_date computed column สำหรับ filter
    getOpdService(knex: Knex, hn, date, columnName = '', searchText = '') {
        columnName = columnName == 'visitNo' || columnName == 'vn' ? 'visit_vn' : columnName;
        
        let query = knex('his_connect.view_opd_service')
            .select(
                'hn', 'visitno', 'time', 'adate', 'bp_systolic', 'bp_diastolic', 'pr', 'rr',
                'hdate', 'htime', 'mooban', 'apointname', 'atumbon', 'aampur', 'aplace',
                'cause_t', 'eye', 'verbal', 'motor',
                'cause', 'apoint', 'injt', 'pmi', 'atohosp', 'airway',
                'risk1', 'risk2', 'risk3', 'risk4', 'blood', 'splintc', 'splint', 'iv',
                'disc_date_er', 'staer', 'staward'
            )
            .where('service_date', date);
        
        if (hn) query.where('hn', hn);
        if (columnName && searchText) query.where(columnName, searchText);
        
        return query.limit(maxLimit);
    }

    // ✅ เรียกใช้: routes/isonline/his.ts (L240)
    // Columns based on his_hosxpv4.model.ts getOpdServiceByVN
    // ใช้ view_opd_service - filter ด้วย visit_vn
    getOpdServiceByVN(db: Knex, vn: any) {
        let sql = db('his_connect.view_opd_service')
            .select(
                'hn', 'visitno', 'date', 'time',
                'clinic_local_code', 'clinic_local_name',
                'bp_systolic', 'bp_diastolic', 'pr', 'rr', 'hdate', 'htime',
                'gcs_e', 'gcs_v', 'gcs_m', 'eye', 'verbal', 'motor',
                'cause', 'apoint', 'injt', 'injp', 'airway',
                'risk1', 'risk2', 'risk3', 'risk4', 'blood', 'splintc', 'iv',
                'br1', 'br2', 'tinj', 'ais1', 'ais2',
                'disc_date_er', 'cause_t', 'wardcode', 'htohosp', 'diag1', 'diag2'
            );
        if (typeof vn === 'string') {
            sql.where('visit_vn', vn);
        } else {
            sql.whereIn('visit_vn', vn)
        };
        return sql.limit(maxLimit);
    }

    // ✅ เรียกใช้: routes/isonline/his.ts (L289)
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


    // ✅ เรียกใช้: routes/isonline/his.ts (L262)
    // Columns based on column_description.md getDiagnosisOpd
    getDiagnosisOpd(knex: Knex, visitno) {
        return knex('his_connect.view_diagnosis_opd')
            .select(
                knex.raw(`? as HOSPCODE`, [process.env.HOSPCODE || '']),
                'CID', 'PID', 'seq_id', 'SEQ', 'VN', 'DATE_SERV',
                'DIAGTYPE', 'DIAGCODE', 'CLINIC', 'PROVIDER', 'D_UPDATE'
            )
            .where('visit_vn', "=", visitno);
    }
    
    // ❌ ไม่พบการเรียกใช้งาน 2025-12-25
    /*
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
    */
    
}
