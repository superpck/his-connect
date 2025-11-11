"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisHiModel = void 0;
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
let hisHospcode = process.env.HOSPCODE;
class HisHiModel {
    check() {
        return true;
    }
    async testConnect(db) {
        const patient = await db('ipt').first();
        return { connection: patient ? true : false };
    }
    getDepartment(db, depCode = '', depName = '') {
        return [];
    }
    getWard(db, wardCode = '', wardName = '') {
        let sql = db('idpm');
        if (wardCode) {
            sql.where('idpm', wardCode);
        }
        else if (wardName) {
            sql.whereLike('idpmname', `%${wardName}%`);
        }
        return sql
            .select('idpm as wardcode', 'idpmname as wardname', `export_code as std_code`, 'bed_std as bed_normal', 'is_active as isactive')
            .orderBy('idpm')
            .limit(maxLimit);
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
    countBedNo(db) {
        return db('ipt')
            .where('dchdate', '0000-00-00')
            .count('an as total_bed')
            .first();
    }
    async getBedNo(db, bedno = null, start = -1, limit = 1000) {
        return db('ipt')
            .leftJoin('idpm', 'ipt.ward', 'idpm.idpm')
            .leftJoin('iptadm', 'ipt.an', 'iptadm.an')
            .leftJoin('bedtype', 'iptadm.bedtype', 'bedtype.bedtype')
            .where('dchdate', '0000-00-00')
            .select(db.raw(`ltrim(substring(iptadm.bedno, 2, 20)) as bedno`), db.raw(`ifnull(iptadm.bedtype, '-') as bedtype`), db.raw(`ifnull(bedtype.namebedtyp,'-') as bedtype_name`), `'-' as roomno`, 'ipt.ward as wardcode', 'idpm.nameidpm as wardname', 'idpm.is_active as isactive', db.raw(`ifnull(bedtype.type_code, 'N') as bed_type`), db.raw(`if(length(idpm.export_code) = 6, idpm.export_code, concat(idpm.export_code,bedtype.export_code)) as std_code`), `'1' as bed_status_type_id`, `'active' as bed_status_type_name`);
    }
    sumReferIn(db, dateStart, dateEnd) {
        return [];
    }
    concurrentIPDByWard(db, date) {
        return db('ipt')
            .innerJoin('idpm', 'ipt.ward', 'idpm.idpm')
            .where('ipt.rgtdate', '<=', date)
            .andWhere(function () {
            this.where('ipt.dchdate', '>=', date)
                .orWhere('ipt.dchdate', '0000-00-00');
        })
            .select('ipt.ward as wardcode', 'idpm.nameidpm as wardname', db.raw(`count(case when rgtdate = ? then an end) as new_case`, [date]), db.raw(`count(case when dchdate = ? then an end) as discharge`, [date]), db.raw(`count(case when dchstts in (8,9) then an end) as death`), db.raw(`
      count(
        case 
          when rgtdate <= ? 
          and (dchdate > ? or dchdate = '0000-00-00') 
          then an 
        end
      ) as cases
    `, [date, date]))
            .groupBy('ipt.ward');
    }
    concurrentIPDByClinic_(db, date) {
        return db('ipt')
            .leftJoin('spclty', 'ipt.dept', 'spclty.spclty')
            .where('ipt.rgtdate', '<=', date)
            .andWhere(function () {
            this.where('ipt.dchdate', '>=', date)
                .orWhere('ipt.dchdate', '0000-00-00');
        })
            .select('ipt.dept as cliniccode', 'spclty.name as clinicname', db.raw(`count(case when rgtdate = ? then an end) as new_case`, [date]), db.raw(`count(case when dchdate = ? then an end) as discharge`, [date]), db.raw(`count(case when dchstts in (8,9) then an end) as death`), db.raw(`
      count(
        case 
          when rgtdate <= ? 
          and (dchdate > ? or dchdate = '0000-00-00') 
          then an 
        end
      ) as cases
    `, [date, date]))
            .groupBy('ipt.dept');
    }
    concurrentIPDByClinic(db, date) {
        return db('ipt')
            .leftJoin('spclty', 'ipt.dept', 'spclty.spclty')
            .where('ipt.rgtdate', '<=', date)
            .andWhere(function () {
            this.where('ipt.dchdate', '>=', date)
                .orWhere('ipt.dchdate', '0000-00-00');
        })
            .select('ipt.dept as cliniccode', 'spclty.namespclty as clinicname', db.raw(`count(case when rgtdate = ? then an end) as new_case`, [date]), db.raw(`count(case when dchdate = ? then an end) as discharge`, [date]), db.raw(`count(case when dchstts in (8,9) then an end) as death`), db.raw(`
      count(
        case 
          when rgtdate <= ? 
          and (dchdate > ? or dchdate = '0000-00-00') 
          then an 
        end
      ) as cases
    `, [date, date]))
            .groupBy('ipt.dept');
    }
    sumOpdVisitByClinic(db, date) {
        return [];
    }
}
exports.HisHiModel = HisHiModel;
