import { Knex } from 'knex';
import * as moment from 'moment';
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
    // ใช้ fn_get_person_model
    async getPerson(knex: Knex, columnName, searchText) {
        if (!columnName || !searchText) {
            throw new Error('Invalid parameters: columnName and searchText are required');
        }
        const result = await knex.raw(
            'SELECT * FROM his_connect.fn_get_person_model(?, ?)',
            [columnName, searchText]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/isonline/his.ts (L218)
    // ใช้ fn_get_opd_service_model
    async getOpdService(knex: Knex, hn, date, columnName = '', searchText = '') {
        if (!date) {
            throw new Error('Invalid parameters: date is required');
        }
        const formattedDate = moment(date).locale('TH').format('YYYY-MM-DD');
        const result = await knex.raw(
            'SELECT * FROM his_connect.fn_get_opd_service_model(?, ?, ?, ?, ?)',
            [hn || null, formattedDate, columnName || null, searchText || null, maxLimit]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/isonline/his.ts (L240)
    // ใช้ fn_get_opd_service_by_vn_model
    async getOpdServiceByVN(db: Knex, vn: any) {
        if (!vn) {
            throw new Error('Invalid parameters: vn is required');
        }
        const vnArray = typeof vn === 'string' ? [vn] : vn;
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_opd_service_by_vn_model(?, ?)',
            [vnArray, maxLimit]
        );
        return result.rows;
    }

    // ✅ เรียกใช้: routes/isonline/his.ts (L289)
    // ใช้ fn_get_diagnosis_opd_vwxy_model
    async getDiagnosisOpdVWXY(db: Knex, date: any) {
        if (!date) {
            throw new Error('Invalid parameters: date is required');
        }
        const formattedDate = moment(date).locale('TH').format('YYYY-MM-DD');
        const result = await db.raw(
            'SELECT * FROM his_connect.fn_get_diagnosis_opd_vwxy_model(?, ?)',
            [formattedDate, maxLimit]
        );
        return result.rows;
    }


    // ✅ เรียกใช้: routes/isonline/his.ts (L262)
    // ใช้ fn_get_diagnosis_opd_model
    async getDiagnosisOpd(knex: Knex, visitno) {
        if (!visitno) {
            throw new Error('Invalid parameters: visitno is required');
        }
        const result = await knex.raw(
            'SELECT * FROM his_connect.fn_get_diagnosis_opd_model(?)',
            [visitno]
        );
        return result.rows;
    }
    
    // ❌ ไม่พบการเรียกใช้งาน 2025-12-25
    getProcedureOpd(knex, columnName, searchNo, hospCode) {
        return [];
    }

    // ❌ ไม่พบการเรียกใช้งาน 2025-12-25
    getChargeOpd(knex, columnName, searchNo, hospCode) {
        return [];
    }

    // ❌ ไม่พบการเรียกใช้งาน 2025-12-25
    getDrugOpd(knex, columnName, searchNo, hospCode) {
        return [];
    }

    // ❌ ไม่พบการเรียกใช้งาน 2025-12-25
    getAdmission(knex, columnName, searchNo, hospCode) {
        return [];
    }

    // ❌ ไม่พบการเรียกใช้งาน 2025-12-25
    getDiagnosisIpd(knex, columnName, searchNo, hospCode) {
        return [];
    }

    // ❌ ไม่พบการเรียกใช้งาน 2025-12-25
    getProcedureIpd(knex, columnName, searchNo, hospCode) {
        return [];
    }

    // ❌ ไม่พบการเรียกใช้งาน 2025-12-25
    getChargeIpd(knex, columnName, searchNo, hospCode) {
        return [];
    }

    // ❌ ไม่พบการเรียกใช้งาน 2025-12-25
    getDrugIpd(knex, columnName, searchNo, hospCode) {
        return [];
    }

    // ❌ ไม่พบการเรียกใช้งาน 2025-12-25
    getAccident(knex, visitno) {
        return [];
    }

    // ❌ ไม่พบการเรียกใช้งาน 2025-12-25
    getAppointment(knex, columnName, searchNo, hospCode) {
        return [];
    }

    // ❌ ไม่พบการเรียกใช้งาน 2025-12-25
    getData(knex, tableName, columnName, searchNo, hospCode) {
        return knex(tableName)
            .where(columnName, "=", searchNo)
            .limit(5000);
    }
    
    
}
