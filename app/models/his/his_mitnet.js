"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisMitnetModel = void 0;
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
let hisHospcode = process.env.HOSPCODE;
class HisMitnetModel {
    check() {
        return true;
    }
    async testConnect(db) {
        const row = await db('concurrentIPDByWard').first();
        return { connection: row ? true : false };
    }
    getDepartment(db, depCode = '', depName = '') {
        let sql = db('getDepartment');
        if (depCode) {
            sql.where('depcode', depCode);
        }
        else if (depName) {
            sql.whereLike('depname', `%${depName}%`);
        }
        return sql
            .select('*')
            .orderBy('depcode')
            .limit(maxLimit);
    }
    getWard(db, wardCode = '', wardName = '') {
        let sql = db('getWard');
        if (wardCode) {
            sql.where('wardcode', wardCode);
        }
        else if (wardName) {
            sql.whereLike('wardname', `%${wardName}%`);
        }
        return sql
            .select('*')
            .orderBy('wardcode')
            .where('isactive', "1")
            .limit(maxLimit);
    }
    getDr(db, code, license_no) {
        let sql = db('getDr');
        if (code) {
            sql.where('code', code);
        }
        else if (license_no) {
            sql.where('license_no', license_no);
        }
        return sql
            .select('*')
            .orderBy('code')
            .limit(maxLimit);
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
    countBedNo(db) {
        return db('getWard')
            .sum('getward.bed_normal as total_bed')
            .where('getWard.isactive', '1');
    }
    async getBedNo(db, bedno = null, start = -1, limit = 1000) {
        let sql = db('getbedno')
            .select('*')
            .where('getbedno.isactive', '1');
        if (bedno) {
            sql = sql.where('getbedno.bedno', bedno);
        }
        return sql.orderBy('getbedno.bedno');
    }
    sumReferIn(db, dateStart, dateEnd) {
        return [];
    }
    concurrentIPDByWard(db, date) {
        return db('concurrentIPDByWard')
            .select('*')
            .orderBy('concurrentIPDByWard.wardcode');
    }
    concurrentIPDByClinic_(db, date) {
        return [];
    }
    concurrentIPDByClinic(db, date) {
        return db('concurrentIPDByClinic')
            .select('*')
            .orderBy('concurrentIPDByClinic.cliniccode');
    }
    sumOpdVisitByClinic(db, date) {
        return db('OpdVisitByClinic')
            .select('*')
            .where('OpdVisitByClinic.date', date)
            .orderBy('OpdVisitByClinic.cliniccode');
    }
    getVisitForMophAlert(db, date) {
        return [];
    }
}
exports.HisMitnetModel = HisMitnetModel;
