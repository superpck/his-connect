"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisHosxpv4Model = void 0;
const moment = require("moment");
const maxLimit = 250;
let hisHospcode = process.env.HOSPCODE;
const hisVersion = process.env.HIS_PROVIDER.toLowerCase() == 'hosxpv3' ? '3' : '4';
const dbClient = process.env.HIS_DB_CLIENT ? process.env.HIS_DB_CLIENT.toLowerCase() : 'mysql2';
const getHospcode = async () => {
    try {
        if (typeof global.dbHIS === 'function') {
            let row = await global.dbHIS('opdconfig').select('hospitalcode').first();
            hisHospcode = row ? row.hospitalcode : process.env.HOSPCODE;
            console.log('hisHospcode v.4', hisHospcode);
        }
        else {
            console.log('Default HOSPCODE:', hisHospcode);
        }
    }
    catch (error) {
        console.error('Error in getHospcode:', error);
        console.log('Default HOSPCODE:', hisHospcode);
    }
};
class HisHosxpv4Model {
    constructor() {
        getHospcode();
    }
    check() {
        return true;
    }
    async testConnect(db) {
        let result;
        result = await global.dbHIS('opdconfig').first();
        const hospname = result?.hospitalname || result?.hospitalcode || null;
        result = await db('patient').select('hn').limit(1);
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
    getTableName(db, dbName = process.env.HIS_DB_NAME) {
        return db('information_schema.tables')
            .select('table_name')
            .where('table_schema', '=', dbName);
    }
    getDepartment(db, depCode = '', depName = '') {
        let sql = db('clinic');
        if (depCode) {
            sql.where('clinic', depCode);
        }
        else if (depName) {
            sql.whereLike('name', `%${depName}%`);
        }
        return sql
            .select('clinic as department_code', 'name as department_name', `'-' as moph_code`)
            .select(db.raw(`CASE WHEN LOCATE('ฉุกเฉิน', name) > 0 THEN 1 ELSE 0 END as emergency`))
            .orderBy('name')
            .limit(maxLimit);
    }
    getWard(db, wardCode = '', wardName = '') {
        let sql = db('ward');
        if (wardCode) {
            sql.where('ward', wardCode);
        }
        else if (wardName) {
            sql.whereLike('name', `%${wardName}%`);
        }
        return sql
            .select('ward as wardcode', 'name as wardname', `ward_export_code as std_code`, 'bedcount as bed_normal', db.raw("CASE WHEN ward_active ='Y' THEN 1 ELSE 0 END as isactive"))
            .where('ward', '!=', '')
            .whereNotNull('ward')
            .orderBy('ward')
            .limit(maxLimit);
    }
    getDr(db, drCode = '', drName = '') {
        let sql = db('doctor');
        if (drCode) {
            sql.where('code', drCode);
        }
        else if (drName) {
            sql.whereLike('name', `%${drName}%`);
        }
        return sql
            .select('code as dr_code', 'licenseno as dr_license_code', 'name as dr_name', 'expire as expire_date')
            .whereRaw(`LEFT(licenseno,1) IN ('ว','ท')`)
            .limit(maxLimit);
    }
    getReferOut(db, date, hospCode = hisHospcode, visitNo = null) {
        return [];
    }
    async getPerson(db, columnName, searchText, hospCode = hisHospcode) {
        columnName = columnName == 'hn' ? 'p.hn' : columnName;
        columnName = columnName == 'cid' ? 'p.cid' : columnName;
        columnName = columnName == 'name' ? 'p.fname' : columnName;
        columnName = columnName == 'hid' ? 'h.house_id' : columnName;
        const rhGrp = hisVersion == '4' ? 'person.bloodgroup_rh' : 'person.blood_grp_rh';
        const vstatusSubquery = db('person_village_duty as pvd')
            .select(db.raw(`CASE 
                WHEN pvd.person_duty_id IN ('1','2','4','5') THEN '1'
                WHEN pvd.person_duty_id IN ('6') THEN '2'
                WHEN pvd.person_duty_id IN ('3') THEN '3'
                WHEN pvd.person_duty_id IN ('10') THEN '4'
                WHEN pvd.person_duty_id IN ('7','8','9') THEN '5'
                ELSE '5' 
            END`))
            .whereRaw('pvd.person_id = person.cid')
            .limit(1);
        const result = await db('patient as p')
            .leftJoin('person', 'p.hn', 'person.patient_hn')
            .leftJoin('house as h', 'person.house_id', 'h.house_id')
            .leftJoin('occupation as o', 'o.occupation', 'p.occupation')
            .leftJoin('nationality as nt0', 'nt0.nationality', 'p.citizenship')
            .leftJoin('nationality as nt1', 'nt1.nationality', 'p.nationality')
            .leftJoin('provis_religion as r', 'r.code', 'p.religion')
            .leftJoin('education as e', 'e.education', 'p.educate')
            .leftJoin('person_labor_type as pl', 'person.person_labor_type_id', 'pl.person_labor_type_id')
            .select(db.raw('? as HOSPCODE', [hisHospcode]), 'h.house_id as HID', 'p.cid as CID', 'p.pname as PRENAME', 'p.fname as NAME', 'p.lname as LNAME', 'p.hn as HN', 'p.hn as PID', 'p.sex as SEX', 'p.birthday as BIRTH', db.raw("CASE WHEN p.marrystatus IN (1,2,3,4,5,6) THEN p.marrystatus ELSE 9 END as MSTATUS"), db.raw("CASE WHEN person.person_house_position_id = 1 THEN '1' ELSE '2' END as FSTATUS"), db.raw("CASE WHEN o.occupation IS NULL THEN '000' ELSE o.occupation END AS OCCUPATION_OLD"), db.raw("CASE WHEN o.nhso_code IS NULL THEN '9999' ELSE o.nhso_code END AS OCCUPATION_NEW"), db.raw("CASE WHEN nt0.nhso_code IS NULL THEN '099' ELSE nt0.nhso_code END AS RACE"), db.raw("CASE WHEN nt1.nhso_code IS NULL THEN '099' ELSE nt1.nhso_code END AS NATION"), db.raw("CASE WHEN p.religion IS NULL THEN '01' ELSE p.religion END AS RELIGION"), db.raw("CASE WHEN e.provis_code IS NULL THEN '9' ELSE e.provis_code END as EDUCATION"), 'p.father_cid as FATHER', 'p.mother_cid as MOTHER', 'p.couple_cid as COUPLE', db.raw(`(${vstatusSubquery.toString()}) as VSTATUS`), 'person.movein_date as MOVEIN', db.raw("CASE WHEN person.person_discharge_id IS NULL THEN '9' ELSE person.person_discharge_id END AS DISCHARGE"), 'person.discharge_date as DDISCHARGE', `person.blood_group as ABOGROUP`, `${rhGrp} as RHGROUP`, 'pl.nhso_code as LABOR', 'p.passport_no as PASSPORT', 'p.type_area as TYPEAREA', 'p.mobile_phone_number as MOBILE', 'p.deathday as dead', db.raw('CASE WHEN p.last_update IS NULL THEN p.last_update ELSE p.last_visit END as D_UPDATE'))
            .where(columnName, searchText);
        return result[0];
    }
    async getAddress(db, columnName, searchText, hospCode = hisHospcode) {
        const result = await db('person as p')
            .leftJoin('patient as pt', 'p.cid', 'pt.cid')
            .leftJoin('house as h', 'h.house_id', 'p.house_id')
            .leftJoin('village as v', 'v.village_id', 'h.village_id')
            .leftJoin('thaiaddress as t', 't.addressid', 'v.address_id')
            .leftJoin('person_address as pa', 'pa.person_id', 'p.person_id')
            .select(db.raw('? AS hospcode', [hisHospcode]), 'pt.cid', 'pt.hn', db.raw('pt.hn as pid'), db.raw("CASE WHEN p.house_regist_type_id IN (1, 2) THEN '1' ELSE '2' END as addresstype"), db.raw("CASE WHEN h.census_id IS NULL THEN '' ELSE h.census_id END AS house_id"), db.raw("CASE WHEN p.house_regist_type_id IN (4) THEN '9' ELSE h.house_type_id END as housetype"), db.raw('h.house_condo_roomno as roomno'), db.raw('h.house_condo_name as condo'), db.raw("CASE WHEN p.house_regist_type_id IN (4) THEN pt.addrpart ELSE h.address END as houseno"), db.raw("'' as soisub"), db.raw("'' as soimain"), db.raw("CASE WHEN p.house_regist_type_id IN (4) THEN pt.road ELSE h.road END as road"), db.raw("CASE WHEN p.house_regist_type_id IN (4) THEN '' ELSE v.village_name END as villaname"), db.raw("CASE WHEN p.house_regist_type_id IN (4) THEN pt.moopart ELSE v.village_moo END as village"), db.raw("CASE WHEN p.house_regist_type_id IN (4) THEN pt.tmbpart ELSE t.tmbpart END as tambon"), db.raw("CASE WHEN p.house_regist_type_id IN (4) THEN pt.amppart ELSE t.amppart END as ampur"), db.raw("CASE WHEN p.house_regist_type_id IN (4) THEN pt.chwpart ELSE t.chwpart END as changwat"), db.raw('p.last_update as D_Update'))
            .where(columnName, searchText);
        return result[0];
    }
    async getService(db, columnName, searchText, hospCode = hisHospcode) {
        columnName = columnName === 'visitNo' ? 'os.vn' : columnName;
        columnName = columnName === 'vn' ? 'os.vn' : columnName;
        columnName = columnName === 'seq_id' ? 'os.seq_id' : columnName;
        columnName = columnName === 'hn' ? 'o.hn' : columnName;
        columnName = columnName === 'date_serv' ? 'o.vstdate' : columnName;
        const result = await db('ovst as o')
            .select(db.raw('? as HOSPCODE', [hisHospcode]), db.raw('pt.hn as PID'), db.raw('o.hn as HN'), db.raw('pt.CID'), db.raw('os.seq_id'), db.raw('os.vn as SEQ'), db.raw(`CASE 
                    WHEN o.vstdate IS NULL OR TRIM(o.vstdate) = '' OR o.vstdate LIKE '0000-00-00%' 
                    THEN '' 
                    ELSE DATE_FORMAT(o.vstdate, '%Y-%m-%d') 
                END as DATE_SERV`), db.raw(`CASE 
                    WHEN o.vsttime IS NULL OR TRIM(o.vsttime) = '' OR o.vsttime LIKE '0000-00-00%' 
                    THEN '' 
                    ELSE TIME_FORMAT(o.vsttime, '%H%i%s') 
                END as TIME_SERV`), db.raw(`CASE WHEN v.village_moo <> '0' THEN '1' ELSE '2' END as LOCATION`), db.raw(`CASE o.visit_type 
                    WHEN 'i' THEN '1' 
                    WHEN 'o' THEN '2' 
                    ELSE '1' 
                END as INTIME`), db.raw(`CASE WHEN p2.pttype_std_code IS NULL OR p2.pttype_std_code = '' THEN '9100' ELSE p2.pttype_std_code END as INSTYPE`), db.raw('o.hospmain as MAIN'), db.raw(`CASE o.pt_subtype 
                    WHEN '7' THEN '2' 
                    WHEN '9' THEN '3' 
                    WHEN '10' THEN '4' 
                    ELSE '1' 
                END as TYPEIN`), db.raw('CASE WHEN o.rfrolct IS NULL THEN i.rfrolct ELSE o.rfrolct END as REFEROUTHOSP'), db.raw('CASE WHEN o.rfrocs IS NULL THEN i.rfrocs ELSE o.rfrocs END as CAUSEOUT'), db.raw('s.waist'), db.raw('s.cc'), db.raw('s.pe'), db.raw('s.pmh as ph'), db.raw('s.hpi as pi'), db.raw(`CONCAT('CC:', s.cc, ' HPI:', s.hpi, ' PMH:', s.pmh) as nurse_note`), db.raw(`CASE WHEN o.pt_subtype IN ('0', '1') THEN '1' ELSE '2' END as SERVPLACE`), db.raw(`CASE WHEN s.temperature IS NOT NULL THEN REPLACE(FORMAT(s.temperature, 1), ',', '') ELSE FORMAT(0, 1) END as BTEMP`), db.raw('FORMAT(s.bps, 0) as SBP'), db.raw('FORMAT(s.bpd, 0) as DBP'), db.raw('FORMAT(s.pulse, 0) as PR'), db.raw('FORMAT(s.rr, 0) as RR'), db.raw('s.o2sat'), db.raw('s.bw as weight'), db.raw('s.height'), db.raw(`'er.gcs_e'`), db.raw(`'er.gcs_v'`), db.raw(`'er.gcs_m'`), db.raw(`'er.pupil_l as pupil_left'`), db.raw(`'er.pupil_r as pupil_right'`), db.raw(`CASE 
                    WHEN (o.ovstost >= '01' AND o.ovstost <= '14') THEN '2' 
                    WHEN o.ovstost IN ('98', '99', '61', '62', '63', '00') THEN '1' 
                    WHEN o.ovstost = '54' THEN '3' 
                    WHEN o.ovstost = '52' THEN '4' 
                    ELSE '7' 
                END as TYPEOUT`), db.raw('o.doctor as dr'), db.raw('doctor.licenseno as provider'), db.raw(`CASE WHEN vn.inc01 + vn.inc12 IS NOT NULL THEN REPLACE(FORMAT(vn.inc01 + vn.inc12, 2), ',', '') ELSE FORMAT(0, 2) END as COST`), db.raw(`CASE WHEN vn.item_money IS NOT NULL THEN REPLACE(FORMAT(vn.item_money, 2), ',', '') ELSE FORMAT(0, 2) END as PRICE`), db.raw(`CASE WHEN vn.paid_money IS NOT NULL THEN REPLACE(FORMAT(vn.paid_money, 2), ',', '') ELSE FORMAT(0, 2) END as PAYPRICE`), db.raw(`CASE WHEN vn.rcpt_money IS NOT NULL THEN REPLACE(FORMAT(vn.rcpt_money, 2), ',', '') ELSE FORMAT(0, 2) END as ACTUALPAY`), db.raw(`CASE 
                    WHEN CONCAT(o.vstdate, ' ', o.vsttime) IS NULL 
                        OR TRIM(CONCAT(o.vstdate, ' ', o.vsttime)) = '' 
                        OR CONCAT(o.vstdate, ' ', o.vsttime) LIKE '0000-00-00%' 
                    THEN '' 
                    ELSE DATE_FORMAT(CONCAT(o.vstdate, ' ', o.vsttime), '%Y-%m-%d %H:%i:%s') 
                END as D_UPDATE`), db.raw('vn.hospsub as hsub'))
            .leftJoin('person as p', 'o.hn', 'p.patient_hn')
            .leftJoin('vn_stat as vn', function () {
            this.on('o.vn', '=', 'vn.vn')
                .andOn('vn.hn', '=', 'p.patient_hn');
        })
            .leftJoin('ipt as i', 'i.vn', 'o.vn')
            .leftJoin('opdscreen as s', function () {
            this.on('o.vn', '=', 's.vn')
                .andOn('o.hn', '=', 's.hn');
        })
            .leftJoin('pttype as p2', 'p2.pttype', 'vn.pttype')
            .leftJoin('village as v', 'v.village_id', 'p.village_id')
            .leftJoin('patient as pt', 'pt.hn', 'o.hn')
            .leftJoin('ovst_seq as os', 'os.vn', 'o.vn')
            .leftJoin('doctor', 'o.doctor', 'doctor.code')
            .leftJoin('er_nursing_detail as er', 'er.vn', 'o.vn')
            .whereRaw(`${columnName} = ?`, [searchText]);
        return result;
    }
    async getDiagnosisOpd(db, visitNo, hospCode = hisHospcode) {
        const result = await db('ovst as o')
            .select(db.raw('? as HOSPCODE', [hisHospcode]), db.raw('pt.cid as CID'), db.raw('o.hn as PID'), db.raw('o.hn'), db.raw('q.seq_id'), db.raw('q.vn as SEQ'), db.raw('q.vn as VN'), db.raw('o.vstdate as DATE_SERV'), db.raw(`CASE WHEN odx.diagtype IS NULL THEN '' ELSE odx.diagtype END as DIAGTYPE`), db.raw('odx.icd10 as DIAGCODE'), db.raw(`CASE WHEN s.provis_code IS NULL THEN '' ELSE s.provis_code END as CLINIC`), db.raw('d.CODE as PROVIDER'), db.raw('q.update_datetime as D_UPDATE'))
            .leftJoin('ovst_seq as q', 'q.vn', 'o.vn')
            .leftJoin('ovstdiag as odx', 'odx.vn', 'o.vn')
            .leftJoin('patient as pt', 'pt.hn', 'o.hn')
            .leftJoin('person as p', 'p.patient_hn', 'pt.hn')
            .leftJoin('spclty as s', 's.spclty', 'o.spclty')
            .leftJoin('doctor as d', 'd.CODE', 'o.doctor')
            .where('q.vn', visitNo)
            .whereRaw(`odx.icd10 REGEXP '[A-Z]'`);
        return result;
    }
    async getDiagnosisOpdAccident(db, dateStart, dateEnd, hospCode = hisHospcode) {
        if (dateStart && dateEnd) {
            return db('ovstdiag as dx')
                .whereBetween('vstdate', [dateStart, dateEnd])
                .whereRaw(`left(icd10,1) in ('V','W','X','Y')`)
                .limit(maxLimit);
        }
        else {
            throw new Error('Invalid parameters');
        }
    }
    async getDiagnosisOpdVWXY(db, date) {
        const subquery = db('ovstdiag as dx')
            .select('vn')
            .where('dx.vstdate', date)
            .whereRaw(`LEFT(icd10, 1) IN ('V', 'W', 'X', 'Y')`);
        const result = await db('ovstdiag as dx')
            .select(db.raw('hn'), db.raw('vn as visitno'), db.raw('dx.vstdate as date'), db.raw('icd10 as diagcode'), db.raw('icd.name as diag_name'), db.raw('dx.diagtype as diag_type'), db.raw('doctor as dr'), db.raw('dx.episode'), db.raw(`'IT' as codeset`), db.raw('update_datetime as d_update'))
            .leftJoin('icd10_sss as icd', 'dx.icd10', 'icd.code')
            .whereIn('vn', subquery)
            .whereRaw(`LEFT(icd10, 1) IN ('S', 'T', 'V', 'W', 'X', 'Y')`)
            .orderBy('dx.vn')
            .orderBy('diagtype')
            .orderBy('update_datetime')
            .limit(maxLimit);
        return result;
    }
    async getDiagnosisSepsisOpd(db, date) {
        const subquery = db('ovstdiag as dx')
            .select('vn')
            .where('dx.vstdate', date)
            .where(function () {
            this.whereRaw(`LEFT(icd10, 4) IN ('R651', 'R572')`)
                .orWhereRaw(`LEFT(diag, 3) IN ('A40', 'A41')`);
        })
            .groupBy('dx.vn');
        const result = await db('ovstdiag as dx')
            .select(db.raw('hn'), db.raw('vn as visitno'), db.raw('dx.vstdate as date'), db.raw('icd10 as diagcode'), db.raw('icd.name as diag_name'), db.raw('dx.diagtype as diag_type'), db.raw('doctor as dr'), db.raw('dx.episode'), db.raw(`'IT' as codeset`), db.raw('update_datetime as d_update'))
            .leftJoin('icd10_sss as icd', 'dx.icd10', 'icd.code')
            .whereIn('vn', subquery)
            .orderBy('dx.vn')
            .orderBy('diagtype')
            .orderBy('update_datetime')
            .limit(maxLimit);
        return result;
    }
    async getDiagnosisSepsisIpd(db, dateStart, dateEnd) {
        const subquery = db('iptdiag as dx')
            .select('dx.an')
            .leftJoin('ipt', 'dx.an', 'ipt.an')
            .whereBetween('ipt.dchdate', [dateStart, dateEnd])
            .where(function () {
            this.whereRaw(`LEFT(icd10, 4) IN ('R651', 'R572')`)
                .orWhereRaw(`LEFT(diag, 3) IN ('A40', 'A41')`);
        })
            .groupBy('dx.an');
        const result = await db('iptdiag as dx')
            .select(db.raw('ipt.hn'), db.raw('ipt.vn as visitno'), db.raw('dx.an'), db.raw('ipt.dchdate as date'), db.raw('dx.icd10 as diagcode'), db.raw('icd.name as diag_name'), db.raw('dx.diagtype as diag_type'), db.raw('dx.doctor as dr'), db.raw('patient.pname as patient_prename'), db.raw('patient.fname as patient_fname'), db.raw('patient.lname as patient_lname'), db.raw('ipt.ward as wardcode'), db.raw('ward.name as wardname'), db.raw(`'IT' as codeset`), db.raw('dx.entry_datetime as d_update'))
            .leftJoin('icd10_sss as icd', 'dx.icd10', 'icd.code')
            .leftJoin('ipt', 'dx.an', 'ipt.an')
            .leftJoin('patient', 'ipt.hn', 'patient.hn')
            .leftJoin('ward', 'ipt.ward', 'ward.ward')
            .whereIn('dx.an', subquery)
            .orderBy('dx.an')
            .orderBy('diagtype')
            .orderBy('ipt.update_datetime')
            .limit(maxLimit);
        return result;
    }
    async getProcedureOpd(db, visitNo, hospCode = hisHospcode) {
        const query1 = db('health_med_service as h1')
            .select(db.raw('? as hospcode', [hisHospcode]), db.raw('pt.hn as pid'), db.raw('os.seq_id'), db.raw('os.vn as seq'), db.raw('os.vn'), db.raw(`CASE 
                    WHEN o.vstdate IS NULL OR TRIM(o.vstdate) = '' OR o.vstdate LIKE '0000-00-00%' 
                    THEN '' 
                    ELSE DATE_FORMAT(o.vstdate, '%Y-%m-%d') 
                END as date_serv`), db.raw('sp.provis_code as clinic'), db.raw('h3.icd10tm as procedcode'), db.raw(`CASE 
                    WHEN h2.service_price IS NOT NULL AND TRIM(h2.service_price) <> '' 
                    THEN REPLACE(FORMAT(h2.service_price, 2), ',', '') 
                    ELSE FORMAT(0, 2) 
                END as serviceprice`), db.raw('h1.health_med_doctor_id as provider'), db.raw(`CASE 
                    WHEN CONCAT(o.vstdate, ' ', o.vsttime) IS NULL 
                        OR TRIM(CONCAT(o.vstdate, ' ', o.vsttime)) = '' 
                        OR CONCAT(o.vstdate, ' ', o.vsttime) LIKE '0000-00-00%' 
                    THEN '' 
                    ELSE DATE_FORMAT(CONCAT(o.vstdate, ' ', o.vsttime), '%Y-%m-%d %H:%i:%s') 
                END as d_update`))
            .leftJoin('health_med_service_operation as h2', 'h2.health_med_service_id', 'h1.health_med_service_id')
            .leftJoin('health_med_operation_item as h3', 'h3.health_med_operation_item_id', 'h2.health_med_operation_item_id')
            .leftJoin('health_med_organ as g1', 'g1.health_med_organ_id', 'h2.health_med_organ_id')
            .leftJoin('health_med_operation_type as t1', 't1.health_med_operation_type_id', 'h2.health_med_operation_type_id')
            .leftJoin('ovst as o', function () {
            this.on('o.vn', '=', 'h1.vn')
                .andOn('h1.hn', '=', 'o.hn');
        })
            .leftJoin('vn_stat as v', function () {
            this.on('v.vn', '=', 'h1.vn')
                .andOn('h1.hn', '=', 'v.hn');
        })
            .leftJoin('person as p', 'p.patient_hn', 'o.hn')
            .leftJoin('spclty as sp', 'sp.spclty', 'o.spclty')
            .leftJoin('patient as pt', 'pt.hn', 'o.hn')
            .leftJoin('ovst_seq as os', 'os.vn', 'o.vn')
            .whereNotNull('h3.icd10tm')
            .whereNotNull('v.cid')
            .where('v.cid', '<>', '')
            .where('os.vn', visitNo);
        const query2 = db('er_regist_oper as r')
            .distinct()
            .select(db.raw('? as hospcode', [hisHospcode]), db.raw('pt.hn as pid'), db.raw('os.seq_id'), db.raw('os.vn as seq'), db.raw('os.vn'), db.raw(`CASE 
                    WHEN o.vstdate IS NULL OR TRIM(o.vstdate) = '' OR o.vstdate LIKE '0000-00-00%' 
                    THEN '' 
                    ELSE DATE_FORMAT(o.vstdate, '%Y-%m-%d') 
                END as date_serv`), db.raw('sp.provis_code as clinic'), db.raw(`CASE 
                    WHEN e.icd10tm IS NULL OR e.icd10tm = '' 
                    THEN e.icd9cm 
                    ELSE e.icd10tm 
                END as procedcode`), db.raw(`CASE 
                    WHEN e.price IS NOT NULL AND TRIM(e.price) <> '' 
                    THEN REPLACE(FORMAT(e.price, 2), ',', '') 
                    ELSE FORMAT(0, 2) 
                END as serviceprice`), db.raw('r.doctor as provider'), db.raw(`CASE 
                    WHEN CONCAT(o.vstdate, ' ', o.vsttime) IS NULL 
                        OR TRIM(CONCAT(o.vstdate, ' ', o.vsttime)) = '' 
                        OR CONCAT(o.vstdate, ' ', o.vsttime) LIKE '0000-00-00%' 
                    THEN '' 
                    ELSE DATE_FORMAT(CONCAT(o.vstdate, ' ', o.vsttime), '%Y-%m-%d %H:%i:%s') 
                END as d_update`))
            .leftJoin('er_oper_code as e', 'e.er_oper_code', 'r.er_oper_code')
            .leftJoin('vn_stat as v', 'v.vn', 'r.vn')
            .leftJoin('ovst as o', 'o.vn', 'r.vn')
            .leftJoin('person as p', 'p.patient_hn', 'o.hn')
            .leftJoin('spclty as sp', 'sp.spclty', 'o.spclty')
            .leftJoin('patient as pt', 'pt.hn', 'o.hn')
            .leftJoin('ovst_seq as os', 'os.vn', 'o.vn')
            .where('e.icd9cm', '<>', '')
            .whereNotNull('v.cid')
            .where('v.cid', '<>', '')
            .where('os.vn', visitNo);
        const query3 = db('dtmain as r')
            .distinct()
            .select(db.raw('? as hospcode', [hisHospcode]), db.raw('pt.hn as pid'), db.raw('os.seq_id'), db.raw('os.vn as seq'), db.raw('os.vn'), db.raw(`CASE 
                    WHEN r.vstdate IS NULL OR TRIM(r.vstdate) = '' OR r.vstdate LIKE '0000-00-00%' 
                    THEN '' 
                    ELSE DATE_FORMAT(r.vstdate, '%Y-%m-%d') 
                END as date_serv`), db.raw('sp.provis_code as clinic'), db.raw(`CASE 
                    WHEN e.icd10tm_operation_code IS NULL OR e.icd10tm_operation_code = '' 
                    THEN e.icd9cm 
                    ELSE e.icd10tm_operation_code 
                END as procedcode`), db.raw(`CASE 
                    WHEN r.fee IS NOT NULL AND TRIM(r.fee) <> '' 
                    THEN REPLACE(FORMAT(r.fee, 2), ',', '') 
                    ELSE FORMAT(0, 2) 
                END as serviceprice`), db.raw('r.doctor as provider'), db.raw(`CASE 
                    WHEN CONCAT(o.vstdate, ' ', o.vsttime) IS NULL 
                        OR TRIM(CONCAT(o.vstdate, ' ', o.vsttime)) = '' 
                        OR CONCAT(o.vstdate, ' ', o.vsttime) LIKE '0000-00-00%' 
                    THEN '' 
                    ELSE DATE_FORMAT(CONCAT(o.vstdate, ' ', o.vsttime), '%Y-%m-%d %H:%i:%s') 
                END as d_update`))
            .leftJoin('person as p', 'p.patient_hn', 'r.hn')
            .leftJoin('dttm as e', 'e.icd9cm', 'r.icd9')
            .leftJoin('vn_stat as v', function () {
            this.on('v.vn', '=', 'r.vn')
                .andOn('v.hn', '=', 'r.hn');
        })
            .leftJoin('ovst as o', function () {
            this.on('o.vn', '=', 'r.vn')
                .andOn('o.hn', '=', 'r.hn');
        })
            .leftJoin('spclty as sp', 'sp.spclty', 'o.spclty')
            .leftJoin('patient as pt', 'pt.hn', 'o.hn')
            .leftJoin('ovst_seq as os', 'os.vn', 'o.vn')
            .whereNotNull('v.cid')
            .where('v.cid', '<>', '')
            .whereNotNull('e.icd10tm_operation_code')
            .where('os.vn', visitNo);
        const result = await db.raw(`
            ${query1.toString()}
            UNION ALL
            ${query2.toString()}
            UNION ALL
            ${query3.toString()}
        `);
        return result[0];
    }
    async getChargeOpd(db, visitNo, hospCode = hisHospcode) {
        const result = await db('opitemrece as o')
            .select(db.raw('? as hospcode', [hisHospcode]), db.raw('pt.hn as pid'), db.raw('os.seq_id'), db.raw('os.vn as seq'), db.raw('os.vn'), db.raw(`CASE 
                    WHEN CONCAT(ovst.vstdate) IS NULL 
                        OR TRIM(CONCAT(ovst.vstdate)) = '' 
                        OR CONCAT(ovst.vstdate) LIKE '0000-00-00%' 
                    THEN '' 
                    ELSE DATE_FORMAT(CONCAT(ovst.vstdate), '%Y-%m-%d') 
                END as date_serv`), db.raw(`CASE 
                    WHEN sp.provis_code IS NULL OR sp.provis_code = '' 
                    THEN '00100' 
                    ELSE sp.provis_code 
                END as clinic`), db.raw('o.income as chargeitem'), db.raw(`CASE 
                    WHEN d.charge_list_id IS NULL OR d.charge_list_id = '' 
                    THEN '0000000' 
                    ELSE RIGHT(CONCAT('00000000', d.charge_list_id), 6) 
                END as chargelist`), db.raw('o.qty as quantity'), db.raw(`CASE 
                    WHEN p2.pttype_std_code IS NULL OR p2.pttype_std_code = '' 
                    THEN '9100' 
                    ELSE p2.pttype_std_code 
                END as instype`), db.raw('FORMAT(o.cost, 2) as cost'), db.raw('FORMAT(o.sum_price, 2) as price'), db.raw(`'0.00' as payprice`), db.raw(`CASE 
                    WHEN CONCAT(ovst.vstdate, ' ', ovst.cur_dep_time) IS NULL 
                        OR TRIM(CONCAT(ovst.vstdate, ' ', ovst.cur_dep_time)) = '' 
                        OR CONCAT(ovst.vstdate, ' ', ovst.cur_dep_time) LIKE '0000-00-00%' 
                    THEN '' 
                    ELSE DATE_FORMAT(CONCAT(ovst.vstdate, ' ', ovst.cur_dep_time), '%Y-%m-%d %H:%i:%s') 
                END as d_update`))
            .leftJoin('ovst', 'o.vn', 'ovst.vn')
            .leftJoin('person as p', 'o.hn', 'p.patient_hn')
            .leftJoin('spclty as sp', 'sp.spclty', 'ovst.spclty')
            .leftJoin('pttype as p2', 'p2.pttype', 'o.pttype')
            .leftJoin('patient as pt', 'pt.hn', 'o.hn')
            .leftJoin('ovst_seq as os', 'os.vn', 'o.vn')
            .leftJoin('drugitems_charge_list as d', 'd.icode', 'o.icode')
            .where('os.vn', visitNo);
        return result;
    }
    getLabRequest(db, columnName, searchNo, hospCode = hisHospcode) {
        columnName = columnName === 'visitNo' ? 'vn' : columnName;
        return db('lab_order as o')
            .leftJoin('lab_order_service as s', 'o.lab_order_number', 's.lab_order_number')
            .select(db.raw(`'${hospCode}' as hospcode`))
            .select('vn as visitno', 'lab.hn as hn', 'lab.an as an', 'lab.lab_no as request_id', 'lab.lab_code as LOCALCODE', 'lab.lab_name as INVESTNAME', 'lab.loinc as loinc', 'lab.icdcm as icdcm', 'lab.standard as cgd', 'lab.cost as cost', 'lab.lab_price as price', 'lab.date as DATETIME_REPORT')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
    getInvestigation(db, columnName, searchNo, hospCode = hisHospcode) {
        return this.getLabResult(db, columnName, searchNo);
    }
    ;
    getLabResult(db, columnName, searchNo) {
        columnName = columnName === 'visitNo' ? 'lab_head.vn' : columnName;
        columnName = columnName === 'hn' ? 'ovst.hn' : columnName;
        columnName = columnName === 'cid' ? 'patient.cid' : columnName;
        return db('lab_head')
            .leftJoin('lab_order', 'lab_head.lab_order_number', 'lab_order.lab_order_number')
            .leftJoin('lab_items', 'lab_order.lab_items_code', 'lab_items.lab_items_code')
            .leftJoin('lab_items_sub_group', 'lab_items.lab_items_sub_group_code', 'lab_items_sub_group.lab_items_sub_group_code')
            .innerJoin('ovst', 'lab_head.vn', 'ovst.vn')
            .innerJoin('patient', 'ovst.hn', 'patient.hn')
            .select(db.raw(`'${hisHospcode}' as HOSPCODE,'LAB' as INVESTTYPE`))
            .select('lab_head.vn', 'lab_head.vn as visitno', 'lab_head.vn as SEQ', 'lab_head.hn as PID', 'patient.cid as CID', 'lab_head.lab_order_number as request_id', 'lab_order.lab_items_code as LOCALCODE', 'lab_items.tmlt_code as tmlt', 'lab_head.form_name as lab_group', 'lab_order.lab_items_name_ref as INVESTNAME', 'lab_order.lab_order_result as INVESTVALUE', 'lab_items.icode as ICDCM', 'lab_items.lab_items_sub_group_code as GROUPCODE', 'lab_items_sub_group.lab_items_sub_group_name as GROUPNAME')
            .select(db.raw(`case when lab_order.lab_items_normal_value_ref then concat(lab_items.lab_items_unit,' (', lab_order.lab_items_normal_value_ref,')') else lab_items.lab_items_unit end  as UNIT`))
            .select(db.raw(`concat(lab_head.order_date, ' ', lab_head.order_time) as DATETIME_INVEST`))
            .select(db.raw(`concat(lab_head.report_date, ' ', lab_head.report_time) as DATETIME_REPORT`))
            .where(columnName, searchNo)
            .where(`lab_order.confirm`, 'Y')
            .whereNot(`lab_order.lab_order_result`, '')
            .whereNotNull('lab_order.lab_order_result')
            .limit(maxLimit);
    }
    async getDrugOpd(db, visitNo, hospCode = hisHospcode) {
        const sql = `
            SELECT ? as HOSPCODE,
                pt.hn as PID, pt.cid as CID,
                os.seq_id, os.vn as SEQ, os.vn,
                if(
                    opi.vstdate  is null 
                        or trim(opi.vstdate)='' 
                        or opi.vstdate  like '0000-00-00%',
                    '',
                    date_format(opi.vstdate ,'%Y-%m-%d')
                ) as date_serv,
                sp.provis_code as clinic,
                d.did as DID,d.tmt_tp_code as DID_TMT,
                d.icode as dcode, d.name as dname,
                opi.qty as amount,
                d.packqty as unit,
                d.units  as unit_packing,
				concat(d.usage_code, ' ' , d.frequency_code, ' ', d.usage_unit_code, ' ', d.time_code) as usage_code,
				concat(drugusage.name1, ' ', drugusage.name2 , ' ' , drugusage.name3) as drug_usage,
				d.therapeutic as caution,
                format(opi.unitprice,2) as drugprice, 
                format(d.unitcost,2)  as drugcost, 
                opi.doctor as provider,
                if(
                    opi.last_modified  is null 
                        or trim(opi.last_modified)='' 
                        or opi.last_modified  like '0000-00-00%',
                    date_format(concat(opi.rxdate,' ',opi.rxtime),'%Y-%m-%d %H:%i:%s'),
                    date_format(opi.last_modified,'%Y-%m-%d %H:%i:%s')
                ) as d_update
                
            FROM
                opitemrece opi 
                left join ovst o on o.vn=opi.vn  and o.hn=opi.hn
                inner join drugitems d on opi.icode=d.icode
                left join drugusage on d.drugusage=drugusage.drugusage
                left join spclty sp on o.spclty=sp.spclty
                left join person p on opi.hn=p.patient_hn 
                left join patient pt on pt.hn = o.hn
                left join ovst_seq os on os.vn = o.vn 
                
            WHERE 
                (opi.an is null or opi.an ='') 
                and opi.vn not in (select i.vn from ipt as i where i.vn=opi.vn) 
                and opi.icode like '1%'
                and os.vn=?
        `;
        const result = await db.raw(sql, [hisHospcode, visitNo]);
        return result[0];
    }
    async getAdmission(db, columnName, searchValue, hospCode = hisHospcode) {
        columnName = columnName === 'an' ? 'i.an' : columnName;
        columnName = columnName === 'hn' ? 'i.hn' : columnName;
        columnName = columnName === 'visitNo' ? 'q.vn' : columnName;
        columnName = columnName === 'dateadmit' ? 'i.regdate' : columnName;
        columnName = columnName === 'datedisc' ? 'i.dchdate' : columnName;
        let sqlCommand = db('ipt as i')
            .leftJoin('an_stat as a', 'i.an', 'a.an')
            .leftJoin('iptdiag as idx', 'i.an', 'idx.an')
            .leftJoin('patient as pt', 'i.hn', 'pt.hn')
            .leftJoin('person as p', 'p.patient_hn', 'pt.hn')
            .leftJoin('ovst as o', 'o.vn', 'i.vn')
            .leftJoin('ovst_seq as q', 'q.vn', 'o.vn')
            .leftJoin('opdscreen as os', 'o.vn', 'os.vn')
            .leftJoin('spclty as s', 'i.spclty', 's.spclty')
            .leftJoin('pttype as p1', 'p1.pttype', 'i.pttype')
            .leftJoin('provis_instype as ps', 'ps.CODE', 'p1.nhso_code')
            .leftJoin('dchtype as dt', 'i.dchtype', 'dt.dchtype')
            .leftJoin('dchstts as ds', 'i.dchstts', 'ds.dchstts')
            .leftJoin('opitemrece as c', 'c.an', 'i.an')
            .leftJoin('doctor', 'a.dx_doctor', 'doctor.code')
            .leftJoin('ward', 'i.ward', 'ward.ward');
        if (Array.isArray(searchValue)) {
            sqlCommand.whereIn(columnName, searchValue);
        }
        else {
            sqlCommand.where(columnName, searchValue);
        }
        if (columnName == 'i.dchdate') {
            sqlCommand.whereRaw('LENGTH(i.rfrilct)=5');
        }
        return sqlCommand
            .select(db.raw(`
                ? as HOSPCODE,
                i.hn as PID,
                q.seq_id, o.vn SEQ,
                i.an AS AN, pt.cid, pt.sex as SEX,
                date_format(concat(i.regdate, ' ', i.regtime),'%Y-%m-%d %H:%i:%s') as datetime_admit,
                i.ward as WARD_LOCAL,
                CASE WHEN s.provis_code IS NULL THEN '' ELSE s.provis_code END AS wardadmit,
                ward.name as WARDADMITNAME,
                CASE WHEN ps.pttype_std_code THEN '' ELSE ps.pttype_std_code END AS instype,
                RIGHT ((SELECT export_code FROM ovstist WHERE ovstist = i.ivstist),1),'1' AS typein,
                i.rfrilct as referinhosp,
                i.rfrics as causein,
                cast(
                    IF (
                        i.bw = 0,'',
                            IF (
                                i.bw IS NOT NULL,
                                cast(i.bw / 1000 AS DECIMAL(5, 1)),
                                IF (
                                    os.bw = 0,'',
                                    cast(os.bw AS DECIMAL(5, 1))
                                )
                            )
                    ) AS CHAR (5)
                ) ddmitweight,
                IF (os.height = 0,'',os.height) admitheight,
                CASE WHEN i.dchdate IS NULL THEN '' ELSE date_format(concat(i.dchdate, ' ', i.dchtime),'%Y-%m-%d %H:%i:%s') END AS datetime_disch,
                CASE WHEN s.provis_code IS NULL THEN '' ELSE s.provis_code END AS warddisch,
                ward.name as WARDDISCHNAME,
                CASE WHEN ds.nhso_dchstts IS NULL THEN '' ELSE ds.nhso_dchstts END AS dischstatus,
                CASE WHEN dt.nhso_dchtype IS NULL THEN '' ELSE dt.nhso_dchtype END AS dischtype,
                IF(i.dchtype = '04',i.rfrolct,'') AS referouthosp,
                IF (
                    i.dchtype = 04,            
                    IF (
                        i.rfrocs = 7,
                        '5',            
                        IF (
                            i.rfrocs IS NOT NULL,
                            '1',
                            ''
                        )
                    ),
                    ''
                ) causeout,
                CASE WHEN sum(c.qty * c.cost) IS NULL THEN 0 ELSE ROUND(sum(c.qty * c.cost),0) END AS cost,
                CASE WHEN a.uc_money IS NULL THEN 0.00 ELSE ROUND(a.uc_money,2) END AS price,
                ROUND(
                    sum(
                        IF (
                            c.paidst IN (01, 03),
                            c.sum_price,
                            0
                            )
                    ),
                    2
                ) payprice,
                CASE WHEN a.paid_money IS NULL THEN 0.00 ELSE ROUND(a.paid_money,2) END AS actualpay,
                a.dx_doctor as dr, doctor.licenseno as provider,
                CASE WHEN idx.modify_datetime IS NULL THEN '' ELSE date_format(idx.modify_datetime,'%Y-%m-%d %H:%i:%s') END AS d_update,
                i.drg, a.rw, i.adjrw, i.wtlos,
                CASE WHEN i.grouper_err IS NULL THEN 1 ELSE i.grouper_err END AS error,
                CASE WHEN i.grouper_warn IS NULL THEN 64 ELSE i.grouper_warn END AS warning,
                CASE WHEN i.grouper_actlos IS NULL THEN 0 ELSE i.grouper_actlos END AS actlos,
                CASE WHEN i.grouper_version IS NULL THEN '5.1.3' ELSE i.grouper_version END AS grouper_version,
                CASE WHEN i.grouper_version IS NULL THEN '5.1.3' ELSE i.grouper_version END AS grouper_version
        `, [hisHospcode])).groupBy('i.an');
    }
    async getDiagnosisIpd(db, columnName, searchNo, hospCode = hisHospcode) {
        columnName = columnName === 'visitNo' ? 'q.vn' : columnName;
        columnName = columnName === 'an' ? 'ipt.an' : columnName;
        const sql = `
            select 
                ? as hospcode,
                pt.hn as pid,
                ipt.an as an,
                ifnull(date_format(concat(ipt.regdate,' ',ipt.regtime),'%Y-%m-%d %H:%i:%s'),'') as datetime_admit,
                concat('0',right(spclty.provis_code,4)) as warddiag,
                iptdiag.diagtype as diagtype,
                iptdiag.icd10 as diagcode, 
                icd.name AS diagname,
                iptdiag.doctor as provider,
                ifnull(date_format(iptdiag.modify_datetime,'%Y-%m-%d %H:%i:%s'),date_format(NOW(),'%Y-%m-%d %H:%i:%s')) d_update,
                pt.cid as CID
                
            from 
                iptdiag
                left join ipt on ipt.an=iptdiag.an
                left join ovst_seq q ON q.vn = ipt.vn
                left join patient pt on pt.hn = ipt.hn
                left join person p on p.patient_hn = ipt.hn
                LEFT JOIN icd10_sss as icd ON iptdiag.icd10 = icd.code
                left outer join spclty on spclty.spclty=ipt.spclty              
            where ${columnName} = ?
            order by ipt.an, iptdiag.diagtype`;
        const result = await db.raw(sql, [hisHospcode, searchNo]);
        return result[0];
    }
    async getDiagnosisIpdAccident(db, dateStart, dateEnd, hospCode = hisHospcode) {
        if (dateStart & dateEnd) {
            return db('iptdiag as dx')
                .innerJoin('ipt as ipd', 'dx.an', 'ipd.an')
                .innerJoin('icd10_sss as icd', 'dx.icd10', 'icd.code')
                .select('dx.*', 'icd.name AS diagname')
                .whereBetween('ipd.dchdate', [dateStart, dateEnd])
                .whereRaw(`LEFT(dx.icd10,1) IN ('V','W','X','Y')`)
                .limit(maxLimit);
        }
        else {
            throw new Error('Invalid parameters');
        }
    }
    async getProcedureIpd(db, an, hospCode = hisHospcode) {
        const sql = `
            select
                ? as hospcode,
                pt.hn as pid,
                ipt.an,
                if(
                    ipt.regdate IS NULL OR ipt.regdate = '0000-00-00',
                    '',
                    date_format(concat(ipt.regdate, ' ', ipt.regtime), '%Y-%m-%d %H:%i:%s')
                ) as datetime_admit,
                concat('0', right(spclty.provis_code, 4)) as wardstay,
                ipc.icd9cm as procedcode,
                if(
                    i.begin_date_time IS NULL OR i.begin_date_time LIKE '0000-00-00%',
                    '',
                    date_format(i.begin_date_time, '%Y-%m-%d %H:%i:%s')
                ) as timestart,
                if(
                    i.end_date_time IS NULL OR i.end_date_time LIKE '0000-00-00%',
                    '',
                    date_format(i.end_date_time, '%Y-%m-%d %H:%i:%s')
                ) as timefinish,
                if(
                    ipc.price IS NOT NULL,
                    replace(format(ipc.price, 2), ',', ''),
                    format(0, 2)
                ) as serviceprice,
                i.doctor as provider,
                if(
                    ipt.dchdate IS NOT NULL AND ipt.dchdate != '0000-00-00',
                    date_format(concat(ipt.dchdate, ' ', ipt.dchtime), '%Y-%m-%d %H:%i:%s'),
                    ''
                ) as d_update
            from
                ipt_nurse_oper i
                left join an_stat a on a.an = i.an
                left join ipt on ipt.an = a.an
                left join patient pt on pt.hn = ipt.hn
                left join person p on p.patient_hn = ipt.hn
                left join spclty on spclty.spclty = ipt.spclty
                left join ipt_oper_code ipc on ipc.ipt_oper_code = i.ipt_oper_code
            where ipt.an = ?`;
        const sql1 = `
            select 
                ? as hospcode,
                pt.hn as pid,
                ipt.an,
                if(
                    concat(ipt.regdate,' ',ipt.regtime) is null 
                        or trim(concat(ipt.regdate,' ',ipt.regtime)) = '' 
                        or concat(ipt.regdate,' ',ipt.regtime) like '0000-00-00%',
                    '',
                    date_format(concat(ipt.regdate,' ',ipt.regtime),'%Y-%m-%d %H:%i:%s')
                ) as datetime_admit,
                concat('0',right(spclty.provis_code,4)) as wardstay,
                ipc.icd9cm as procedcode,
                if(
                    i.begin_date_time is null 
                        or trim(i.begin_date_time) = '' 
                        or i.begin_date_time like '0000-00-00%',
                    '',date_format(i.begin_date_time ,'%Y-%m-%d %H:%i:%s')
                ) as timestart,
                if(
                    i.end_date_time is null 
                        or trim(i.end_date_time) = '' 
                        or i.end_date_time like '0000-00-00%',
                    '',date_format(i.end_date_time ,'%Y-%m-%d %H:%i:%s')
                ) as timefinish,
                if(ipc.price , replace(format(ipc.price,2),',',''), format(0,2)) as serviceprice,
                i.doctor as provider,
                if(
                    ipt.dchdate is not null 
                        or ipt.dchdate <> '',
                        if(concat(ipt.dchdate,' ',ipt.dchtime) is null 
                            or trim(concat(ipt.dchdate,' ',ipt.dchtime)) = '' 
                            or concat(ipt.dchdate,' ',ipt.dchtime) like '0000-00-00%',
                        '',date_format(concat(ipt.dchdate,' ',ipt.dchtime),'%Y-%m-%d %H:%i:%s')),
                        if(concat(ipt.regdate,' ',ipt.regtime) is null 
                            or trim(concat(ipt.regdate,' ',ipt.regtime)) = '' 
                            or concat(ipt.regdate,' ',ipt.regtime) like '0000-00-00%',
                            '',date_format(concat(ipt.regdate,' ',ipt.regtime),'%Y-%m-%d %H:%i:%s'))
                ) as d_update
            from 
                ipt_nurse_oper i
                left join an_stat a on a.an=i.an
                left join ipt  on ipt.an=a.an
                left join patient pt on pt.hn = ipt.hn
                left join person p on p.patient_hn = ipt.hn
                left join spclty on spclty.spclty=ipt.spclty  
                left join ipt_oper_code ipc on ipc.ipt_oper_code=i.ipt_oper_code 
            where 
                ipt.an = ?

            union all

            select
                ? as hospcode,
                pt.hn as pid,
                ipt.an,
                if(
                    concat(ipt.regdate,' ',ipt.regtime) is null 
                        or trim(concat(ipt.regdate,' ',ipt.regtime)) = '' 
                        or concat(ipt.regdate,' ',ipt.regtime) like '0000-00-00%',
                    '',
                    date_format(concat(ipt.regdate,' ',ipt.regtime),'%Y-%m-%d %H:%i:%s')
                ) as datetime_admit,
                concat('0',right(spclty.provis_code,4)) as wardstay,
                i.icd9 as procedcode,
                if(
                    concat(i.opdate,' ',i.optime) is null or trim(concat(i.opdate,' ',i.optime))='' or concat(i.opdate,' ',i.optime)like '0000-00-00%',
                    '',date_format(concat(i.opdate,' ',i.optime) ,'%Y-%m-%d %H:%i:%s')
                ) as timestart,
                if(
                    concat(i.enddate,' ',i.endtime) is null or trim(concat(i.enddate,' ',i.endtime))='' or concat(i.enddate,' ',i.endtime)like '0000-00-00%',
                    '',date_format(concat(i.enddate,' ',i.endtime) ,'%Y-%m-%d %H:%i:%s')
                )  as timefinish,
                if(i.iprice , replace(format(i.iprice,2),',',''), format(0,2)) as serviceprice,
                i.doctor as provider,
                if(
                    ipt.dchdate is not null 
                        or ipt.dchdate <> '',
                        if(concat(ipt.dchdate,' ',ipt.dchtime) is null 
                            or trim(concat(ipt.dchdate,' ',ipt.dchtime)) = '' 
                            or concat(ipt.dchdate,' ',ipt.dchtime)like '0000-00-00%',
                        '',date_format(concat(ipt.dchdate,' ',ipt.dchtime),'%Y-%m-%d %H:%i:%s')),
                        if(concat(ipt.regdate,' ',ipt.regtime) is null 
                            or trim(concat(ipt.regdate,' ',ipt.regtime)) = '' 
                            or concat(ipt.regdate,' ',ipt.regtime) like '0000-00-00%',
                        '',date_format(concat(ipt.regdate,' ',ipt.regtime),'%Y-%m-%d %H:%i:%s'))
                ) as d_update
            from 
                iptoprt i
                left join an_stat a on a.an=i.an
                left join ipt  on ipt.an=a.an
                left join patient pt on pt.hn = ipt.hn
                left join person p on p.patient_hn = ipt.hn
                left join spclty on spclty.spclty=ipt.spclty  
            where              
                ipt.an= ?                  
            `;
        const result = await db.raw(sql, [hisHospcode, an]);
        return result[0];
    }
    async getChargeIpd(db, an, hospCode = hisHospcode) {
        const sql = `
            select
                ? as hospcode,
                pt.hn as pid,
                o.an as an,
                if(
                    concat(ipt.regdate,' ',ipt.regtime) is null 
                        or trim(concat(ipt.regdate,' ',ipt.regtime)) = '' 
                        or concat(ipt.regdate,' ',ipt.regtime)like '0000-00-00%',
                    '',
                    date_format(concat(ipt.regdate,' ',ipt.regtime),'%Y-%m-%d %H:%i:%s')
                ) as datetime_admit,
                concat('1',right(sp.provis_code,4)) as wardstay,
                o.income as chargeitem,
                if(d.charge_list_id is null or d.charge_list_id = '' ,'000000',right(concat('000000',d.charge_list_id), 6)) as chargelist,
                format(o.qty,2) as quantity,
                if (psi.pttype_std_code is null or psi.pttype_std_code ='' ,'9100',psi.pttype_std_code ) as instype,
                format(o.cost,2) as cost,
                format(o.sum_price,2) as price,
                '0.00' as payprice,
                if(
                    concat(o.rxdate,' ',o.rxtime) is null 
                        or trim(concat(o.rxdate,' ',o.rxtime)) = '' 
                        or concat(o.rxdate,' ',o.rxtime) like '0000-00-00%',
                    '',
                    date_format(concat(o.rxdate,' ',o.rxtime),'%Y-%m-%d %H:%i:%s')
                ) as d_update

            from 
                opitemrece o  
                left join ipt on o.hn=ipt.hn and o.an=ipt.an 
                left join person p on o.hn=p.patient_hn
                left join spclty sp on sp.spclty=ipt.spclty
                left join provis_instype psi on psi.code = ipt.pttype
                left join patient pt on pt.hn = ipt.hn
                left join drugitems_charge_list d on d.icode = o.icode

            where 
                (o.an <> ''or o.an is not null) 
                and o.unitprice <> '0'
                and ipt.an= ?                  
            `;
        const result = await db.raw(sql, [hisHospcode, an]);
        return result[0];
    }
    async getDrugIpd(db, an, hospCode = hisHospcode) {
        const sql = `
            select 
                ? as HOSPCODE
                ,ifnull(p.person_id,'') PID
                ,ifnull(i.an,'') AN
                ,ifnull(date_format(concat(i.regdate,' ',i.regtime),'%Y-%m-%d %H:%i:%s'),'') DATETIME_ADMIT
                ,ifnull(s.provis_code,'') WARDSTAY
                ,if(o.item_type='H','2','1') TYPEDRUG
                ,ifnull(d.did,'') DIDSTD
                ,ifnull(concat(d.name,' ',d.strength),'') DNAME
                ,ifnull(date_format(m.orderdate,'%Y-%m-%d'),'') DATESTART
                ,ifnull(date_format(m.offdate,'%Y-%m-%d'),'') DATEFINISH
                ,cast(sum(ifnull(o.qty,0)) as decimal(12,0)) AMOUNT
                ,ifnull(d.provis_medication_unit_code,'') UNIT
                ,ifnull(d.packqty,'') UNIT_PACKING
                ,cast(ifnull(d.unitprice,0) as decimal(11,2)) DRUGPRICE
                ,cast(if(d.unitcost is null or d.unitcost=0,ifnull(d.unitprice,0),d.unitcost) as decimal(11,2)) DRUGCOST
                ,o.doctor PROVIDER
                ,ifnull(date_format(concat(o.rxdate,' ',o.rxtime),'%Y-%m-%d %H:%i:%s'),'') D_UPDATE
                ,pt.cid as CID
            from ipt as i
                left join an_stat a on a.an=i.an
                left join opitemrece o on o.an=i.an
                left join patient pt on pt.hn=i.hn
                left join person p on p.patient_hn=pt.hn
                left join spclty s on s.spclty=i.spclty
                left join drugitems d on d.icode=o.icode
                left join medplan_ipd m on m.an=o.an and m.icode=o.icode                    
            where                 
                i.an=?       
                and d.icode is not null
                and o.qty<>0
                and o.sum_price>0
            group by i.an,o.icode,typedrug
            order by i.an,typedrug,o.icode      
            `;
        const result = await db.raw(sql, [hisHospcode, an]);
        return result[0];
    }
    async getAccident(db, visitNo, hospCode = hisHospcode) {
        const sql = `
            select 
                ? as hospcode,
                p.hn, p.hn as pid, p.cid,
                q.seq_id, q.vn as seq,
                date_format(concat(o.vstdate, ' ', o.vsttime),'%Y-%m-%d %H:%i:%s') datetime_serv,
                date_format(concat(o.vstdate, ' ', o.vsttime),'%Y-%m-%d %H:%i:%s') datetime_ae,
                ifnull(lpad(d.er_accident_type_id,2,'0'),'') aetype,
                ifnull(lpad(d.accident_place_type_id,2,'0'),'99') aeplace,
                ifnull(vt.export_code, '1') typein_ae,
                ifnull(d.accident_person_type_id,'9') traffic,
                ifnull(tt.export_code, '99') vehicle,
                ifnull(d.accident_alcohol_type_id,'9') alcohol,
                ifnull(d.accident_drug_type_id,'9') nacrotic_drug,
                ifnull(d.accident_belt_type_id,'9') belt,
                ifnull(d.accident_helmet_type_id,'9') helmet,
                ifnull(d.accident_airway_type_id,'3') airway,
                ifnull(d.accident_bleed_type_id,'3') stopbleed,
                ifnull(d.accident_splint_type_id,'3') splint,
                ifnull(d.accident_fluid_type_id,'3') fluid,
                ifnull(d.er_emergency_type, '6') urgency,
                IF (d.gcs_e IN (1, 2, 3, 4),d.gcs_e,'4') coma_eye,
                IF (d.gcs_v IN (1, 2, 3, 4, 5),d.gcs_v,'5') coma_speak,
                IF (d.gcs_m IN (1, 2, 3, 4, 5, 6),d.gcs_m,'6') coma_movement,
                date_format(now(), '%Y-%m-%d %H:%i:%s') d_update
            FROM
                er_regist er
            LEFT JOIN ovst o ON er.vn = o.vn
            LEFT JOIN er_pt_type t ON t.er_pt_type = er.er_pt_type
            LEFT JOIN ovst_seq q ON o.vn = q.vn
            LEFT JOIN patient pt ON pt.hn = o.hn
            LEFT JOIN person p ON p.patient_hn = pt.hn
            LEFT JOIN er_nursing_detail d ON er.vn = d.vn
            LEFT JOIN er_nursing_visit_type vt ON vt.visit_type = d.visit_type
            LEFT JOIN accident_transport_type tt ON tt.accident_transport_type_id = d.accident_transport_type_id                   
            where                 
                q.vn =?
            `;
        const result = await db.raw(sql, [hisHospcode, visitNo]);
        return result[0];
    }
    async getDrugAllergy(db, hn, hospCode = hisHospcode) {
        return db('opd_allergy as oe')
            .leftJoin('drugitems_register as di', 'oe.agent', 'di.drugname')
            .leftJoin('patient', 'oe.hn', 'patient.hn')
            .leftJoin('person', 'oe.hn', 'person.patient_hn')
            .select(db.raw('? as HOSPCODE', [hisHospcode]))
            .select('patient.hn as PID', 'patient.cid as CID', 'di.std_code as DRUGALLERGY', 'oe.agent as DNAME', 'oe.seriousness_id as ALEVE', 'oe.symptom as DETAIL', 'oe.opd_allergy_source_id as INFORMANT')
            .select(db.raw(`if(oe.report_date is null 
                    or trim(oe.report_date)=' ' 
                    or oe.report_date like '0000-00-00%',
                    '', date_format(oe.report_date,'%Y-%m-%d')) as DATERECORD`))
            .select(db.raw('? as INFORMHOSP', [hisHospcode]))
            .select(db.raw(`(select case when 
                    oe.allergy_relation_id in ('1','2','3','4','5') 
                then  oe.allergy_relation_id
                else  '1'  end) as TYPEDX`))
            .select(db.raw(`'' as SYMPTOM`))
            .select(db.raw(`if(oe.update_datetime is null or trim(oe.update_datetime) = '' 
                or oe.update_datetime like '0000-00-00%', '', 
                date_format(oe.update_datetime,'%Y-%m-%d %H:%i:%s')) as D_UPDATE`))
            .where('oe.hn', hn);
    }
    getAppointment(db, visitNo, hospCode = hisHospcode) {
        return db('view_opd_fu')
            .select(db.raw('"' + hisHospcode + '" as hospcode'))
            .select('*')
            .where('vn', "=", visitNo)
            .limit(maxLimit);
    }
    async getReferHistory(db, columnName, searchNo, hospCode = hisHospcode) {
        columnName = columnName === 'visitNo' ? 'os.vn' : columnName;
        columnName = columnName === 'vn' ? 'os.vn' : columnName;
        columnName = columnName === 'seq_id' ? 'os.seq_id' : columnName;
        columnName = columnName === 'referNo' ? 'ro.refer_number' : columnName;
        return db('referout as ro')
            .leftJoin('patient as pt', 'pt.hn', 'ro.hn')
            .leftJoin('person as ps', 'ps.cid', 'pt.cid')
            .leftJoin(db.raw('ovst as o on o.vn = ro.vn or o.an=ro.vn'))
            .leftJoin('ipt as i', 'i.an', 'o.an')
            .leftJoin('ovst_seq as os', 'os.vn', 'o.vn')
            .leftJoin('spclty as sp', 'sp.spclty', 'ro.spclty')
            .leftJoin('opdscreen as s', 's.vn', 'o.vn')
            .leftJoin('er_regist as e', 'e.vn', 'o.vn')
            .leftJoin('doctor', 'o.doctor', 'doctor.code')
            .select(db.raw('? as HOSPCODE', [hisHospcode]))
            .select('ro.refer_number as REFERID', db.raw('concat(?,ro.refer_number) as REFERID_PROVINCE', [hisHospcode]), 'pt.hn as PID', 'pt.cid', 'os.seq_id', 'os.vn as SEQ', 'o.an as AN')
            .select('o.i_refer_number as REFERID_ORIGIN', 'o.rfrilct as HOSPCODE_ORIGIN', db.raw(`if(concat(o.vstdate,' ', o.vsttime) is null 
                or trim(concat(o.vstdate,' ', o.vsttime)) = '' 
                or concat(o.vstdate,' ', o.vsttime) like '0000-00-00%',
                '', date_format(concat(o.vstdate,' ', o.vsttime),'%Y-%m-%d %H:%i:%s')) as DATETIME_SERV`), db.raw(`if(concat(i.regdate,' ', i.regtime) is null 
                        or trim(concat(i.regdate,' ', i.regtime)) = '' 
                        or concat(i.regdate,' ', i.regtime) like '0000-00-00%','',
                    date_format(concat(i.regdate,' ', i.regtime),'%Y-%m-%d %H:%i:%s')
                ) as DATETIME_ADMIT`), db.raw(`if(
                    concat(ro.refer_date, ' ', ro.refer_time) is null 
                        or trim(concat(ro.refer_date, ' ', ro.refer_time)) = '' 
                        or concat(ro.refer_date, ' ', ro.refer_time) like '0000-00-00%',
                    '',
                    date_format(concat(ro.refer_date, ' ', ro.refer_time),'%Y-%m-%d %H:%i:%s')
                ) as DATETIME_REFER,
                if (
                    sp.provis_code is null 
                        or sp.provis_code = '',
                    '00100',
                    sp.provis_code
                ) as CLINIC_REFER,
                ro.refer_hospcode as HOSP_DESTINATION,
                concat('CC:',s.cc,' HPI:',s.hpi,' PMH:',s.pmh) as CHIEFCOMP,
                '' as PHYSICALEXAM,
                ifnull(ro.pre_diagnosis,'ไม่ระบุ') as DIAGFIRST,
                ifnull(ro.pre_diagnosis,'ไม่ระบุ') as DIAGLAST,
                ifnull(ro.ptstatus_text,'ไม่ระบุ') as PSTATUS,
                ovst.doctor as dr, doctor.licenseno as provider,
                (select case e.er_pt_type 
                    when '2' then '2' 
                    when '1' then '3' 
                else 
                    '1' 
                end
                ) as PTYPE,
                ifnull(e.er_emergency_level_id,'5') as EMERGENCY,
                '99' as PTYPEDIS,
                if(
                    ro.refer_cause = '1' 
                        or ro.refer_cause = '2' ,
                    ro.refer_cause,
                    '1'
                ) as CAUSEOUT,
                ro.request_text as REQUEST,
                ro.doctor as PROVIDER,
                if(
                    concat(o.vstdate, ' ', o.vsttime) is null 
                        or trim(concat(o.vstdate, ' ', o.vsttime)) = '' 
                        or concat(o.vstdate, ' ', o.vsttime) like '0000-00-00%',
                    '',
                    date_format(concat(o.vstdate, ' ', o.vsttime),'%Y-%m-%d %H:%i:%s')
                ) as D_UPDATE `))
            .where(columnName, searchNo)
            .whereNotNull('ro.refer_hospcode')
            .whereNot('ro.refer_hospcode', '');
    }
    getClinicalRefer(db, referNo, hospCode = hisHospcode) {
        return db('view_clinical_refer')
            .select(db.raw(`'${hisHospcode}' as hospcode`))
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }
    getInvestigationRefer(db, referNo, hospCode = hisHospcode) {
        return db('view_investigation_refer')
            .select(db.raw(`'${hisHospcode}' as hospcode`))
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }
    async getCareRefer(db, referNo, hospCode = hisHospcode) {
        const sql = `
            select 
                '${hisHospcode}' as hospcode,
                ro.refer_number as referid,
                concat('${hisHospcode}',ro.refer_number ) as referid_province,
                '' as caretype,
                if(
                    concat(ro.refer_date, ' ', ro.refer_time) is null 
                        or trim(concat(ro.refer_date, ' ', ro.refer_time)) = '' 
                        or concat(ro.refer_date, ' ', ro.refer_time) like '0000-00-00%',
                    '',
                    date_format(concat(ro.refer_date, ' ', ro.refer_time),'%Y-%m-%d %H:%i:%s')
                ) as d_update 
                
            from
                referout ro 
            where 
                ro.refer_number = ?
            `;
        const result = await db.raw(sql, [referNo]);
        return result[0];
    }
    getReferResult(db, visitDate, hospCode = hisHospcode) {
        visitDate = moment(visitDate).format('YYYY-MM-DD');
        return db('referin')
            .leftJoin('patient', 'referin.hn', 'patient.hn')
            .leftJoin('ovst', 'referin.vn', 'ovst.vn')
            .leftJoin('refer_reply', 'referin.vn', 'refer_reply.vn')
            .select(db.raw(`? as HOSPCODE`, [hisHospcode]))
            .select('referin.refer_hospcode as HOSP_SOURCE', 'patient.cid as CID_IN', 'referin.hn as PID_IN', 'referin.vn as SEQ_IN', 'referin.docno as REFERID', 'referin.refer_date as DATETIME_REFER', 'referin.icd10 as detail', 'refer_reply.diagnosis_text as reply_diagnostic', 'refer_reply.advice_text as reply_recommend')
            .select(db.raw(`case when referin.referin_number IS NOT NULL AND referin.referin_number !='' AND referin.referin_number !='-' then referin.referin_number else concat('${hisHospcode}-',referin.docno) end as REFERID_SOURCE`))
            .select(db.raw(`concat(refer_reply.reply_date, ' ',refer_reply.reply_time) as reply_date`))
            .select(db.raw(`'' as AN_IN, concat(referin.refer_hospcode,referin.referin_number) as REFERID_PROVINCE`))
            .select(db.raw(`concat(ovst.vstdate, ' ',ovst.vsttime) as DATETIME_IN, '1' as REFER_RESULT`))
            .select(db.raw(`concat(ovst.vstdate, ' ',ovst.vsttime) as D_UPDATE`))
            .where(db.raw(`(referin.refer_date=? or referin.date_in=?)`, [visitDate, visitDate]))
            .where(db.raw('length(referin.refer_hospcode)=5'))
            .whereNotNull('referin.vn')
            .whereNotNull('patient.hn')
            .limit(maxLimit);
    }
    async getProvider(db, columnName, searchNo, hospCode = hisHospcode) {
        columnName = columnName === 'licenseNo' ? 'd.code' : columnName;
        columnName = columnName === 'cid' ? 'd.cid' : columnName;
        const sql = `
            select 
                '${hisHospcode}' as hospcode,
                d.code as provider,
                d.licenseno as registerno,
                d.council_code as council,
                d.cid as cid,
                ifnull(p2.provis_pname_long_name,d.pname) as prename,
                ifnull(p.fname,d.fname) as name,
                ifnull(p.lname,d.lname) as lname,
                d.sex as sex,	
                if(p.birthday   is null or trim(p.birthday )='' or p.birthday   like '0000-00-00%','',date_format(p.birthday,'%Y-%m-%d')) as  birth,
                d.provider_type_code as providertype,
                if( d.start_date is null or trim(d.start_date)='' or d.start_date like '0000-00-00%','',date_format(d.start_date,'%Y-%m-%d')) as startdate,
                if( d.finish_date is null or trim(d.finish_date)='' or d.finish_date like '0000-00-00%','',date_format(d.finish_date,'%Y-%m-%d')) as outdate,
                d.move_from_hospcode as movefrom,
                d.move_to_hospcode as  moveto,
                if(d.update_datetime is null or trim(d.update_datetime)='' or d.update_datetime like '0000-00-00%','',date_format(d.update_datetime,'%Y-%m-%d %H:%i:%s') ) as d_update
                
            from 
                doctor d 
                left join patient p on d.cid = p.cid
                left join pname pn on pn.name = p.pname
                left join provis_pname p2 on p2.provis_pname_code = pn.provis_code                
            where 
                ${columnName} = ?`;
        const result = await db.raw(sql, [searchNo]);
        return result[0];
    }
    getProviderDr(db, drList) {
        return db('doctor as d')
            .leftJoin('patient as p', 'd.cid', 'p.cid')
            .leftJoin('pname as pn', 'pn.name', 'p.pname')
            .leftJoin('provis_pname as p2', 'p2.provis_pname_code', 'pn.provis_code')
            .select(db.raw(`
                '${hisHospcode}' as hospcode,
                d.code as provider,
                d.licenseno as registerno,
                d.council_code as council,
                d.cid as cid,
                CASE WHEN p2.provis_pname_long_name IS NULL THEN d.pname ELSE p2.provis_pname_long_name END as prename,
                CASE WHEN p.fname IS NULL THEN d.fname ELSE p.fname END as name,
                CASE WHEN p.lname IS NULL THEN d.lname ELSE p.lname END as lname,
                d.sex as sex,	
                if(p.birthday is null or trim(p.birthday )='' or p.birthday   like '0000-00-00%','',date_format(p.birthday,'%Y-%m-%d')) as  birth,
                d.provider_type_code as providertype,
                if( d.start_date is null or trim(d.start_date)='' or d.start_date like '0000-00-00%','',date_format(d.start_date,'%Y-%m-%d')) as startdate,
                if( d.finish_date is null or trim(d.finish_date)='' or d.finish_date like '0000-00-00%','',date_format(d.finish_date,'%Y-%m-%d')) as outdate,
                d.move_from_hospcode as movefrom,
                d.move_to_hospcode as  moveto,
                if(d.update_datetime is null or trim(d.update_datetime)='' or d.update_datetime like '0000-00-00%','',date_format(d.update_datetime,'%Y-%m-%d %H:%i:%s') ) as d_update`))
            .whereIn('d.code', drList);
    }
    getData(db, tableName, columnName, searchNo, hospCode = hisHospcode) {
        return db(tableName)
            .select(db.raw('"' + hisHospcode + '" as hospcode'))
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
    sumReferOut(db, dateStart, dateEnd) {
        return db('referout as r')
            .select('r.refer_date')
            .count('r.vn as cases')
            .whereNotNull('r.vn')
            .whereBetween('r.refer_date', [dateStart, dateEnd])
            .where('r.refer_hospcode', '!=', "")
            .whereNotNull('r.refer_hospcode')
            .where('r.refer_hospcode', '!=', hisHospcode)
            .groupBy('r.refer_date')
            .orderBy('r.refer_date');
    }
    sumReferIn(db, dateStart, dateEnd) {
        return db('referin')
            .leftJoin('ovst', 'referin.vn', 'ovst.vn')
            .select('referin.refer_date')
            .count('referin.vn as cases')
            .whereBetween('referin.refer_date', [dateStart, dateEnd])
            .where('referin.refer_hospcode', '!=', hisHospcode)
            .whereNotNull('referin.refer_hospcode')
            .whereNotNull('referin.vn')
            .whereNotNull('ovst.vn')
            .groupBy('referin.refer_date');
    }
    countBedNo(db) {
        return db('bedno').count('bedno.bedno as total_bed')
            .leftJoin('roomno', 'bedno.roomno', 'roomno.roomno')
            .leftJoin('ward', 'roomno.ward', 'ward.ward')
            .where('ward.ward_active', 'Y').first();
    }
    async getBedNo(db, bedno = null, start = -1, limit = 1000) {
        let sql = db('bedno')
            .leftJoin('roomno', 'bedno.roomno', 'roomno.roomno')
            .leftJoin('ward', 'roomno.ward', 'ward.ward')
            .leftJoin('bedtype', 'bedno.bedtype', 'bedtype.bedtype')
            .leftJoin('bed_status_type as status', 'bedno.bed_status_type_id', 'status.bed_status_type_id')
            .select('bedno.bedno', 'bedno.bedtype', 'bedtype.name as bedtype_name', 'bedno.roomno', 'roomno.ward as wardcode', 'ward.name as wardname', 'bedno.export_code as std_code', 'bedno.bed_status_type_id', 'status.bed_status_type_name', db.raw("CASE WHEN ward.ward_active !='Y' OR status.is_available !='Y' THEN 0 ELSE 1 END as isactive"), db.raw(`
                    CASE 
                        WHEN LOWER(bedtype.name) LIKE '%พิเศษ%' THEN 'S'
                        WHEN LOWER(bedtype.name) LIKE '%icu%' OR bedtype.name LIKE '%ไอซียู%' THEN 'ICU'
                        WHEN LOWER(bedtype.name) LIKE '%ห้องคลอด%' OR LOWER(bedtype.name) LIKE '%รอคลอด%' THEN 'LR'
                        WHEN LOWER(bedtype.name) LIKE '%Home Ward%' THEN 'HW'
                        ELSE 'N'
                    END as bed_type
                `))
            .where('ward.ward_active', 'Y');
        if (bedno) {
            sql = sql.where('bedno.bedno', bedno);
        }
        if (start >= 0) {
            sql = sql.offset(start).limit(limit);
        }
        return sql
            .where('bedno.bedno', '!=', '')
            .whereNotNull('bedno.bedno')
            .where('roomno.ward', '!=', '')
            .whereNotNull('roomno.ward')
            .orderBy('bedno.bedno');
    }
    concurrentIPDByWard(db, date) {
        const dateStart = moment(date).locale('TH').startOf('hour').format('YYYY-MM-DD HH:mm:ss');
        const dateEnd = moment(date).locale('TH').endOf('hour').format('YYYY-MM-DD HH:mm:ss');
        const clientType = (db.client?.config?.client || '').toLowerCase();
        let sql = db('ipt')
            .leftJoin('ward', 'ipt.ward', 'ward.ward')
            .select('ipt.ward as wardcode', 'ward.name as wardname');
        const getDatetimeExpr = (dateCol, timeCol) => {
            switch (clientType) {
                case 'pg':
                case 'postgres':
                case 'postgresql':
                    return db.raw(`${dateCol}::text || ' ' || ${timeCol}::text`);
                case 'mssql':
                    return db.raw(`CAST(${dateCol} AS VARCHAR) + ' ' + CAST(${timeCol} AS VARCHAR)`);
                case 'oracledb':
                    return db.raw(`${dateCol} || ' ' || ${timeCol}`);
                default:
                    return db.raw(`CONCAT(${dateCol}, ' ', ${timeCol})`);
            }
        };
        const regdatetime = getDatetimeExpr('ipt.regdate', 'ipt.regtime');
        const dchdatetime = getDatetimeExpr('ipt.dchdate', 'ipt.dchtime');
        sql = sql.select(db.raw(`SUM(CASE WHEN ${regdatetime.sql} BETWEEN ? AND ? THEN 1 ELSE 0 END) AS new_case`, [dateStart, dateEnd]), db.raw(`SUM(CASE WHEN ${dchdatetime.sql} BETWEEN ? AND ? THEN 1 ELSE 0 END) AS discharge`, [dateStart, dateEnd]), db.raw(`SUM(CASE WHEN ${dchdatetime.sql} BETWEEN ? AND ? AND ipt.dchstts IN (?, ?) THEN 1 ELSE 0 END) AS death`, [dateStart, dateEnd, '08', '09']), db.raw(`SUM(CASE WHEN ipt.dchdate IS NULL OR ${dchdatetime.sql} BETWEEN ? AND ? THEN 1 ELSE 0 END) AS cases`, [dateStart, dateEnd]))
            .whereRaw(`${regdatetime.sql} <= ?`, [dateStart])
            .whereRaw(`(ipt.dchdate IS NULL OR ${dchdatetime.sql} BETWEEN ? AND ?)`, [dateStart, dateEnd]);
        sql = sql.whereNotNull('ipt.ward')
            .whereNot('ipt.ward', '')
            .where("ward.ward_active", "Y");
        return sql.groupBy(['ipt.ward', 'ward.name']).orderBy('ipt.ward');
    }
    concurrentIPDByClinic(db, date) {
        const formattedDate = moment(date).locale('TH').format('YYYY-MM-DD');
        let sql = db('ipt')
            .leftJoin('ward', 'ipt.ward', 'ward.ward')
            .leftJoin('spclty as clinic', 'ipt.spclty', 'clinic.spclty')
            .select('ipt.spclty as cliniccode', db.raw('SUM(CASE WHEN ipt.regdate = ? THEN 1 ELSE 0 END) AS new_case', [formattedDate]), db.raw('SUM(CASE WHEN ipt.dchdate = ? THEN 1 ELSE 0 END) AS discharge', [formattedDate]), db.raw('SUM(CASE WHEN ipt.dchstts IN (?, ?) THEN 1 ELSE 0 END) AS death', ['08', '09']))
            .count('ipt.regdate as cases')
            .where('ipt.regdate', '<=', formattedDate)
            .whereRaw('ipt.spclty is not null and ipt.spclty!= ""')
            .andWhere(function () {
            this.whereNull('ipt.dchdate').orWhere('ipt.dchdate', '>=', formattedDate);
        });
        return sql.where("ward.ward_active", "Y")
            .groupBy(['ipt.spclty'])
            .orderBy('ipt.spclty');
    }
    sumOpdVisitByClinic(db, date) {
        let sql = db('ovst')
            .leftJoin('spclty', 'ovst.spclty', 'spclty.spclty')
            .select('ovst.vstdate as date', 'spclty.nhso_code as cliniccode', db.raw('SUM(CASE WHEN an IS NULL or an=\'\' THEN 0 ELSE 1 END) AS admit'))
            .count('ovst.vstdate as cases')
            .where('ovst.vstdate', date);
        return sql.groupBy(['ovst.vstdate', 'spclty.nhso_code', 'spclty.name'])
            .orderBy('spclty.nhso_code');
    }
    async getVisitForMophAlert(db, date, isRowCount = false, start = -1, limit = 1000) {
        date = moment(date).locale('TH').format('YYYY-MM-DD');
        if (isRowCount) {
            return db('ovst').where('ovst.vstdate', date).count('ovst.vn as row_count').first();
        }
        else {
            let sql = db('ovst')
                .leftJoin('patient as p', 'p.hn', 'ovst.hn')
                .leftJoin('ovstost as ot', 'ovst.ovstost', 'ot.ovstost')
                .leftJoin('kskdepartment as d', 'ovst.main_dep', 'd.depcode')
                .select('ovst.hn', 'ovst.vn', 'p.cid', db.raw(`? as department_type`, ['OPD']), 'ovst.main_dep as department_code', 'd.department as department_name', 'ovst.vstdate as date_service', 'ovst.vsttime as time_service', 'ot.name as service_status', 'ot.name as service_status_name')
                .where('ovst.vstdate', date);
            if (start >= 0) {
                sql = sql.offset(start).limit(limit);
            }
            const rows = await sql;
            return rows.filter((row) => {
                return row.service_status_name && (row.service_status_name.includes('ตรวจแล้ว') || row.service_status_name.includes('รอรับยา'));
            });
        }
    }
    async getVisitForMophAlert1(db, date, isRowCount = false, start = -1, limit = 1000) {
        try {
            date = moment(date).locale('TH').format('YYYY-MM-DD');
            let query = db('ovst as o')
                .leftJoin('ovstost as ot', 'o.ovstost', 'ot.ovstost')
                .where('o.vstdate', date);
            if (dbClient === 'pg' || dbClient === 'postgres' || dbClient === 'postgresql') {
                query = query.whereRaw(`POSITION('ตรวจแล้ว' IN ot.name) > 0`);
            }
            else {
                query = query.whereRaw(`LOCATE('ตรวจแล้ว', ot.name) > 0`);
            }
            if (isRowCount) {
                query = query.count('o.vn as row_count');
                const result = await query.first();
                return result;
            }
            else {
                if (start >= 0) {
                    query = query.offset(start).limit(limit);
                }
                return await query.leftJoin('patient as p', 'p.hn', 'o.hn')
                    .leftJoin('kskdepartment as d', 'o.main_dep', 'd.depcode')
                    .select('o.hn', 'o.vn', 'p.cid', db.raw(`? as department_type`, ['OPD']), 'o.main_dep as department_code', 'd.department as department_name', 'o.vstdate as date_service', 'o.vsttime as time_service', 'ot.name as service_status')
                    .limit(maxLimit);
            }
        }
        catch (error) {
            throw error;
        }
    }
}
exports.HisHosxpv4Model = HisHosxpv4Model;
