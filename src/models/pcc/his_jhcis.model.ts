import { Knex } from 'knex';
import * as moment from 'moment';
const dbName = process.env.HIS_DB_NAME;
const maxLimit = 500;

export class PccHisJhcisModel {

    check() {
        return true;
    }

    getTableName(knex: Knex) {
        return knex('information_schema.tables')
            .select('TABLE_NAME')
            .where('TABLE_SCHEMA', '=', dbName);
    }

    getService(db: Knex, hn, date) {
        return db('visit')
            .select('pid', 'pid as hn', 'visitno', 'visitdate as date',
                'timestart as time')
            .select(db.raw("case when LOCATE('/', pressure) then SUBSTR(pressure,1,LOCATE('/', pressure)-1) else '' end as bp_systolic"))
            .select(db.raw("case when LOCATE('/', pressure) then SUBSTR(pressure,LOCATE('/', pressure)+1) else '' end as bp_diastolic"))
            .select('pulse as pr', 'respri as rr', 'weight', 'height',
                'waist', 'temperature as tem')
            .where('pid', "=", hn)
            .where('visitdate', "=", date)
            .limit(maxLimit);
    }

    getServiceByHn(db: Knex, hn, cid, date = '', visitno = '') {
        if (!hn && !cid) return null;

        let searchType = 'visit.pid';
        let searchValue = hn;
        let where: any = {};
        if (cid) {
            let searchType = 'person.idcard';
            let searchValue = cid;
        }
        if (date) {
            where.visitdate = date;
        }
        if (visitno) {
            where.visitno = visitno;
        }

        return db('visit')
            .leftJoin('person', 'visit.pid', 'person.pid')
            .leftJoin('chospital', 'visit.pcucode', 'chospital.hoscode')
            .select('visit.pcucode as hospcode', 'visit.*', 'visit.pid as hn',
                'visit.visitdate as date', 'visit.visitdate as date_serv',
                'visit.timestart as time')
            .select(db.raw("case when LOCATE('/', pressure) then SUBSTR(pressure,1,LOCATE('/', pressure)-1) else '' end as bp_systolic"))
            .select(db.raw("case when LOCATE('/', pressure) then SUBSTR(pressure,LOCATE('/', pressure)+1) else '' end as bp_diastolic"))
            .select('pulse as pr', 'respri as rr',
                'temperature as tem', 'visit.bmilevel as bmi',
                'visit.rightcode as pttype', 'visit.hosmain as hospmain',
                'visit.hossub as hospsub', 'chospital.hosname as hospname')
            .where(searchType, searchValue)
            .where(where)
            .limit(maxLimit);
    }

    getDiagnosisByHn(db: Knex, pid) {
        return db('visitdiag as dx')
            .innerJoin('visit', 'dx.visitno', 'visit.visitno')
            .leftJoin('cdisease as lib', 'dx.diagcode', 'lib.diseasecode')
            .leftJoin('chospital', 'visit.pcucode', 'chospital.hoscode')
            .select('dx.*', 'dx.pcucode as hospcode', 'chospital.hosname as hospname',
                'lib.diseasename as diagname', 'lib.diseasenamethai as diagnamethai',
                'visit.visitdate as date_serv', 'visit.timestart as time_serv')
            .where('visit.pid', "=", pid)
            .orderBy('visit.visitdate', 'desc')
            .orderBy('visit.timestart', 'desc');
    }

    getDiagnosis(db: Knex, visitNo) {
        return db('visitdiag as dx')
            .innerJoin('visit', 'dx.visitno', 'visit.visitno')
            .leftJoin('cdisease as lib', 'dx.diagcode', 'lib.diseasecode')
            .leftJoin('chospital', 'visit.pcucode', 'chospital.hoscode')
            .select('dx.*', 'dx.pcucode as hospcode', 'chospital.hosname as hospname',
                'lib.diseasename as diagname', 'lib.diseasenamethai as diagnamethai',
                'visit.visitdate as date_serv', 'visit.timestart as time_serv')
            .where('dx.visitno', "=", visitNo)
            .orderBy('visit.visitdate', 'desc')
            .orderBy('visit.timestart', 'desc')
            .orderBy('dx.dxtype');
    }

    getDrug(db: Knex, visitNo) {
        return db('visitdrug as drug')
            .innerJoin('visit', 'drug.visitno', 'visit.visitno')
            .leftJoin('cdrug as lib', 'drug.drugcode', 'lib.drugcode')
            .leftJoin('chospital', 'visit.pcucode', 'chospital.hoscode')
            .select('drug.*', 'drug.pcucode as hospcode', 'chospital.hosname as hospname'
                , 'lib.drugname', 'visit.visitdate as date_serv', 'visit.timestart as time_serv'
                , 'lib.pack', 'lib.unitsell as unit_sell', 'lib.unitusage as unit_use', 'lib.cost', 'lib.sell as price'
                , 'lib.drugcaution as caution', 'lib.drugcode24 as code24'
                , 'lib.tcode','lib.tmtcode as tmt', 'lib.drugproperties as comment')
            .where('drug.visitno', "=", visitNo)
            .where('lib.drugtype', "=", '01')
            .orderBy('visit.visitdate', 'desc')
            .orderBy('visit.timestart', 'desc');
    }

    getDrugByHn(db: Knex, pid) {
        return db('visitdrug as drug')
            .innerJoin('visit', 'drug.visitno', 'visit.visitno')
            .leftJoin('cdrug as lib', 'drug.drugcode', 'lib.drugcode')
            .leftJoin('chospital', 'visit.pcucode', 'chospital.hoscode')
            .select('drug.*', 'drug.pcucode as hospcode', 'chospital.hosname as hospname'
                , 'lib.drugname', 'visit.visitdate as date_serv', 'visit.timestart as time_serv'
                , 'lib.pack', 'lib.unitsell as unit', 'lib.unitusage as unit_use', 'lib.cost', 'lib.sell as price'
                , 'lib.drugcaution as caution', 'lib.drugcode24 as code24'
                , 'lib.tcode','lib.tmtcode as tmt', 'lib.drugproperties as comment')
            .where('visit.pid', "=", pid)
            .where('lib.drugtype', "=", '01')
            .orderBy('visit.visitdate', 'desc')
            .orderBy('visit.timestart', 'desc');
    }

    getAnc(db: Knex, visitNo) {
        return db('visitanc as anc')
            .leftJoin('visit', 'anc.visitno', 'visit.visitno')
            .leftJoin('chospital', 'visit.pcucodeperson', 'chospital.hoscode')
            .select('anc.*', 'anc.pcucodeperson as hospcode', 'chospital.hosname as hospname'
                , 'visit.visitdate as date_serv', 'visit.timestart as time_serv')
            .where('anc.visitno', "=", visitNo)
            .orderBy('anc.datecheck', 'desc')
            .orderBy('visit.visitdate', 'desc');
    }

    getAncByHn(db: Knex, pid) {
        return db('visitanc as anc')
            .leftJoin('visit', 'anc.visitno', 'visit.visitno')
            .leftJoin('chospital', 'visit.pcucodeperson', 'chospital.hoscode')
            .select('anc.*', 'anc.pcucodeperson as hospcode', 'chospital.hosname as hospname'
                , 'visit.visitdate as date_serv', 'visit.timestart as time_serv')
            .where('visit.pid', "=", pid)
            .orderBy('anc.datecheck', 'desc')
            .orderBy('visit.visitdate', 'desc');
    }

    getEpi(db: Knex, visitNo) {
        return db('visitepi as epi')
            .leftJoin('visit', 'epi.visitno', 'visit.visitno')
            .leftJoin('chospital', 'visit.pcucodeperson', 'chospital.hoscode')
            .leftJoin('cvaccinegroup as lib', 'epi.vaccinecode', 'lib.vaccode')
            .select('epi.*', 'epi.pcucodeperson as hospcode', 'chospital.hosname as hospname'
                , 'visit.visitdate as date_serv', 'visit.timestart as time_serv',
                'lib.vacname')
            .where('epi.visitno', "=", visitNo)
            .orderBy('epi.dateepi', 'desc');
    }

    getEpiByHn(db: Knex, pid) {
        return db('visitepi as epi')
            .innerJoin('person', 'epi.pid', 'person.pid')
            .leftJoin('visit', 'epi.visitno', 'visit.visitno')
            .leftJoin('chospital', 'visit.pcucodeperson', 'chospital.hoscode')
            .leftJoin('cvaccinegroup as lib', 'epi.vaccinecode', 'lib.vaccode')
            .select('epi.*', 'epi.pcucodeperson as hospcode', 'chospital.hosname as hospname'
                , 'visit.visitdate as date_serv', 'visit.timestart as time_serv'
                , 'lib.vacname')
            .where('person.pid', "=", pid)
            .orderBy('epi.dateepi', 'desc');
    }

    getFp(db: Knex, visitNo) {
        return db('visitfp as fp')
            .innerJoin('person', 'fp.pid', 'person.pid')
            .leftJoin('visit', 'fp.visitno', 'visit.visitno')
            .leftJoin('chospital', 'visit.pcucodeperson', 'chospital.hoscode')
            .join('cdrug', function () {
                this.on('fp.fpcode', '=', 'cdrug.drugcode')
            })
            .select('fp.*', 'fp.pcucodeperson as hospcode', 'chospital.hosname as hospname'
                , 'visit.visitdate as date_serv', 'visit.timestart as time_serv',
                'cdrug.drugname')
            .where('fp.visitno', "=", visitNo)
            .where('cdrug.drugtype', "=", '04')
            .orderBy('fp.datefp', 'desc');
    }

    getFpByHn(db: Knex, pid) {
        return db('visitfp as fp')
            .innerJoin('person', 'fp.pid', 'person.pid')
            .innerJoin('visit', 'fp.visitno', 'visit.visitno')
            .leftJoin('chospital', 'visit.pcucodeperson', 'chospital.hoscode')
            .join('cdrug', function () {
                this.on('fp.fpcode', '=', 'cdrug.drugcode')
            })
            .select('fp.*', 'fp.pcucodeperson as hospcode', 'chospital.hosname as hospname'
                , 'visit.visitdate as date_serv', 'visit.timestart as time_serv',
                'cdrug.drugname')
            .where('person.pid', "=", pid)
            .where('cdrug.drugtype', "=", '04')
            .orderBy('fp.datefp', 'desc');
    }

    getNutrition(db: Knex, visitNo) {
        return db('visitnutrition as nutrition')
            .innerJoin('visit', 'nutrition.visitno', 'visit.visitno')
            .innerJoin('person', 'visit.pid', 'person.pid')
            .leftJoin('chospital', 'visit.pcucode', 'chospital.hoscode')
            .select('nutrition.*', 'nutrition.pcucode as hospcode', 'chospital.hosname as hospname'
                , 'visit.visitdate as date_serv', 'visit.timestart as time_serv')
            .where('nutrition.visitno', "=", visitNo)
            .orderBy('visit.visitdate', 'desc')
            .orderBy('visit.timestart', 'desc');
    }

    getNutritionByHn(db: Knex, pid) {
        return db('visitnutrition as nutrition')
            .innerJoin('visit', 'nutrition.visitno', 'visit.visitno')
            .innerJoin('person', 'visit.pid', 'person.pid')
            .leftJoin('chospital', 'visit.pcucode', 'chospital.hoscode')
            .select('nutrition.*', 'nutrition.pcucode as hospcode', 'chospital.hosname as hospname'
                , 'visit.visitdate as date_serv', 'visit.timestart as time_serv')
            .where('visit.pid', "=", pid)
            .orderBy('visit.visitdate', 'desc')
            .orderBy('visit.timestart', 'desc');
    }

    getDrugAllergy(db: Knex, pid, cid) {
        if (!pid && !cid)
            return null;

        let where = 'alg.drugcode!=""';
        if (pid) {
            where += ` and alg.pid="${pid}" `;
        }
        if (cid) {
            where += ` and person.idcard="${cid}" `;
        }
        return db('personalergic as alg')
            .innerJoin('person', 'alg.pid', 'person.pid')
            .leftJoin('chospital', 'alg.pcucodeperson', 'chospital.hoscode')
            .leftJoin('cdrugallergysymtom as lib', 'alg.symptom', 'lib.symtomcode')
            .join('cdrug', function () {
                this.on('alg.drugcode', '=', 'cdrug.drugcode')
            })
            .select('alg.*', 'alg.pcucodeperson as hospcode'
                , 'chospital.hosname as hospname'
                , 'cdrug.drugname', 'person.idcard'
                , 'lib.symtomname', 'lib.icd10tm')
            .whereRaw(db.raw(where))
            .where('cdrug.drugtype', "=", '01')
            .orderBy('person.fname')
            .orderBy('person.lname')
            .limit(maxLimit);
    }

    getChronic(db: Knex, pid, cid) {
        if (!pid && !cid)
            return null;

        let where = 'chronic.chroniccode!=""';
        if (pid) {
            where += ` and chronic.pid="${pid}" `;
        }
        if (cid) {
            where += ` and person.idcard="${cid}" `;
        }
        return db('personchronic as chronic')
            .innerJoin('person', 'chronic.pid', 'person.pid')
            .leftJoin('cdisease as icd', 'chronic.chroniccode', 'icd.diseasecode')
            .leftJoin('chospital', 'chronic.pcucodeperson', 'chospital.hoscode')
            .select('chronic.*', 'chronic.pcucodeperson as hospcode'
                , 'chospital.hosname as hospname')
            .select('icd.diseasename as dxname', 'icd.diseasenamethai as dxthai')
            .whereRaw(db.raw(where))
            .limit(maxLimit);
    }

    getLabResult(db, columnName, searchNo) {
        return [];
    }

    libDrug(db: Knex, searchType, searchValue) {
        return db('cdrug')
            .where(searchType, 'like', '%' + searchValue + '%')
            .where('drugtype', "=", '01')
            .limit(maxLimit);
    }













    getPerson(db: Knex, columnName, searchText) {
        columnName = columnName === 'cid' ? 'idcard' : columnName;
        columnName = columnName === 'hn' ? 'pid' : columnName;
        return db('person')
            .leftJoin('ctitle', 'person.prename', 'ctitle.titlecode')
            .select('pid as hn', 'idcard as cid', 'prename', 'ctitle.titlename',
                'fname', 'lname',
                'birth as dob', 'sex', 'hnomoi as address', 'mumoi as moo',
                'roadmoi as road','provcodemoi as province',
                'distcodemoi as district','subdistcodemoi as subdistrict',
                'telephoneperson as tel', 'postcodemoi as zip',
                'occupa as occupation')
            .select(db.raw('concat(provcodemoi, distcodemoi, subdistcodemoi) as addcode'))
            .where(columnName, "=", searchText);
    }

    getProcedureOpd(knex, columnName, searchNo, hospCode) {
        return knex('procedure_opd')
            .where(columnName, "=", searchNo);
    }

    getChargeOpd(knex, columnName, searchNo, hospCode) {
        return knex('charge_opd')
            .where(columnName, "=", searchNo);
    }

    getDrugOpd(knex, columnName, searchNo, hospCode) {
        return knex('drug_opd')
            .where(columnName, "=", searchNo);
    }

    getAdmission(knex, columnName, searchNo, hospCode) {
        return knex('admission')
            .where(columnName, "=", searchNo);
    }

    getDiagnosisIpd(knex, columnName, searchNo, hospCode) {
        return knex('diagnosis_ipd')
            .where(columnName, "=", searchNo);
    }

    getProcedureIpd(knex, columnName, searchNo, hospCode) {
        return knex('procedure_ipd')
            .where(columnName, "=", searchNo);
    }

    getChargeIpd(knex, columnName, searchNo, hospCode) {
        return knex('charge_ipd')
            .where(columnName, "=", searchNo);
    }

    getDrugIpd(knex, columnName, searchNo, hospCode) {
        return knex('drug_ipd')
            .where(columnName, "=", searchNo);
    }

    getAccident(knex, columnName, searchNo, hospCode) {
        return knex('accident')
            .where(columnName, "=", searchNo);
    }

    getAppointment(knex, columnName, searchNo, hospCode) {
        return knex('appointment')
            .where(columnName, "=", searchNo);
    }

    getData(knex, tableName, columnName, searchNo, hospCode) {
        return knex(tableName)
            .where(columnName, "=", searchNo)
            .limit(5000);
    }
}
