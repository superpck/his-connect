import Knex = require('knex');
import * as moment from 'moment';
const dbName = process.env.HIS_DB_NAME;

export class HisKpstatModel {
    getTableName(knex) {
        return knex
            .select('TABLE_NAME')
            .from('information_schema.tables')
            .where('TABLE_SCHEMA', '=', dbName);
    }

    testConnect(db: Knex) {
        return db('mrls.pt').select('hn').limit(1)
    }

    getPerson(knex, columnName, searchText) {
        columnName = columnName === 'cid' ? 'idpop' : columnName;
        return knex
            .select('hn', 'idpop as cid', 'pname as prename', 'fname', 'lname', 'brthdate as dob', 'mate as sex', 'addrpart as address', 'moopart as moo', 'road', 'soi', 'add as addcode', 'tel', 'zip', 'occptn as occupation')
            .from('mrls.pt')
            .where(columnName, "=", searchText);
    }
    getOpdService(knex, hn, date, columnName = '', searchText = '') {
        return knex
            .select('hn', 'vstno as visitno', 'vstdate as date', 'vsttime as time', 'bp1 as bp_systolic', 'bp2 as bp_diastolic', 'puls as pr', 'rate as rr')
            .from('mrls.ovst')
            .where('hn', "=", hn)
            .where('vstdate', "=", date);
    }
    getDiagnosisOpd(knex, visitno) {
        return knex
            .select('vstno as visitno', 'icd10 as diagcode', 'dxtype as diag_type')
            .from('ovstdiag')
            .where('vstno', "=", visitno);
    }
    getProcedureOpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('procedure_opd')
            .where(columnName, "=", searchNo);
    }
    getChargeOpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('charge_opd')
            .where(columnName, "=", searchNo);
    }
    getDrugOpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('drug_opd')
            .where(columnName, "=", searchNo);
    }
    getAdmission(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('admission')
            .where(columnName, "=", searchNo);
    }
    getDiagnosisIpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('diagnosis_ipd')
            .where(columnName, "=", searchNo);
    }
    getProcedureIpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('procedure_ipd')
            .where(columnName, "=", searchNo);
    }
    getChargeIpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('charge_ipd')
            .where(columnName, "=", searchNo);
    }
    getDrugIpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('drug_ipd')
            .where(columnName, "=", searchNo);
    }
    getAccident(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('accident')
            .where(columnName, "=", searchNo);
    }
    getAppointment(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('appointment')
            .where(columnName, "=", searchNo);
    }
    getData(knex, tableName, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from(tableName)
            .where(columnName, "=", searchNo)
            .limit(5000);
    }
}
