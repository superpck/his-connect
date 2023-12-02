"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisModel = void 0;
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
const dbName = process.env.HIS_DB_NAME;
const dbClient = process.env.HIS_DB_CLIENT;
class HisModel {
    check() {
        return true;
    }
    testConnect(db) {
        return db('patient').select('hn').limit(1);
    }
    getTableName(db, dbname = dbName) {
        const whereDB = dbClient === 'mssql' ? 'TABLE_CATALOG' : 'TABLE_SCHEMA';
        return db('information_schema.tables')
            .where(whereDB, '=', dbname);
    }
    getReferOut(db, date, hospCode = hcode) {
        return db('hospdata.refer_out as refer')
            .leftJoin('hospdata.patient as pt', 'refer.hn', 'pt.hn')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('refer_date', 'refer_hcode as hosp_destination', 'refer.hn', 'pt.person_id as cid', 'refer.vn as seq', 'refer.an', 'pt.title as prename', 'pt.name as fname', 'pt.surname as lname', 'pt.birth as dob', 'pt.sex', 'refer.icd10 as dx')
            .where('refer.refer_date', date)
            .orderBy('refer.refer_date')
            .limit(maxLimit);
    }
    getPerson(db, columnName, searchText, hospCode = hcode) {
        columnName = columnName === 'cid' ? 'no_card' : columnName;
        return db('hospdata.patient')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('hn', 'no_card as cid', 'title as prename', 'name as fname', 'middlename as mname', 'surname as lname', 'birth as dob', 'sex', 'address', 'moo', 'road', 'soi', 'add as addcode', 'tel', 'zip', 'occupa as occupation')
            .where(columnName, "=", searchText)
            .limit(maxLimit);
    }
    getAddress(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'cid' ? 'no_card' : columnName;
        return db('view_address')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
    getService(db, columnName, searchText, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'vn' : columnName;
        return db('view_opd_visit')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('hn', 'vn as visitno', 'date as dateserv', 'time', 'time_drug as time_end', 'pttype_std2 as pttype', 'insclass as payment', 'dep_standard as clinic', 'dr', 'bp as bp_systolic', 'bp1 as bp_diastolic', 'puls as pr', 'rr', 'fu as appoint', 'status as result', 'refer as referin')
            .where(columnName, searchText)
            .orderBy('date')
            .limit(maxLimit);
    }
    getDiagnosisOpd(db, visitno, hospCode = hcode) {
        return db('view_opd_dx as dx')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('vn as visitno', 'diag as diagcode', 'desc as diag_name', 'short_eng as en', 'short_thi as thi', 'type as diag_type', 'dr_dx as dr')
            .select(db.raw(' "IT" as codeset'))
            .where('vn', visitno)
            .limit(maxLimit);
    }
    getProcedureOpd(db, visitno, hospCode = hcode) {
        return db('view_opd_op')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('vn as visitno', 'date', 'hn', 'op as op_code', 'desc as op_name', 'icd_9 as icdcm', 'dr')
            .where('vn', "=", visitno)
            .limit(maxLimit);
    }
    getChargeOpd(db, visitNo, hospCode = hcode) {
        return db('view_opd_charge_item')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('vn', visitNo)
            .limit(maxLimit);
    }
    getLabRequest(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'vn' : columnName;
        return db('view_lab_request_item as lab')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('vn as visitno', 'lab.hn as hn', 'lab.an as an', 'lab.lab_no as request_id', 'lab.lab_code as lab_code', 'lab.lab_name as lab_name', 'lab.loinc as loinc', 'lab.icdcm as icdcm', 'lab.standard as cgd', 'lab.cost as cost', 'lab.lab_price as price', 'lab.date as request_date')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
    getLabResult(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'vn' : columnName;
        return db('view_lab_result')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
    getDrugOpd(db, visitNo, hospCode = hcode) {
        return db('view_pharmacy_opd_drug as drug')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('drug.*')
            .where('vn', visitNo)
            .limit(maxLimit);
    }
    getAdmission(db, columnName, searchNo, hospCode = hcode) {
        return db('view_ipd')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
    getDiagnosisIpd(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'vn' : columnName;
        return db('diagnosis_ipd')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
    getProcedureIpd(db, an, hospCode = hcode) {
        return db('procedure_ipd')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('an', an)
            .limit(maxLimit);
    }
    getChargeIpd(db, an, hospCode = hcode) {
        return db('charge_ipd')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('an', "=", an)
            .limit(maxLimit);
    }
    getDrugIpd(db, an, hospCode = hcode) {
        return db('drug_ipd')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('an', an)
            .limit(maxLimit);
    }
    getAccident(db, visitNo, hospCode = hcode) {
        return db('accident')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('vn', visitNo)
            .limit(maxLimit);
    }
    getDrugAllergy(db, hn, hospCode = hcode) {
        return db('view_drug_allergy')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('hn', hn)
            .limit(maxLimit);
    }
    getAppointment(db, visitNo, hospCode = hcode) {
        return db('view_opd_fu')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('vn', "=", visitNo)
            .limit(maxLimit);
    }
    getReferHistory(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'vn' : columnName;
        columnName = columnName === 'referNo' ? 'refer_no' : columnName;
        return db('view_refer_history')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
    getClinicalRefer(db, referNo, hospCode = hcode) {
        return db('view_clinical_refer')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }
    getInvestigationRefer(db, referNo, hospCode = hcode) {
        return db('view_investigation_refer')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }
    getCareRefer(db, referNo, hospCode = hcode) {
        return db('view_care_refer')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }
    getReferResult(db, hospDestination, referNo, hospCode = hcode) {
        return db('view_refer_result')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('refer_hcode', "=", hospDestination)
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }
    getData(db, tableName, columnName, searchNo, hospCode = hcode) {
        return db(tableName)
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
}
exports.HisModel = HisModel;
