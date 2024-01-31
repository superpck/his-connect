import { Knex } from 'knex';
import * as moment from 'moment';
const dbName = process.env.HIS_DB_NAME;
const maxLimit = 100;

export class HisHosxpv4Model {
    getTableName(knex: Knex) {
        return knex('information_schema.tables')
            .select('table_name')
            .where('table_catalog', '=', dbName);

    }

    testConnect(db: Knex) {
        return db('patient').select('hn').limit(1)
    }

    getPerson(db: Knex, columnName, searchText) {
        return db('patient')
            .leftJoin('nationality as nt1','patient.nationality','nt1.nationality')
            .leftJoin(`occupation`, 'occupation.occupation', 'patient.occupation')
            .select('patient.hn', 'patient.cid', 'patient.pname as prename',
                'patient.fname', 'patient.lname', 'patient.occupation as occupa',
                db.raw(`ifnull(occupation.nhso_code,'9999') as occupation`), 'patient.nationality',
                'patient.birthday as dob', 'patient.sex', 'patient.moopart as moo', 'patient.road',
                'patient.addrpart as address', 'patient.hometel as tel', 'patient.po_code as zip',
                db.raw('ifnull(nt1.nhso_code,"099") as nation'))
            .select(db.raw('CONCAT(chwpart,amppart,tmbpart) as addcode'))
            .where(columnName, "=", searchText);
    }
    /* 
                ,ifnull(o.occupation,'000') as OCCUPATION_OLD
            ,ifnull(o.nhso_code,'9999') as OCCUPATION_NEW
            ,ifnull(p.religion,'01') as RELIGION
            ,if(e.provis_code is null,'9',e.provis_code) as EDUCATION

    */

    getOpdService(db: Knex, hn, date, columnName = '', searchText = '') {
        columnName = columnName == 'visitNo' || columnName == 'vn' ? 'opdscreen.vn' : columnName;
        columnName = columnName == 'hn' ? 'opdscreen.hn' : columnName;
        let where: any = {};
        if (hn) where['opdscreen.hn'] = hn;
        if (date) where['opdscreen.vstdate'] = date;
        if (columnName && searchText) where[columnName] = searchText;
        return db('opdscreen')
            .leftJoin(`ovst`, 'ovst.vn', 'opdscreen.vn')
            .leftJoin(`patient`, 'patient.hn', 'opdscreen.hn')
            .leftJoin(`er_regist`, 'er_regist.vn', 'ovst.vn')
            .leftJoin(`er_nursing_detail`, 'er_nursing_detail.vn', 'opdscreen.vn')
            .leftJoin(`er_emergency_type`, `er_emergency_type.er_emergency_type`, `er_regist.er_emergency_type`)
            .leftJoin(`accident_transport_type`, 'er_nursing_detail.accident_transport_type_id', 'accident_transport_type.accident_transport_type_id')
            .select('opdscreen.hn', 'opdscreen.vn as visitno', 'opdscreen.vstdate as date',
                'opdscreen.vsttime as time',
                'opdscreen.bps as bp_systolic', 'opdscreen.bpd as bp_diastolic',
                'opdscreen.pulse as pr', 'opdscreen.rr', 'ovst.vstdate as hdate', 'ovst.vsttime as htime',
                'er_nursing_detail.gcs_e as eye', 'er_nursing_detail.gcs_v as verbal',
                'er_nursing_detail.gcs_m as motor',
                'er_nursing_detail.er_accident_type_id as cause',
                'accident_transport_type.export_code as injt',
                'er_nursing_detail.accident_person_type_id as injp',
                'er_nursing_detail.accident_airway_type_id as airway',
                'er_nursing_detail.accident_alcohol_type_id as risk1',
                'er_nursing_detail.accident_drug_type_id as risk2',
                'er_nursing_detail.accident_belt_type_id as risk3',
                'er_nursing_detail.accident_helmet_type_id as risk4',
                'er_nursing_detail.accident_bleed_type_id as blood',
                'er_nursing_detail.accident_splint_type_id as splintc',
                'er_nursing_detail.accident_fluid_type_id as iv',
                'er_nursing_detail.accident_type_1 as br1',
                'er_nursing_detail.accident_type_2 as br2',
                'er_nursing_detail.accident_type_3 as tinj',
                'er_nursing_detail.accident_type_4 as ais1',
                'er_nursing_detail.accident_type_5 as ais2',
                'er_nursing_detail.accident_place_type_id as apoint',
                'er_nursing_detail.accident_place as apointname',
                'er_regist.finish_time as disc_date_er',
                'er_emergency_type.export_code as cause_t'
            )
            .where(where)
            .limit(maxLimit);

    }

    getDiagnosisOpd(db: Knex, visitno) {
        return db('ovstdiag')
            .select('vn as visitno', 'icd10 as diagcode'
                , 'diagtype as diag_type', 'hn'
                , 'update_datetime as d_update')
            .select(db.raw(`concat(vstdate,' ',vsttime) as date_serv`))
            .where('vn', "=", visitno);
    }

    getProcedureOpd(knex, columnName, searchNo, hospCode) {
        return knex('procedure_opd')
            .select('*')
            .where(columnName, "=", searchNo);
    }

    getChargeOpd(knex, columnName, searchNo, hospCode) {
        return knex('charge_opd')
            .select('*')
            .where(columnName, "=", searchNo);
    }

    getDrugOpd(knex, columnName, searchNo, hospCode) {
        return knex('drug_opd')
            .select('*')
            .where(columnName, "=", searchNo);
    }

    getAdmission(knex, columnName, searchNo, hospCode) {
        return knex('admission')
            .select('*')
            .where(columnName, "=", searchNo);
    }

    getDiagnosisIpd(knex, columnName, searchNo, hospCode) {
        return knex('diagnosis_ipd')
            .select('*')
            .where(columnName, "=", searchNo);
    }

    getProcedureIpd(knex, columnName, searchNo, hospCode) {
        return knex('procedure_ipd')
            .select('*')
            .where(columnName, "=", searchNo);
    }

    getChargeIpd(knex, columnName, searchNo, hospCode) {
        return knex('charge_ipd')
            .select('*')
            .where(columnName, "=", searchNo);
    }

    getDrugIpd(knex, columnName, searchNo, hospCode) {
        return knex('drug_ipd')
            .select('*')
            .where(columnName, "=", searchNo);
    }

    getAccident(knex, visitno) {
        return knex('er_regist')
            .select('er_regist.vn', 'ovst.hn', 'ovst.vstdate as adate',
                'ovst.vsttime as atime', 'er_nursing_detail.accident_person_type_id',
                'er_nursing_detail.accident_belt_type_id as belt',
                'opdscreen.bps as bp1', 'opdscreen.bpd as bp2',
                'er_nursing_detail.gcs_e as e', 'er_nursing_detail.gcs_v as v', 'er_nursing_detail.gcs_m as m')
            .leftJoin(`ovst`, function () { this.on('ovst.vn', '=', 'er_regist.vn') })
            .leftJoin(`patient`, function () { this.on('patient.hn', '=', 'ovst.hn') })
            .leftJoin(`er_nursing_detail`, function () { this.on('er_nursing_detail.vn', '=', 'ovst.vn') })
            .leftJoin(`opdscreen`, function () { this.on('opdscreen.hn', '=', 'ovst.hn') })
            //.leftJoin('patient' on 'patient'.'hn' = 'ovst'.'hn')
            .where('er_regist.vn', "=", visitno);
        //         db('users').select('*').leftJoin('accounts', function() {
        //   this.on('accounts.id', '=', 'users.account_id').orOn('accounts.owner_id', '=', 'users.id')
        // })
    }

    getAppointment(knex, columnName, searchNo, hospCode) {
        return knex('appointment')
            .select('*')
            .where(columnName, "=", searchNo);
    }

    getData(knex, tableName, columnName, searchNo, hospCode) {
        return knex(tableName)
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(5000);
    }
}
