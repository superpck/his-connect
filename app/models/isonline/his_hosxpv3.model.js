"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisHosxpv3Model = void 0;
const dbName = process.env.HIS_DB_NAME;
const maxLimit = 100;
class HisHosxpv3Model {
    getTableName(knex) {
        return knex('information_schema.tables')
            .select('table_name')
            .where('table_schema', '=', dbName);
    }
    testConnect(db) {
        return db('patient').select('hn').limit(1);
    }
    getPerson(db, columnName, searchText) {
        return db('patient')
            .leftJoin('nationality as nt1', 'patient.nationality', 'nt1.nationality')
            .leftJoin(`occupation`, 'occupation.occupation', 'patient.occupation')
            .select('patient.hn', 'patient.cid', 'patient.pname as prename', 'patient.fname', 'patient.lname', 'patient.occupation as occupa', db.raw(`ifnull(occupation.nhso_code,'9999') as occupation`), 'patient.nationality', 'patient.birthday as dob', 'patient.sex', 'patient.moopart as moo', 'patient.road', 'patient.addrpart as address', 'patient.hometel as tel', 'patient.po_code as zip', db.raw('ifnull(nt1.nhso_code,"099") as nation'))
            .select(db.raw('CONCAT(chwpart,amppart,tmbpart) as addcode'))
            .where(columnName, "=", searchText);
    }
    getOpdService(db, hn, date, columnName = '', searchText = '') {
        columnName = columnName == 'visitNo' || columnName == 'vn' ? 'opdscreen.vn' : columnName;
        let where = {};
        if (hn)
            where['opdscreen.hn'] = hn;
        if (date)
            where['opdscreen.vstdate'] = date;
        if (columnName && searchText)
            where[columnName] = searchText;
        return db('opdscreen')
            .leftJoin(`ovst`, 'ovst.vn', 'opdscreen.vn')
            .leftJoin(`patient`, 'patient.hn', 'opdscreen.hn')
            .leftJoin(`er_regist`, 'er_regist.vn', 'ovst.vn')
            .leftJoin(`er_nursing_detail`, 'er_nursing_detail.vn', 'opdscreen.vn')
            .leftJoin(`ovstdiag`, 'ovstdiag.vn', 'opdscreen.vn')
            .leftJoin(`ipt`, 'ipt.vn', 'opdscreen.vn')
            .leftJoin(`referin`, 'referin.vn', 'opdscreen.vn')
            .leftJoin(`er_emergency_type`, `er_emergency_type.er_emergency_type`, `er_regist.er_emergency_type`)
            .leftJoin(`accident_place_type`, `accident_place_type.accident_place_type_id`, `er_nursing_detail.accident_place_type_id`)
            .leftJoin(`accident_transport_type`, `accident_transport_type.accident_transport_type_id`, `er_nursing_detail.accident_transport_type_id`)
            .leftJoin(`accident_person_type`, `accident_person_type.accident_person_type_id`, `er_nursing_detail.accident_person_type_id`)
            .select('opdscreen.hn', 'opdscreen.vn as visitno', 'opdscreen.vstdate as date', 'opdscreen.vsttime as time', 'opdscreen.bps as bp_systolic', 'opdscreen.bpd as bp_diastolic', 'opdscreen.pulse as pr', 'opdscreen.rr', 'ovst.vstdate as hdate', 'ovst.vsttime as htime', 'er_nursing_detail.gcs_e as eye', 'er_nursing_detail.gcs_v as verbal', 'er_nursing_detail.gcs_m as motor', 'er_nursing_detail.er_accident_type_id as cause', 'accident_place_type.export_code as apoint', 'accident_transport_type.export_code as injt', 'accident_person_type.export_code as injp', 'er_nursing_detail.accident_airway_type_id as airway', 'er_nursing_detail.accident_alcohol_type_id as risk1', 'er_nursing_detail.accident_drug_type_id as risk2', 'er_nursing_detail.accident_belt_type_id as risk3', 'er_nursing_detail.accident_helmet_type_id as risk4', 'er_nursing_detail.accident_bleed_type_id as blood', 'er_nursing_detail.accident_splint_type_id as splintc', 'er_nursing_detail.accident_splint_type_id as splint', 'er_nursing_detail.accident_fluid_type_id as iv', 'er_nursing_detail.accident_type_1 as br1', 'er_nursing_detail.accident_type_2 as br2', 'er_nursing_detail.accident_type_3 as tinj', 'er_nursing_detail.accident_type_4 as ais1', 'er_nursing_detail.accident_type_5 as ais2', 'er_regist.finish_time as disc_date_er', 'er_emergency_type.export_code as cause_t', 'ipt.ward as wardcode', 'referin.refer_hospcode as htohosp')
            .where(where)
            .limit(maxLimit);
    }
    getDiagnosisOpd(db, visitno) {
        return db('ovstdiag')
            .select('vn as visitno', 'icd10 as diagcode', 'diagtype as diag_type', 'hn', 'update_datetime as d_update')
            .select(db.raw(`concat(vstdate,' ',vsttime) as date_serv`))
            .where('vn', "=", visitno);
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
    getAccident(knex, visitno) {
        return knex('accident')
            .where(visitno, "=", visitno);
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
exports.HisHosxpv3Model = HisHosxpv3Model;
