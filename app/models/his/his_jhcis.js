"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisJhcisModel = void 0;
const moment = require("moment");
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
let hisHospcode = process.env.HOSPCODE;
const getHospcode = async () => {
    let row = await global.dbHIS('j2_hospital').first();
    hisHospcode = row ? row.HMAIN : process.env.HOSPCODE;
    console.log('hisHospcode v.4', hisHospcode);
};
class HisJhcisModel {
    constructor() {
        getHospcode();
    }
    check() {
        return true;
    }
    async testConnect(db) {
        let result;
        result = await global.dbHIS('j2_hospital').first();
        const hospname = result?.HNAME || null;
        result = await db('person').select('pid as hn').limit(1);
        const connection = result && (result.patient || result.length > 0) ? true : false;
        let charset = '';
        if (process.env.HIS_DB_CLIENT.toLowerCase().includes('mysql')) {
            result = await db('information_schema.SCHEMATA')
                .select('DEFAULT_CHARACTER_SET_NAME')
                .where('SCHEMA_NAME', process.env.HIS_DB_NAME)
                .first();
            charset = result?.DEFAULT_CHARACTER_SET_NAME || '';
        }
        return { hospname, connection, charset };
    }
    getDepartment(db, depCode = '', depName = '') {
        let sql = db('lib_clinic');
        if (depCode) {
            sql.where('code', depCode);
        }
        else if (depName) {
            sql.whereLike('clinic', `%${depName}%`);
        }
        else {
            sql.where('isactive', 1);
        }
        return sql
            .select('code as department_code', 'clinic as department_name', 'standard as moph_code')
            .select(db.raw(`if(type='ER',1,0) as emergency`))
            .orderBy('clinic')
            .limit(maxLimit);
    }
    getWard(db, wardCode = '', wardName = '') {
        let sql = db('lib_ward');
        if (wardCode) {
            sql.where('code', wardCode);
        }
        else if (wardName) {
            sql.whereLike('ward', `%${wardName}%`);
        }
        else {
            sql.where('isactive', 1);
        }
        return sql
            .select('code as ward_code', 'ward as ward_name', 'standard as moph_code')
            .limit(maxLimit);
    }
    getDr(db, drCode = '', drName = '') {
        let sql = db('lib_dr');
        if (drCode) {
            sql.where('code', drCode);
        }
        else if (drName) {
            sql.whereLike('fname', `%${drName}%`);
        }
        return sql
            .select('code as dr_code', 'code as dr_license_code')
            .select(db.raw('concat(title,fname," ",lname) as dr_name'))
            .select('expire as expire_date')
            .limit(maxLimit);
    }
    getReferOut(db, date, hospCode = hcode, visitNo = null) {
        let sql = db('visit')
            .leftJoin('person', 'visit.pid', 'person.pid')
            .leftJoin('user', 'visit.username', 'user.username');
        if (visitNo) {
            sql.where(`visit.visitno`, visitNo);
        }
        else {
            sql.where('visit.visitdate', date);
        }
        return sql
            .select('visit.pcucode as HOSPCODE', 'visit.refertohos as HOSP_DESTINATION', 'visit.numberrefer as REFERID', db.raw(`concat(visit.pcucode,'-',visit.numberrefer) as REFERID_PROVINCE`), 'visit.pid as PID', 'person.idcard as CID', 'visit.visitno as SEQ', 'person.prename', 'person.fname', 'person.lname', 'person.birth as dob', 'person.sex', 'visit.symptoms as CHIEFCOMP', 'visit.vitalcheck as PI', 'visit.symptomsco as PH', 'visit.healthsuggest1 as PHYSICALEXAM', 'visit.diagnote as DIAGLAST', 'visit.receivefromhos as HOSPCODE_ORIGIN', 'visit.username', db.raw('CASE WHEN user.licenseno="" OR user.licenseno IS NULL THEN user.noofoccupation ELSE user.licenseno END as provider'), db.raw(`concat(visit.visitdate,' ',visit.timestart) as DATETIME_SERV`), db.raw(`concat(visit.visitdate,' ',visit.timeend) as DATETIME_REFER`), db.raw(`case when isnull(visit.refertohos) then '' when visit.refer='06' then '3' else '1' end as CAUSEOUT`), db.raw(`'5' as EMERGENCY`), db.raw(`'1' as PTYPE`), db.raw(`'99' as PTYPEDIS`), db.raw(`'1' as referout_type`), db.raw(`concat(visit.visitdate,' ', visit.timeend) as D_UPDATE`))
            .whereNotNull('visit.numberrefer')
            .whereNotNull('refertohos')
            .orderBy('visit.visitdate')
            .limit(maxLimit);
    }
    getReferHistory(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'visit.visitno' : columnName;
        columnName = columnName === 'hn' ? 'visit.pid' : columnName;
        columnName = columnName === 'cid' ? 'person.idcard' : columnName;
        columnName = columnName === 'referid' ? 'visit.numberrefer' : columnName;
        return db('visit')
            .leftJoin('person', 'visit.pid', 'person.pid')
            .select('visit.pcucode as HOSPCODE', 'visit.refertohos as HOSP_DESTINATION', 'visit.numberrefer as REFERID')
            .select(db.raw(`concat(visit.pcucode,'-',visit.numberrefer) as REFERID_PROVINCE`))
            .select('visit.pid as PID', 'person.idcard as CID', 'visit.visitno as SEQ', 'person.prename', 'person.fname', 'person.lname', 'person.birth as dob', 'person.sex', 'visit.symptoms as CHIEFCOMP', 'visit.vitalcheck as PI', 'visit.symptomsco as PH', 'visit.healthsuggest1 as PHYSICALEXAM', 'visit.diagnote as DIAGLAST', 'visit.receivefromhos as HOSPCODE_ORIGIN')
            .select(db.raw(`concat(visit.visitdate,' ',visit.timestart) as DATETIME_SERV`))
            .select(db.raw(`concat(visit.visitdate,' ',visit.timeend) as DATETIME_REFER`))
            .select(db.raw(`case when isnull(visit.refertohos) then '' when visit.refer='06' then '3' else '1' end as CAUSEOUT`))
            .select(db.raw(`'5' as EMERGENCY`))
            .select(db.raw(`'1' as PTYPE`))
            .select(db.raw(`'99' as PTYPEDIS`))
            .select(db.raw(`'1' as referout_type`))
            .select(db.raw(`concat(visit.visitdate,' ', visit.timeend) as D_UPDATE`))
            .where(columnName, "=", searchNo)
            .whereRaw('!isnull(visit.numberrefer)')
            .whereRaw('!isnull(refertohos)')
            .orderBy('visit.visitdate')
            .limit(maxLimit);
    }
    getPerson(db, columnName, searchText, hospCode = hcode) {
        columnName = columnName === 'hn' ? 'pid' : columnName;
        columnName = columnName === 'cid' ? 'idcard' : columnName;
        return db('person')
            .select('person.pcucodeperson as HOSPCODE', 'person.pid as PID', 'person.pid as HN', 'person.idcard as CID', 'person.prename as PRENAME', 'person.fname as NAME', 'person.fname as FNAME', 'person.lname as LNAME', 'person.birth as BIRTH', 'person.sex as SEX', 'person.marystatus as MSTATUS', 'person.occupa as OCCUPATION_OLD', 'person.fatherid as FATHER', 'person.motherid as MOTHER', 'person.educate as EDUCATION', 'person.nation as NATION', 'person.origin as RACE', 'person.religion as RELIGION', 'person.bloodgroup as ABOGROUP', 'person.bloodrh as RHGROUP', 'person.telephoneperson as TELEPHONE', 'person.mobile as MOBILE', 'person.datestart as MOVEIN', 'person.dateexpire as DISCHARGE', 'person.dateupdate as D_UPDATE')
            .where(columnName, "=", searchText)
            .limit(maxLimit);
    }
    getAddress(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'cid' ? 'person.idcard' : columnName;
        columnName = columnName === 'hn' ? 'pid' : columnName;
        return db('person')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('pcucodeperson as HOSPCODE', 'pid as PID', 'hnomoi as HOUSENO', 'mumoi as VILLAGE', 'roadmoi as ROAD', 'subdistcodemoi as TAMBON', 'distcodemoi as AMPUR', 'provcodemoi as CHANGWAT', 'postcodemoi as ZIP', 'telephoneperson as TELEPHONE', 'mobile as MOBILE', 'person.idcard as CID')
            .select(db.raw(`'1' as ADDRESSTYPE`))
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
    getService(db, columnName, searchText, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'visit.visitno' : columnName;
        columnName = columnName === 'hn' ? 'visit.pid' : columnName;
        columnName = columnName === 'cid' ? 'person.idcard' : columnName;
        columnName = columnName === 'date_serv' ? 'visit.visitdate' : columnName;
        return db('visit')
            .leftJoin('person', 'visit.pid', 'person.pid')
            .leftJoin('cright', 'visit.rightcode', 'cright.rightcode')
            .select('visit.pcucode as HOSPCODE', 'visit.pid as PID', 'visit.pid as HN', 'person.idcard as CID', 'visit.visitno as SEQ', 'visit.visitdate as DATE_SERV', 'visit.rightcode', 'cright.mapright as INSTYPE', 'visit.rightno as INSID', 'visit.hosmain as MAIN', 'visit.hosmain as HMAIN', 'visit.hossub as SUB', 'visit.hossub as HSUB', 'visit.symptoms as CHIEFCOMP', 'visit.vitalcheck as PRESENTILLNESS', 'visit.symptomsco as PASTHISTORY', 'visit.healthsuggest1 as PHYSICALEXAM', 'visit.weight as WEIGHT', 'visit.height as HEIGHT', 'visit.weight as temperature', 'visit.pulse as PR', 'visit.respri as RR', 'visit.waist as WAIST', 'visit.money1 as PRICE', 'visit.receivefromhos as REFERINHOSP', 'visit.refertohos as REFEROUTHOSP')
            .select(db.raw(`REPLACE(visit.timestart, ':', '') as TIME_SERV`))
            .select(db.raw(`case when isnull(visit.refertohos) then '' when visit.refer='06' then '3' else '1' end as CAUSEOUT`))
            .select(db.raw(`case when isnull(visit.receivefromhos) then '1' else '3' end as TYPEIN`))
            .select(db.raw(`case when LOCATE('/', visit.pressure)>0 then substr(visit.pressure,1,LOCATE('/', visit.pressure)-1) else '' end as SBP`))
            .select(db.raw(`case when LOCATE('/', visit.pressure)>0 then substr(visit.pressure,LOCATE('/', visit.pressure)+1) else '' end as DBP`))
            .select(db.raw(`'1' as LOCATION`))
            .select(db.raw(`'1' as SERVPLACE`))
            .select(db.raw(`concat(visit.visitdate,' ', visit.timestart) as D_UPDATE`))
            .where(columnName, searchText)
            .orderBy('visit.visitdate', 'desc')
            .limit(maxLimit);
    }
    getDiagnosisOpd(db, visitno, hospCode = hcode) {
        return db('visitdiag as dx')
            .leftJoin('visit', 'dx.visitno', 'visit.visitno')
            .leftJoin('person', 'visit.pid', 'person.pid')
            .select('dx.pcucode as HOSPCODE', 'dx.visitno as SEQ', 'visit.pid as PID', 'person.idcard as CID', 'dx.clinic as CLINIC', 'dx.dxtype as DIAGTYPE', 'dx.doctordiag as PROVIDER', 'visit.visitdate as DATE_SERV', 'dx.dateupdate as D_UPDATE')
            .select(db.raw(`REPLACE(dx.diagcode, '.', '') as DIAGCODE`))
            .select(db.raw(' "IT" as codeset'))
            .where('dx.visitno', visitno)
            .orderBy('dx.dxtype')
            .limit(maxLimit);
    }
    getProcedureOpd(db, visitno, hospCode = hcode) {
        return [];
    }
    getChargeOpd(db, visitNo, hospCode = hcode) {
        return [];
    }
    getLabRequest(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'visitno' : columnName;
        columnName = columnName === 'hn' ? 'pid' : columnName;
        return [];
    }
    getLabResult(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'vn' : columnName;
        return [];
    }
    getDrugOpd(db, visitNo, hospCode = hcode) {
        return db('visitdrug as drug')
            .leftJoin('visit', 'drug.visitno', 'visit.visitno')
            .leftJoin('person', 'visit.pid', 'person.pid')
            .leftJoin('cdrug', 'drug.drugcode', 'cdrug.drugcode')
            .leftJoin('cdrugunitsell', 'cdrug.unitsell', 'cdrugunitsell.unitsellcode')
            .select('drug.pcucode as HOSPCODE', 'drug.visitno as SEQ', 'visit.pid as PID', 'person.idcard as CID', 'visit.visitdate as DATE_SERV', 'drug.clinic as CLINIC', 'drug.drugcode', 'drug.unit as AMOUNT', 'cdrug.unitsell as UNIT', 'cdrugunitsell.unitsellname as UNIT_PACKING', 'cdrug.drugname as DNAME', 'drug.realprice as DRUGPRICE', 'drug.costprice as DRUGCOST', 'drug.dose as drug_usage', 'cdrug.drugproperties as caution', 'cdrug.drugcode24 as DIDSTD', 'cdrug.drugcode24 as DID', 'cdrug.tmtcode as DID_TMT', 'drug.doctor1 as PROVIDER', 'drug.dateupdate as D_UPDATE')
            .where('drug.visitno', visitNo)
            .where('cdrug.drugtype', '01')
            .limit(maxLimit);
    }
    getAdmission(db, columnName, searchNo, hospCode = hcode) {
        return [];
    }
    getDiagnosisIpd(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'vn' : columnName;
        return [];
    }
    getProcedureIpd(db, an, hospCode = hcode) {
        return [];
    }
    getChargeIpd(db, an, hospCode = hcode) {
        return [];
    }
    getDrugIpd(db, an, hospCode = hcode) {
        return [];
    }
    getAccident(db, visitNo, hospCode = hcode) {
        return [];
    }
    async getDrugAllergy(db, hn, hospCode = hcode) {
        return db('personalergic as drugallg')
            .leftJoin('cdrug', 'drugallg.drugcode', 'cdrug.drugcode')
            .leftJoin('cdrugallergysymtom as sym', 'drugallg.symptom', 'sym.symtomcode')
            .leftJoin('person', 'drugallg.pid', 'person.pid')
            .select('person.pcucodeperson as HOSPCODE', 'person.pcucodeperson as INFORMHOSP', 'drugallg.pid as PID', 'person.idcard as CID', 'cdrug.drugcode24 as DRUGALLERGY', 'cdrug.drugcode as DCODE', 'cdrug.drugname as DNAME', 'drugallg.levelalergic as ALEVE', 'drugallg.symptom as SYMPTOM', 'sym.symtomname as DETAIL', 'drugallg.typedx as TYPEDX', 'drugallg.informant as INFORMANT', 'cdrug.drugcode24 as DID', 'cdrug.tmtcode as DID_TMT', 'drugallg.daterecord as DATERECORD', 'drugallg.dateupdate as D_UPDATE')
            .where('drugallg.pid', hn)
            .whereRaw('(drugallg.informhosp is null or drugallg.pcucodeperson=drugallg.informhosp)');
    }
    getAppointment(db, visitNo, hospCode = hcode) {
        return [];
    }
    getClinicalRefer(db, referNo, hospCode = hcode) {
        return [];
    }
    getInvestigationRefer(db, referNo, hospCode = hcode) {
        return [];
    }
    getCareRefer(db, referNo, hospCode = hcode) {
        return [];
    }
    getReferResult(db, hospDestination, referNo, hospCode = hcode) {
        return [];
    }
    async getProvider(db, columnName, searchNo) {
        return db('user as dr')
            .leftJoin('ctitle as t', 'dr.prename', 't.titlecode')
            .select(db.raw(`"${hisHospcode}" as hospcode`), db.raw('CASE WHEN licenseno="" OR licenseno IS NULL THEN dr.noofoccupation ELSE dr.licenseno END as provider'), db.raw('CASE WHEN licenseno="" OR licenseno IS NULL THEN dr.noofoccupation ELSE dr.licenseno END as registerno'), db.raw(`
                CASE
                    WHEN dr.council IS NOT NULL AND dr.council!="" THEN dr.council
                    WHEN dr.prename IN ('132','133','134','135') THEN '01'
                    WHEN dr.prename IN ('136','137') THEN '04'
                    WHEN dr.prename IN ('144','145') THEN '03'
                    WHEN LOCATE("พยาบาล", dr.officerposition)>0 THEN '02'
                    ELSE '' END AS council
                `), 'dr.idcard as cid', 'dr.prename as prenamecode', 't.titlename as prename', 'dr.fname as name', 'dr.lname as lname', 'dr.usersex as sex', 'dr.userbirth as birth', db.raw(`CASE WHEN dr.prename IN ('136','137') THEN '02' ELSE '01' END as providertype`), 'dr.dateworkhere as startdate', 'dr.datemovehere as outdate', 'dr.pcucodemovefrom as movefrom', 'dr.pcucodemoveto as  moveto', 'dr.dateupdate as d_update')
            .whereNotNull('dr.idcard')
            .where('dr.idcard', '=', '')
            .where('dr.council', '=', '')
            .whereNotNull('dr.council')
            .where(columnName, searchNo);
    }
    getProviderDr(db, drList) {
        const licenseNo = '"' + drList.join('","') + '"';
        return db('user as dr')
            .leftJoin('ctitle as t', 'dr.prename', 't.titlecode')
            .select(db.raw(`"${hisHospcode}" as hospcode`), db.raw('CASE WHEN licenseno="" OR licenseno IS NULL THEN dr.noofoccupation ELSE dr.licenseno END as provider'), db.raw('CASE WHEN licenseno="" OR licenseno IS NULL THEN dr.noofoccupation ELSE dr.licenseno END as registerno'), db.raw(`
                    CASE
                        WHEN dr.council IS NOT NULL AND dr.council!="" THEN dr.council
                        WHEN dr.prename IN ('132','133','134','135') THEN '01'
                        WHEN dr.prename IN ('136','137') THEN '04'
                        WHEN dr.prename IN ('144','145') THEN '03'
                        WHEN LOCATE("พยาบาล", dr.officerposition)>0 THEN '02'
                        ELSE '' END AS council
                    `), 'dr.idcard as cid', 'dr.prename as prenamecode', 't.titlename as prename', 'dr.fname as name', 'dr.lname as lname', 'dr.usersex as sex', 'dr.userbirth as birth', db.raw(`CASE WHEN dr.prename IN ('136','137') THEN '02' ELSE '01' END as providertype`), 'dr.dateworkhere as startdate', 'dr.datemovehere as outdate', 'dr.pcucodemovefrom as movefrom', 'dr.pcucodemoveto as  moveto', 'dr.dateupdate as d_update')
            .whereRaw(`(dr.noofoccupation in (${licenseNo}) or dr.licenseno in (${licenseNo}) )`)
            .whereNotNull('dr.idcard')
            .where('dr.idcard', '!=', '');
    }
    getData(db, tableName, columnName, searchNo, hospCode = hcode) {
        return db(tableName)
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
    sumReferIn(db, dateStart, dateEnd) {
        return [];
    }
    sumReferOut(db, dateStart, dateEnd) {
        return [];
    }
    countBedNo(db) {
        return { total_bed: 0 };
    }
    async getBedNo(db, bedno = null, start = -1, limit = 1000) {
        return [];
    }
    concurrentIPDByWard(db, date) {
        return [];
    }
    concurrentIPDByClinic(db, date) {
        return [];
    }
    sumOpdVisitByClinic(db, date) {
        return [];
    }
    async getVisitForMophAlert(db, date, isRowCount = false, limit = 1000, start = -1) {
        date = moment(date).locale('th').format('YYYY-MM-DD');
        let sql = ` FROM visit
                LEFT JOIN person ON visit.pid=person.pid
            WHERE visit.visitdate = ? AND LENGTH(person.idcard)==13 AND visit.flagservice='03'`;
        if (isRowCount) {
            sql = `SELECT count(*) AS row_count ` + sql;
            const result = await db.raw(sql, [date]);
            return { row_count: result && result.length > 0 ? result[0][0].row_count : 0 };
        }
        else {
            sql = `SELECT visit.visitno AS vn, visit.pid AS hn
                    , person.idcard AS cid
                    , visit.visitdate AS date_service, visit.timestart AS time_service ` + sql;
            const result = await db.raw(sql, [date]);
            return result.map((row) => {
                return {
                    ...row,
                    department_type: 'OPD',
                    department_code: '00',
                    department_name: 'ผู้ป่วยนอก'
                };
            });
        }
    }
}
exports.HisJhcisModel = HisJhcisModel;
