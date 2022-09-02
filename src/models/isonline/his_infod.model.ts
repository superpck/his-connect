import Knex = require('knex');
import * as moment from 'moment';
const dbName = process.env.HIS_DB_NAME;
const maxLimit = 100;

export class HisInfodModel {
    getTableName(knex: Knex) {
        return knex
            .select('TABLE_NAME')
            .from('INFORMATION_SCHEMA.COLUMNS')
            .where('TABLE_CATALOG', '=', dbName);
    }
    
    testConnect(db: Knex) {
        return db('VW_IS_PERSON').select('hn').limit(1)
    }

    getPerson(knex: Knex, columnName, searchText) {
        columnName = columnName == 'hn' ? "ltrim(PT.hn)": columnName;
        
        var sql="SELECT   NULL AS age, PS.CardID, PT.hn, PTITLE.titleName AS titleCode "+
        ", PT.firstName, PT.lastName, PT.sex, PT.birthDay"+
        ", SUBSTRING(PT.birthDay, 7, 2) + '/' + SUBSTRING(PT.birthDay, 5, 2) + '/' + SUBSTRING(PT.birthDay, 1, 4) AS bday,"+
        "PT.marital, PT.occupation, PT.addr1, PT.addr2, PT.moo, PT.tambonCode, PT.regionCode, PT.areaCode"+
        " FROM            dbo.PATIENT AS PT LEFT OUTER JOIN  "+
       "dbo.PatSS AS PS ON PS.hn = PT.hn LEFT OUTER JOIN "+
       "dbo.PTITLE AS PTITLE ON PT.titleCode = PTITLE.titleCode " +
       ` where ${columnName}='${searchText}' ` ;

       var result = knex.raw(sql);
       return result[0];

        // return knex
        // .select()
        // .from('VW_IS_PERSON')       
        // .where(columnName, "=", searchText);
    }
    
    getOpdService(db: Knex, hn, date, columnName = '', searchText = '') {
        columnName = columnName == 'visitNo' || columnName == 'vn' ? 'visitno' : columnName;
        let where: any = {};
        if (hn) where['hn'] = hn;
        if (date) where['vstdate'] = date;
        if (columnName && searchText) where[columnName] = searchText;

        return db('getOpdService_isonline')
            .where(where)
            .orderBy('vstdate', 'desc')
            .limit(maxLimit);
    }

    getDiagnosisOpd(knex, visitno) {
        return knex
            .select('vn as visitno', 'diag as diagcode',
            'type as diag_type')
            .from('opd_dx')
            .where('vn', "=", visitno);
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
