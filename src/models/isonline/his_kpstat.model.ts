import { Knex } from 'knex';
import * as moment from 'moment';
const dbName = process.env.HIS_DB_NAME;

export class HisKpstatModel {
    getTableName(knex) {
        return knex('information_schema.tables')
            .select('TABLE_NAME')
            .where('TABLE_SCHEMA', '=', dbName);
    }

    testConnect(db: Knex) {
        return db('mrls.pt').select('hn').limit(1)
    }

    getPerson(knex, columnName, searchText) {
        columnName = columnName === 'cid' ? 'idpop' : columnName;
        return knex('mrls.pt')
            .select('hn', 'idpop as cid', 'pname as prename', 'fname', 'lname', 'brthdate as dob', 'mate as sex', 'addrpart as address', 'moopart as moo', 'road', 'soi', 'add as addcode', 'tel', 'zip', 'occptn as occupation')
            .where(columnName, "=", searchText);
    }
    getOpdService(knex, hn, date, columnName = '', searchText = '') {
        return knex('mrls.ovst')
            .select('hn', 'vstno as visitno', 'vstdate as date', 'vsttime as time', 'bp1 as bp_systolic', 'bp2 as bp_diastolic', 'puls as pr', 'rate as rr')
            .where('hn', "=", hn)
            .where('vstdate', "=", date);
    }
    getDiagnosisOpd(knex, visitno) {
        return knex('ovstdiag')
            .select('vstno as visitno', 'icd10 as diagcode', 'dxtype as diag_type')
            .where('vstno', "=", visitno);
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
