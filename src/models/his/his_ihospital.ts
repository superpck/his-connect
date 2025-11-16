import { Knex } from 'knex';
import * as moment from 'moment';
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
let hisHospcode = process.env.HOSPCODE;

export class HisIHospitalModel {
  check() {
    return true;
  }

  async testConnect(db: Knex) {
    let result: any;
    result = await global.dbHIS('hospdata.sys_hospital').first();
    const hospname = result?.hname || null;

    result = await db('hospdata.patient').select('hn').limit(1);
    const connection = result && (result.patient || result.length > 0) ? true : false;

    let charset: any = '';
    if (process.env.HIS_DB_CLIENT.toLowerCase().includes('mysql')) {
      result = await db('information_schema.SCHEMATA')
        .select('DEFAULT_CHARACTER_SET_NAME')
        .where('SCHEMA_NAME', process.env.HIS_DB_NAME)
        .first();
      charset = result?.DEFAULT_CHARACTER_SET_NAME || '';
    }
    return { hospname, connection, charset };
  }

  // รหัสห้องตรวจ
  getDepartment(db: Knex, depCode: string = '', depName: string = '') {
    let sql = db('lib_clinic');
    if (depCode) {
      sql.where('code', depCode);
    } else if (depName) {
      sql.whereLike('clinic', `%${depName}%`)
    } else {
      sql.where('isactive', 1)
    }
    return sql
      .select('code as department_code', 'clinic as department_name',
        'standard as moph_code')
      .select(db.raw(`if(type='ER',1,0) as emergency`))
      .orderBy('clinic')
      .limit(maxLimit);
  }

  // รหัส Ward
  getWard(db: Knex, wardCode: string = '', wardName: string = '') {
    let sql = db('lib_ward').where('code', '!=', 0);
    if (wardCode) {
      sql.where('code', wardCode);
    } else if (wardName) {
      sql.whereLike('ward', `%${wardName}%`)
    }
    return sql
      .select('code as wardcode', 'ward as wardname',
        'standard as std_code', 'bed_nm as bed_normal', 'bed_sp as bed_special',
        'ward_type', 'ward_typesub as ward_subtype', 'isactive')
      .limit(maxLimit);
  }

  // รายละเอียดแพทย์
  getDr(db: Knex, code: string, license_no: string) {
    if (code || license_no) {
      let sql = db('lib_dr')
        .where('type', '!=', 'NONE-DR')
        .whereRaw(`fname !='' AND fname IS NOT NULL`);
      if (code) {
        sql.where({ code });
      } else if (license_no) {
        sql.where({ license_no })
      }
      return sql
        .select('code as dr_code', 'license_no as dr_license_code')
        .select(db.raw('concat(title,fname," ",lname) as dr_name'))
        .select('type as dr_type', 'expire as expire_date')
        .limit(maxLimit);
    } else {
      throw new Error('Invalid parameters');
    }
  }

  async getPerson1(db: Knex, columnName, searchText) {
    // columnName => cid, hn
    const sql = `
            select xxx from xxx
            where ${columnName}="${searchText}"
            order by mmm `;
    const result = await db.raw(sql);
    return result[0];
  }

  // select รายชื่อเพื่อแสดงทะเบียน
  //getReferOut(db: Knex, date, hospCode = hisHospcode, visitNo = null) {
  getReferOut(db: Knex, date: any, hospCode = hisHospcode, visitNo: string = null) {
    let sql = db('hospdata.refer_out as refer')
      .leftJoin('hospdata.opd_visit as visit', 'refer.vn', 'visit.vn')
      .leftJoin('hospdata.patient as pt', 'visit.hn', 'pt.hn')
      .leftJoin('hospdata.opd_vs as vs', 'refer.vn', 'vs.vn')
      .leftJoin('hospdata.ipd_ipd as ipd', 'refer.vn', 'ipd.vn')
      .leftJoin('hospdata.refer_in', 'refer.vn', 'refer_in.vn')
      .select(db.raw(`"${hcode}" as hospcode`))
      .select(db.raw('concat(refer.refer_date, " " , refer.refer_time) as refer_date'))
      .select('refer.refer_no as referid', 'refer.refer_type as referout_type'
        , 'refer.refer_hcode as hosp_destination'
        , 'refer_in.refer as hospcode_origin', 'refer_in.refer_no as referid_origin'
        , 'visit.hn', 'pt.no_card as cid', 'refer.vn as seq', 'ipd.an'
        , 'pt.title as prename', 'pt.name as fname', 'pt.surname as lname'
        , 'pt.birth as dob', 'pt.sex', 'refer.treated AS PHYSICALEXAM'
        , 'refer.history_ill as PH', 'refer.current_ill as PI'
        , 'refer.dr_request as REQUEST', 'visit.dx1 as ICD10'
        , 'refer.dx as DIAGLAST', 'refer.dx', 'refer.other as detail'
        , 'vs.nurse_cc as chiefcomp', 'pi_dr as pi', 'pe_dr as pe', 'nurse_ph as ph'
        , db.raw('IF(ipd.an IS NULL,null, concat(ipd.admite," ",ipd.time)) as datetime_admit')
        , db.raw(`IF(visit.dr > 0, CONCAT("ว",visit.dr),'') as provider`)
        , `visit.dr`, 'refer.dr_request as request', 'refer.causeout'
      )
      .where('refer.hcode', hospCode);
    if (visitNo) {
      sql.where(`refer.vn`, visitNo);
    } else {
      sql.where('refer.refer_date', date);
    }
    return sql
      .whereNull('refer.datecancel')
      .orderBy('refer.refer_date')
      .groupBy('refer.vn')
      .limit(maxLimit);
  }

  sumReferOut(db: Knex, dateStart: any, dateEnd: any) {
    return db('hospdata.refer_out as r')
      .select('r.refer_date')
      .count('r.vn as cases')
      .whereNotNull('r.vn')
      .whereBetween('r.refer_date', [dateStart, dateEnd])
      .where('r.refer_hcode', '!=', "")
      .whereNotNull('r.refer_hcode')
      .where('r.refer_hcode', '!=', hisHospcode)
      .whereNull('r.datecancel')
      .groupBy('r.refer_date')
      .orderBy('r.refer_date');
  }

  getPerson(db: Knex, columnName, searchText, hospCode = hisHospcode) {
    //columnName = cid, hn
    columnName = columnName === 'cid' ? 'no_card' : columnName;
    return db('hospdata.view_patient')
      .select(db.raw('"' + hisHospcode + '" as hospcode'))
      .select(db.raw('4 as typearea'))
      .select('no_card as cid', 'hn as pid', 'title as prename',
        'name', 'name as fname', 'surname as lname', 'hn',
        'birth', 'sex', 'marry_std as mstatus', 'blood as abogroup',
        'occ_std as occupation_new', 'race_std as race',
        'nation_std as nation', 'religion_std as religion',
        'edu_std as education', 'tel as telephone',
        'lastupdate as d_update')
      .where(columnName, "=", searchText)
      .limit(maxLimit);
  }

  getAddress(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
    columnName = columnName === 'cid' ? 'CID' : columnName;
    return db('view_address_hdc')
      .select('HOSPCODE', `PID`, `ADDRESSTYPE`, `HOUSE_ID`, `HOUSETYPE`,
        `ROOMNO`, `CONDO`, `HOUSENO`, `SOISUB`,
        `SOIMAIN`, `ROAD`, `VILLANAME`, `VILLAGE`,
        `TAMBON`, `AMPUR`, `CHANGWAT`, `TELEPHONE`,
        `MOBILE`, `D_UPDATE`)
      .where(columnName, "=", searchNo)
      .orderBy('ADDRESSTYPE')
      .limit(maxLimit);
  }

  getService(db: Knex, columnName: string, searchText: any, hospCode = hisHospcode) {
    //columnName => visitNo, hn
    columnName = columnName === 'visitNo' ? 'vn' : columnName;
    columnName = columnName === 'date_serv' ? 'visit.date' : `visit.${columnName}`;
    return db('view_opd_visit as visit')
      .leftJoin('hospdata.er_triage as triage', 'visit.vn', 'triage.vn')
      .select(db.raw('"' + hisHospcode + '" as hospcode'))
      .select('visit.hn as pid', 'visit.hn', 'visit.vn as seq', 'visit.date as date_serv',
        'visit.hospmain as main', 'visit.hospsub as hsub',
        'visit.refer as referinhosp',
        db.raw(' case when visit.time="" or visit.time="08:00" then visit.time_opd else visit.time end as time_serv '),
        db.raw('"1" as servplace'), 'visit.nurse_cc as chiefcomp',
        'visit.pi_dr as presentillness', 'visit.pe_dr as physicalexam', 'visit.nurse_ph as pasthistory',
        'visit.t as btemp', 'visit.bp as sbp', 'visit.bp1 as dbp', 'visit.weigh as weight', 'visit.high as height',
        'visit.puls as pr', 'visit.rr', db.raw(`IF(visit.dr > 0, CONCAT("ว",visit.dr),'') as provider`),
        'visit.no_card as cid', 'visit.pttype_std as instype', 'visit.no_ptt as insid',
        'triage.e as gcs_e', 'triage.v as gcs_v', 'triage.m as gcs_m',
        'triage.gcs', 'triage.o2sat', 'triage.pupil_lt as pupil_left', 'triage.pupil_rt as pupil_right',
        db.raw('IF(visit.period>1,2,1) AS intime'), 'visit.cost as price', 'visit.opd_result_hdc as typeout',
        db.raw('IF(visit.hospmain=? OR visit.`add`=?,1,2) AS location', [hcode, '4001'])
      )
      .select(db.raw('concat(visit.date, " " , visit.time) as d_update'))
      .where(columnName, searchText)
      .orderBy('visit.date', 'desc')
      .limit(maxLimit);
  }

  getDiagnosisOpd(db: Knex, visitno: string, hospCode = hisHospcode) {
    return db('view_opd_dx_hdc as dx')
      .select('dx.*')
      .select(db.raw(' "IT" as codeset'))
      .select(db.raw(`case when substr(dx.DIAGCODE,1,1) in ('V','W','X','Y') then 4 else dx.DIAGTYPE end as dxtype`))
      .where('SEQ', visitno)
      .orderBy('dxtype')
      .orderBy('dx.D_UPDATE')
      .limit(maxLimit);
  }
  getDiagnosisOpdAccident(db: Knex, dateStart: any, dateEnd: any, hospCode = hisHospcode) {
    if (dateStart & dateEnd) {
      return db('view_opd_dx as dx')
        .whereBetween('date', [dateStart, dateEnd])
        .whereRaw(`LEFT(diag,1) IN ('V','W','X','Y')`)
        .limit(maxLimit);
    } else {
      throw new Error('Invalid parameters');
    }
  }
  async getDiagnosisOpdVWXY(db: Knex, date: any) {
    let sql = `SELECT hn, vn AS visitno, view_opd_dx.date, diag AS diagcode
                , view_opd_dx.desc AS diag_name, short_eng AS en, short_thi AS thi
                , view_opd_dx.type AS diag_type, dr_dx AS dr
                , "IT" as codeset, lastupdate as d_update
            FROM view_opd_dx WHERE vn IN (
                SELECT vn FROM view_opd_dx 
                WHERE date= ? AND LEFT(diag,1) IN ('V','W','X','Y'))
                AND LEFT(diag,1) IN ('S','T','V','W','X','Y')
            ORDER BY vn, type, lastupdate LIMIT ${maxLimit}`

    const result = await db.raw(sql, [date]);
    return result[0];
  }
  async getDiagnosisSepsisOpd(db: Knex, dateStart: any, dateEnd: any) {
    let sql = `SELECT hn, vn AS visitno, view_opd_dx.date, diag AS diagcode
                , view_opd_dx.desc AS diag_name, short_eng AS en, short_thi AS thi
                , view_opd_dx.type AS diag_type, dr_dx AS dr
                , "IT" as codeset, lastupdate as d_update
            FROM view_opd_dx WHERE vn IN (
                SELECT vn FROM view_opd_dx 
                WHERE date BETWEEN ? AND ? AND (LEFT(diag,4) IN ('R651','R572') OR LEFT(diag,3) IN ('A40','A41'))  GROUP BY vn)
            ORDER BY vn, type, lastupdate LIMIT ${maxLimit}`
    const result = await db.raw(sql, [dateStart, dateEnd]);
    return result[0];
  }
  async getDiagnosisSepsisIpd(db: Knex, dateStart: any, dateEnd: any) {
    let sql = `SELECT ipd.hn, ipd.vn AS visitno, dx.an
                , dx.admite as date, dx AS diagcode
                , dx.desc AS diag_name, short_eng AS en, short_thi AS thi
                , dx.type AS diag_type, dx.dr
                , patient.title AS patient_prename
                , patient.name AS patient_fname
                , patient.surname AS patient_lname
                , ipd.ward as wardcode, lib_ward.ward as wardname
                , "IT" as codeset, dx.lastupdate as d_update
            FROM view_ipd_dx as dx
                LEFT JOIN patient on dx.hn=patient.hn
                LEFT JOIN ipd_ipd as ipd on dx.an=ipd.an
                LEFT JOIN lib_ward on ipd.ward=lib_ward.code
            WHERE dx.an IN (
                SELECT an FROM view_ipd_dx 
                WHERE admite BETWEEN ? AND ? AND (LEFT(dx,4) IN ('R651','R572') OR LEFT(dx,3) IN ('A40','A41')) GROUP BY an)
                AND dx.type != "5"
            ORDER BY dx.an, dx.type, dx.lastupdate LIMIT ${maxLimit}`

    const result = await db.raw(sql, [dateStart, dateEnd]);
    return result[0];
  }

  getProcedureOpd(db: Knex, visitno: string, hospCode = hisHospcode) {
    return db('view_opd_op')
      .select(db.raw('"' + hcode + '" as hospcode'))
      .select('vn as visitno', 'date', 'hn', 'op as op_code', 'op as procedcode',
        'desc as procedname', 'icd_9 as icdcm', 'dr as provider',
        'clinic_std as clinic', 'price as serviceprice')
      .select(db.raw('concat(date," ",time_in) as date_serv'))
      .select(db.raw('concat(date," ",time_in) as d_update'))
      .where('vn', "=", visitno)
      .limit(maxLimit);
  }

  getChargeOpd(db: Knex, visitNo: string, hospCode = hisHospcode) {
    return db('view_opd_charge_item')
      .select('*')
      .select(db.raw('"' + hcode + '" as hospcode'))
      .where('vn', visitNo)
      .limit(maxLimit);
  }

  getLabRequest(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
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

  getLabResult(db: Knex, columnName, searchNo, referID = '', hospCode = hisHospcode) {
    columnName = columnName === 'visitNo' ? 'result.vn' : columnName;
    columnName = columnName === 'pid' ? 'result.hn' : columnName;
    columnName = columnName === 'cid' ? 'result.no_card' : columnName;
    columnName = columnName === 'an' ? 'result.an' : columnName;
    return db('hospdata.view_lab_result as result')
      .select(db.raw('"' + hcode + '" as hospcode'))
      .select(db.raw('"' + hcode + referID + '" as REFERID'))
      .select(db.raw('"' + referID + '" as REFERID_PROVINCE'))
      .select(db.raw('"LAB" as INVESTTYPE'))
      .select(db.raw('CONCAT(result.date," ",result.time) as DATETIME_INVEST'))
      .select('result.hn as PID', 'result.vn as SEQ', 'result.cid as CID'
        , 'an as AN', 'result.type_result as LH'
        , 'result.lab_code as LOCALCODE', 'result.icdcm as INVESTCODE'
        , 'result.lab_name as INVESTNAME'
        , 'result.result as INVESTVALUE', 'result.unit as UNIT'
        , 'result.result_text as INVESTRESULT'
        , 'result.minresult as NORMAL_MIN', 'result.maxresult as NORMAL_MAX'
        , 'result.lab_code_request as GROUPCODE', 'result.request_lab_name as GROUPNAME'
        , 'result.date_result as DATETIME_REPORT')
      .select(db.raw('CONCAT(result.date," ",result.time) as D_UPDATE'))
      .where(columnName, "=", searchNo)
      .whereNotIn('result.lab_code', ['03098', '02066', '03155'])
      .whereRaw('result.lab_code NOT LIKE "03037%" AND result.lab_name NOT LIKE "HIV%"  AND result.result NOT LIKE "%ส่งตรวจภายนอก%" ')
      .limit(maxLimit);

    // `LOINC` varchar(20) DEFAULT NULL,
  }

  getInvestigation(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
    columnName = columnName === 'visitNo' ? 'result.vn' : columnName;
    columnName = columnName === 'pid' ? 'result.hn' : columnName;
    columnName = columnName === 'cid' ? 'result.no_card' : columnName;
    return db('hospdata.view_lab_result as result')
      .select(db.raw('"' + hcode + '" as hospcode'))
      .select(db.raw('"LAB" as INVESTTYPE'))
      .select(db.raw('CONCAT(result.date," ",result.time) as DATETIME_INVEST'))
      .select('result.hn as PID', 'result.vn as SEQ', 'result.pid as CID'
        , 'an as AN', 'result.type_result as LH'
        , 'result.lab_code as LOCALCODE', 'result.icdcm as INVESTCODE'
        , 'result.lab_name as INVESTNAME'
        , 'result.result as INVESTVALUE', 'result.unit as UNIT'
        , 'result.result_text as INVESTRESULT'
        , 'result.minresult as NORMAL_MIN', 'result.maxresult as NORMAL_MAX'
        , 'result.date_result as DATETIME_REPORT')
      .select(db.raw('CONCAT(result.date," ",result.time) as D_UPDATE'))
      .where(columnName, "=", searchNo)
      .whereNotIn('result.lab_code', ['03098', '02066', '03155'])
      .whereRaw('result.lab_code NOT LIKE "03037%" AND result.lab_code NOT LIKE "HIV%"')
      .limit(maxLimit);

    // `LOINC` varchar(20) DEFAULT NULL,
  }

  getDrugOpd(db: Knex, visitNo: string, hospCode = hisHospcode) {
    // if (!visitNo) {
    return db('view_pharmacy_opd_drug_item as drug')
      .select(db.raw('? as hospcode', [hospCode])
        , 'drug.hn', 'drug.hn as pid', 'drug.vn', 'drug.vn as seq'
        , db.raw("concat(drug.date_serv,' ',drug.time_serv) as date_serv")
        , 'drug.clinic', 'drug.code24 as didstd', 'drug.tmt'
        , 'drug.drugname as dname'
        , 'drug.no as amount', 'drug.unit', 'drug.price as drugprice'
        , db.raw('concat("ว",drug.dr_visit) as provider')
        , db.raw("now() as d_update"), 'drug.cid'
        , db.raw("concat(drug.methodname, ' ' , drug.no_use, ' ', drug.unit_use, ' ',drug.freqname, ' ', timesname) as drug_usage")
        , 'drug.caution')
      .where('vn', visitNo)
      .limit(1000);
    // } else {
    //     throw new Error('getDrugOpd: Invalid visitNo: ' + visitNo);
    // }

    // const sql1 = `
    //     SELECT '${hospCode}' as hospcode, drug.hn as pid, drug.vn, drug.vn as seq
    //         , concat(drug.date_serv,' ',drug.time_serv) as date_serv
    //         , drug.clinic, drug.code24 as didstd, drug.tmt, drug.drugname as dname
    //         , drug.no as amount, drug.unit, drug.price as drugprice
    //         , concat('ว',drug.dr_visit) as provider
    //         , now() as d_update, drug.cid
    //         , concat(drug.methodname, ' ' , drug.no_use, ' ', drug.unit_use, ' ',drug.freqname, ' ', timesname) as drug_usage
    //         , drug.caution
    //         FROM view_pharmacy_opd_drug_item as drug
    //         WHERE drug.vn='${visitNo}'
    //         limit 1000`;
    // const result = await db.raw(sql1);
    // return result[0];
  }

  getAdmission(db: Knex, columnName: string, searchValue: any, hospCode = hisHospcode) {
    columnName = columnName === 'cid' ? 'no_card' : columnName;
    columnName = columnName === 'visitNo' ? 'vn' : columnName;
    columnName = columnName === 'dateadmit' ? 'admite' : columnName;
    columnName = columnName === 'datedisc' ? 'disc' : columnName;

    let sql = db('view_ipd_ipd as ipd');
    if (['no_card', 'vn', 'hn', 'an'].indexOf(columnName) < 0) {
      sql.whereRaw('LENGTH(ipd.refer)=5');
    }
    if (Array.isArray(searchValue)) {
      sql.whereIn(columnName, searchValue)
    } else {
      sql.where(columnName, searchValue)
    }
    return sql
      .select(db.raw('"' + hcode + '" as HOSPCODE'))
      .select('ipd.hn as PID', 'ipd.vn as SEQ',
        'ipd.an AS AN', 'ipd.hn', 'ipd.sex AS SEX')
      .select(db.raw('concat(ipd.admite, " " , ipd.time) as DATETIME_ADMIT'))
      .select('ipd.ward_std as WARDADMIT',
        'ipd.ward_name as WARDADMITNAME',
        'ipd.ward as WARD_LOCAL',
        'ipd.pttype_std2 as INSTYPE')
      .select(db.raw('case when ipd.refer="" then 1 else 3 end as TYPEIN '))
      .select('ipd.refer as REFERINHOSP')
      .select(db.raw('1 as CAUSEIN'))
      .select('ipd.weight as ADMITWEIGHT', 'ipd.height as ADMITHEIGHT')
      .select(db.raw('concat(ipd.disc, " " , ipd.timedisc) as DATETIME_DISCH'))
      .select('ipd.ward_std as WARDDISCH', 'ipd.dischstatus as DISCHSTATUS',
        'ipd.dischtype as DISCHTYPE', 'ipd.price', 'ipd.paid as PAYPRICE')
      .select(db.raw('case when ipd.disc then ipd.ward_name else "" end as WARDDISCHNAME'))
      .select(db.raw('0 as ACTUALPAY'))
      .select('ipd.dr_disc as PROVIDER')
      .select(db.raw('concat(ipd.disc, " " , ipd.timedisc) as D_UPDATE'))
      .select('ipd.drg as DRG', 'ipd.rw as RW', 'ipd.adjrw as ADJRW', 'ipd.drg_error as ERROR',
        'ipd.drg_warning as WARNING', 'ipd.los as ACTLOS',
        'ipd.grouper_version as GROUPER_VERSION', 'ipd.no_card as CID')
      .limit(maxLimit);
  }

  getDiagnosisIpd(db: Knex, columnName: string, searchNo: string, hospCode = hisHospcode) {
    columnName = columnName === 'visitNo' ? 'dx.SEQ' : columnName;
    columnName = columnName === 'an' ? 'dx.AN' : columnName;
    columnName = columnName === 'pid' ? 'dx.PID' : columnName;
    columnName = columnName === 'cid' ? 'dx.CID' : columnName;
    return db('view_ipd_dx_hdc as dx')
      .select('dx.*', db.raw(' "IT" as codeset'))
      .where(columnName, searchNo)
      .where('DIAGTYPE', '!=', '5')
      .orderBy('AN')
      .orderBy('DIAGTYPE')
      .orderBy('D_UPDATE')
      .limit(maxLimit);
  }
  getDiagnosisIpdAccident(db: Knex, dateStart: any, dateEnd: any, hospCode = hisHospcode) {
    if (dateStart & dateEnd) {
      return db('view_ipd_dx as dx')
        .whereBetween('admite', [dateStart, dateEnd])
        .where('type', '!=', '5')
        .whereRaw(`LEFT(dx,1) IN ('V','W','X','Y')`)
        .orderBy(['disc', 'timedisc'])
        .limit(maxLimit);
    } else {
      throw new Error('Invalid parameters');
    }
  }

  getProcedureIpd(db: Knex, an, hospCode = hisHospcode) {
    return db('view_ipd_op as op')
      .select(db.raw('"' + hcode + '" as HOSPCODE'))
      .select('hn as PID', 'an as AN', 'vn as SEQ')
      .select(db.raw('concat(admite, " " , timeadmit) as DATETIME_ADMIT'))
      .select('clinic_std as WARDSTAY', 'op as PROCEDCODE',
        'desc as PROCEDNAME', 'dr as PROVIDER',
        'price as SERVICEPRICE',
        'cid as CID', 'lastupdate as D_UPDATE')
      .where('an', an)
      .limit(maxLimit);
  }

  getChargeIpd(db: Knex, an: string, hospCode = hisHospcode) {
    return db('ipd_charge')
      .select(db.raw('"' + hcode + '" as hospcode'))
      .where({ an })
      .limit(maxLimit);
  }

  async getDrugIpd(db: Knex, an: string, hospCode = hisHospcode) {
    try {
      return await db('pharmacy.view_supreme_prescriptiondetail as drug')
        .select(db.raw('"' + hcode + '" as hospcode')
          , 'hn as pid', 'an', 'cid'
          , db.raw("date_format(dateadm,'%Y-%m-%d %H:%i:%s') as DATETIME_ADMIT")
          , 'prioritycode as TYPEDRUG'
          , 'ward_standard as WARDSTAY', 'orderitemcode as DID'
          , 'orderitemname as DNAME', 'orderqty as AMOUNT', 'orderunitcode as UNIT'
          , 'startdate as DATESTART', 'enddate as DATEFINISH'
          // , db.raw("CASE WHEN startdate IS NULL THEN null ELSE date_format(startdate, '%Y-%m-%d') END AS DATESTART")
          // , db.raw("CASE WHEN enddate IS NULL THEN null ELSE date_format(enddate, '%Y-%m-%d') END AS DATEFINISH")
          , 'totalprice as DRUGPRICE', 'freetext2 as drug_usage', 'tmtcode as DID_TMT'
          , 'tmtcode as tmt', 'tmtcode as DIDSTD', 'dr_disc as provider', 'lastmodified as D_UPDATE')
        .where({ an, prioritycode: 'H' }) // เฉพาะ Homemed
        .where('orderqty', '>', 0)
        .limit(1000);
    } catch (error) {
      console.log('getDrugIpd error:', error?.status || '', error?.message || error);
      throw new Error(error);
    }
  }

  getAccident(db: Knex, visitNo: string, hospCode = hisHospcode) {
    return db('accident')
      .select('*')
      .select(db.raw('"' + hcode + '" as hospcode'))
      .where('vn', visitNo)
      .limit(maxLimit);
  }

  getDrugAllergy(db: Knex, hn, hospCode = hisHospcode) {
    return db('view_drug_allergy')
      .select('*')
      .select(db.raw('"' + hcode + '" as hospcode'))
      .where('hn', hn)
      .limit(maxLimit);
  }

  getAppointment(db: Knex, visitNo: string, hospCode = hisHospcode) {
    return db('view_opd_fu')
      .select('*')
      .select(db.raw('"' + hcode + '" as hospcode'))
      .where('vn', "=", visitNo)
      .limit(maxLimit);
  }

  async getReferHistory(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
    //columnName = visitNo, referNo
    columnName = columnName === 'visitNo' ? 'refer.vn' : ('refer.' + columnName);
    columnName = columnName === 'refer.referNo' ? 'refer.refer_no' : columnName;
    const Sql = `SELECT ? as hospcode, refer.refer_no as referid
            , concat(?,refer.refer_no) as referid_province
            , refer.hn as pid, refer.vn as seq, refer.an
            , concat(refer.date_service,' ',refer.refer_time) as datetime_serv
            , concat(ipd.admite,' ',ipd.time) as datetime_admit
            , concat(refer.refer_date,' ',refer.refer_time) as datetime_refer
            , visit.clinic as clinic_refer, refer.refer_hcode as hosp_destination
            , refer.sendto as destination_req, vs.cc as CHIEFCOMP
            , vs.pi as PRESENTILLNESS, vs.pe, refer.treated AS PHYSICALEXAM
            , refer.history_ill as PH, refer.current_ill as PI
            , refer.dr_request as REQUEST, visit.dx1 as ICD10
            , vs.nurse_ph as PASTHISTORY, refer.dx as DIAGLAST
            , case when visit.dep=1 then 3 else 1 end as ptype
            , refer.other as detail
            , case when refer.severity=5 then '1'
                when refer.severity=4 then '2'
                when refer.severity=3 then '3'
                when refer.severity=2 then '4'
                else '5' end as emergency
            , '99' as ptypedis, refer.causeout
            , concat('ว',visit.dr) as provider
            , now() as d_update
        from refer_out as refer 
        LEFT JOIN opd_visit as visit on refer.vn=visit.vn
        LEFT JOIN opd_vs as vs on refer.vn=vs.vn
        LEFT JOIN ipd_ipd as ipd on refer.an=ipd.an
        WHERE refer.hcode=? and ${columnName}=? AND refer.datecancel IS NULL
        limit ?;`;
    const result = await db.raw(Sql, [hospCode, hospCode, hospCode, searchNo, maxLimit]);
    return result[0];
  }

  getClinicalRefer(db: Knex, referNo, hospCode = hisHospcode) {
    return db('view_clinical_refer')
      .select('*')
      .select(db.raw('"' + hcode + '" as hospcode'))
      .where('refer_no', "=", referNo)
      .limit(maxLimit);
  }

  getInvestigationRefer(db: Knex, referNo, hospCode = hisHospcode) {
    return db('view_investigation_refer')
      .select('*')
      .select(db.raw('"' + hcode + '" as hospcode'))
      .where('refer_no', "=", referNo)
      .limit(maxLimit);
  }

  getCareRefer(db: Knex, referNo, hospCode = hisHospcode) {
    return db('view_care_refer')
      .select('*')
      .select(db.raw('"' + hcode + '" as hospcode'))
      .where('refer_no', "=", referNo)
      .limit(maxLimit);
  }

  getReferResult(db: Knex, visitDate, hospCode = hisHospcode) {
    visitDate = moment(visitDate).format('YYYY-MM-DD');

    return db('view_opd_visit as visit')
      .leftJoin('refer_in', 'visit.vn', 'refer_in.vn')
      .select(db.raw(`(select hcode from sys_hospital) as HOSPCODE`)
        , 'visit.refer as HOSP_SOURCE', 'visit.refer_no as REFERID_SOURCE'
        , db.raw('concat(visit.refer,visit.refer_no) as REFERID_PROVINCE')
        , 'visit.date as DATETIME_IN'
        , 'visit.hn as PID_IN', 'visit.vn as SEQ_IN'
        , 'visit.ipd_an as AN_IN', 'visit.no_card as CID_IN'
        , 'refer_in.refer_in as REFERID', 'visit.dx1 as detail'
        , 'visit.dr_note as reply_diagnostic', 'visit.lastupdate as reply_date'
        , db.raw('1 as REFER_RESULT')
        , db.raw(`concat(visit.date,' ',visit.time) as D_UPDATE`)
        , 'visit.dr as PROVIDER', 'visit.dr')
      .where('visit.date', visitDate)
      .where('visit.refer', '!=', hospCode)
      .where(db.raw('length(visit.refer)=5'))
      .groupBy('visit.vn')
      .limit(maxLimit);
  }
  getProviderDr(db: Knex, drList: any[]) {
    return db('hdc.provider')
      .whereIn('REGISTERNO', drList)
      .limit(maxLimit);
  }
  getProvider(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
    return db('hdc.provider')
      .whereIn(columnName, searchNo)
      .limit(maxLimit);
  }

  getData(db: Knex, tableName, columnName, searchNo, hospCode = hisHospcode) {
    return db(tableName)
      .select('*')
      .select(db.raw('"' + hcode + '" as hospcode'))
      .where(columnName, "=", searchNo)
      .limit(maxLimit);
  }

  // MOPH ERP
  countBedNo(db: Knex) {
    return db('app_nis.bed').count('* as total_bed').first();

  }

  async getBedNo(db: Knex, bedno: any = null, start = -1, limit: number = 1000) {
    let query = db('app_nis.bed')
    if (start >= 0) {
      query = query.offset(start).limit(limit);
    }
    query = query.select('bed_id', 'ward_code as wardcode', 'bed_name',
      db.raw(`CONCAT(ward_code, '-',bed_number) as bedno`),
      'room as roomno', 'bed_status as isactive',
      db.raw(`
            CASE 
                WHEN std_type = 2 THEN 'ICU'
                WHEN std_type = 3 THEN 'SEMIICU'
                WHEN std_type = 4 THEN 'STROKE'
                WHEN bed_type = 2 THEN 'S'
                WHEN bed_type = 5 THEN 'CLIP'
                WHEN bed_name LIKE '%รอคลอด%' THEN 'LR'
                ELSE 'N'
            END as bed_type
        `)
    ).where('bed_status', 1);
    if (bedno) {
      query = query.whereRaw(`CONCAT(ward_code, '-',bed_number) = ?`, bedno);
    }
    return await query;
  }

  // Report zone
  sumReferIn(db: Knex, dateStart: any, dateEnd: any) {
    return db('opd_visit as visit')
      .select('visit.date')
      .count('visit.vn as cases')
      .whereBetween('visit.date', [dateStart, dateEnd])
      .whereNotNull('visit.refer')
      .where('visit.refer', '!=', hisHospcode)
      .whereRaw('LENGTH(visit.refer)=5')
      .whereNotNull('visit.vn')
      .groupBy('visit.date');
  }

  concurrentIPDByWard(db: Knex, date: any) {
    const dateAdmitLimit = moment(date).subtract(1, 'year').format('YYYY-MM-DD');
    let sql = db('view_ipd_ipd as ip')
      .select('ip.ward as wardcode', 'ward_name as wardname',
        db.raw('SUBSTRING(ip.ward_std,2,2) as clinic'));
    if (date.length > 10) {
      const dateStart = moment(date).locale('TH').startOf('hour').format('YYYY-MM-DD HH:mm:ss');
      const dateEnd = moment(date).locale('TH').endOf('hour').format('YYYY-MM-DD HH:mm:ss');
      sql = sql.select(
        db.raw('SUM(CASE WHEN ip.dateadm BETWEEN ? AND ? THEN 1 ELSE 0 END) AS new_case', [dateStart, dateEnd]),
        db.raw('SUM(CASE WHEN ip.datedsc BETWEEN ? AND ? THEN 1 ELSE 0 END) AS discharge', [dateStart, dateEnd]),
        db.raw('SUM(CASE WHEN ip.refer IS NOT NULL AND ip.refer != "" THEN 1 ELSE 0 END) AS referin'),
        db.raw('SUM(CASE WHEN ip.datedsc BETWEEN ? AND ? THEN adjrw ELSE 0 END) AS adjrw', [dateStart, dateEnd]),
        db.raw('SUM(CASE WHEN ip.datedsc BETWEEN ? AND ? AND LEFT(ip.stat_dsc,1) IN ("8","9") THEN 1 ELSE 0 END) AS death', [dateStart, dateEnd]))
        .count('* as cases')
        .sum('ip.pday as los')
        .whereRaw('ip.dateadm <= ?', [dateStart])
        .whereRaw('(ip.disc IS NULL OR ip.datedsc BETWEEN ? AND ?)', [dateStart, dateEnd])
        .andWhere(function () {
          this.whereNull('ip.disc').orWhere('ip.disc', '>=', date);
        });
    } else {
      date = moment(date).format('YYYY-MM-DD');
      sql = sql.select(
        db.raw('SUM(CASE WHEN ip.admite = ? THEN 1 ELSE 0 END) AS new_case', [date]),
        db.raw('SUM(CASE WHEN ip.disc = ? THEN 1 ELSE 0 END) AS discharge', [date]),
        db.raw('SUM(CASE WHEN ip.refer IS NOT NULL AND ip.refer != "" THEN 1 ELSE 0 END) AS referin'),
        db.raw('SUM(CASE WHEN ip.disc = ? THEN adjrw ELSE 0 END) AS adjrw', [date]),
        db.raw('SUM(CASE WHEN LEFT(ip.stat_dsc,1) IN ("8","9") THEN 1 ELSE 0 END) AS death'))
        .count('* as cases')
        .sum('ip.pday as los')
        .where('ip.admite', '<=', date)
        .andWhere(function () {
          this.whereNull('ip.disc').orWhere('ip.disc', '>=', date);
        });
    }
    sql = sql.where('ip.admite', '>', dateAdmitLimit)   // Protect ไม่นับ admit เกิน 1 ปี
      .whereRaw('ip.ward is not null and ip.ward>0')
    console.log(sql.groupBy('ip.ward').orderBy('ip.ward').toString());
    return sql.groupBy('ip.ward').orderBy('ip.ward');
  }
  concurrentIPDByClinic_(db: Knex, date: any) {
    const dateAdmitLimit = moment(date).subtract(1, 'year').format('YYYY-MM-DD');
    let sql = db('view_ipd_ipd as ip')
      .select('clinic_hdc_code as cliniccode', 'clinic_hdc_name as clinicname');
    if (date.length > 10) {
      const dateStart = moment(date).locale('TH').startOf('hour').format('YYYY-MM-DD HH:mm:ss');
      const dateEnd = moment(date).locale('TH').endOf('hour').format('YYYY-MM-DD HH:mm:ss');
      sql = sql.select(
        db.raw('SUM(CASE WHEN ip.dateadm BETWEEN ? AND ? THEN 1 ELSE 0 END) AS new_case', [dateStart, dateEnd]),
        db.raw('SUM(CASE WHEN ip.datedsc BETWEEN ? AND ? THEN 1 ELSE 0 END) AS discharge', [dateStart, dateEnd]),
        db.raw('SUM(CASE WHEN ip.refer IS NOT NULL AND ip.refer != "" THEN 1 ELSE 0 END) AS referin'),
        db.raw('SUM(CASE WHEN ip.datedsc BETWEEN ? AND ? THEN adjrw ELSE 0 END) AS adjrw', [dateStart, dateEnd]),
        db.raw('SUM(CASE WHEN ip.datedsc BETWEEN ? AND ? AND LEFT(ip.stat_dsc,1) IN ("8","9") THEN 1 ELSE 0 END) AS death', [dateStart, dateEnd]))
        .count('* as cases')
        .sum('ip.pday as los')
        .whereRaw('ip.dateadm <= ?', [dateStart])
        .whereRaw('(ip.disc IS NULL OR ip.datedsc BETWEEN ? AND ?)', [dateStart, dateEnd])
        .andWhere(function () {
          this.whereNull('ip.disc').orWhere('ip.disc', '>=', date);
        });
    } else {
      date = moment(date).format('YYYY-MM-DD');
      sql = sql.select(
        db.raw('SUM(CASE WHEN ip.admite = ? THEN 1 ELSE 0 END) AS new_case', [date]),
        db.raw('SUM(CASE WHEN ip.disc = ? THEN 1 ELSE 0 END) AS discharge', [date]),
        db.raw('SUM(CASE WHEN ip.refer IS NOT NULL AND ip.refer != "" THEN 1 ELSE 0 END) AS referin'),
        db.raw('SUM(CASE WHEN ip.disc = ? THEN adjrw ELSE 0 END) AS adjrw', [date]),
        db.raw('SUM(CASE WHEN LEFT(ip.stat_dsc,1) IN ("8","9") THEN 1 ELSE 0 END) AS death'))
        .count('* as cases')
        .sum('ip.pday as los')
        .where('ip.admite', '<=', date)
        .andWhere(function () {
          this.whereNull('ip.disc').orWhere('ip.disc', '>=', date);
        });
    }
    sql = sql.where('ip.admite', '>', dateAdmitLimit);   // Protect ไม่นับ admit เกิน 1 ปี
    console.log('concurrentIPDByClinic => ', sql.groupBy('cliniccode').orderBy('cliniccode').toString());
    return sql.groupBy('cliniccode').orderBy('cliniccode');
  }

  concurrentIPDByClinic(db: Knex, date: any) {
    const dateAdmitLimit = moment(date).subtract(1, 'year').format('YYYY-MM-DD');
    date = moment(date).format('YYYY-MM-DD');
    let sql = db('view_ipd_ipd as ip')
      .select('clinic_hdc_name as clinicname',
        db.raw('CASE WHEN clinic_hdc_code IS NULL OR clinic_hdc_code=\'\' OR clinic_hdc_code=\'99\' THEN SUBSTRING(ward_std,2,2) ELSE clinic_hdc_code END AS cliniccode'),
        db.raw('SUM(CASE WHEN ip.admite = ? THEN 1 ELSE 0 END) AS new_case', [date]),
        db.raw('SUM(CASE WHEN ip.disc = ? THEN 1 ELSE 0 END) AS discharge', [date]),
        db.raw('SUM(CASE WHEN ip.refer IS NOT NULL AND ip.refer != "" THEN 1 ELSE 0 END) AS referin'),
        db.raw('SUM(CASE WHEN ip.disc = ? THEN adjrw ELSE 0 END) AS adjrw', [date]),
        db.raw('SUM(CASE WHEN LEFT(ip.stat_dsc,1) IN ("8","9") THEN 1 ELSE 0 END) AS death'))
      .count('* as cases')
      .sum('ip.pday as los')
      .whereBetween('ip.admite', [dateAdmitLimit, date])  // Protect ไม่นับ admit เกิน 1 ปี
      .andWhere(function () {
        this.whereNull('ip.disc').orWhere('ip.disc', '>=', date);
      });
    // console.log(sql.groupBy('cliniccode').orderBy('cliniccode').toString());
    return sql.groupBy('cliniccode').orderBy('cliniccode');
  }
  sumOpdVisitByClinic(db: Knex, date: any) {
    date = moment(date).format('YYYY-MM-DD'); // for safety date format
    let sql = db('view_opd_visit as visit')
      .select('visit.date',
        db.raw('CASE WHEN clinic_std IS NULL OR clinic_std = "" THEN "99" ELSE SUBSTRING(visit.clinic_std, 2, 2) END as cliniccode'),
        'visit.dxclinic_name as clinicname',
        db.raw('SUM(CASE WHEN visit.ipd_an IS NULL OR visit.ipd_an = "" THEN 0 ELSE 1 END) AS admit'))
      .count('* as cases')
      .where('visit.date', date);
    return sql.groupBy('cliniccode').orderBy('cliniccode');
  }

  getVisitForMophAlert(db: Knex, date: any, isRowCount: boolean = false, start = -1, limit: number = 1000) {
    date = moment(date).format('YYYY-MM-DD'); // for safety date format

    // Detect database client for cross-database compatibility
    const client = db.client.config.client;
    const isMSSQL = client === 'mssql';
    const isPostgreSQL = client === 'pg' || client === 'postgres' || client === 'postgresql';
    const isOracle = client === 'oracledb' || client === 'oracle';

    // LENGTH() function
    // MySQL/PostgreSQL/Oracle: LENGTH()
    // MSSQL: LEN()
    const lengthCheck = isMSSQL
      ? 'LEN(no_card) = 13'
      : 'LENGTH(no_card) = 13';

    // LOCATE/POSITION/CHARINDEX/INSTR for text search
    // MySQL: LOCATE(substring, string) = 0
    // PostgreSQL: POSITION(substring IN string) = 0
    // MSSQL: CHARINDEX(substring, string) = 0
    // Oracle: INSTR(string, substring) = 0
    const locateCheck = isMSSQL
      ? "CHARINDEX('เสียชีวิต', opd_result) = 0"
      : isPostgreSQL
        ? "POSITION('เสียชีวิต' IN opd_result) = 0"
        : isOracle
          ? "INSTR(opd_result, 'เสียชีวิต') = 0"
          : "LOCATE('เสียชีวิต', opd_result) = 0";

    let query = db('hospdata.view_opd_visit')
      .where('date', date)
      .where('visit_grp', 'not in', [16, 19, 7, 3, 13, 7])
      .where('status', 'not in', [3, 6, 7, 8, 9, 1112, 16, 20, 21, 52, 0, 98, 99])
      .whereRaw(lengthCheck)
      .whereRaw(locateCheck)
      .whereNotIn('dep', [30, 1208, 1209, 1210, 1211, 1213])
      .where('opd_age', '>', 12)
      .where('opd_age_type', 1);

    if (isRowCount) {
      return query.countDistinct('vn as total_rows').first();
    } else {
      if (start >= 0) {
        query = query.offset(start).limit(limit);
      }
      return query.select('hn', 'vn', 'no_card as cid',
        db.raw("? as department_type", ['OPD']),
        'dep as department_code', 'dep_name as department_name',
        'date as date_service', 'time as time_service', 'status',
        'opd_result as service_status')
        .groupBy('dep', 'hn');  // 1 HN ส่งครั้งเดียว, กรณีจะให้ตอบทุกรายการ ให้ลบ groupBy ออก
    }
  }

}