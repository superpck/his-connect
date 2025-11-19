import { Knex } from 'knex';
import * as moment from 'moment';

const maxLimit = 250;
const hcode = process.env.HOSPCODE;
let hisHospcode = process.env.HOSPCODE;
const noDate = '0000-00-00';

export class HisHiModel {
  check() {
    return true;
  }

  async testConnect(db: Knex) {
    const patient = await db('ipt').first();
    return { connection: patient ? true : false };
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
      sql.whereLike('nameidpm', `%${wardName}%`)
    }
    return sql
      .select('idpm as wardcode', 'nameidpm as wardname',
        `export_code as std_code`, 'bed_normal', 'bed_sp as bed_special', 'bed_icu', 'bed_extra',
        'is_active as isactive'
      )
      .where(db.raw(`idpm <> ''`))
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

  // Report zone
  sumReferIn(db: Knex, dateStart: any, dateEnd: any) {
    return [];
  }

  // MOPH ERP ========================================================
  // นับจำนวนเตียงทั้งหมด
  countBedNo(db: Knex) {
    return db('ipt')
      .where('dchdate', noDate)
      .count('an as total_bed')
      .first();
  }

  async getBedNo(db: Knex, bedno: any = null, start = -1, limit: number = 1000) {
    let sql = db('ipt');
    if (start >= 0) {
      sql = sql.offset(start).limit(limit);
    }
    return sql
      .leftJoin('idpm', 'ipt.ward', 'idpm.idpm')
      .leftJoin('iptadm', 'ipt.an', 'iptadm.an')
      .leftJoin('bedtype', 'iptadm.bedtype', 'bedtype.bedtype')
      .whereRaw('dchdate = ? or dchdate is null', [noDate])
      .andWhere(db.raw(`ipt.ward <> ''`))
      .select(
        db.raw(`${hcode} as hospcode`)
        , db.raw(`ifnull(nullif(ltrim(substring(iptadm.bedno, 2, 20)), 'ไม่ระบุเตียง'), 'ไม่ระบุเตียง') as bedno`)
        , db.raw(`ifnull(bedtype.type_code, 'N') as bedtype`)
        , db.raw(`ifnull(bedtype.namebedtyp,'-') as bedtype_name`)
        , 'ipt.ward as wardcode'
        , 'idpm.nameidpm as wardname'
        , 'idpm.is_active as isactive'
        , db.raw(`if(bedtype.export_code is null, idpm.export_code, concat(substr(idpm.export_code,1,3),bedtype.export_code)) as std_code`)
      );
  }

  concurrentIPDByWard(db: Knex, date: any) { // date: datetime
    const dateAdmitLimit = moment(date).subtract(1, 'year').format('YYYY-MM-DD');
    const dateStart = moment(date).locale('TH').startOf('hour').format('YYYY-MM-DD HH:mm:ss');
    const dateEnd = moment(date).locale('TH').endOf('hour').format('YYYY-MM-DD HH:mm:ss');
    return db('ipt')
      .innerJoin('idpm', 'ipt.ward', 'idpm.idpm')
      .innerJoin('iptadm', 'ipt.an', 'iptadm.an')
      .leftJoin('bedtype', 'iptadm.bedtype', 'bedtype.bedtype')
      .where(db.raw(`concat(ipt.rgtdate,' ',time(ipt.rgttime*100)) <= ?`, [dateEnd]))
      .andWhere('ipt.rgtdate', '>=', dateAdmitLimit)
      .andWhere(function () {
        this.where(db.raw(`concat(ipt.dchdate,' ',time(ipt.dchtime*100)) >= ?`, [dateStart]))
          .orWhere('ipt.dchdate', noDate);
      })
      .andWhere(db.raw(`ipt.ward <> ''`))
      .select(
        db.raw(`? as hospcode`, [hcode]),
        'ipt.ward as wardcode',
        'idpm.nameidpm as wardname',
        db.raw(`count(case when concat(rgtdate,' ',time(rgttime*100)) between ?  and ? then ipt.an end) as new_case`, [dateStart, dateEnd]),
        db.raw(`count(case when concat(dchdate,' ',time(dchtime*100)) between ?  and ? then ipt.an end) as discharge`, [dateStart, dateEnd]),
        db.raw(`count(case when dchstts in (8,9) and concat(dchdate,' ',time(dchtime*100)) between ?  and ? then ipt.an end) as death`, [dateStart, dateEnd]),
        db.raw(`
            count(
              case 
                when concat(rgtdate,' ',time(rgttime*100)) <= ? 
                and (concat(dchdate,' ',time(dchtime*100)) > ? or dchdate = ?) 
                then ipt.an 
              end
            ) as cases
    `, [dateEnd, dateStart, noDate]),
        db.raw(`count(case when bedtype.type_code = 'N' then ipt.an end) as normal`),
        db.raw(`count(case when bedtype.type_code = 'S' then ipt.an end) as special`),
        db.raw(`count(case when bedtype.type_code = 'ICU' then ipt.an end) as icu`),
        db.raw(`count(case when bedtype.type_code = 'SEMI' then ipt.an end) as semi`),
        db.raw(`count(case when bedtype.type_code = 'HW' then ipt.an end) as homeward`),
        db.raw(`count(case when bedtype.type_code = 'IMC' then ipt.an end) as imc`),
        db.raw(`count(case when bedtype.type_code = 'LR' then ipt.an end) as lr`),
        db.raw(`count(case when bedtype.type_code = 'STROKE' then ipt.an end) as stroke`),
        db.raw(`count(case when bedtype.type_code = 'BURN' then ipt.an end) as burn`),
      )
      .groupBy('ipt.ward');
  }

  concurrentIPDByClinic(db: Knex, date: any) { // date: datetime
    const dateAdmitLimit = moment(date).subtract(1, 'year').format('YYYY-MM-DD');
    const dateStart = moment(date).locale('TH').startOf('hour').format('YYYY-MM-DD HH:mm:ss');
    const dateEnd = moment(date).locale('TH').endOf('hour').format('YYYY-MM-DD HH:mm:ss');
    return db('ipt')
      .innerJoin('idpm', 'ipt.ward', 'idpm.idpm')
      .innerJoin('iptadm', 'ipt.an', 'iptadm.an')
      .leftJoin('bedtype', 'iptadm.bedtype', 'bedtype.bedtype')
      .leftJoin('spclty', 'ipt.dept', 'spclty.spclty')
      .where(db.raw(`concat(ipt.rgtdate,' ',time(ipt.rgttime*100)) <= ?`, [dateEnd]))
      .andWhere('ipt.rgtdate', '>=', dateAdmitLimit)
      .andWhere(function () {
        this.where(db.raw(`concat(ipt.dchdate,' ',time(ipt.dchtime*100)) >= ?`, [dateStart]))
          .orWhere('ipt.dchdate', noDate);
      })
      .andWhere(db.raw(`ipt.ward <> ''`))
      .select(
        db.raw(`${hcode} as hospcode`),
        db.raw(`if(ipt.dept = '' or ipt.dept is null,'00',ipt.dept) as cliniccode`),
        db.raw(`ifnull(spclty.namespclty,'ไม่ระบุ') as clinicname`),
        db.raw(`count(case when concat(rgtdate,' ',time(rgttime*100)) between ?  and ? then ipt.an end) as new_case`, [dateStart, dateEnd]),
        db.raw(`count(case when concat(dchdate,' ',time(dchtime*100)) between ?  and ? then ipt.an end) as discharge`, [dateStart, dateEnd]),
        db.raw(`count(case when dchstts in (8,9) and concat(dchdate,' ',time(dchtime*100)) between ?  and ? then ipt.an end) as death`, [dateStart, dateEnd]),
        db.raw(`
            count(
              case 
                when concat(rgtdate,' ',time(rgttime*100)) <= ? 
                and (concat(dchdate,' ',time(dchtime*100)) > ? or dchdate = ?) 
                then ipt.an 
              end
            ) as cases
    `, [dateEnd, dateStart, noDate]),
        db.raw(`count(case when bedtype.type_code = 'N' then ipt.an end) as normal`),
        db.raw(`count(case when bedtype.type_code = 'S' then ipt.an end) as special`),
        db.raw(`count(case when bedtype.type_code = 'ICU' then ipt.an end) as icu`),
        db.raw(`count(case when bedtype.type_code = 'SEMI' then ipt.an end) as semi`),
        db.raw(`count(case when bedtype.type_code = 'HW' then ipt.an end) as homeward`),
        db.raw(`count(case when bedtype.type_code = 'IMC' then ipt.an end) as imc`),
        db.raw(`count(case when bedtype.type_code = 'LR' then ipt.an end) as lr`),
        db.raw(`count(case when bedtype.type_code = 'STROKE' then ipt.an end) as stroke`),
        db.raw(`count(case when bedtype.type_code = 'BURN' then ipt.an end) as burn`),
      )
      .groupBy('ipt.dept');
  }

  sumOpdVisitByClinic(db: Knex, date: any) {
    date = moment(date).locale('TH').format('YYYY-MM-DD'); // set date only
    return db('ovst as visit')
      .innerJoin('cln', 'visit.cln', 'cln.cln')
      .innerJoin('spclty as spec', 'cln.specialty', 'spec.spclty')
      .where(db.raw(`date(visit.vstdttm) = ?`, [date]))
      .select(db.raw(`? as hospcode`, [hcode]),
        db.raw(`IFNULL(cln.specialty, '00') as cliniccode`), 'spec.namespclty as clinicname',
        db.raw(`COUNT(
          CASE 
            WHEN visit.an > 0 THEN visit.an  
          END
        ) AS admit`)
      )
      .count('visit.vn as cases')
      .groupBy('cln.specialty')
      .orderBy('cln.specialty');
  }
  
  getVisitForMophAlert(db: Knex, date: any) {
      date = moment(date).locale('TH').format('YYYY-MM-DD');
      let sql = db('ovst as visit') // ข้อมูลผู้ป่วยนอก
      .innerJoin('pt as patient', 'visit.hn', 'patient.hn') // ข้อมูลประชาชน
      .leftJoin('cln as clinic', 'visit.cln', 'clinic.cln') // ห้องตรวจ
      .leftJoin('ipt as admission', 'visit.an', 'admission.an') // ผู้ป่วยใน
      .leftJoin('idpm as ward', 'admission.ward', 'ward.idpm') // ward ผู้ป่วยใน
      .where(db.raw(`((date(visit.vstdttm) = ? and visit.an = 0 and visit.ovstost = '1') or admission.dchdate = ?) `, [date, date]))
      // เฉพาะผู้ป่วยนอกที่มาในวันนั้น และ status 1 = discharge กลับบ้าน หรือ ผู้ป่วยในที่จำหน่ายในวันนั้น 
      .andWhere(db.raw(`patient.pop_id <> ''`)) // ต้องมีหมายเลขบัตรประชาชน
      .andWhere(db.raw(`patient.pop_id is not null`)) // ต้องมีหมายเลขบัตรประชาชน
      .andWhere(db.raw(`length(patient.pop_id) = 13`)) // ต้องมีความยาว 13 หลัก
      .andWhere(db.raw(`length(patient.pop_id) not in (?,?)`, ['1111111111119', '9999999999994'])) // ไม่เอาหมายเลขประชาชนตัวอย่าง
      .andWhere(db.raw(`timestampdiff(year, patient.brthdate, ?) between 15 and 90`, [date])) // อายุระหว่าง 15-90 ปี
      .andWhere(db.raw(`patient.ntnlty = '99'`)) // สัญชาติไทย
      ;
    return sql
      .select('visit.hn', 'visit.vn', 'patient.pop_id as cid',
        db.raw(`CASE
              when visit.an > 0 and substr(ward.export_code,4,3) = '606' THEN 'HOMEWARD'
              WHEN visit.an > 0 and substr(ward.export_code,4,3) <> '606' THEN 'IPD' 
              WHEN visit.an = 0 and visit.cln = '20100' THEN 'ER' 
              ELSE 'OPD' END as department_type`),
        'clinic.cln as department_code', 'clinic.namecln as department_name',
        db.raw('date(visit.vstdttm) as date_service'),
        db.raw('time(visit.vstdttm) as time_service')
      )
      .groupBy('visit.cln', 'visit.hn'); // กันซ้ำ hn ในวันเดียวกันในห้องตรวจเดียวกัน
  }
}
