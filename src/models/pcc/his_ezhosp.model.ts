import Knex = require('knex');
import * as moment from 'moment';

const dbName = process.env.HIS_DB_NAME;
const hospCode = process.env.HOSPCODE;
const backwardService = moment().locale('th').subtract(3, 'year').format('YYYY-MM-DD');
const maxLimit = 500;

export class PccHisEzhospModel {
    getTableName(knex: Knex) {
        return knex
            .select('TABLE_NAME')
            .from('information_schema.tables')
            .where('TABLE_SCHEMA', '=', dbName);
    }

    getPerson(db: Knex, columnName, searchText) {
        columnName = columnName === 'idcard' ? 'no_card' : columnName;
        columnName = columnName === 'cid' ? 'no_card' : columnName;
        columnName = columnName === 'pid' ? 'hn' : columnName;
        return db('patient')
            .select(db.raw(`(select hcode from sys_hospital limit 1) as hospcode
                ,(select hname from sys_hospital limit 1) as hospname`))
            .select('patient.hn', 'patient.hn as pid', 'patient.no_card as cid'
                , 'patient.no_card as idcard', 'patient.title as prename'
                , 'patient.name as fname', 'patient.surname as lname'
                , 'patient.birth', 'patient.birth as dob', 'patient.sex', 'patient.address'
                , 'patient.blood as bloodgroup', 'patient.moo', 'patient.road'
                , 'patient.tel', 'patient.zip', 'patient.nation'
                , 'patient.race', 'patient.ethnic as religion', 'patient.marry as mstatus'
                , 'occupa as occupation', 'patient.add as addcode')
            .where(columnName, "=", searchText);
    }

    getPersonByName(db: Knex, fname, lname) {
        let where = 'hn!=""';
        if (fname) {
            where += ` and name like "${fname}%" `;
        }
        if (lname) {
            where += ` and surname like "${lname}%" `;
        }
        return db('patient')
            .select(db.raw(`(select hcode from sys_hospital limit 1) as hospcode
                ,(select hname from sys_hospital limit 1) as hospname`))
            .select('patient.hn', 'patient.hn as pid', 'patient.no_card as cid'
                , 'patient.no_card as idcard', 'patient.title as prename'
                , 'patient.name as fname', 'patient.surname as lname'
                , 'patient.birth', 'patient.birth as dob', 'patient.sex', 'patient.address'
                , 'patient.blood as bloodgroup', 'patient.moo', 'patient.road'
                , 'patient.tel', 'patient.zip', 'patient.nation'
                , 'patient.race', 'patient.ethnic as religion', 'patient.marry as mstatus'
                , 'occupa as occupation', 'patient.add as addcode')
            .whereRaw(db.raw(where));
    }

    getService(db: Knex, hn, date) {
        let where: any = { hn };
        if (date) {
            where.date = date;
        }
        return db('opd_visit as visit')
            .leftJoin('opd_vs as vs', 'visit.vn', 'vs.vn')
            .leftJoin('patient', 'visit.hn', 'patient.hn')
            .leftJoin('lib_pttype as p', 'visit.pttype', 'p.code')
            .leftJoin('lib_clinic as clinic', 'visit.dep', 'clinic.code')
            .leftJoin('lib_dr as dr', 'visit.dr', 'dr.code')
            .select(db.raw(`(select hcode from sys_hospital limit 1) as hospcode
                ,(select hname from sys_hospital limit 1) as hospname`))
            .select('patient.no_card as idcard', 'visit.hn as pid', 'visit.hn'
                , 'visit.vn as visitno'
                , 'visit.date', 'visit.date as date_serv', 'visit.time_reg as time'
                , 'visit.time as time_serv', 'vs.time_vs'
                , 'visit.dep as clinic', 'clinic.clinic as clinic_name'
                , 'visit.pttype', 'p.text as pttype_text', 'visit.hospmain'
                , 'visit.hospsub', 'patient.tel'
                , 'vs.bp as bp_systolic', 'vs.bp1 as bp_diastolic'
                , 'vs.weigh as weight', 'vs.high as height'
                , 'vs.bmi', 'vs.puls as pr', 'vs.rr', 'vs.t as temperature'
                , 'vs.t as tem', 'vs.waistline as waist'
                , 'vs.cc', 'vs.pi'
                , 'vs.nurse_ph as ph', 'visit.dr as provider')
            .select(db.raw(`concat(dr.title, dr.fname, ' ', dr.lname) as provider_name`))
            .where(where)
            .whereNotIn('visit.status', [8, 20])
            .where('visit.date', '>', backwardService)
            .orderBy('visit.date', 'desc')
            .limit(maxLimit);
    }

    getServiceByHn(db: Knex, hn, cid) {
        if (!hn && !cid) return null;

        let searchType = 'visit.hn';
        let searchValue = hn;
        if (cid) {
            let searchType = 'patient.no_card';
            let searchValue = cid;
        }

        return db('opd_visit as visit')
            .leftJoin('opd_vs as vs', 'visit.vn', 'vs.vn')
            .leftJoin('patient', 'visit.hn', 'patient.hn')
            .leftJoin('lib_pttype as p', 'visit.pttype', 'p.code')
            .leftJoin('lib_clinic as clinic', 'visit.dep', 'clinic.code')
            .leftJoin('lib_dr as dr', 'visit.dr', 'dr.code')
            .select(db.raw(`(select hcode from sys_hospital limit 1) as hospcode
                ,(select hname from sys_hospital limit 1) as hospname`))
            .select('patient.no_card as idcard', 'visit.hn as pid', 'visit.hn'
                , 'visit.vn as visitno'
                , 'visit.date', 'visit.date as visitdate', 'visit.time_reg as time'
                , 'visit.time as timestart', 'vs.time_vs'
                , 'visit.dep as clinic', 'clinic.clinic as clinic_name'
                , 'visit.pttype', 'p.text as pttype_text', 'visit.hospmain'
                , 'visit.hospsub'
                , 'vs.bp as bp_systolic', 'vs.bp1 as bp_diastolic'
                , 'vs.weigh as weight', 'vs.high as height'
                , 'vs.bmi', 'vs.puls as pr', 'vs.rr', 'vs.t as temperature'
                , 'vs.t as tem', 'vs.waistline as waist'
                , 'vs.cc', 'vs.pi'
                , 'vs.nurse_ph as ph', 'visit.dr as provider')
            .select(db.raw(`concat(dr.title, dr.fname, ' ', dr.lname) as provider_name`))
            .where(searchType, searchValue)
            .whereNotIn('visit.status', [8, 20])
            .where('visit.date', '>', backwardService)
            .orderBy('visit.date', 'desc')
            .limit(maxLimit);
    }

    getDiagnosisByHn(db: Knex, pid) {
        return db('opd_dx as dx')
            .innerJoin('opd_visit as visit', 'dx.vn', 'visit.vn')
            .leftJoin('lib_icd10 as lib', 'dx.diag', 'lib.code')
            .select(db.raw(`(select hcode from sys_hospital limit 1) as hospcode
                ,(select hname from sys_hospital limit 1) as hospname`))
            .select('dx.*', 'dx.diag as diagcode'
                , 'lib.desc as diagname', 'lib.short_thi as diagnamethai'
                , 'visit.date as date_serv', 'visit.time as time_serv')
            .where('visit.hn', "=", pid)
            .whereNotIn('visit.status', [8, 20])
            .orderBy('visit.date', 'desc')
            .orderBy('visit.time', 'desc');
    }

    getDiagnosis(db: Knex, visitNo) {
        return db('view_opd_dx')
            .select('*')
            .select(db.raw(`(select hcode from sys_hospital limit 1) as hospcode
                ,(select hname from sys_hospital limit 1) as hospname`))
            .select('diag as diagcode'
                , 'desc as diagname', 'short_thi as diagnamethai'
                , 'date as date_serv', 'time as time_serv')
            .where('vn', "=", visitNo)
            .whereNotIn('status', [8, 20])
            .orderBy('date', 'desc')
            .orderBy('time', 'desc');
    }

    getDrug(db: Knex, visitNo) {
        return db('view_pharmacy_opd_drug_item as drug')
            .select('*')
            .select(db.raw(`'${hospCode}' as hospcode`))
            .select(db.raw(`(select hcode from sys_hospital limit 1) as hospcode
                ,(select hname from sys_hospital limit 1) as hospname`))
            .select(db.raw(`concat(methodname,' ', no_use ,' ', unit_use, ' ', freqname, ' ', timesname) as dose`))
            .where('vn', "=", visitNo)
            .whereNotIn('visit_status', [8, 20])
            .whereNotIn('drugcode', ['ZZZZZZ', 'POST', 'PREFILL', 'ZTP1'])
            .orderBy('date_serv', 'desc')
            .orderBy('time_serv', 'desc');
    }

    getDrugByHn(db: Knex, pid) {
        return db('view_pharmacy_opd_drug_item as drug')
            .innerJoin('visit', 'drug.vn', 'visit.vn')
            .select(db.raw(`(select hcode from sys_hospital limit 1) as hospcode
                ,(select hname from sys_hospital limit 1) as hospname`))
            .select('drug.*', 'visit.vn', 'visit.vn as visitno'
                , 'visit.date as date_serv', 'visit.time as time_serv'
                , 'drug.caution as comment')
            .select(db.raw(`concat(drug.methodname,' ', drug.no_use ,' ', drug.unit_use, ' ', drug.freqname, ' ', drug.timesname) as dose`))
            .where('visit.hn', "=", pid)
            .whereNotIn('visit.status', [8, 20])
            .orderBy('visit.date', 'desc')
            .orderBy('visit.time', 'desc');
    }

    getAnc(db: Knex, visitNo) {
        return [];
        // return db('visitanc as anc')
        //     .leftJoin('visit', 'anc.visitno', 'visit.visitno')
        //     .leftJoin('chospital', 'visit.pcucodeperson', 'chospital.hoscode')
        //     .select('anc.*', 'anc.pcucodeperson as hospcode', 'chospital.hosname as hospname'
        //         , 'visit.visitdate as date_serv', 'visit.timestart as time_serv')
        //     .where('anc.visitno', "=", visitNo)
        //     .orderBy('anc.datecheck', 'desc')
        //     .orderBy('visit.visitdate', 'desc');
    }

    getAncByHn(db: Knex, pid) {
        return [];
        // return db('visitanc as anc')
        //     .leftJoin('visit', 'anc.visitno', 'visit.visitno')
        //     .leftJoin('chospital', 'visit.pcucodeperson', 'chospital.hoscode')
        //     .select('anc.*', 'anc.pcucodeperson as hospcode', 'chospital.hosname as hospname'
        //         , 'visit.visitdate as date_serv', 'visit.timestart as time_serv')
        //     .where('visit.pid', "=", pid)
        //     .orderBy('anc.datecheck', 'desc')
        //     .orderBy('visit.visitdate', 'desc');
    }

    getEpi(db: Knex, visitNo) {
        return [];
        // return db('visitepi as epi')
        //     .leftJoin('visit', 'epi.visitno', 'visit.visitno')
        //     .leftJoin('chospital', 'visit.pcucodeperson', 'chospital.hoscode')
        //     .leftJoin('cvaccinegroup as lib', 'epi.vaccinecode', 'lib.vaccode')
        //     .select('epi.*', 'epi.pcucodeperson as hospcode', 'chospital.hosname as hospname'
        //         , 'visit.visitdate as date_serv', 'visit.timestart as time_serv',
        //         'lib.vacname')
        //     .where('epi.visitno', "=", visitNo)
        //     .orderBy('epi.dateepi', 'desc');
    }

    getEpiByHn(db: Knex, pid) {
        return [];
        // return db('visitepi as epi')
        //     .innerJoin('person', 'epi.pid', 'person.pid')
        //     .leftJoin('visit', 'epi.visitno', 'visit.visitno')
        //     .leftJoin('chospital', 'visit.pcucodeperson', 'chospital.hoscode')
        //     .leftJoin('cvaccinegroup as lib', 'epi.vaccinecode', 'lib.vaccode')
        //     .select('epi.*', 'epi.pcucodeperson as hospcode', 'chospital.hosname as hospname'
        //         , 'visit.visitdate as date_serv', 'visit.timestart as time_serv'
        //         , 'lib.vacname')
        //     .where('person.pid', "=", pid)
        //     .orderBy('epi.dateepi', 'desc');
    }

    getFp(db: Knex, visitNo) {
        return [];
        // return db('visitfp as fp')
        //     .innerJoin('person', 'fp.pid', 'person.pid')
        //     .leftJoin('visit', 'fp.visitno', 'visit.visitno')
        //     .leftJoin('chospital', 'visit.pcucodeperson', 'chospital.hoscode')
        //     .join('cdrug', function () {
        //         this.on('fp.fpcode', '=', 'cdrug.drugcode')
        //     })
        //     .select('fp.*', 'fp.pcucodeperson as hospcode', 'chospital.hosname as hospname'
        //         , 'visit.visitdate as date_serv', 'visit.timestart as time_serv',
        //         'cdrug.drugname')
        //     .where('fp.visitno', "=", visitNo)
        //     .where('cdrug.drugtype', "=", '04')
        //     .orderBy('fp.datefp', 'desc');
    }

    getFpByHn(db: Knex, pid) {
        return [];
        // return db('visitfp as fp')
        //     .innerJoin('person', 'fp.pid', 'person.pid')
        //     .innerJoin('visit', 'fp.visitno', 'visit.visitno')
        //     .leftJoin('chospital', 'visit.pcucodeperson', 'chospital.hoscode')
        //     .join('cdrug', function () {
        //         this.on('fp.fpcode', '=', 'cdrug.drugcode')
        //     })
        //     .select('fp.*', 'fp.pcucodeperson as hospcode', 'chospital.hosname as hospname'
        //         , 'visit.visitdate as date_serv', 'visit.timestart as time_serv',
        //         'cdrug.drugname')
        //     .where('person.pid', "=", pid)
        //     .where('cdrug.drugtype', "=", '04')
        //     .orderBy('fp.datefp', 'desc');
    }

    getNutrition(db: Knex, visitNo) {
        return [];
        // return db('visitnutrition as nutrition')
        //     .innerJoin('visit', 'nutrition.visitno', 'visit.visitno')
        //     .innerJoin('person', 'visit.pid', 'person.pid')
        //     .leftJoin('chospital', 'visit.pcucode', 'chospital.hoscode')
        //     .select('nutrition.*', 'nutrition.pcucode as hospcode', 'chospital.hosname as hospname'
        //         , 'visit.visitdate as date_serv', 'visit.timestart as time_serv')
        //     .where('nutrition.visitno', "=", visitNo)
        //     .orderBy('visit.visitdate', 'desc')
        //     .orderBy('visit.timestart', 'desc');
    }

    getNutritionByHn(db: Knex, pid) {
        return [];
        // return db('visitnutrition as nutrition')
        //     .innerJoin('visit', 'nutrition.visitno', 'visit.visitno')
        //     .innerJoin('person', 'visit.pid', 'person.pid')
        //     .leftJoin('chospital', 'visit.pcucode', 'chospital.hoscode')
        //     .select('nutrition.*', 'nutrition.pcucode as hospcode', 'chospital.hosname as hospname'
        //         , 'visit.visitdate as date_serv', 'visit.timestart as time_serv')
        //     .where('visit.pid', "=", pid)
        //     .orderBy('visit.visitdate', 'desc')
        //     .orderBy('visit.timestart', 'desc');
    }

    getDrugAllergy(db: Knex, pid, cid) {
        return [];
        // if (!pid && !cid)
        //     return null;

        // let where = 'alg.drugcode!=""';
        // if (pid) {
        //     where += ` and alg.pid="${pid}" `;
        // }
        // if (cid) {
        //     where += ` and person.idcard="${cid}" `;
        // }
        // return db('personalergic as alg')
        //     .innerJoin('person', 'alg.pid', 'person.pid')
        //     .leftJoin('chospital', 'alg.pcucodeperson', 'chospital.hoscode')
        //     .leftJoin('cdrugallergysymtom as lib', 'alg.symptom', 'lib.symtomcode')
        //     .join('cdrug', function () {
        //         this.on('alg.drugcode', '=', 'cdrug.drugcode')
        //     })
        //     .select('alg.*', 'alg.pcucodeperson as hospcode'
        //         , 'chospital.hosname as hospname'
        //         , 'cdrug.drugname', 'person.idcard'
        //         , 'lib.symtomname', 'lib.icd10tm')
        //     .whereRaw(db.raw(where))
        //     .where('cdrug.drugtype', "=", '01')
        //     .orderBy('person.fname')
        //     .orderBy('person.lname')
        //     .limit(maxLimit);
    }

    getChronic(db: Knex, pid, cid) {
        return [];
    }

    getLabResult(db, columnName, searchNo) {
        columnName = columnName.toUpperCase() === 'VISITNO' ? 'result.vn' : columnName;
        columnName = columnName === 'pid' ? 'result.hn' : columnName;
        const backwardService = moment().locale('th').subtract(1, 'year').format('YYYY-MM-DD');

        return db('hospdata.view_lab_result as result')
            .select('*')
            .select(db.raw(`(select hcode from sys_hospital limit 1) as hospcode
                ,(select hname from sys_hospital limit 1) as hospname`))
            .select(db.raw('"LAB" as TYPEINVEST'))
            .select(db.raw('CONCAT(result.date," ",result.time) as DATETIME_INVEST'))
            .select('result.hn as PID', 'result.vn as SEQ', 'result.no_card as cid'
                , 'an as AN', 'result.type_result as LH'
                , 'result.lab_code as LOCALCODE', 'result.icdcm as INVESTCODE'
                , 'result.lab_name as INVESTNAME'
                , 'result.result as INVESTVALUE', 'result.unit as UNIT'
                , 'result.result_obj as INVESTRESULT'
                , 'result.minresult as NORMAL_MIN', 'result.maxresult as NORMAL_MAX'
                , 'result.date_result as DATETIME_REPORT')
            .select(db.raw('CONCAT(result.date," ",result.time) as D_UPDATE'))
            .where(columnName, "=", searchNo)
            .where('result.date_result', '>', backwardService)
            .orderBy('result.date_result', 'desc')
            .limit(maxLimit);
    }

    libDrug(db: Knex, searchType, searchValue) {
        return db('pharmacy_inventory as drug')
            .select('drug.*', 'drug.unit_use as unitusage',
                'drug.price as sellcaldrugstore',
                'drug.paytype as chargeitem',
                'drug.last_tmt as drugflag')
            .where(searchType, 'like', '%' + searchValue + '%')
            .limit(maxLimit);
    }


















    getProcedureOpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('procedure_opd')
            .where(columnName, "=", searchNo);
    }

    getChargeOpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('charge_opd')
            .where(columnName, "=", searchNo);
    }

    getDrugOpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('drug_opd')
            .where(columnName, "=", searchNo);
    }

    getAdmission(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('admission')
            .where(columnName, "=", searchNo);
    }

    getDiagnosisIpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('diagnosis_ipd')
            .where(columnName, "=", searchNo);
    }

    getProcedureIpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('procedure_ipd')
            .where(columnName, "=", searchNo);
    }

    getChargeIpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('charge_ipd')
            .where(columnName, "=", searchNo);
    }

    getDrugIpd(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('drug_ipd')
            .where(columnName, "=", searchNo);
    }

    getAccident(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('accident')
            .where(columnName, "=", searchNo);
    }

    getAppointment(knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('appointment')
            .where(columnName, "=", searchNo);
    }

    getData(knex, tableName, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from(tableName)
            .where(columnName, "=", searchNo)
            .limit(5000);
    }
}
