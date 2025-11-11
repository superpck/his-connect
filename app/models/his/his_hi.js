"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisHiModel = void 0;
const moment = require("moment");
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
            sql.whereLike('nameidpm', `%${wardName}%`);
        }
        return sql
            .select('idpm as wardcode', 'nameidpm as wardname', `export_code as std_code`, 'bed_normal', 'bed_sp as bed_special', 'bed_icu', 'is_active as isactive')
            .where(db.raw(`idpm <> ''`))
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
        const noDate = '0000-00-00';
        return db('ipt')
            .where('dchdate', noDate)
            .count('an as total_bed')
            .first();
    }
    async getBedNo(db, bedno = null, start = -1, limit = 1000) {
        const noDate = '0000-00-00';
        return db('ipt')
            .leftJoin('idpm', 'ipt.ward', 'idpm.idpm')
            .leftJoin('iptadm', 'ipt.an', 'iptadm.an')
            .leftJoin('bedtype', 'iptadm.bedtype', 'bedtype.bedtype')
            .whereRaw('dchdate = ? or dchdate is null', [noDate])
            .select(db.raw(`ltrim(substring(iptadm.bedno, 2, 20)) as bedno`), db.raw(`ifnull(iptadm.bedtype, '-') as bedtype`), db.raw(`ifnull(bedtype.namebedtyp,'-') as bedtype_name`), 'ipt.ward as wardcode', 'idpm.nameidpm as wardname', 'idpm.is_active as isactive', db.raw(`ifnull(bedtype.type_code, 'N') as bed_type`), db.raw(`if(bedtype.export_code is null, idpm.export_code, concat(substr(idpm.export_code,1,3),bedtype.export_code)) as std_code`));
    }
    sumReferIn(db, dateStart, dateEnd) {
        return [];
    }
    concurrentIPDByWard(db, date) {
        const dateAdmitLimit = moment(date).subtract(1, 'year').format('YYYY-MM-DD');
        const dateStart = moment(date).locale('TH').startOf('hour').format('YYYY-MM-DD HH:mm:ss');
        const dateEnd = moment(date).locale('TH').endOf('hour').format('YYYY-MM-DD HH:mm:ss');
        const noDate = '0000-00-00';
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
            .select('ipt.ward as wardcode', 'idpm.nameidpm as wardname', db.raw(`count(case when concat(rgtdate,' ',time(rgttime*100)) between ?  and ? then an end) as new_case`, [dateStart, dateEnd]), db.raw(`count(case when concat(dchdate,' ',time(dchtime*100)) between ?  and ? then an end) as discharge`, [dateStart, dateEnd]), db.raw(`count(case when dchstts in (8,9) and concat(dchdate,' ',time(dchtime*100)) between ?  and ? then an end) as death`, [dateStart, dateEnd]), db.raw(`
            count(
              case 
                when concat(rgtdate,' ',time(rgttime*100)) <= ? 
                and (concat(dchdate,' ',time(dchtime*100)) > ? or dchdate = ?) 
                then an 
              end
            ) as cases
    `, [dateEnd, dateStart, noDate]), db.raw(`count(case when bedtype.type_code = 'N' then an end) as normal`), db.raw(`count(case when bedtype.type_code = 'S' then an end) as special`), db.raw(`count(case when bedtype.type_code = 'ICU' then an end) as icu`), db.raw(`count(case when bedtype.type_code = 'SEMI' then an end) as semi`), db.raw(`count(case when bedtype.type_code = 'HW' then an end) as homeward`), db.raw(`count(case when bedtype.type_code = 'IMC' then an end) as imc`), db.raw(`count(case when bedtype.type_code = 'LR' then an end) as lr`), db.raw(`count(case when bedtype.type_code = 'STROKE' then an end) as stroke`), db.raw(`count(case when bedtype.type_code = 'BURN' then an end) as burn`))
            .groupBy('ipt.ward');
    }
    concurrentIPDByClinic(db, date) {
        const dateAdmitLimit = moment(date).subtract(1, 'year').format('YYYY-MM-DD');
        const dateStart = moment(date).locale('TH').startOf('hour').format('YYYY-MM-DD HH:mm:ss');
        const dateEnd = moment(date).locale('TH').endOf('hour').format('YYYY-MM-DD HH:mm:ss');
        const noDate = '0000-00-00';
        return db('ipt')
            .innerJoin('iptadm', 'ipt.an', 'iptadm.an')
            .leftJoin('spclty', 'ipt.dept', 'spclty.spclty')
            .where(db.raw(`concat(ipt.rgtdate,' ',time(ipt.rgttime*100)) <= ?`, [dateEnd]))
            .andWhere('ipt.rgtdate', '>=', dateAdmitLimit)
            .andWhere(function () {
            this.where(db.raw(`concat(ipt.dchdate,' ',time(ipt.dchtime*100)) >= ?`, [dateStart]))
                .orWhere('ipt.dchdate', noDate);
        })
            .select('ipt.ward as wardcode', 'idpm.nameidpm as wardname', db.raw(`count(case when concat(rgtdate,' ',time(rgttime*100)) between ?  and ? then an end) as new_case`, [dateStart, dateEnd]), db.raw(`count(case when concat(dchdate,' ',time(dchtime*100)) between ?  and ? then an end) as discharge`, [dateStart, dateEnd]), db.raw(`count(case when dchstts in (8,9) and concat(dchdate,' ',time(dchtime*100)) between ?  and ? then an end) as death`, [dateStart, dateEnd]), db.raw(`
            count(
              case 
                when concat(rgtdate,' ',time(rgttime*100)) <= ? 
                and (concat(dchdate,' ',time(dchtime*100)) > ? or dchdate = ?) 
                then an 
              end
            ) as cases
    `, [dateEnd, dateStart, noDate]), db.raw(`count(case when bedtype.type_code = 'N' then an end) as normal`), db.raw(`count(case when bedtype.type_code = 'S' then an end) as special`), db.raw(`count(case when bedtype.type_code = 'ICU' then an end) as icu`), db.raw(`count(case when bedtype.type_code = 'SEMI' then an end) as semi`), db.raw(`count(case when bedtype.type_code = 'HW' then an end) as homeward`), db.raw(`count(case when bedtype.type_code = 'IMC' then an end) as imc`), db.raw(`count(case when bedtype.type_code = 'LR' then an end) as lr`), db.raw(`count(case when bedtype.type_code = 'STROKE' then an end) as stroke`), db.raw(`count(case when bedtype.type_code = 'BURN' then an end) as burn`))
            .groupBy('ipt.dept');
    }
    sumOpdVisitByClinic(db, date) {
        return db('ovst as visit')
            .innerJoin('cln', 'visit.cln', 'cln.cln')
            .innerJoin('spclty as spec', 'cln.specialty', 'spec.spclty')
            .where(db.raw(`date(visit.vstdttm) = ?`, [date]))
            .select('cln.specialty as cliniccode', 'spec.namespclty as clinicname', db.raw(`COUNT(
          CASE 
            WHEN visit.an > 0 THEN visit.an  
          END
        ) AS admit`))
            .count('visit.vn as cases')
            .groupBy('cln.specialty')
            .orderBy('cln.specialty');
    }
}
exports.HisHiModel = HisHiModel;
