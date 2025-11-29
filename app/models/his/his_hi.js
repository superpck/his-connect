"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisHiModel = void 0;
const moment = require("moment");
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
let hisHospcode = process.env.HOSPCODE;
const noDate = '0000-00-00';
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
            .select('idpm as wardcode', 'nameidpm as wardname', `export_code as std_code`, 'bed_normal', 'bed_sp as bed_special', 'bed_icu', 'bed_extra', 'is_active as isactive')
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
    sumReferIn(db, dateStart, dateEnd) {
        return [];
    }
    countBedNo(db) {
        return db('ipt')
            .where('dchdate', noDate)
            .count('an as total_bed')
            .first();
    }
    async getBedNo(db, bedno = null, start = -1, limit = 1000) {
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
            .select(db.raw(`${hcode} as hospcode`), db.raw(`ifnull(nullif(ltrim(substring(iptadm.bedno, 2, 20)), 'ไม่ระบุเตียง'), 'ไม่ระบุเตียง') as bedno`), db.raw(`ifnull(bedtype.type_code, 'N') as bedtype`), db.raw(`ifnull(bedtype.namebedtyp,'-') as bedtype_name`), 'ipt.ward as wardcode', 'idpm.nameidpm as wardname', 'idpm.is_active as isactive', db.raw(`if(bedtype.export_code is null, idpm.export_code, concat(substr(idpm.export_code,1,3),bedtype.export_code)) as std_code`));
    }
    concurrentIPDByWard(db, date) {
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
            .select(db.raw(`? as hospcode`, [hcode]), 'ipt.ward as wardcode', 'idpm.nameidpm as wardname', db.raw(`count(case when concat(rgtdate,' ',time(rgttime*100)) between ?  and ? then ipt.an end) as new_case`, [dateStart, dateEnd]), db.raw(`count(case when concat(dchdate,' ',time(dchtime*100)) between ?  and ? then ipt.an end) as discharge`, [dateStart, dateEnd]), db.raw(`count(case when dchstts in (8,9) and concat(dchdate,' ',time(dchtime*100)) between ?  and ? then ipt.an end) as death`, [dateStart, dateEnd]), db.raw(`
            count(
              case 
                when concat(rgtdate,' ',time(rgttime*100)) <= ? 
                and (concat(dchdate,' ',time(dchtime*100)) > ? or dchdate = ?) 
                then ipt.an 
              end
            ) as cases
    `, [dateEnd, dateStart, noDate]), db.raw(`count(case when bedtype.type_code = 'N' then ipt.an end) as normal`), db.raw(`count(case when bedtype.type_code = 'S' then ipt.an end) as special`), db.raw(`count(case when bedtype.type_code = 'ICU' then ipt.an end) as icu`), db.raw(`count(case when bedtype.type_code = 'SEMI' then ipt.an end) as semi`), db.raw(`count(case when bedtype.type_code = 'HW' then ipt.an end) as homeward`), db.raw(`count(case when bedtype.type_code = 'IMC' then ipt.an end) as imc`), db.raw(`count(case when bedtype.type_code = 'LR' then ipt.an end) as lr`), db.raw(`count(case when bedtype.type_code = 'STROKE' then ipt.an end) as stroke`), db.raw(`count(case when bedtype.type_code = 'BURN' then ipt.an end) as burn`))
            .groupBy('ipt.ward');
    }
    concurrentIPDByClinic(db, date) {
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
            .select(db.raw(`${hcode} as hospcode`), db.raw(`if(ipt.dept = '' or ipt.dept is null,'00',ipt.dept) as cliniccode`), db.raw(`ifnull(spclty.namespclty,'ไม่ระบุ') as clinicname`), db.raw(`count(case when concat(rgtdate,' ',time(rgttime*100)) between ?  and ? then ipt.an end) as new_case`, [dateStart, dateEnd]), db.raw(`count(case when concat(dchdate,' ',time(dchtime*100)) between ?  and ? then ipt.an end) as discharge`, [dateStart, dateEnd]), db.raw(`count(case when dchstts in (8,9) and concat(dchdate,' ',time(dchtime*100)) between ?  and ? then ipt.an end) as death`, [dateStart, dateEnd]), db.raw(`
            count(
              case 
                when concat(rgtdate,' ',time(rgttime*100)) <= ? 
                and (concat(dchdate,' ',time(dchtime*100)) > ? or dchdate = ?) 
                then ipt.an 
              end
            ) as cases
    `, [dateEnd, dateStart, noDate]), db.raw(`count(case when bedtype.type_code = 'N' then ipt.an end) as normal`), db.raw(`count(case when bedtype.type_code = 'S' then ipt.an end) as special`), db.raw(`count(case when bedtype.type_code = 'ICU' then ipt.an end) as icu`), db.raw(`count(case when bedtype.type_code = 'SEMI' then ipt.an end) as semi`), db.raw(`count(case when bedtype.type_code = 'HW' then ipt.an end) as homeward`), db.raw(`count(case when bedtype.type_code = 'IMC' then ipt.an end) as imc`), db.raw(`count(case when bedtype.type_code = 'LR' then ipt.an end) as lr`), db.raw(`count(case when bedtype.type_code = 'STROKE' then ipt.an end) as stroke`), db.raw(`count(case when bedtype.type_code = 'BURN' then ipt.an end) as burn`))
            .groupBy('ipt.dept');
    }
    sumOpdVisitByClinic(db, date) {
        date = moment(date).locale('TH').format('YYYY-MM-DD');
        return db('ovst as visit')
            .innerJoin('cln', 'visit.cln', 'cln.cln')
            .innerJoin('spclty as spec', 'cln.specialty', 'spec.spclty')
            .where(db.raw(`date(visit.vstdttm) = ?`, [date]))
            .select(db.raw(`? as hospcode`, [hcode]), db.raw(`IFNULL(cln.specialty, '00') as cliniccode`), 'spec.namespclty as clinicname', db.raw(`COUNT(
          CASE 
            WHEN visit.an > 0 THEN visit.an  
          END
        ) AS admit`))
            .count('visit.vn as cases')
            .groupBy('cln.specialty')
            .orderBy('cln.specialty');
    }
    getVisitForMophAlert(db, date, limit = 1000, start = -1, isRowCount = false) {
        date = moment(date).locale('TH').format('YYYY-MM-DD');
        let sql = db('ovst as visit')
            .innerJoin('pt as patient', 'visit.hn', 'patient.hn')
            .leftJoin('cln as clinic', 'visit.cln', 'clinic.cln')
            .leftJoin('ipt as admission', 'visit.an', 'admission.an')
            .leftJoin('idpm as ward', 'admission.ward', 'ward.idpm')
            .where(db.raw(`((date(visit.vstdttm) = ? and visit.an = 0 and visit.ovstost = '1') or admission.dchdate = ?) `, [date, date]))
            .andWhere(db.raw(`patient.pop_id <> ''`))
            .andWhere(db.raw(`patient.pop_id is not null`))
            .andWhere(db.raw(`length(patient.pop_id) = 13`))
            .andWhere(db.raw(`length(patient.pop_id) not in (?,?)`, ['1111111111119', '9999999999994']))
            .andWhere(db.raw(`timestampdiff(year, patient.brthdate, ?) between 15 and 90`, [date]))
            .andWhere(db.raw(`patient.ntnlty = '99'`));
        if (isRowCount) {
            console.log(sql.countDistinct('vn as row_count').toString());
            return sql.countDistinct('vn as row_count').first();
        }
        else {
            if (start >= 0) {
                sql = sql.offset(start).limit(limit);
            }
            return sql
                .select('visit.hn', 'visit.vn', 'patient.pop_id as cid', db.raw(`CASE
              when visit.an > 0 and substr(ward.export_code,4,3) = '606' THEN 'HOMEWARD'
              WHEN visit.an > 0 and substr(ward.export_code,4,3) <> '606' THEN 'IPD' 
              WHEN visit.an = 0 and visit.cln = '20100' THEN 'ER' 
              ELSE 'OPD' END as department_type`), 'clinic.cln as department_code', 'clinic.namecln as department_name', db.raw('date(visit.vstdttm) as date_service'), db.raw('time(visit.vstdttm) as time_service'))
                .groupBy('visit.cln', 'visit.hn');
        }
    }
}
exports.HisHiModel = HisHiModel;
