"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisModel = void 0;
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
let hisHospcode = process.env.HOSPCODE;
class HisModel {
    check() {
        return true;
    }
    async testConnect(db) {
        return { connection: true };
    }
    getDepartment(db, depCode = '', depName = '') {
        return [];
    }
    getWard(db, wardCode = '', wardName = '') {
        return [];
    }
    getDr(db, code, license_no) {
        return [];
    }
    getReferOut(db, date, hospCode = hisHospcode, visitNo = null) {
        return [];
    }
    sumReferOut(db, dateStart, dateEnd) {
        return [];
    }
    async getPerson(db, columnName, searchText, hospCode = hisHospcode) {
        if (!columnName || !searchText) {
            throw new Error('Invalid parameter');
        }
        let query = db('person')
            .select('person.*', 'ethnic as race', 'father as father_name', 'mother as mother_name');
        if (Array.isArray(searchText)) {
            query = query.whereIn(columnName, searchText);
        }
        else {
            query = query.where(columnName, searchText);
        }
        return query.limit(maxLimit);
    }
    getAddress(db, columnName, searchNo, hospCode = hisHospcode) {
        return db('address')
            .select('hn', 'addresstype', 'house_no', 'village as village_no', 'village_name', 'alley', 'road', 'province', 'district', 'subdistrict', 'zip', 'tel_home as tel')
            .where(columnName || 'hn', searchNo)
            .limit(maxLimit);
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
    countBedNo(db) {
        return { total_bed: 0 };
    }
    async getBedNo(db, bedno = null, start = -1, limit = 1000) {
        return [];
    }
    sumReferIn(db, dateStart, dateEnd) {
        return [];
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
}
exports.HisModel = HisModel;
