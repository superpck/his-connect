import { Knex } from 'knex';
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
let hisHospcode = process.env.HOSPCODE;

export class HisMitnetModel {
  check() {
    return true;
  }

  async testConnect(db: Knex) {
    const row = await db('concurrentIPDByWard').first();
    return { connection: row ? true : false };
  }

  // รหัสห้องตรวจ
  getDepartment(db: Knex, depCode: string = '', depName: string = '') {
  	let sql = db('getDepartment');
    if (depCode) {
       sql.where('depcode', depCode);
    } else if (depName) {
       sql.whereLike('depname', `%${depName}%`);
    }
    return sql
        .select('*')
        .orderBy('depcode')
        .limit(maxLimit);
  }
  
  // รหัส Ward
  getWard(db: Knex, wardCode: string = '', wardName: string = '') {
    let sql = db('getWard');
    if (wardCode) {
       sql.where('wardcode', wardCode);
    } else if (wardName) {
       sql.whereLike('wardname', `%${wardName}%`);
    }
    return sql
        .select('*')
        .orderBy('wardcode')
		.where('isactive', "1")
        .limit(maxLimit);
  }

  // รายละเอียดแพทย์
  getDr(db: Knex, code: string, license_no: string) {
    let sql = db('getDr');
    if (code) {
       sql.where('code', code);
    } else if (license_no) {
		sql.where('license_no', license_no);
    }
    return sql
        .select('*')
        .orderBy('code')
        .limit(maxLimit);
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

  // MOPH ERP
  countBedNo(db: Knex) {
     return db('getWard')
		.sum('getward.bed_normal as total_bed')
        .where('getWard.isactive', '1');
  }

  async getBedNo(db: Knex, bedno: any = null, start = -1, limit: number = 1000) {
    let sql = db('getbedno')
    .select('*')
    .where('getbedno.isactive', '1');
    if (bedno) {
      sql = sql.where('getbedno.bedno', bedno);
    }
    return sql.orderBy('getbedno.bedno');
  }

  // Report zone
  sumReferIn(db: Knex, dateStart: any, dateEnd: any) {
    return [];
  }

  concurrentIPDByWard(db: Knex, date: any) {
    return db('concurrentIPDByWard')
		.select('*')
		.orderBy('concurrentIPDByWard.wardcode');
  }
  concurrentIPDByClinic_(db: Knex, date: any) {
    return [];
  }
  concurrentIPDByClinic(db: Knex, date: any) {
    return db('concurrentIPDByClinic')
		.select('*')
		.orderBy('concurrentIPDByClinic.cliniccode');
  
  }
  sumOpdVisitByClinic(db: Knex, date: any) {
	return db('OpdVisitByClinic')
		.select('*')
        .where('OpdVisitByClinic.date', date)
		.orderBy('OpdVisitByClinic.cliniccode');
  }
}