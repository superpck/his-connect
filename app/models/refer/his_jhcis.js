"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisJhcisModel = void 0;
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
const dbName = process.env.HIS_DB_NAME;
const dbClient = process.env.HIS_DB_CLIENT;
class HisJhcisModel {
    check() {
        return true;
    }
    getTableName(db, dbName = process.env.HIS_DB_NAME) {
        return db('information_schema.tables')
            .select('TABLE_NAME')
            .where('TABLE_SCHEMA', '=', dbName);
    }
    getReferOut(db, date, hospCode = hcode) {
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
            .where('visit.visitdate', date)
            .whereRaw('!isnull(visit.numberrefer)')
            .whereRaw('!isnull(refertohos)')
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
    getDrugAllergy(db, hn, hospCode = hcode) {
        return [];
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
    getData(db, tableName, columnName, searchNo, hospCode = hcode) {
        return db(tableName)
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
}
exports.HisJhcisModel = HisJhcisModel;
