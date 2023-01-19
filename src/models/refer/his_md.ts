import { Knex } from 'knex';
import * as moment from 'moment';
const maxLimit = 250;
const hcode = process.env.HOSPCODE;

export class HisMdModel {
    check() {
        return true;
    }

    getTableName(db: Knex, dbName = process.env.HIS_DB_NAME) {
        return db('information_schema.tables')
            .select('TABLE_NAME')
            .where('TABLE_SCHEMA', '=', dbName);
    }

    // select รายชื่อเพื่อแสดงทะเบียน
    async getReferOut(db: Knex, date, hospCode=hcode) {
            const sql=`select ${hcode} as hospcode,
            b.date_visit as refer_date,
            a.REFERID as referid,            
            a.HOSP_DESTINATION as hosp_destination,
            b.hn,c.cid,a.SEQ AS seq,"" as an,
            c.prename,c.name as fname,c.surname as lname,
            DATE_FORMAT(c.birthdate_sql, "%Y-%m-%d") as dob,c.sex,
            (SELECT d.icd10 FROM hos_doctor_diagnosis d WHERE d.visit_code=a.SEQ LIMIT 1) AS dx
            FROM 
            (hos_refer_history a INNER JOIN hos_pt_visit b ON a.SEQ =b.visit_code)
            LEFT JOIN hos_pt c ON b.hn=c.hn
            where b.date_visit="${date}"
            order by a.SEQ `;
            const result = await db.raw(sql);
            return result[0];
    }

//     async getReferOut(db: Knex, date, hospCode=hcode) {
//     const sql=`select ${hcode} as hospcode,
//     b.date_visit as refer_date,
//     a.refer_id as referid,            
//     a.refer as hosp_destination,
//     b.hn,c.cid,a.visit_code AS seq,"" as an,
//     c.prename,c.name as fname,c.surname as lname,
//     DATE_FORMAT(c.birthdate_sql, "%Y-%m-%d") as dob,c.sex,
//     (SELECT d.icd10 FROM hos_doctor_diagnosis d WHERE d.visit_code=a.visit_code LIMIT 1) AS dx
//     FROM 
//     (hos_refer a INNER JOIN hos_pt_visit b ON a.visit_code =b.visit_code)
//     LEFT JOIN hos_pt c ON b.hn=c.hn
// 		WHERE b.date_visit="${date}"
//     order by a.visit_code `;
//     const result = await db.raw(sql);
//         return result[0];
// }    

    // const sql=`select ${hcode} as hospcode,
    // b.date_visit as refer_date,
    // a.refer_id as referid,            
    // a.refer as hosp_destination,
    // b.hn,c.cid,a.visit_code AS seq,"" as an,
    // c.prename,c.name as fname,c.surname as lname,
    // DATE_FORMAT(c.birthdate_sql, "%Y-%m-%d") as dob,c.sex,
    // (SELECT d.icd10 FROM hos_doctor_diagnosis d WHERE d.visit_code=a.visit_code LIMIT 1) AS dx
    // FROM 
    // (hos_refer a INNER JOIN hos_pt_visit b ON a.visit_code =b.visit_code)
    // LEFT JOIN hos_pt c ON b.hn=c.hn
    // where b.date_visit="${date}"
    // order by a.visit_code `;

    async getPerson(db: Knex, columnName, searchText) {
        // columnName => cid, hn
        const sql = `
            select HOSPCODE,CID,PID,HID,PRENAME,NAME,LNAME,HN,SEX,BIRTH,MSTATUS,OCCUPATION_OLD,
            OCCUPATION_NEW,RACE,NATION,RELIGION,EDUCATION,FSTATUS,FATHER,MOTHER,COUPLE,
            VSTATUS,MOVEIN,DISCHARGE,DDISCHARGE,ABOGROUP,RHGROUP,LABOR,PASSPORT,TYPEAREA,D_UPDATE
            from f43_person a
            where ${columnName}="${searchText}" `;
        const result = await db.raw(sql);
        return result[0];
    }

    // async getAddress(db: Knex, columnName, searchNo,hospCode=hcode) {
    //     // columnName = columnName === 'cid' ? 'no_card' : columnName;
    //     const sql = `SELECT  ${hcode} AS hospcode,a.hn ,'1' AS addresstype,'' AS house_id,
    //     '9' AS housetype,'' AS roomno, '' AS condo,a.address AS houseno,
    //     '' AS soisub,'' AS soimain,a.road AS road,'' AS villaname,
    //     a.moo AS village ,a.tambon ,a.amphur AS ampur,
    //     a.province AS changwat,a.tel AS telephone,a.tel AS mobile
    //     FROM hos_pt a
    //     where ${columnName}="${searchNo}" `;
    //     const result = await db.raw(sql);
    //     return result[0];
    // }

    // async getService(db: Knex, columnName, searchText,hospCode=hcode) {
    //     // columnName = visitNo, hn
    //     const sql = `select ${hcode} AS hospcode,
    //     a.hn,a.visit_code as visitno,a.date_visit_sql as dateserv,
    //     SUBSTR(b.index_start,9,6) as time,SUBSTR(b.doctor_end,9,6) as time_end,
    //     a.pttype,'' as payment,'01' as clinic,a.doctor as dr,
    //     c.sys_bp as bp_systolic,c.dia_bp as bp_diastolic,c.pulse as pr,
    //     c.respire as rr,'' as fu,'' as result,'' as referin 
    //     FROM (hos_pt_visit a INNER JOIN hos_pt_visit_time b ON a.visit_code=b.visit_code)
    //     LEFT JOIN hos_pt_visit_vitalsign c ON a.visit_code=c.visit_code 
    //     where a.visit_code="${searchText}" `;
    //     const result = await db.raw(sql);
    //     return result[0];
    // }


    async getService(db, columnName, searchNo, hospCode=hcode) {      
        columnName = columnName === 'visitNo' ? 'seq' : columnName;
        const sql=`select HOSPCODE,PID,HN,SEQ,DATE_SERV,TIME_SERV,LOCATION,INTIME,INSTYPE,INSID,
        MAIN,TYPEIN,REFERINHOSP,CAUSEIN,CHIEFCOMP,SERVPLACE,BTEMP,SBP,
        DBP,PR,RR,TYPEOUT,REFEROUTHOSP,CAUSEOUT,COST,PRICE,PAYPRICE,ACTUALPAY,D_UPDATE FROM f43_service 
                    where ${columnName}="${searchNo}" `;
        const result = await db.raw(sql);
        return result[0];
    }
    
    async getDiagnosisOpd(db, visitNo, hospCode=hcode) {
        const sql=`select HOSPCODE,PID,SEQ,DATE_SERV,DIAGTYPE,DIAGCODE,CLINIC,PROVIDER,D_UPDATE 
                    FROM f43_diagnosis_opd where SEQ = "${visitNo}" `;
        const result = await db.raw(sql);
        return result[0];
    }
  
    async getProcedureOpd(db, visitno, hospCode=hcode) {
        //columnName = visitNo, hn
        const sql = `select ${hcode} AS hospcode,
        a.visit_code as vn,a.dateopd_sql as date,
        a.hn,a.icd9_code as op_code,b.name as op_name,a.icd9 as icdcm,a.doctor as dr   
        FROM hos_doctor_procedure a INNER JOIN hos_code_icd9 b ON a.icd9_code=b.code       
        where a.visit_code="${visitno}"`;
        const result = await db.raw(sql);
        return result[0];
    }

    getChargeOpd(db, visitNo, hospCode=hcode) {
        return db('view_opd_charge_item')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('vn', visitNo)
            .limit(maxLimit);
    }

    getLabRequest(db, columnName, searchNo, hospCode=hcode) {
        columnName = columnName === 'visitNo' ? 'vn' : columnName;
        return db('view_lab_request_item as lab')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('vn as visitno', 'lab.hn as hn', 'lab.an as an',
                'lab.lab_no as request_id',
                'lab.lab_code as lab_code',
                'lab.lab_name as lab_name',
                'lab.loinc as loinc',
                'lab.icdcm as icdcm',
                'lab.standard as cgd',
                'lab.cost as cost',
                'lab.lab_price as price',
                'lab.date as request_date')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }

    getLabResult(db, columnName, searchNo, hospCode=hcode) {
        columnName = columnName === 'visitNo' ? 'vn' : columnName;
        return db('view_lab_result')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }

    async getDrugOpd(db, seq, hospCode=hcode) {
        const sql=`select HOSPCODE,PID,SEQ,DATE_SERV,CLINIC,DIDSTD,DNAME,AMOUNT,UNIT,
        UNIT_PACKING,DRUGPRICE,DRUGCOST,PROVIDER,D_UPDATE FROM f43_drug_opd
            where SEQ = "${seq}" `;
        const result = await db.raw(sql);
        return result[0];
    }

    async getAdmission(db, columnName, searchNo, hospCode=hcode) {
        columnName = columnName === 'an' ? 'AN' : columnName;
        columnName = columnName === 'pid' ? 'PID' : columnName;
        columnName = columnName === 'visitNo' ? 'SEQ' : columnName;
        const sql=`select  
        HOSPCODE,PID,SEQ,AN,DATETIME_ADMIT,WARDADMIT,INSTYPE,TYPEIN,REFERINHOSP,
CAUSEIN,ADMITWEIGHT,ADMITHEIGHT,DATETIME_DISCH,WARDDISCH,DISCHSTATUS,
DISCHTYPE,REFEROUTHOSP,CAUSEOUT,COST,PRICE,PAYPRICE,ACTUALPAY,PROVIDER,D_UPDATE 
        from f43_admission 
            where ${columnName}="${searchNo}" `;
        const result = await db.raw(sql);
        return result[0];
    }

    async getDiagnosisIpd(db: Knex, an, hospCode=hcode) {
        const sql=`select  
        HOSPCODE,PID,AN,DATETIME_ADMIT,WARDDIAG,DIAGTYPE,DIAGCODE,PROVIDER,D_UPDATE
        from f43_diagnosis_ipd 
                    where AN = "${an}" `;
        const result = await db.raw(sql);
        return result[0];
    }

    getProcedureIpd(db, an, hospCode = hcode) {
        return db('view_ipd_op as op')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('hn as pid', 'an')
            .select(db.raw('concat(admite, " " , time) as datetime_admit'))
            .select('clinic_std as wardstay', 'op as procedcode',
                'dr as provider',
                'cid', 'lastupdate as d_update')
            .where('an', an)
            .limit(maxLimit);
    }

    getChargeIpd(db, an, hospCode = hcode) {
        return db('charge_ipd')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('an', "=", an)
            .limit(maxLimit);
    }

    async getDrugIpd(db, an, hospCode=hcode) {
        const sql=`select  
        HOSPCODE,PID,AN,DATETIME_ADMIT,WARDSTAY,TYPEDRUG,DIDSTD,DNAME,
DATESTART,DATEFINISH,AMOUNT,UNIT,UNIT_PACKING,DRUGPRICE,DRUGCOST,PROVIDER,D_UPDATE
        from f43_drug_ipd 
        where AN = "${an}" `;
        const result = await db.raw(sql);
        return result[0];
    }

    getAccident(db, visitNo, hospCode=hcode) {
        return db('accident')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('vn', visitNo)
            .limit(maxLimit);
    }

    getDrugAllergy(db, hn, hospCode=hcode) {
        return db('view_drug_allergy')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('hn', hn)
            .limit(maxLimit);
    }

    getAppointment(db, visitNo, hospCode=hcode) {
        return db('view_opd_fu')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('vn', "=", visitNo)
            .limit(maxLimit);
    }

    async getReferHistory(db: Knex, columnName, searchNo, hospCode=hcode) {
        //columnName = visitNo, referNo
        columnName = columnName === 'visitNo' ? 'a.SEQ' : columnName;
        columnName = columnName === 'referNo' ? 'a.REFERID' : columnName;
    const sql = `
        SELECT  '${hcode}'  as hospcode,a.REFERID as referid,' ' as referid_province,
        a.PID as pid,a.SEQ as seq,a.AN as an,a.REFERID_ORIGIN as referid_origin,
        a.HOSPCODE_ORIGIN as hospcode_origin,DATE_FORMAT(a.SEQ, '%Y-%m-%d %H:%i:%s') as datetime_serv, 
        '' as datetime_admit,
        DATE_FORMAT(a.SEQ, '%Y-%m-%d %H:%i:%s') as datetime_refer,'' as clinic_refer,
        a.HOSP_DESTINATION as hosp_destination,
        '' as chiefcomp,'' as physicalexam,'' as diagfirst,
        '' as diaglast,'' as pstatus,'' as ptype, IF(a.EMERGENCY='','2',a.EMERGENCY) as emergency,
        '' as ptypedis,'' as causeout,'' as request,'' AS provider,
        '' as d_update
        FROM hos_refer_history a 
                    where
                ${columnName}="${searchNo}"
            `;
        const result = await db.raw(sql);
        return result[0];
    }


    getClinicalRefer(db, referNo, hospCode=hcode) {
        return db('view_clinical_refer')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }

    getInvestigationRefer(db, referNo, hospCode=hcode) {
        return db('view_investigation_refer')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }

    getCareRefer(db, referNo, hospCode=hcode) {
        return db('view_care_refer')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }

    getReferResult(db, hospDestination, referNo, hospCode=hcode) {
        return [];
    }

    getData(db, tableName, columnName, searchNo, hospCode=hcode) {
        return db(tableName)
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
}
