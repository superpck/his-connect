import Knex = require('knex');
import * as moment from 'moment';
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
const dbName = process.env.HIS_DB_NAME;
const dbClient = process.env.HIS_DB_CLIENT;

export class HisEzhospModel {
    check() {
        return true;
    }

    async getTableName(db: Knex, dbname = dbName) {
        const whereDB = dbClient === 'mssql' ? 'TABLE_CATALOG' : 'TABLE_SCHEMA';
        const result = await db('information_schema.tables')
            .where(whereDB, dbname);
        return result
    }

    getTableName1(knex: Knex, dbname = dbName) {
        return knex
            .select('TABLE_NAME')
            .from('information_schema.tables')
            .where('TABLE_SCHEMA', '=', dbname);
    }

    testConnect(db: Knex) {
        return db('hospdata.patient').select('hn').limit(1)
    }

    getPerson(knex: Knex, columnName, searchText) {
        columnName = columnName === 'cid' ? 'no_card' : columnName;
        return knex
            .select('hn', 'no_card as cid', 'title as prename',
                'name as fname', 'middlename as mname', 'surname as lname',
                'birth as dob', 'sex', 'address', 'moo', 'road', 'soi',
                'add as addcode', 'tel', 'zip', 'occupa as occupation')
            .from('hospdata.patient')
            .where(columnName, "=", searchText);
    }

    getOpdService(db: Knex, hn, date, columnName = '', searchText = '') {
        columnName = columnName == 'visitNo' ? 'vn' : columnName;
        let where: any = {};
        if (hn) where['hn'] = hn;
        if (date) where['date'] = date;
        if (columnName && searchText) where[columnName] = searchText;

        return db('view_opd_visit')
            .select('hn', 'vn as visitno', 'date', 'time',
                'time_drug as time_end', 'pttype_std2 as pttype',
                'insclass as payment',
                'dep_standard as clinic', 'dr',
                'bp as bp_systolic', 'bp1 as bp_diastolic',
                'puls as pr', 'rr', 'fu as appoint',
                'status as result', 'refer as referin')
            .where(where)
            .orderBy('date', 'desc')
            .limit(maxLimit);
    }

    getOpdServiceByVN(knex, vn) {
        return knex
            .select('hn', 'vn as visitno', 'date', 'time',
                'time_drug as time_end', 'pttype_std2 as pttype',
                'insclass as payment',
                'dep_standard as clinic', 'dr',
                'bp as bp_systolic', 'bp1 as bp_diastolic',
                'puls as pr', 'rr', 'fu as appoint',
                'status as result', 'refer as referin')
            .from('view_opd_visit')
            .where('vn', "=", vn);
    }

    getDiagnosisOpd(knex, visitno) {
        return knex
            .select('vn as visitno', 'diag as diagcode', 'desc as diag_name',
                'short_eng as en', 'short_thi as thi',
                'type as diag_type', 'dr_dx as dr')
            .select(knex.raw(' "IT" as codeset'))
            .from('view_opd_dx as dx')
            .where('vn', "=", visitno);
        // .select('vn as visitno', 'icd10 as diagcode'
        //     , 'diagtype', 'hn'
        //     , 'update_datetime as d_update')
        // .select(db.raw(`concat(vstdate,' ',vsttime) as date_serv`))
    }

    getProcedureOpd(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'vn' : columnName;
        return knex
            .select('vn as visitno', 'date', 'hn', 'op as op_code',
                'desc as op_name', 'icd_9 as icdcm', 'dr')
            .from('view_opd_op')
            .where(columnName, "=", searchNo);
    }

    getChargeOpd(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'vn' : columnName;
        return knex
            .select('*')
            .from('view_opd_charge_item')
            .where(columnName, "=", searchNo);
    }

    getLabRequest(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'vn' : columnName;
        return knex
            .select('vn as visitno', 'lab.hn as hn', 'lab.an as an',
                'lab.lab_no as request_id',
                'lab.lab_code as lab_code',
                'lab.lab_name as lab_name',
                'lab.loinc as loinc',
                'lab.icdcm as icdcm',
                'lab.standard as cgd',
                'lab.cost as cost',
                'lab.lab_price as price',
                'lab.date as request_date')
            .from('view_lab_request_item as lab')
            .where(columnName, "=", searchNo);
    }

    getLabResult(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'vn' : columnName;
        return knex
            .select('*')
            .from('view_lab_result')
            .where(columnName, "=", searchNo);
    }

    getDrugOpd(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'drug.vn' : ('drug.' + columnName);
        return knex
            .select('drug.*')
            .from('view_pharmacy_opd_drug as drug')
            .where(columnName, "=", searchNo);
    }

    getDrugName(knex, columnName, textSearch, typeCompare = '=', hospCode) {
        columnName = columnName === 'code' ? 'drug.aliascode' : columnName;
        columnName = columnName === 'id' ? 'drug.drugcode' : columnName;
        // ใน ezhosp aliascode = รหัสยา
        // ใน ezhosp drugcode = autorunning
        return knex
            .select('drug.aliascode as code', 'drug.name', 'drug.name as dfstext',
                'drug.unit', 'drug.unit_use',
                'drug.defa_use as dose', 'drug.method as sigcode', 'method.name as sigtext',
                'drug.unit as packsize',
                'drug.freq', 'freq.name as freqname',
                'drug.times', 'times.name as timesname',
                'drug.procat as product_cat',
                'drug.comment as caution', 'drug.price',
                'drug.last_tmt as tmt_code', 'drug.last_code24 as code24')
            .from('pharmacy_inventory as drug')
            .leftJoin('pharmacy_method as method', 'drug.method', 'method.code')
            .leftJoin('pharmacy_freq as freq', 'drug.freq', 'freq.code')
            .leftJoin('pharmacy_times as times', 'drug.times', 'times.code')
            .where(columnName, typeCompare, textSearch);
    }

    getAdmission(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'vn' : columnName;
        return knex
            .select('*')
            .from('admission')
            .where(columnName, "=", searchNo);
    }

    getDiagnosisIpd(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'vn' : columnName;
        return knex
            .select('*')
            .from('diagnosis_ipd')
            .where(columnName, "=", searchNo);
    }

    getProcedureIpd(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'vn' : columnName;
        return knex
            .select('*')
            .from('procedure_ipd')
            .where(columnName, "=", searchNo);
    }

    getChargeIpd(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'vn' : columnName;
        return knex
            .select('*')
            .from('charge_ipd')
            .where(columnName, "=", searchNo);
    }

    getDrugIpd(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'vn' : columnName;
        return knex
            .select('*')
            .from('drug_ipd')
            .where(columnName, "=", searchNo);
    }

    getAccident(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'vn' : columnName;
        return knex
            .select('*')
            .from('accident')
            .where(columnName, "=", searchNo);
    }

    getAppointment(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'opd_fu.vn' : columnName;
        return knex
            .select('opd_fu.hn', 'opd_fu.vn as seq',
                'opd_visit.date as date_serv', 'opd_visit.time as time_serv',
                'opd_fu.date', 'opd_fu.fu_date as appointment_date',
                'opd_fu.fu_time as appointment_time',
                'opd_visit.dep as local_code',
                'lib_clinic.standard as clinic_code',
                'lib_clinic.clinic',
                'opd_fu.detail')
            .from('opd_fu')
            .leftJoin('opd_visit', 'opd_fu.vn', 'opd_visit.vn')
            .leftJoin('lib_clinic', 'opd_visit.dep', 'lib_clinic.code')
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
