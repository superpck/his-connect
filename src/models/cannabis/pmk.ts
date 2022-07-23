import * as knex from 'knex';
const maxLimit = 2500;
const dbName = process.env.CANNABIS_DB_NAME;
const hcode = process.env.HOSPCODE;

export class PmkModel {

  testConnection(db: knex) {
    return db('PATIENTS as p')
      .select(db.raw(`'${hcode}' AS "hospcode"`))
      .select('p.ID_CARD as cid', 'p.HN as hn', 'p.PRENAME as provis_pname'
        , 'p.PRENAME as prename', 'p.NAME as fname', 'p.SURNAME as lname'
        , 'p.BIRTHDAY as birthday')
      .select(db.raw(`case when p.SEX='F' then 2 else 1 end as sex`))
      .select('p.HOME as address', 'p.VILLAGE as moo', 'p.VILLANAME as village'
        , 'p.ROAD as street', 'p.SOIMAIN as soi')
      .select(db.raw(`substr(p.TAMBON,1,2) as province_code`))
      .select(db.raw(`substr(p.TAMBON,3,2) as district_code`))
      .select(db.raw(`substr(p.TAMBON,5,2) as subdistrict_code`))
      .select('p.TAMBON as address_id', 'p.ZIP_CODE as zip'
        , 'p.TEL as telephone', 'p.MOBILE as mobile'
        , 'p.MAR_MARYSTATUS_ID as nhso_marriage_code'
        , 'p.ETH_ETHNIC_ID as nation_code'
        , 'p.ETH_ETHNIC_ID as citizenship'
        , 'p.REL_RELIGION_ID as religion_code'
        , 'p.WHO as informname', 'p.RELATION', 'p.WHO_PLACE as informtel'
        , 'p.DRUG_ALLERGY_HX as drugallergy')
      .limit(1);
  }

  searchPatient(db: knex, cid: any): Promise<any> {
    return db('PATIENTS as p')
      .select(db.raw(`'${hcode}' AS "hospcode"`))
      .select('p.ID_CARD as cid', 'p.HN as hn', 'p.PRENAME as provis_pname'
        , 'p.PRENAME as prename', 'p.NAME as fname', 'p.SURNAME as lname'
        , 'p.BIRTHDAY as birthday')
      .select(db.raw(`case when p.SEX='F' then 2 else 1 end as sex`))
      .select('p.HOME as address', 'p.VILLAGE as moo', 'p.VILLANAME as village'
        , 'p.ROAD as street', 'p.SOIMAIN as soi')
      .select(db.raw(`substr(p.TAMBON,1,2) as province_code`))
      .select(db.raw(`substr(p.TAMBON,3,2) as district_code`))
      .select(db.raw(`substr(p.TAMBON,5,2) as subdistrict_code`))
      .select('p.TAMBON as address_id', 'p.ZIP_CODE as zip'
        , 'p.TEL as telephone', 'p.MOBILE as mobile'
        , 'p.MAR_MARYSTATUS_ID as nhso_marriage_code'
        , 'p.ETH_ETHNIC_ID as nation_code'
        , 'p.ETH_ETHNIC_ID as citizenship'
        , 'p.REL_RELIGION_ID as religion_code'
        , 'p.WHO as informname', 'p.RELATION', 'p.WHO_PLACE as informtel'
        , 'p.DRUG_ALLERGY_HX as drugallergy')
      .where('p.ID_CARD', cid)
      .limit(1);
  }

  async searchVisit(db: knex, hn: any, startDate = null, endDate = null): Promise<any> {
    let where = `o.hn='${hn}'`;
    if (startDate && endDate) {
      where = ` and o.vstdate between TO_DATE('${startDate}', 'YYYY-MM-DD HH24:MI:SS') and TO_DATE('${endDate}', 'YYYY-MM-DD HH24:MI:SS')`;
    }
    return db(`CCD_OPD_VISIT as o`)
      .innerJoin(db.raw('PATIENTS as p on o.PAT_RUN_HN=p.PAT_RUN_HN and o.PAT_YEAR_HN=p.PAT_YEAR_HN'))
      .select('o.*')
      // .select(db.raw(`TO_CHAR(o.OPD_DATE, 'YYYY-MM-DD') as vstdate`))
      // .select(db.raw(`TO_CHAR(o.OPD_TIME, 'HH24:MI:SS') as vsttime`))
      // .select(db.raw(`concat(TO_CHAR(o.OPD_DATE, 'YYYY-MM-DD '), TO_CHAR(o.OPD_TIME, 'HH24:MI:SS')) as date`))
      .whereRaw(db.raw(where))
      .limit(maxLimit);
  }

  async patientInfo(db: knex, hn: any): Promise<any> {
    return db('PATIENTS as p')
      .select(db.raw(`'${hcode}' AS "hospcode"`))
      .select('p.ID_CARD as cid', 'p.HN as hn', 'p.PRENAME as provis_pname'
        , 'p.PRENAME as prename', 'p.NAME as fname', 'p.SURNAME as lname'
        , 'p.BIRTHDAY as birthday')
      .select(db.raw(`case when p.SEX='F' then 2 else 1 end as sex`))
      .select('p.HOME as address', 'p.VILLAGE as moo', 'p.VILLANAME as village'
        , 'p.ROAD as street', 'p.SOIMAIN as soi')
      .select(db.raw(`substr(p.TAMBON,1,2) as province_code`))
      .select(db.raw(`substr(p.TAMBON,3,2) as district_code`))
      .select(db.raw(`substr(p.TAMBON,5,2) as subdistrict_code`))
      .select('p.TAMBON as address_id', 'p.ZIP_CODE as zip'
        , 'p.TEL as telephone', 'p.MOBILE as mobile'
        , 'p.MAR_MARYSTATUS_ID as nhso_marriage_code'
        , 'p.ETH_ETHNIC_ID as nation_code'
        , 'p.ETH_ETHNIC_ID as citizenship'
        , 'p.REL_RELIGION_ID as religion_code'
        , 'p.WHO as informname', 'p.RELATION', 'p.WHO_PLACE as informtel'
        , 'p.DRUG_ALLERGY_HX as drugallergy')
      .where('p.HN', hn)
      .limit(1);

    //      passport_no 
  }

  async getVisitLab(db: knex, hn: any, vn: any): Promise<any> {
    return db(dbName + '.ccd_lab_result')
      .where('hn', hn)
      .where('vn', vn)
      .limit(maxLimit);
  }

  async getVisitDrug(db: knex, hn: any, vn: any): Promise<any> {
    return db(dbName + '.ccd_dispense_items')
      .where('hn', hn)
      .where('vn', vn)
      .limit(maxLimit);
  }

  async getVisitAppointment(db: knex, hn: any, vn: any): Promise<any> {
    return db(dbName + '.ccd_appointment')
      .where('hn', hn)
      .where('vn', vn)
      .limit(maxLimit);
  }

  async getVisitDiagText(db: knex, hn: any, vn: any): Promise<any> {
    return db(dbName + '.ccd_opd_visit_diag_text')
      .where('hn', hn)
      .where('vn', vn)
      .limit(maxLimit);
  }

  async getVisitDiagnosis(db: knex, hn: any, vn: any): Promise<any> {
    return db(dbName + '.ccd_opd_visit_diag')
      .where('hn', hn)
      .where('vn', vn)
      .limit(maxLimit);
  }

  async getVisitProcedure(db: knex, hn: any, vn: any): Promise<any> {
    return db(dbName + '.ccd_opd_visit_procedure')
      .where('hn', hn)
      .where('vn', vn)
      .limit(maxLimit);
  }

  async getVisitScreening(db: knex, hn: any, vn: any): Promise<any> {
    return db(dbName + '.ccd_opd_visit_screen')
      .where('hn', hn)
      .where('vn', vn)
      .limit(maxLimit);
  }

}
