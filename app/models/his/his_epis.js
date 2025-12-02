"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisEPisModel = void 0;
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
let hisHospcode = process.env.HOSPCODE;
class HisEPisModel {
    getWard(db, wardCode = '', wardName = '') {
        return [];
    }
    countBedNo(db) {
        return { total_bed: 100 };
    }
    async getBedNo(db, bedno = null, start = -1, limit = 1000) {
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
    concurrentIPDByWard(db, date) {
        return [];
    }
    concurrentIPDByClinic_(db, date) {
        return [];
    }
    concurrentIPDByClinic(db, date) {
        return [];
    }
    sumOpdVisitByClinic(db, date) {
        return [];
    }
    getVisitForMophAlert(db, date, isRowCount = false, limit = 1000, start = -1) {
        if (isRowCount) {
            return { row_count: 0 };
        }
        else {
            return [];
        }
    }
    check() {
        return true;
    }
    async testConnect(db) {
        const row = await db('wardroomhst').first();
        return { connection: row ? true : false };
    }
    getDepartment(db, depCode = '', depName = '') {
        return [];
    }
    getDr(db, code, license_no) {
        return [];
    }
    async getPerson1(db, columnName, searchText) {
        return [];
    }
    getReferOut(db, date, hospCode = hisHospcode, visitNo = null) {
        return [];
    }
    sumReferOut(db, dateStart, dateEnd) {
        return [];
    }
    getPerson(db, columnName, searchText, hospCode = hisHospcode) {
        return [];
    }
    getAddress(db, columnName, searchNo, hospCode = hisHospcode) {
        return [];
    }
    getService(db, columnName, searchText, hospCode = hisHospcode) {
        return [];
    }
    getDiagnosisOpd(db, visitno, hospCode = hisHospcode) {
        return [];
    }
    getDiagnosisOpdAccident(db, dateStart, dateEnd, hospCode = hisHospcode) {
        return [];
    }
    async getDiagnosisOpdVWXY(db, date) {
        return [];
    }
    async getDiagnosisSepsisOpd(db, dateStart, dateEnd) {
        return [];
    }
    async getDiagnosisSepsisIpd(db, dateStart, dateEnd) {
        return [];
    }
    getProcedureOpd(db, visitno, hospCode = hisHospcode) {
        return [];
    }
    getChargeOpd(db, visitNo, hospCode = hisHospcode) {
        return [];
    }
    getLabRequest(db, columnName, searchNo, hospCode = hisHospcode) {
        return [];
    }
    getLabResult(db, columnName, searchNo, referID = '', hospCode = hisHospcode) {
        return [];
    }
    getInvestigation(db, columnName, searchNo, hospCode = hisHospcode) {
        return [];
    }
    getDrugOpd(db, visitNo, hospCode = hisHospcode) {
        return [];
    }
    getAdmission(db, columnName, searchValue, hospCode = hisHospcode) {
        return [];
    }
    getDiagnosisIpd(db, columnName, searchNo, hospCode = hisHospcode) {
        return [];
    }
    getDiagnosisIpdAccident(db, dateStart, dateEnd, hospCode = hisHospcode) {
        return [];
    }
    getProcedureIpd(db, an, hospCode = hisHospcode) {
        return [];
    }
    getChargeIpd(db, an, hospCode = hisHospcode) {
        return [];
    }
    async getDrugIpd(db, an, hospCode = hisHospcode) {
        return [];
    }
    getAccident(db, visitNo, hospCode = hisHospcode) {
        return [];
    }
    getDrugAllergy(db, hn, hospCode = hisHospcode) {
        return [];
    }
    getAppointment(db, visitNo, hospCode = hisHospcode) {
        return [];
    }
    async getReferHistory(db, columnName, searchNo, hospCode = hisHospcode) {
        return [];
    }
    getClinicalRefer(db, referNo, hospCode = hisHospcode) {
        return [];
    }
    getInvestigationRefer(db, referNo, hospCode = hisHospcode) {
        return [];
    }
    getCareRefer(db, referNo, hospCode = hisHospcode) {
        return [];
    }
    getReferResult(db, visitDate, hospCode = hisHospcode) {
        return [];
    }
    getProviderDr(db, drList) {
        return [];
    }
    getProvider(db, columnName, searchNo, hospCode = hisHospcode) {
        return [];
    }
    getData(db, tableName, columnName, searchNo, hospCode = hisHospcode) {
        return [];
    }
    sumReferIn(db, dateStart, dateEnd) {
        return [];
    }
}
exports.HisEPisModel = HisEPisModel;
