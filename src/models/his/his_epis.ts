import { Knex } from 'knex';
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
let hisHospcode = process.env.HOSPCODE;

export class HisEPisModel {
  // MOPH ERP =========================================================================
  // รหัส Ward
  getWard(db: Knex, wardCode: string = '', wardName: string = '') {
    return [];
  }

  // รหัส เตียง
  countBedNo(db: Knex) {
    return { total_bed: 100 };
  }

  async getBedNo(db: Knex, bedno: any = null, start = -1, limit: number = 1000) {
    let sql = `SELECT 
      wardroomhst.bedno as bedno
      ,wardroomhst.bedtype as bedtype
      ,bedtype.name as bedtype_name
      ,wardroomhst.room as roomno
      ,wardroomhst.ward as wardcode
      ,ward.name as wardname
      ,(select phisenv.val from phisenv where  phisenv.section = 'HPTENV' and phisenv.var = 'HPTCODE') as std_code
      , Case When UPPER(bedtype.var) like '%ICU' Then 'ICU'
      When UPPER(bedtype.var) like 'RESERVE%' Then 'S'
      Else 'N' End As bed_type
      ,'1' as isactive
      FROM wardroomhst
      LEFT OUTER JOIN bedtype ON wardroomhst.bedtype = bedtype.bedtype
      LEFT OUTER JOIN ward ON wardroomhst.ward  = ward.ward
      WHERE
        wardroomhst.canceldate is null
        and wardroomhst.wardroomst = 10;`;
    const result = await db.raw(sql);
    return result[0];
  }

  concurrentIPDByWard(db: Knex, date: any) {
    return [];
  }
  concurrentIPDByClinic_(db: Knex, date: any) {
    return [];
  }
  concurrentIPDByClinic(db: Knex, date: any) {
    return [];
  }
  sumOpdVisitByClinic(db: Knex, date: any) {
    return [];
  }

  getVisitForMophAlert(db: Knex, date: any, isRowCount: boolean = false, limit: number = 1000, start = -1) {
    if (isRowCount) {
      return { row_count: 0 };
    } else {
      return [];
    }
  }

  // nRefer =============================================================================
  check() {
    return true;
  }

  async testConnect(db: Knex) {
    const row = await db('wardroomhst').first();
    return { connection: row ? true : false };
  }

  // รหัสห้องตรวจ
  getDepartment(db: Knex, depCode: string = '', depName: string = '') {
    return [];
  }

  // รายละเอียดแพทย์
  getDr(db: Knex, code: string, license_no: string) {
    return [];
  }

  async getPerson1(db: Knex, columnName, searchText) {
    return [];
  }

  // select รายชื่อเพื่อแสดงทะเบียน
  getReferOut(db: Knex, date: any, hospCode = hisHospcode, visitNo: string = null) {
    return [];
  }

  sumReferOut(db: Knex, dateStart: any, dateEnd: any) {
    return [];
  }

  getPerson(db: Knex, columnName, searchText, hospCode = hisHospcode) {
    return [];
  }

  getAddress(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
    return [];
  }

  getService(db: Knex, columnName: string, searchText: any, hospCode = hisHospcode) {
    return [];
  }

  getDiagnosisOpd(db: Knex, visitno: string, hospCode = hisHospcode) {
    return [];
  }
  getDiagnosisOpdAccident(db: Knex, dateStart: any, dateEnd: any, hospCode = hisHospcode) {
    return [];
  }
  async getDiagnosisOpdVWXY(db: Knex, date: any) {
    return [];
  }
  async getDiagnosisSepsisOpd(db: Knex, dateStart: any, dateEnd: any) {
    return [];
  }
  async getDiagnosisSepsisIpd(db: Knex, dateStart: any, dateEnd: any) {
    return [];
  }

  getProcedureOpd(db: Knex, visitno: string, hospCode = hisHospcode) {
    return [];
  }

  getChargeOpd(db: Knex, visitNo: string, hospCode = hisHospcode) {
    return [];
  }

  getLabRequest(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
    return [];
  }

  getLabResult(db: Knex, columnName, searchNo, referID = '', hospCode = hisHospcode) {
    return [];
  }

  getInvestigation(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
    return [];
  }

  getDrugOpd(db: Knex, visitNo: string, hospCode = hisHospcode) {
    return [];
  }

  getAdmission(db: Knex, columnName: string, searchValue: any, hospCode = hisHospcode) {
    return [];
  }

  getDiagnosisIpd(db: Knex, columnName: string, searchNo: string, hospCode = hisHospcode) {
    return [];
  }
  getDiagnosisIpdAccident(db: Knex, dateStart: any, dateEnd: any, hospCode = hisHospcode) {
    return [];
  }

  getProcedureIpd(db: Knex, an, hospCode = hisHospcode) {
    return [];
  }

  getChargeIpd(db: Knex, an: string, hospCode = hisHospcode) {
    return [];
  }

  async getDrugIpd(db: Knex, an: string, hospCode = hisHospcode) {
    return [];
  }

  getAccident(db: Knex, visitNo: string, hospCode = hisHospcode) {
    return [];
  }

  getDrugAllergy(db: Knex, hn, hospCode = hisHospcode) {
    return [];
  }

  getAppointment(db: Knex, visitNo: string, hospCode = hisHospcode) {
    return [];
  }

  async getReferHistory(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
    return [];
  }

  getClinicalRefer(db: Knex, referNo, hospCode = hisHospcode) {
    return [];
  }

  getInvestigationRefer(db: Knex, referNo, hospCode = hisHospcode) {
    return [];
  }

  getCareRefer(db: Knex, referNo, hospCode = hisHospcode) {
    return [];
  }

  getReferResult(db: Knex, visitDate, hospCode = hisHospcode) {
    return [];
  }
  getProviderDr(db: Knex, drList: any[]) {
    return [];
  }
  getProvider(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
    return [];
  }

  getData(db: Knex, tableName, columnName, searchNo, hospCode = hisHospcode) {
    return [];
  }

  // Report zone
  sumReferIn(db: Knex, dateStart: any, dateEnd: any) {
    return [];
  }

}