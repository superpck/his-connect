import { Knex } from 'knex';
const dbName = process.env.HIS_DB_NAME;
const maxLimit = 250;

export class HisHiModel {
    getTableName(knex: Knex) {
        return knex('information_schema.tables')
            .select('table_name')
            .where('table_schema', '=', dbName);
    }

    async testConnect(db: Knex) {
        try {
            const result = await db('hi.pt').select('hn')
                .orderBy('hn', 'desc').first();
            const connection = result && result?.hn ? true : false;
            return { connection };
        } catch (error) {
            throw new Error(error);
        }
    }

    getPerson(knex: Knex, columnName, searchText) {
        return knex('hi.pt')
            .select('hn', 'pop_id as cid', 'pname as prename',
                'fname', 'lname',
                'brthdate as dob', 'male as sex', 'addrpart as address', 'moopart as moo', '"" as road',
                'concat(chwpart,amppart,tmbpart,moopart) as addcode', 'hometel as tel', '"" as zip', 'occupa as occupation')
            .where(columnName, "=", searchText);
    }

    getOpdService(db: Knex, hn, date, columnName = '', searchText = '') {
        columnName = columnName == 'visitNo' ? 'vn' : columnName;
        let where = {};
        if (hn)
            where['hn'] = hn;
        if (date)
            where['date(vstdttm)'] = date;
        if (columnName && searchText)
            where[columnName] = searchText;
        return db('ovst')
            .leftJoin('emergency as e', 'ovst.vn', 'e.vn')
            .leftJoin('ipt', 'ovst.vn', 'ipt.vn')
            .leftJoin('orfro as r ', 'ovst.vn', 'r.vn')
            .select(
                'ovst.hn',
                'ovst.vn as visitno',
                db.raw('date(ovst.vstdttm) as date'),
                db.raw('time(ovst.vstdttm) as time'),
                'ovst.sbp as bp_systolic',
                'ovst.dbp as bp_diastolic',
                'ovst.pr',
                'ovst.rr',
                'date(ovst.vstdttm) as hdate',
                'time(ovst.vstdttm) as htime',
                'e.coma_eye as eye',
                'e.speak as verbal',
                'e.coma_move as motor',
                db.raw(`if(e.aetype_ae = '01','1','2') as cause`),
                'e.aeplace as apoint',
                'e.typein_ae as injt',
                'e.aetype_ae as injp',
                'e.airway as airway',
                'e.alochol as risk1',
                'e.nacrotic as risk2',
                'e.belt as risk3',
                'e.helmet as risk4',
                'e.stopbleed as blood',
                'e.imm as splintc',
                'e.splint as splint',
                'e.fluid as iv',
                // 'er_nursing_detail.accident_type_1 as br1',
                // 'er_nursing_detail.accident_type_2 as br2',
                // 'er_nursing_detail.accident_type_3 as tinj',
                // 'er_nursing_detail.accident_type_4 as ais1',
                // 'er_nursing_detail.accident_type_5 as ais2',
                // 'er_regist.finish_time as disc_date_er',
                // 'er_emergency_type.export_code as cause_t',
                'ipt.ward as wardcode',
                'r.rfrlct as htohosp')
            .where(where)
            .orderBy('date', 'desc')
            .limit(maxLimit);
    }

    getDiagnosisOpd(knex, visitno) {
        return knex('ovstdx')
            .select('vn as visitno', 'icd10 as diagcode')
            .select(knex.raw(`if(cnt = '1' , '1',if(icd10 between 'V000' and 'Y999',5,4)) as diagcode`))
            .where('vn', "=", visitno);
    }

    getProcedureOpd(knex, columnName, searchNo, hospCode) {
        return knex('oprt')
            .select('*')
            .where(columnName, "=", searchNo);
    }

    getChargeOpd(knex, columnName, searchNo, hospCode) {
        return knex('incoth')
            .select('*')
            .where(columnName, "=", searchNo);
    }

    getDrugOpd(knex, visitNo, hospCode) {
        return knex('prsc')
            .innerJoin('prscdt', 'prsc.prscno', 'prscdt.prscno')
            .select('prsc.vn as visitno', 'prscdt.*')
            .where('prsc.vn', "=", visitNo);
    }

    getAdmission(knex, columnName, searchNo, hospCode) {
        return knex('ipt')
            .where(columnName, "=", searchNo);
    }

    getDiagnosisIpd(knex, columnName, searchNo, hospCode) {
        return knex('iptdx')
            .where(columnName, "=", searchNo);
    }

    getProcedureIpd(knex, columnName, searchNo, hospCode) {
        return knex('ioprt')
            .where(columnName, "=", searchNo);
    }

    getChargeIpd(knex, columnName, searchNo, hospCode) {
        return knex('incoth')
            .where(columnName, "=", searchNo);
    }

    getDrugIpd(knex, columnName, searchNo, hospCode) {
        return knex('iprsc')
            .where(columnName, "=", searchNo);
    }

    getAccident(knex, visitno, hospCode) {
        return knex('emergency as e')
            .innerJoin('ovst', 'ovst.vn', 'e.vn')
            .select('ovst.vn', 'ovst.hn', 'e.sickdate as adate',
                'e.sicktime as atime', 'aetype_ae as accident_person_type_id',
                'e.belt',
                'ovst.sbp as bp1', 'ovst.dbp as bp2',
                'e.coma_eye as e', 'e.coma_speak as v', 'e.coma_move as m')
            .where('e.vn', "=", visitno);
    }

    getAppointment(knex, columnName, searchNo, hospCode) {
        return knex('oapp')
            .where(columnName, "=", searchNo);
    }

    getData(knex, tableName, columnName, searchNo, hospCode) {
        return knex(tableName)
            .where(columnName, "=", searchNo)
            .limit(5000);
    }
}