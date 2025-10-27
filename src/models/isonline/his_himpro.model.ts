import { Knex } from 'knex';
import * as moment from 'moment';
const dbName = process.env.HIS_DB_NAME;
const maxLimit = 250;

export class HisHimproModel {
    async testConnect(db: Knex) {
        try {
            const result = await db('patient').select('hn')
                .orderBy('hn', 'desc').first();
            const connection = result && result?.hn ? true : false;
            return { connection };
        } catch (error) {
            throw new Error(error);
        }
    }

    getTableName(knex: Knex) {
        return knex('information_schema.tables')
            .select('table_name')
            .where('table_schema', '=', dbName);
    }

    getPerson(knex: Knex, columnName, searchText) {
        return knex('hospdata.patient')
            .select('hn', 'no_card as cid', 'title as prename',
                'name as fname', 'surname as lname',
                'birth as dob', 'sex', 'address', 'moo', 'road',
                'add as addcode', 'tel', 'zip', 'occupa as occupation')
            .where(columnName, "=", searchText);
    }

    getOpdService(db: Knex, hn, date, columnName = '', searchText = '') {
        columnName = columnName == 'visitNo' ? 'vn' : columnName;
        let where: any = {};
        if (hn) where['hn'] = hn;
        if (date) where['date'] = date;
        if (columnName && searchText) where[columnName] = searchText;
        return db('view_opd_visit')
            .select('hn', 'vn as visitno', 'date', 'time',
                'bp as bp_systolic', 'bp1 as bp_diastolic',
                'puls as pr', 'rr')
            .where(where)
            .orderBy('date', 'desc')
            .limit(maxLimit);
    }

    getDiagnosisOpd(knex, visitno) {
        return knex('opd_dx')
            .select('vn as visitno', 'diag as diagcode',
                'type as diag_type')
            .where('vn', "=", visitno);
    }

    getProcedureOpd(knex, columnName, searchNo, hospCode) {
        return knex('procedure_opd')
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
