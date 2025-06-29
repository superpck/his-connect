import { Knex } from 'knex';
const dbName = process.env.HIS_DB_NAME;
const maxLimit = 500;

export class HisHosxpv3Model {
    getTableName(knex: Knex) {
        return knex('information_schema.tables')
            .select('table_name')
            .where('table_schema', '=', dbName);
    }

    testConnect(db: Knex) {
        return db('patient').select('hn').limit(1)
    }

    getPerson(db: Knex, columnName: string, searchText: any) {
        let sql = db('patient');
        if (typeof searchText === 'string'){
            sql.where(columnName, searchText);
        } else {
            sql.whereIn(columnName, searchText);
        }

        return sql.leftJoin('nationality as nt1','patient.nationality','nt1.nationality')
            .leftJoin(`occupation`, 'occupation.occupation', 'patient.occupation')
            .select('patient.hn', 'patient.cid', 'patient.pname as prename',
                'patient.fname', 'patient.lname', 'patient.occupation as occupa',
                'occupation.nhso_code as occupation', 'patient.nationality',
                'patient.birthday as dob', 'patient.sex', 'patient.moopart as moo', 'patient.road',
                'patient.addrpart as address', 'patient.hometel as tel', 'patient.po_code as zip',
                'nt1.nhso_code as nation',
                db.raw('CONCAT(chwpart,amppart,tmbpart) as addcode'))
            .limit(maxLimit);
    }

    getOpdService(db: Knex, hn, date, columnName = '', searchText = '') {
        columnName = columnName == 'visitNo' || columnName == 'vn' ? 'opdscreen.vn' : columnName;
        let where: any = {};
        if (hn) where['opdscreen.hn'] = hn;
        if (date) where['opdscreen.vstdate'] = date;
        if (columnName && searchText) where[columnName] = searchText;

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
            .leftJoin(`clinic`, 'ovst.cur_dep', 'clinic.clinic')
            // .leftOuterJoin(db.raw(`select vn,icd10,diagtype from ovstdiag where diagtype = 1 AND hn`, '=', hn) `ovstdiag`,'ovstdiag.vn','er_nursing_detail.vn')
            // .leftOuterJoin(db.raw(`select vn,icd10,diagtype from ovstdiag where diagtype = 2 AND hn`, '=', hn) `ovstdiag`,'ovstdiag.vn','er_nursing_detail.vn')
            .select('opdscreen.hn', 'opdscreen.vn as visitno', 'opdscreen.vstdate as date',
                'opdscreen.vsttime as time',
                'ovst.cur_dep as clinic_local_code', 'clinic.name as clinic_local_name',
                'opdscreen.bps as bp_systolic', 'opdscreen.bpd as bp_diastolic',
                'opdscreen.pulse as pr', 'opdscreen.rr', 'ovst.vstdate as hdate', 'ovst.vsttime as htime',
                'er_nursing_detail.gcs_e', 'er_nursing_detail.gcs_v',
                'er_nursing_detail.gcs_m',
                'er_nursing_detail.gcs_e as eye', 'er_nursing_detail.gcs_v as verbal',
                'er_nursing_detail.gcs_m as motor',
                'er_nursing_detail.er_accident_type_id as cause',
                'accident_place_type.export_code as apoint',
                'accident_transport_type.export_code as injt',
                'accident_person_type.export_code as injp',
                'er_nursing_detail.accident_airway_type_id as airway',
                'er_nursing_detail.accident_alcohol_type_id as risk1',
                'er_nursing_detail.accident_drug_type_id as risk2',
                'er_nursing_detail.accident_belt_type_id as risk3',
                'er_nursing_detail.accident_helmet_type_id as risk4',
                'er_nursing_detail.accident_bleed_type_id as blood',
                'er_nursing_detail.accident_splint_type_id as splintc',
                'er_nursing_detail.accident_splint_type_id as splint',
                'er_nursing_detail.accident_fluid_type_id as iv',
                'er_nursing_detail.accident_type_1 as br1',
                'er_nursing_detail.accident_type_2 as br2',
                'er_nursing_detail.accident_type_3 as tinj',
                'er_nursing_detail.accident_type_4 as ais1',
                'er_nursing_detail.accident_type_5 as ais2',
                'er_regist.finish_time as disc_date_er',
                'er_emergency_type.export_code as cause_t',
                'ipt.ward as wardcode',
                'referin.refer_hospcode as htohosp'
            )
            // .select(db.raw('if(ovstdiag.diagtype =1,ovstdiag.icd10,null) as diag1'))
            // .select(db.raw('if(ovstdiag.diagtype =2,ovstdiag.icd10,null) as diag2'))
            .where(where)
            // .groupBy('ovst.vn')
            // .orderBy('opdscreen.vstdate', 'desc')
            .limit(maxLimit);
    }
    getOpdServiceByVN(db: Knex, vn: any) {
        let sql = db('opdscreen');
        if (typeof vn === 'string') {
            sql.where('opdscreen.vn', vn);
        } else {
            sql.whereIn('opdscreen.vn', vn)
        };

        return sql.leftJoin(`ovst`, 'ovst.vn', 'opdscreen.vn')
            .leftJoin(`patient`, 'patient.hn', 'opdscreen.hn')
            .leftJoin(`er_regist`, 'er_regist.vn', 'ovst.vn')
            .leftJoin(`er_nursing_detail`, 'er_nursing_detail.vn', 'opdscreen.vn')
            .leftJoin(`ovstdiag`, 'ovstdiag.vn', 'opdscreen.vn')
            .leftJoin(`ipt`, 'ipt.vn', 'opdscreen.vn')
            .leftJoin(`referin`, 'referin.vn', 'opdscreen.vn')
            .leftJoin(`clinic`, 'ovst.cur_dep', 'clinic.clinic')
            .select('opdscreen.hn', 'opdscreen.vn as visitno', 'opdscreen.vstdate as date',
                'opdscreen.vsttime as time',
                'ovst.cur_dep as clinic_local_code', 'clinic.name as clinic_local_name',
                'opdscreen.bps as bp_systolic', 'opdscreen.bpd as bp_diastolic',
                'opdscreen.pulse as pr', 'opdscreen.rr', 'ovst.vstdate as hdate', 'ovst.vsttime as htime',
                'er_nursing_detail.gcs_e as eye', 'er_nursing_detail.gcs_v as verbal',
                'er_nursing_detail.gcs_m as motor',
                'er_nursing_detail.er_accident_type_id as cause',
                'er_nursing_detail.accident_place_type_id as apoint',
                'er_nursing_detail.accident_transport_type_id as injt',
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
                'er_regist.finish_time as disc_date_er',
                'er_regist.er_emergency_type as cause_t',
                'ipt.ward as wardcode',
                'referin.refer_hospcode as htohosp'
            )
            .select(db.raw('if(ovstdiag.diagtype =1,ovstdiag.icd10,null) as diag1'))
            .select(db.raw('if(ovstdiag.diagtype =2,ovstdiag.icd10,null) as diag2'))
            // .groupBy('ovst.vn')
            .limit(1);
    }

    // with is_code
    // getOpdService(knex, hn, date) {
    //     return knex('opdscreen')
    //         .select('opdscreen.hn', 'opdscreen.vn as visitno', 'opdscreen.vstdate as date',
    //         'opdscreen.vsttime as time',
    //         'opdscreen.bps as bp_systolic', 'opdscreen.bpd as bp_diastolic',
    //         'opdscreen.pulse as pr', 'opdscreen.rr', 'ovst.vstdate as hdate', 'ovst.vsttime as htime',
    //         'er_nursing_detail.gcs_e as eye', 'er_nursing_detail.gcs_v as verbal',
    //         'er_nursing_detail.gcs_m as motor', 'er_accident_type.is_code as cause',
    //         'er_nursing_detail.visit_type as visit_type',
    //         'accident_place_type.is_code as apoint',
    //         'accident_transport_type.is_code as injt',
    //         'accident_person_type.is_code as injp',
    //         'accident_airway_type.is_code as airway',
    //         'accident_alcohol_type.is_code as risk1',
    //         'accident_drug_type.is_code as risk2',
    //         'accident_belt_type.is_code as risk3',
    //         'accident_helmet_type.is_code as risk4',
    //         'accident_bleed_type.is_code as blood',
    //         'accident_splint_type.is_code as splintc',
    //         'accident_splint_type.is_code as splint',
    //         'accident_fluid_type.is_code as iv',
    //         'er_nursing_detail.accident_type_1 as br1',
    //         'er_nursing_detail.accident_type_2 as br2',
    //         'er_nursing_detail.accident_type_3 as tinj',
    //         'er_nursing_detail.accident_type_4 as ais1',
    //         'er_nursing_detail.accident_type_5 as ais2',
    //         'er_regist.finish_time as disc_date_er',
    //         'er_regist.er_emergency_type as cause_t',
    //         'ipt.ward as wardcode',
    //         'referin.refer_hospcode as htohosp'
    //     )
    //         .select(knex.raw('if(ovstdiag.diagtype =1,ovstdiag.icd10,null) as diag1'))
    //         .select(knex.raw('if(ovstdiag.diagtype =2,ovstdiag.icd10,null) as diag2'))
    //         .leftJoin(`ovst`, 'ovst.vn','opdscreen.vn')
    //         .leftJoin(`patient`, 'patient.hn', 'opdscreen.hn')
    //         .leftJoin(`er_regist`, 'er_regist.vn', 'ovst.vn')
    //         .leftJoin(`er_nursing_detail`, 'er_nursing_detail.vn', 'opdscreen.vn') 
    //         .leftJoin(`ovstdiag`, 'ovstdiag.vn', 'opdscreen.vn')
    //         .leftJoin(`ipt`, 'ipt.vn', 'opdscreen.vn')
    //         .leftJoin(`referin`, 'referin.vn', 'opdscreen.vn')
    //         // .leftOuterJoin(knex.raw(`select vn,icd10,diagtype from ovstdiag where diagtype = 1 AND hn`, '=', hn) `ovstdiag`,'ovstdiag.vn','er_nursing_detail.vn')
    //         // .leftOuterJoin(knex.raw(`select vn,icd10,diagtype from ovstdiag where diagtype = 2 AND hn`, '=', hn) `ovstdiag`,'ovstdiag.vn','er_nursing_detail.vn')
    //         .leftJoin(`accident_airway_type`, 'accident_airway_type.accident_airway_type_id', 'er_nursing_detail.accident_airway_type_id')
    //         .leftJoin(`er_accident_type`, 'er_accident_type.er_accident_type_id', 'er_nursing_detail.er_accident_type_id')
    //         .leftJoin(`er_nursing_visit_type`, `er_nursing_visit_type.visit_type`, 'er_nursing_detail.visit_type')
    //         .leftJoin(`accident_transport_type`, 'accident_transport_type.accident_transport_type_id', 'er_nursing_detail.accident_transport_type_id')
    //         .leftJoin(`accident_place_type`, 'accident_place_type.accident_place_type_id', 'er_nursing_detail.accident_place_type_id')
    //         .leftJoin(`accident_alcohol_type`, 'accident_alcohol_type.accident_alcohol_type_id', 'er_nursing_detail.accident_alcohol_type_id')
    //         .leftJoin(`accident_drug_type`, 'accident_drug_type.accident_drug_type_id', 'er_nursing_detail.accident_drug_type_id')
    //         .leftJoin(`accident_belt_type`, 'accident_belt_type.accident_belt_type_id', 'er_nursing_detail.accident_belt_type_id')
    //         .leftJoin(`accident_helmet_type`, 'accident_helmet_type.accident_helmet_type_id', 'er_nursing_detail.accident_helmet_type_id')
    //         .leftJoin(`accident_bleed_type`, 'accident_bleed_type.accident_bleed_type_id', 'er_nursing_detail.accident_bleed_type_id')
    //         .leftJoin(`accident_fluid_type`, 'accident_fluid_type.accident_fluid_type_id', 'er_nursing_detail.accident_fluid_type_id')
    //         .leftJoin(`accident_splint_type`, 'accident_splint_type.accident_splint_type_id', 'er_nursing_detail.accident_splint_type_id')
    //         .leftJoin(`accident_person_type`, 'accident_person_type.accident_person_type_id', 'er_nursing_detail.accident_person_type_id')
    //         .where('opdscreen.hn', "=", hn)
    //         .where('opdscreen.vstdate', "=", date);
    // }

    getDiagnosisOpd(db: Knex, visitno) {
        return db('ovstdiag')
            .select('hn','vn as visitno', 'icd10 as diagcode'
                , 'diagtype as diag_type'
                , 'update_datetime as d_update')
            .select(db.raw(`concat(vstdate,' ',vsttime) as date_serv`))
            .where('vn', "=", visitno);
    }
    async getDiagnosisOpdVWXY(db: Knex, date: any) {
        let sql = `SELECT hn, vn AS visitno, dx.vstdate as date, icd10 AS diagcode
                , icd.name AS diag_name
                , dx.diagtype AS diag_type, doctor AS dr
                , dx.episode
                , "IT" as codeset, update_datetime as d_update
            FROM ovstdiag as dx
                LEFT JOIN icd10_sss as icd ON dx.icd10 = icd.code
            WHERE vn IN (
                SELECT vn FROM ovstdiag as dx
                WHERE dx.vstdate= ? AND LEFT(icd10,1) IN ('V','W','X','Y'))
                AND LEFT(icd10,1) IN ('S','T','V','W','X','Y')
            ORDER BY vn, diagtype, update_datetime LIMIT `+maxLimit;

        const result = await db.raw(sql, [date]);
        return result[0];
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
        return knex('ipt')
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
