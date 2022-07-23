"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisPmkModel = void 0;
const dbClient = process.env.HIS_DB_CLIENT;
const dbName = process.env.HIS_DB_NAME;
const maxLimit = 500;
class HisPmkModel {
    getTableName(db) {
        if (dbClient === 'oracledb') {
            return db('ALL_TABLES')
                .where('OWNER', '=', dbName);
        }
        else {
            return db('information_schema.tables')
                .select('TABLE_NAME')
                .where('TABLE_SCHEMA', '=', dbName);
        }
    }
    testConnect(db) {
        return db('PATIENTS').select('HN as hn').limit(1);
    }
    getPerson(db, columnName, searchText) {
        columnName = columnName === 'hn' ? 'HN' : columnName;
        columnName = columnName === 'pid' ? 'HN' : columnName;
        columnName = columnName === 'cid' ? 'ID_CARD' : columnName;
        columnName = columnName === 'fname' ? 'NAME' : columnName;
        columnName = columnName === 'lname' ? 'SURNAME' : columnName;
        return db('PATIENTS')
            .select('RUN_HN', 'YEAR_HN')
            .select('HN as hn', 'ID_CARD as cid', 'PRENAME as prename', 'NAME as fname', 'SURNAME as lname', 'BIRTHDAY as dob')
            .select(db.raw(`case when SEX='F' then 2 else 1 end as sex`))
            .select('HOME as address', 'VILLAGE as moo', 'SOIMAIN as soi', 'ROAD as road')
            .select('TAMBON as addcode', 'TEL as tel', 'ZIP_CODE as zip')
            .select(db.raw(`'' as occupation`))
            .whereRaw(db.raw(` ${columnName}='${searchText}' `))
            .limit(maxLimit);
    }
    getOpdService(db, hn, date, columnName = '', searchText = '') {
        columnName = columnName == 'visitNo' || columnName == 'vn' ? 'OPD_NO' : columnName;
        let where = {};
        let cdate = '';
        if (date) {
            cdate = `OPD_DATE=TO_DATE('${date}', 'YYYY-MM-DD HH24:MI:SS')`;
        }
        if (hn) {
            const _hn = hn.split('/');
            where['PAT_RUN_HN'] = _hn[0];
            where['PAT_YEAR_HN'] = _hn[1];
        }
        if (columnName && searchText)
            where[columnName] = searchText;
        return db(`OPDS`)
            .select('PAT_RUN_HN as RUN_HN', 'PAT_YEAR_HN as YEAR_HN')
            .select(db.raw(`concat(concat(to_char(PAT_RUN_HN),'/'),to_char(PAT_YEAR_HN)) AS hn`))
            .select('OPD_NO as visitno', 'OPD_DATE as date')
            .select(db.raw(`TO_CHAR(DATE_CREATED, 'HH24:MI:SS') AS time`))
            .select('BP_SYSTOLIC as bp_systolic', 'BP_DIASTOLIC as bp_diastolic', 'BP_SYSTOLIC as bp1', 'BP_DIASTOLIC as bp2', 'PALSE as pr', 'RESPIRATORY_RATE as rr', 'WT_KG as weight', 'HEIGHT_CM as height', 'TEMP_C as tem')
            .where(where)
            .whereRaw(db.raw(cdate))
            .limit(maxLimit);
    }
    getDiagnosisOpd(db, visitno) {
        return db('OPDDIAGS')
            .select('PAT_RUN_HN as RUN_HN', 'PAT_YEAR_HN as YEAR_HN')
            .select(db.raw(`concat(concat(to_char(PAT_RUN_HN),'/'),to_char(PAT_YEAR_HN)) AS hn`))
            .select('OPD_OPD_NO as visitno', 'ICD_CODE as diagcode', 'TYPE as diag_type')
            .where('OPD_OPD_NO', "=", visitno);
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
    getDrugOpd(db, columnName, searchNo, hospCode) {
        return db('DOC_DRUG_REQUEST_HEADER as drug')
            .select('PAT_RUN_HN as RUN_HN', 'PAT_YEAR_HN as YEAR_HN')
            .select(db.raw(`concat(concat(to_char(PAT_RUN_HN),'/'),to_char(PAT_YEAR_HN)) AS hn`))
            .select('*')
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
exports.HisPmkModel = HisPmkModel;
