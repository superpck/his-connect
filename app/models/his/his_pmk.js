"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisPmkModel = void 0;
const moment = require("moment");
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
const dbName = process.env.HIS_DB_NAME;
const dbClient = process.env.HIS_DB_CLIENT;
class HisPmkModel {
    getTableName(db) {
        if (dbClient === 'oracledb') {
            return db('ALL_TABLES')
                .where('OWNER', '=', dbName);
        }
        else {
            return db('information_schema.tables')
                .select('table_name')
                .where('table_schema', '=', dbName);
        }
    }
    testConnect(db) {
        return db('PATIENTS').select('HN').limit(1);
    }
    async getReferOut(db, date, hospCode = hcode) {
        date = moment(date).format('YYYY-MM-DD');
        let where = `REFER_IN_DATETIME BETWEEN TO_DATE('${date} 00:00:00', 'YYYY-MM-DD HH24:MI:SS') AND TO_DATE('${date} 23:59:59', 'YYYY-MM-DD HH24:MI:SS') AND "referout".REFERTYPE=2`;
        const result = await db('PATIENTS_REFER_HX as referout')
            .join('OPDS', 'referout.OPD_NO', 'OPDS.OPD_NO')
            .join('PATIENTS as patient', function () {
            this.on('OPDS.PAT_RUN_HN', '=', 'patient.RUN_HN')
                .andOn('OPDS.PAT_YEAR_HN', '=', 'patient.YEAR_HN');
        })
            .select(db.raw(`'${hospCode}' AS "HOSPCODE"`))
            .select(db.raw(`concat(concat(to_char(OPDS.PAT_RUN_HN),'/'),to_char(OPDS.PAT_YEAR_HN)) AS "hn"`))
            .select('referout.OPD_NO as seq', 'referout.REFER_NO as referid', 'referout.HOS_IN_CARD as hosp_destination', 'referout.REFER_IN_DATETIME as refer_date', 'patient.ID_CARD as cid', 'patient.PRENAME as prename', 'patient.NAME as fname', 'patient.SURNAME as lname', 'patient.BIRTHDAY as dob')
            .select(db.raw(`case when SEX='F' then 2 else 1 end as "sex"`))
            .whereRaw(db.raw(where));
        return result;
    }
    async getReferHistory(db, columnName, searchNo, hospCode = hcode) {
        let where = '';
        if (columnName == 'visitNo' || columnName == 'vn') {
            where = `"referout".OPD_NO='${searchNo}' AND "referout".REFERTYPE=2`;
        }
        else if (columnName == 'referNo' || columnName == 'referId') {
            where = `"referout".REFER_NO='${searchNo}' AND "referout".REFERTYPE=2`;
        }
        else if (columnName == 'date' || columnName == 'referDate') {
            const date = moment(searchNo).format('YYYY-MM-DD');
            where = `REFER_IN_DATETIME BETWEEN TO_DATE('${date} 00:00:00', 'YYYY-MM-DD HH24:MI:SS') AND TO_DATE('${date} 23:59:59', 'YYYY-MM-DD HH24:MI:SS') AND "referout".REFERTYPE=2`;
        }
        else {
            where = `"referout".${columnName}='${searchNo}' AND "referout".REFERTYPE=2`;
        }
        return db('PATIENTS_REFER_HX as referout')
            .join('OPDS', 'referout.OPD_NO', 'OPDS.OPD_NO')
            .join('PATIENTS as patient', function () {
            this.on('OPDS.PAT_RUN_HN', '=', 'patient.RUN_HN')
                .andOn('OPDS.PAT_YEAR_HN', '=', 'patient.YEAR_HN');
        })
            .select(db.raw(`'${hospCode}' AS "HOSPCODE"`))
            .select(db.raw(`concat(concat(to_char(OPDS.PAT_RUN_HN),'/'),to_char(OPDS.PAT_YEAR_HN)) AS "hn"`))
            .select('referout.OPD_NO as seq', 'referout.REFER_NO as referid', 'referout.HOS_IN_CARD as hosp_destination', 'referout.REFER_IN_DATETIME as refer_date', 'patient.ID_CARD as cid', 'patient.PRENAME as prename', 'patient.NAME as fname', 'patient.SURNAME as lname', 'patient.BIRTHDAY as dob')
            .select(db.raw(`case when SEX='F' then 2 else 1 end as "sex"`))
            .whereRaw(db.raw(where));
    }
    async getReferResult(db, date, hospCode = hcode) {
        return [];
    }
    getReferResult1(db, date, hospCode = hcode) {
        date = moment(date).format('YYYY-MM-DD');
        let where = `REFER_IN_DATETIME BETWEEN TO_DATE('${date} 00:00:00', 'YYYY-MM-DD HH24:MI:SS') AND TO_DATE('${date} 23:59:59', 'YYYY-MM-DD HH24:MI:SS') AND "referout".REFERTYPE=2`;
        return db('PATIENTS_REFER_HX as referout')
            .join('OPDS', 'referout.OPD_NO', 'OPDS.OPD_NO')
            .join('PATIENTS as patient', function () {
            this.on('OPDS.PAT_RUN_HN', '=', 'patient.RUN_HN')
                .andOn('OPDS.PAT_YEAR_HN', '=', 'patient.YEAR_HN');
        })
            .select(db.raw(`'${hospCode}' AS "HOSPCODE"`))
            .select(db.raw(`concat(concat(to_char(OPDS.PAT_RUN_HN),'/'),to_char(OPDS.PAT_YEAR_HN)) AS "hn"`))
            .select('referout.OPD_NO as seq', 'referout.REFER_NO as referid', 'referout.HOS_IN_CARD as hosp_destination', 'referout.REFER_IN_DATETIME as DATETIME_IN', 'patient.ID_CARD as cid', 'patient.PRENAME as prename', 'patient.NAME as fname', 'patient.SURNAME as lname', 'patient.BIRTHDAY as dob', 'REFER_IN_DATETIME as D_UPDATE')
            .select(db.raw(`case when SEX='F' then 2 else 1 end as "sex"`))
            .select(db.raw('1 as REFER_RESULT'))
            .whereRaw(db.raw(where))
            .limit(maxLimit);
        const a = db('view_opd_visit as visit')
            .select('visit.refer as HOSP_SOURCE', 'visit.refer_no as REFERID_SOURCE')
            .select(db.raw('concat(visit.refer,visit.refer_no) as REFERID_PROVINCE'))
            .select('visit.date as DATETIME_IN', 'visit.hn as PID_IN', 'visit.vn as SEQ_IN', 'visit.ipd_an as AN_IN', 'visit.no_card as CID_IN');
    }
    getPerson(db, columnName, searchText, hospCode = hcode) {
        let where = {};
        if (['hn', 'HN', 'pid', 'PID'].indexOf(columnName) >= 0) {
            const hn = searchText.split('/');
            where['RUN_HN'] = hn[0];
            where['YEAR_HN'] = hn[1];
        }
        else {
            columnName = columnName === 'cid' ? 'ID_CARD' : columnName;
            columnName = columnName === 'fname' ? 'NAME' : columnName;
            columnName = columnName === 'lname' ? 'SURNAME' : columnName;
            where[columnName] = searchText;
        }
        return db('PATIENTS')
            .select(db.raw(`'${hospCode}' AS "HOSPCODE"`))
            .select('RUN_HN', 'YEAR_HN')
            .select('HN as hn', 'ID_CARD as cid', 'PRENAME as prename', 'NAME as fname', 'SURNAME as lname', 'BIRTHDAY as dob')
            .select(db.raw(`case when SEX='F' then 2 else 1 end as sex`))
            .select('HOME as address', 'VILLAGE as moo', 'SOIMAIN as soi', 'ROAD as road')
            .select('TAMBON as addcode', 'TEL as tel', 'ZIP_CODE as zip')
            .select(db.raw(`'' as occupation`))
            .where(where)
            .limit(maxLimit);
    }
    getAddress(db, columnName, searchText, hospCode = hcode) {
        let where = '';
        if (['hn', 'HN', 'pid', 'PID'].indexOf(columnName) >= 0) {
            where = `HN='${searchText.trim()}'`;
        }
        else {
            columnName = columnName === 'cid' ? 'ID_CARD' : columnName;
            columnName = columnName === 'fname' ? 'NAME' : columnName;
            columnName = columnName === 'lname' ? 'SURNAME' : columnName;
            where = `${columnName}='${searchText.trim()}'`;
        }
        return db('PATIENTS as p')
            .select(db.raw(`'${hospCode}' AS "HOSPCODE"`))
            .select('HN as PID')
            .select(db.raw(`2 AS "ADDRESSTYPE"`))
            .select('HOME as HOUSENO', 'VILLAGE as VILLAGE', 'SOIMAIN', 'ROAD', 'TAMBON as addcode', 'TEL as TELEPHONE', 'MOBILE', 'ZIP_CODE as zip', 'LAST_OPD as D_UPDATE')
            .select(db.raw('substr(TAMBON,1,2) as CHANGWAT'))
            .select(db.raw('substr(TAMBON,3,2) as AMPUR'))
            .select(db.raw('substr(TAMBON,5,2) as TAMBON'))
            .whereRaw(where);
    }
    getService(db, columnName, searchText, hospCode = hcode) {
        columnName = columnName === 'date_serv' ? 'OPD_DATE' : columnName;
        let where = {};
        let cdate = '';
        if (columnName === 'date') {
            cdate = `OPD_DATE=TO_DATE('${searchText}', 'YYYY-MM-DD HH24:MI:SS')`;
        }
        else if (columnName === 'hn') {
            const _hn = searchText.split('/');
            where['PAT_RUN_HN'] = _hn[0];
            where['PAT_YEAR_HN'] = _hn[1];
        }
        else if (columnName === 'visitNo') {
            where['OPD_NO'] = searchText;
        }
        return db(`OPDS`)
            .select(db.raw(`'${hospCode}' AS "HOSPCODE"`))
            .select(db.raw(`concat(concat(to_char(OPDS.PAT_RUN_HN),'/'),to_char(OPDS.PAT_YEAR_HN)) AS "hn"`))
            .select('PAT_RUN_HN as RUN_HN', 'PAT_YEAR_HN as YEAR_HN')
            .select('OPD_NO as visitno', 'OPD_DATE as date', 'OPD_DATE as DATE_SERV')
            .select(db.raw(`TO_CHAR(DATE_CREATED, 'HH24:MI:SS') AS time`))
            .select('BP_SYSTOLIC as bp_systolic', 'BP_DIASTOLIC as bp_diastolic', 'BP_SYSTOLIC as bp1', 'BP_DIASTOLIC as bp2', 'PALSE as pr', 'RESPIRATORY_RATE as rr', 'WT_KG as weight', 'HEIGHT_CM as height', 'TEMP_C as tem')
            .where(where)
            .whereRaw(db.raw(cdate))
            .limit(maxLimit);
    }
    getDiagnosisOpd(db, visitno) {
        return db('OPDDIAGS')
            .join('OPDS', 'OPDDIAGS.OPD_OPD_NO', 'OPDS.OPD_NO')
            .join('PATIENTS as patient', function () {
            this.on('OPDDIAGS.PAT_RUN_HN', '=', 'patient.RUN_HN')
                .andOn('OPDDIAGS.PAT_YEAR_HN', '=', 'patient.YEAR_HN');
        })
            .select(db.raw(`'${hcode}' AS "HOSPCODE"`))
            .select('patient.HN as PID', 'OPDDIAGS.OPD_OPD_NO as SEQ', 'OPDDIAGS.ICD_CODE as DIAGCODE', 'OPDDIAGS.TYPE as DIAGTYPE', 'OPDDIAGS.DATE_CREATED as D_UPDATE', 'OPDDIAGS.OPD_DATE as DATE_SERV', 'patient.ID_CARD as CID', 'OPDS.DD_DOC_CODE as PROVIDER')
            .where('OPDDIAGS.OPD_OPD_NO', visitno + '');
    }
    async getProcedureOpd(db, visitNo, hospCode = hcode) {
        if (visitNo) {
            return db('EXP18_PROCED')
                .select('PCUCODE as HOSPCODE', 'HN as PID', 'SEQ', 'DATE_SERV', 'PROCED as PROCEDCODE', 'PROVIDER', 'CID', 'SERVPRIC as SERVICEPRICE', 'CLINIC', 'D_UPDATE')
                .where('SEQ', visitNo + '')
                .limit(maxLimit);
        }
        else {
            return [];
        }
    }
    getChargeOpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('charge_opd')
            .where(columnName, "=", searchNo);
    }
    async getDrugOpd(db, visitNo, hospCode = hcode) {
        if (visitNo) {
            const result = await db('H4U_DRUG as drug')
                .where("SEQ", visitNo + '');
            let data = [];
            for (let row of result) {
                const line = row.USAGE_LINE1 ? row.USAGE_LINE1.split('\r|\n') : [];
                await data.push({
                    HOSPCODE: hospCode,
                    PID: row.HN, SEQ: row.SEQ,
                    DATE_SERV: moment(row.DATE_SERV).format('YYYY-MM-DD') +
                        moment(row.TIME_SERV).format(' HH:mm:ss'),
                    AMOUNT: row.QTY, UNIT: row.UNIT,
                    drug_usage: line[1] + ' ' + line[2],
                    caution: line[3],
                    D_UPDATE: moment(row.DATE_SERV).format('YYYY-MM-DD') +
                        moment(row.TIME_SERV).format(' HH:mm:ss'),
                });
            }
            return data;
        }
        else {
            return [];
        }
    }
    getLabResult(db, columnName, searchNo, referID = '', hospCode = hcode) {
        return [];
    }
    getAdmission(knex, columnName, searchNo, hospCode) {
        return [];
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
    sumReferIn(db, dateStart, dateEnd) {
        return [];
    }
    countBedNo(db) {
        return { total_bed: 0 };
    }
    async getBedNo(db, bedno = null, start = -1, limit = 1000) {
        return [];
    }
    concurrentIPDByWard(db, date) {
        return [];
    }
    concurrentIPDByClinic(db, date) {
        return [];
    }
    sumOpdVisitByClinic(db, date) {
        return [];
    }
    getMophAlertOPDVisit(db, date) {
        return [];
    }
}
exports.HisPmkModel = HisPmkModel;
