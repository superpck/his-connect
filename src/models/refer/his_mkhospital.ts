import { Knex } from 'knex';
import * as moment from 'moment';
const maxLimit = 250;
const hcode = process.env.HOSPCODE;

export class HisMkhospitalModel {
    check() {
        return true;
    }

    getTableName(db: Knex, dbName = process.env.HIS_DB_NAME) {
        return db('information_schema.tables')
            .select('TABLE_NAME')
            .where('TABLE_SCHEMA', '=', dbName);
    }

    // select รายชื่อเพื่อแสดงทะเบียน
    //** แห้ม rferout */
    async getReferOut(db: Knex, date, hospCode=hcode) {
   const sql = `
SELECT '10707' as hospcode,r1.date as refer_date,r1.referoutno as referid,r1.referouthosp as hosp_destination,r1.hn,p1.cid,r1.vn as seq,r1.an,p1.title as prename,p1.name as fname,
p1.surname as lname,p1.birth as dob,p1.sex,d1.diagcode as dx  FROM mk_hos.referout r1
left join patient p1 on r1.hn =p1.hn 
left join diagnosis_opd_full d1 on r1.vn=d1.vn
WHERE  date(r1.date)="${date}"`;
        const result = await db.raw(sql);
        return result[0];
}
        async getPerson(db: Knex, columnName, searchText, hospCode=hcode) {
            //columnName => hn
            const sql = `
            SELECT '10707' as  hospcode,p1.cid,p1.hn as pid,'' as hid,p1.title as prename,p1.name as name,p1.surname as lname, 
            p1.hn,p1.sex,p1.birth,p1.marry as mstatus,r1.code43 as occupation_old,r1.code43new as occupation_new,p1.race,p1.nation,p1.ethnic as religion,
            p1.education,p1.typearea, c1.data as telephone,c1.data as mobile,date_format(concat(p1.lastupdate),'%Y-%m-%d %H:%i:%s') as d_update FROM patient p1 
            left join mk_hos.patient_contact c1 on p1.hn=c1.hn 
            left join ref_occ r1 on p1.occupa=r1.code
            where p1.${columnName}="${searchText}"`;
            const result = await db.raw(sql);
           return result[0];
    }

    async getAddress(db: Knex, columnName, searchText, hospCode=hcode) {
        columnName = columnName === 'cid' ? 'cid' : columnName;
        const sql = `
        SELECT  '10707'  as hospcode,p1.hn as pid,a1.addresstype,a1.house_id,a1.housetype,a1.roomno,a1.condo,a1.houseno,a1.soisub,a1.soimain,a1.road,a1.villaname,a1.village,a1.ban,a1.tambol,a1.amphur as ampur,a1.changwat,DATE_FORMAT(a1.lastupdate, "%Y%m%d%H%i%s") as d_update,p1.cid as cid
        from patient p1
        left join patient_address a1 on p1.hn=a1.hn
        where p1.${columnName}="${searchText}"`;
        const result = await db.raw(sql);
       return result[0];
    }

    async getService(db: Knex, columnName, searchText, hospCode=hcode) {
        //columnName = visitNo, hn
        columnName = columnName === 'visitNo' ? 'v1.vn' : columnName;
        columnName = columnName === 'date_serv' ? 'v1.date' : columnName;
        const sql = `
        SELECT  '10707'  as hospcode,v1.hn as pid,v1.hn,v1.vn as seq,date_format(concat(v1.date),'%Y-%m-%d') as date_serv,v1.time as time_serv,
        v1.location as location,v1.intime as intime, r3.code_new  as instype,v1.insid,   '10707'  as main,v1.typein,r1.referinhosp,
        r1.causein as causein,v3.cc as chiefcomp,v1.serviceplace as servplace,v4.btemp,v4.sbp,v4.dbp,v4.pr,v4.rr,v1.typeout,r2.causeout as causeout,
        r2.referouthosp as referouthosp,v1.cost,v1.price,v1.payprice,v1.actualpay,date_format(concat(v1.lastupdate),'%Y-%m-%d %H:%i:%s')   as d_update,v1.hospsub as hsub,p1.cid FROM visit v1 
        left join vs_opd v3 on v1.vn=v3.vn 
        left join visit_vitralsign v4 on v1.vn=v4.vn 
        left join referin r1 on v1.vn=r1.vn 
        left join visit_full v5 on v1.vn=v5.vn 
        left join patient p1 on v1.hn=p1.hn 
        left join referout r2 on v1.vn=r2.vn
        left join ref_payment r3 on v5.pttype=r3.code where  ${columnName}="${searchText}"`;
            const result = await db.raw(sql);
           return result[0];
    }

    async getDiagnosisOpd(db, visitno, hospCode=hcode) {
        const sql = `
        SELECT  '10707' as hospcode, d1.hn as pid,d1.vn as seq, date_format(concat(v1.date),'%Y-%m-%d') as date_serv,d1.diagtype ,
        d1.diagcode,d1.doctor as provider,c1.code43 as clinic,date_format(concat(v1.lastupdate),'%Y-%m-%d %H:%i:%s')  as d_update,p1.cid  from diagnosis_opd_full d1
        left join patient p1 on d1.hn=p1.hn
        left join visit v1 on d1.vn=v1.vn
         left join ref_clinic c1 on v1.dep=c1.code
         where d1.vn="${visitno}"`;
            const result = await db.raw(sql);
           return result[0];
    }

    async getProcedureOpd(db, visitno, hospCode=hcode) {
        const sql = `
        SELECT  '10707'  as hospcode,v1.hn as pid,d1.vn as seq,v1.date as date_serv,c1.code43 as clinic,d1.procedcode,'' as serviceprice,d1.doctor as provider,
        date_format(concat(v1.lastupdate),'%Y-%m-%d %H:%i:%s') as d_update,p1.cid from procedure_opd d1
 left join visit v1 on d1.vn=v1.vn 
 left join patient  p1 on v1.hn=p1.hn 
 left join ref_clinic c1 on v1.dep=c1.code  where d1.vn="${visitno}"`;
            const result = await db.raw(sql);
           return result[0];
    }

    async getChargeOpd(db, visitNo, hospCode=hcode) {
        const sql = `
        SELECT   '10707'  as hospcode,v1.hn as pid,v1.vn as seq,
        v1.date as date_serv,c1.code43 as clinic,d1.code_berk as chargeitem,d1.drug24 as chargelist,d1.amount as quantity,v1.inscl_main as instype,
        d1.berkno as payprice,'0.00' as cost,d1.price as price,
        DATE_FORMAT(CURRENT_TIMESTAMP, "%Y%m%d%H%i%s") as d_update,p1.cid 
        from opdallitem d1 
        left join visit_full v1 on d1.vn=v1.vn 
        left join patient p1 on v1.hn=p1.hn
        left join ref_clinic c1 on v1.dep=c1.code
        where d1.vn="${visitNo}"`;
            const result = await db.raw(sql);
           return result[0];
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

    async getDrugOpd(db, visitNo, hospCode=hcode) {
        const sql = `
        SELECT   '10707'  as hospcode,'' as pid,'' as seq,'' as date_serv,'' as clinic,'' as didstd,'' as dname,
        '' as amount,'' as unit ,'' as unit_packing,'' as drugprice,'' as drugcost,'' as provider,DATE_FORMAT(CURRENT_TIMESTAMP,"%Y%m%d%H%i%s") as d_update,'' as cid
        from vs_opd
        where vn="${visitNo}"`;

    }
//** admission */
    async getAdmission(db, columnName, searchNo, hospCode=hcode) 
    {
        columnName = columnName === 'an' ? 'a1.an' : columnName;
        columnName = columnName === 'hn' ? 'a1.hn' : columnName;
        columnName = columnName === 'visitNo' ? 'a1.vn' : columnName;
        const sql = `SELECT  '10707'   as hospcode,a1.hn as pid,a1.vn as seq,a1.an,date_format(concat(a1.date_admit, ' ', a1.time_admit),'%Y-%m-%d %H:%i:%s') as datetime_admit,r2.code43 as wardadmit,
        r1.code_new as instype,v1.typein,v1.referinhosp,v1.typein as causein,a1.weight as admitweight,a1.high as admithight,date_format(concat(a1.date_dsc, ' ', a1.time_dsc),'%Y-%m-%d %H:%i:%s') as datetime_disch,r2.code43 as warddisch ,a1.dsc_status as dischstatus ,a1.dsc_type as dischtype,r3.referouthosp as referouthosp ,r3.causeout as causeout,a1.cost,a1.price,
        a1.payprice,a1.price as actualpay,a1.dr_admit as provider,DATE_FORMAT(CURRENT_TIMESTAMP,"%Y%m%d%H%i%s") as d_update,a2.drg,a2.rw,
        a2.adjrw ,a2.error,a2.warning,a2.actlos,a2.version as grouper_version,'' as cid from admit a1 
        left join visit_full v1 on a1.vn=v1.vn
        left join admit_drg a2 on a1.an=a2.an
        left join ref_payment r1 on v1.pttype=r1.code
        left join ref_ward r2 on a1.ward=r2.code
        left join referout r3 on a1.an=r3.an
        where  ${columnName}=${searchNo}`;
          const result = await db.raw(sql);
            return result[0];
    }

    getDiagnosisIpd(db, columnName, searchNo, hospCode=hcode) {
        columnName = columnName === 'visitNo' ? 'vn' : columnName;
        return db('diagnosis_ipd')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }

    getProcedureIpd(db, an, hospCode=hcode) {
        return db('procedure_ipd')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('an', an)
            .limit(maxLimit);
    }

    
    getChargeIpd(db, an, hospCode=hcode) {
        return db('charge_ipd')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('an', "=", an)
            .limit(maxLimit);
    }

    getDrugIpd(db, an, hospCode=hcode) {
        return db('drug_ipd')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('an', an)
            .limit(maxLimit);
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
        columnName = columnName === 'visitNo' ? 'r1.vn' : columnName;
        columnName = columnName === 'referNo' ? 'r1.referoutno' : columnName;
        
        const sql = `
        SELECT  '10707'  as hospcode,r1.referoutno as referid, concat('10707','',r1.referoutno) as referid_province,r1.hn as pid,r1.vn as seq,r1.an ,v3.referno_original as referid_origin,'10707' as hospcode_origin,date_format(concat(v1.date, ' ', v1.time),'%Y-%m-%d %H:%i:%s') as datetime_serv,date_format(concat(a1.date_admit, ' ', a1.time_admit),'%Y-%m-%d %H:%i:%s') as datetime_admit,date_format(concat(r1.date),'%Y-%m-%d %H:%i:%s') as datetime_refer,
        c1.code43 as clinic_refer,r1.referouthosp as hosp_destination,concat('history: ',r1.history,' ',r1.symptom) as chiefcomp,concat('Lab : ',r1.lab,' ',r1.tx) as physicalexam,r1.diaglast as diagfirst,
        r1.diaglast as diaglast,r1.tx as pstatus,r1.ptype,r1.emergency,add0(2,r1.ptypedis) as ptypedis,r1.causeout,'' as request,r1.dr as provider,date_format(concat(r1.lastupdate),'%Y-%m-%d %H:%i:%s') as d_update from referout r1 
 left join visit v1 on r1.vn=v1.vn
 left join admit a1 on r1.an=a1.an
 left join ref_clinic c1 on v1.dep=c1.code
 left join visit_full v3 on r1.vn=v3.vn
  where   ${columnName}="${searchNo}"`;
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
        return db('view_refer_result')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('refer_hcode', "=", hospDestination)
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }

    getData(db, tableName, columnName, searchNo, hospCode=hcode) {
        return db(tableName)
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
}
