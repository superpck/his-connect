"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisInfodModel = void 0;
const moment = require("moment");
const dbName = process.env.HIS_DB_NAME;
const maxLimit = 100;
class HisInfodModel {
    getTableName(knex) {
        return knex('INFORMATION_SCHEMA.COLUMNS')
            .select('TABLE_NAME')
            .where('TABLE_CATALOG', '=', dbName);
    }
    async testConnect(db) {
        try {
            const result = await db('VW_IS_PERSON').select('hn')
                .orderBy('hn', 'desc').first();
            const connection = result && result?.hn ? true : false;
            return { connection };
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async getPerson(db, columnName, searchText) {
        columnName = columnName == 'hn' ? "ltrim(PT.hn)" : columnName;
        var sql = ` SELECT   NULL AS age, PS.CardID as cid, PT.hn, PTITLE.titleName AS prename 
                , PT.firstName as fname, PT.lastName as lname
                ,case when  PT.sex = 'ช' then 1
					when PT.sex ='ญ' then 2
					else '' end as sex
                , cast( cast(SUBSTRING(PT.birthDay, 1, 4) as int) - 543 as varchar(10))+'-'+SUBSTRING(PT.birthDay, 5, 2)+'-'+SUBSTRING(PT.birthDay, 7, 2)   dob
                , SUBSTRING(PT.birthDay, 7, 2) + '/' + SUBSTRING(PT.birthDay, 5, 2) + '/' + SUBSTRING(PT.birthDay, 1, 4) AS bday,
                PT.marital, PT.occupation, trim(PT.addr1) +' '+rtrim(PT.addr2) as address, PT.moo, PT.tambonCode, PT.regionCode, PT.areaCode 
                , PT.regionCode+PT.tambonCode  as addcode 
                FROM            dbo.PATIENT AS PT LEFT OUTER JOIN  
                dbo.PatSS AS PS ON PS.hn = PT.hn LEFT OUTER JOIN 
                dbo.PTITLE AS PTITLE ON PT.titleCode = PTITLE.titleCode 
                where ${columnName}='${searchText}' `;
        var result = await db.raw(sql);
        return [result[0]];
    }
    getOpdService(db, hn, date, columnName = '', searchText = '') {
        date = (moment(date).get('year') + 543) + '' + moment(date).format("MMDD");
        return db('dbo.OPD_H AS OH')
            .leftOuterJoin(db.raw('dbo.Bill_h AS BH ON BH.hn = OH.hn AND BH.regNo = OH.regNo'))
            .leftOuterJoin('dbo.PATIENT AS PT', 'PT.hn', 'OH.hn')
            .leftOuterJoin(db.raw('dbo.SSREGIST AS SS ON SS.hn = OH.hn AND SS.RegNo = OH.regNo'))
            .leftOuterJoin('dbo.HOSPCODE AS hos', 'BH.REFERIN', 'hos.OFF_ID')
            .leftOuterJoin('dbo.HOSPCODE AS hos2', 'BH.REFEROUT', 'hos2.OFF_ID')
            .select('OH.hn', 'OH.regNo', 'OH.registDate', 'OH.timePt AS TIME_SERV2')
            .select(db.raw(`CASE WHEN OH.regNo IS NULL THEN RIGHT(RTRIM(LTRIM(CAST(100000000 + CAST(OH.hn AS Int) AS Char))), 7) + '0000' ELSE RIGHT(RTRIM(LTRIM(CAST(100000000 + CAST(OH.hn AS Int) AS Char))), 7) 
            + OH.regNo END AS SEQ`))
            .select(db.raw(`CASE WHEN OH.regNo IS NULL THEN RIGHT(RTRIM(LTRIM(CAST(100000000 + CAST(OH.hn AS Int) AS Char))), 7) + '0000' ELSE RIGHT(RTRIM(LTRIM(CAST(100000000 + CAST(OH.hn AS Int) AS Char))), 7) 
            + OH.regNo END AS visitno`))
            .select(db.raw(`CAST(CAST(SUBSTRING(OH.registDate, 1, 4) AS int) - 543 AS varchar(10)) +'-'+SUBSTRING(OH.registDate, 5, 2)+'-'+ SUBSTRING(OH.registDate, 7, 2) AS DATE_SERV`))
            .select(db.raw(`left(OH.timePt,2)+':'+right(OH.timePt,2) as TIME_SERV`))
            .select('BH.REFERIN', 'BH.TFReasonIn AS CAUSEIN', 'BH.REFEROUT', 'BH.TFReasonOut AS CAUSEOUT', 'SS.Weight', 'SS.Height', 'SS.Lbloodpress AS SBP', 'SS.Hbloodpress AS DBP', 'SS.Temperature AS BTEMP', 'SS.Pulse AS PR', 'SS.Breathe AS RR', 'hos.CHANGWAT AS chwin', 'hos2.CHANGWAT AS chwout')
            .whereRaw(`OH.hn ='${hn}' and OH.registDate='${date}'`);
    }
    getDiagnosisOpd(db, visitno) {
        var Hn = +(visitno.substring(0, 7));
        var regNo = visitno.substring(7);
        return db('dbo.PATDIAG')
            .select('Hn as hn', 'regNo', 'VisitDate', 'DiagDate', 'DocCode', 'DiagType', 'dxtype as diag_type', 'deptCode', 'pt_status', 'rxNo', 'DiagNo')
            .select(db.raw('rtrim(ICDCode) as diagcode'))
            .select(db.raw(`CASE WHEN regNo IS NULL THEN RIGHT(RTRIM(LTRIM(CAST(100000000 + CAST(Hn AS Int) AS Char))), 7) + '0000' ELSE RIGHT(RTRIM(LTRIM(CAST(100000000 + CAST(Hn AS Int) AS Char))), 7) 
            + regNo END AS visitno`))
            .where({ Hn, regNo });
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
exports.HisInfodModel = HisInfodModel;
