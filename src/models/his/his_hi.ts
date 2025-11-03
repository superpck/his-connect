import { Knex } from 'knex';
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
let hisHospcode = process.env.HOSPCODE;

export class HisHiModel {
  check() {
    return true;
  }

  async testConnect(db: Knex) {
    return { connection: true };
  }

  // รหัสห้องตรวจ
  getDepartment(db: Knex, depCode: string = '', depName: string = '') {
    return [];
  }

  // รหัส Ward
  getWard(db: Knex, wardCode: string = '', wardName: string = '') {
    let sql = db('idpm');
    if (wardCode) {
      sql.where('idpm', wardCode);
    } else if (wardName) {
      sql.whereLike('idpmname', `%${wardName}%`)
    }
    return sql
      .select('idpm as wardcode', 'idpmname as wardname',
        `export_code as std_code`, 'bed_std as bed_normal',
        'is_active as isactive'
      )
      .orderBy('idpm')
      .limit(maxLimit);
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

  // MOPH ERP
  countBedNo(db: Knex) {
    return db('ipt')
      .where('dchdate', '0000-00-00')
      .count('an as total_bed')
      .first();
    // return { total_bed: 0 };
  }

  async getBedNo(db: Knex, bedno: any = null, start = -1, limit: number = 1000) {
    return db('ipt')
      .leftJoin('idpm', 'ipt.ward', 'idpm.idpm')
      .leftJoin('iptadm', 'ipt.an', 'iptadm.an')
      .leftJoin('bedtype', 'iptadm.bedtype', 'bedtype.bedtype')
      .where('dchdate', '0000-00-00')
      .select(
        db.raw(`ltrim(substring(iptadm.bedno, 2, 20)) as bedno`)
        , db.raw(`ifnull(iptadm.bedtype, '-') as bedtype`)
        , db.raw(`ifnull(bedtype.namebedtyp,'-') as bedtype_name`)
        , '1 as roomno'
        , 'ipt.ward as wardcode'
        , 'idpm.nameidpm as wardname'
        , 'idpm.is_active as isactive'
        , db.raw(`ifnull(bedtype.type_code, 'N') as bed_type`)
        , db.raw(`if(length(idpm.export_code) = 6, idpm.export_code, concat(idpm.export_code,bedtype.export_code)) as std_code`)
        , '1 as bed_status_type_id'
        , `'active' as bed_status_type_name`
      );
  }

  // Report zone
  sumReferIn(db: Knex, dateStart: any, dateEnd: any) {
    return [];
  }

  concurrentIPDByWard(db: Knex, date: any) {
    return db('ipt')
      .innerJoin('idpm', 'ipt.ward', 'idpm.idpm')
      .where('ipt.rgtdate', '<=', date)
      .andWhere(function () {
        this.where('ipt.dchdate', '>=', date)
          .orWhere('ipt.dchdate', '0000-00-00');
      })
      .select(
        'ipt.ward as wardcode',
        'idpm.nameidpm as wardname',
        db.raw(`count(case when rgtdate = ? then an end) as new_case`, [date]),
        db.raw(`count(case when dchdate = ? then an end) as discharge`, [date]),
        db.raw(`count(case when dchstts in (8,9) then an end) as death`),
        db.raw(`
      count(
        case 
          when rgtdate <= ? 
          and (dchdate > ? or dchdate = '0000-00-00') 
          then an 
        end
      ) as cases
    `, [date, date])
      )
      .groupBy('ipt.ward');
  }
  concurrentIPDByClinic_(db: Knex, date: any) {
    return db('ipt')
      .leftJoin('spclty', 'ipt.dept', 'spclty.spclty')
      .where('ipt.rgtdate', '<=', date)
      .andWhere(function () {
        this.where('ipt.dchdate', '>=', date)
          .orWhere('ipt.dchdate', '0000-00-00');
      })
      .select(
        'ipt.dept as cliniccode',
        'spclty.name as clinicname',
        db.raw(`count(case when rgtdate = ? then an end) as new_case`, [date]),
        db.raw(`count(case when dchdate = ? then an end) as discharge`, [date]),
        db.raw(`count(case when dchstts in (8,9) then an end) as death`),
        db.raw(`
      count(
        case 
          when rgtdate <= ? 
          and (dchdate > ? or dchdate = '0000-00-00') 
          then an 
        end
      ) as cases
    `, [date, date])
      )
      .groupBy('ipt.dept');
  }

  concurrentIPDByClinic(db: Knex, date: any) {
        return db('ipt')
      .leftJoin('spclty', 'ipt.dept', 'spclty.spclty')
      .where('ipt.rgtdate', '<=', date)
      .andWhere(function () {
        this.where('ipt.dchdate', '>=', date)
          .orWhere('ipt.dchdate', '0000-00-00');
      })
      .select(
        'ipt.dept as cliniccode',
        'spclty.namespclty as clinicname',
        db.raw(`count(case when rgtdate = ? then an end) as new_case`, [date]),
        db.raw(`count(case when dchdate = ? then an end) as discharge`, [date]),
        db.raw(`count(case when dchstts in (8,9) then an end) as death`),
        db.raw(`
      count(
        case 
          when rgtdate <= ? 
          and (dchdate > ? or dchdate = '0000-00-00') 
          then an 
        end
      ) as cases
    `, [date, date])
      )
      .groupBy('ipt.dept');
  }
  sumOpdVisitByClinic(db: Knex, date: any) {
    return [];
  }
}