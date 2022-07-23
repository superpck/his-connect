import * as knex from 'knex';
const maxLimit = 2500;
const dbName = process.env.CANNABIS_DB_NAME;

export class CannabisModel {
  async testConnection(db: knex) {
    return await db(dbName + '.ccd_person')
      .select('hospcode', 'hn')
      .limit(1);
  }

  async searchPatient(db: knex, cid: any): Promise<any> {
    return db(dbName + '.ccd_person')
      .where('cid', cid)
      .limit(1);
  }

  async searchVisit(db: knex, hn: any, startDate = null, endDate = null): Promise<any> {
    let where = `ccd_opd_visit.hn='${hn}'`;
    if (startDate && endDate) {
      where = ` and ccd_opd_visit.vstdate between '${startDate}' and '${endDate}'  `
    }
    return db(dbName + '.ccd_opd_visit')
      .innerJoin(dbName + '.ccd_person', 'ccd_opd_visit.hn', 'ccd_person.hn')
      .select('ccd_opd_visit.*', 'ccd_person.prename'
        , 'ccd_person.fname', 'ccd_person.lname', 'ccd_person.birthday'
        , 'ccd_person.sex', 'ccd_person.address_id', 'ccd_person.mobile')
      .where(db.raw(where))
      .orderByRaw('ccd_opd_visit.vstdate DESC, ccd_opd_visit.vsttime DESC')
      .limit(10);
  }

  async patientInfo(db: knex, hn: any): Promise<any> {
    return db(dbName + '.ccd_person')
      .where('hn', hn)
      .limit(1);
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
