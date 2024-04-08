import { Knex } from 'knex';
const maxLimit = 1000;
const hcode = process.env.HOSPCODE;
const dbName = process.env.HIS_DB_NAME;
const dbClient = process.env.HIS_DB_CLIENT;

export class HisEzhospModel {
    check() {
        return true;
    }

    getTableName(db: Knex, dbname = dbName) {
        const whereDB = dbClient === 'mssql' ? 'TABLE_CATALOG' : 'table_schema';
        return db('information_schema.tables')
            .where(whereDB, dbname);
    }

    getTableName1(knex: Knex, dbname = dbName) {
        return knex('information_schema.tables')
            .select('table_name')
            .where('table_schema', '=', dbname);
    }

    testConnect(db: Knex) {
        return db('hospdata.patient').select('hn').limit(1)
    }

    getPerson(db: Knex, columnName: string, searchText: any) {
        columnName = columnName === 'cid' ? 'no_card' : columnName;
        let sql = db('hospdata.view_patient');
        if (typeof searchText === 'string'){
            sql.where(columnName, searchText);
        } else {
            sql.whereIn(columnName, searchText);
        }
        return sql.select('no_card as cid', 'hn as pid', 'title as prename',
                'name', 'name as fname', 'surname as lname', 'hn',
                'birth', 'birth as dob', 'sex', 'marry_std as mstatus',
                'blood as abogroup','address', 'moo', 'road', 'soi',
                'add as addcode', 'tel', 'zip',
                'occ_std as occupation', 'religion_std as religion',
                'nation_std as nation', 'religion_std as religion',
                'edu_std as education', 'tel as telephone',
                'lastupdate as d_update');
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

    getOpdServiceByVN(db: Knex, vn: any) {
        let sql = db('view_opd_visit');
        if (typeof vn === 'string') {
            sql.where('vn', vn);
        } else {
            sql.whereIn('vn', vn)
        };

        return sql.select('hn', 'vn as visitno', 'date', 'time',
                'time_drug as time_end', 'pttype_std2 as pttype',
                'insclass as payment',
                'dep_standard as clinic', 'dr',
                'bp as bp_systolic', 'bp1 as bp_diastolic',
                'puls as pr', 'rr', 'fu as appoint',
                'status as result', 'refer as referin')
                .limit(maxLimit);
    }

    getDiagnosisOpd(knex, visitno) {
        return knex('view_opd_dx as dx')
            .select('vn as visitno', 'diag as diagcode', 'desc as diag_name',
                'short_eng as en', 'short_thi as thi',
                'type as diag_type', 'dr_dx as dr')
            .select(knex.raw(' "IT" as codeset'))
            .where('vn', "=", visitno);
        // .select('vn as visitno', 'icd10 as diagcode'
        //     , 'diagtype', 'hn'
        //     , 'update_datetime as d_update')
        // .select(db.raw(`concat(vstdate,' ',vsttime) as date_serv`))
    }
    async getDiagnosisOpdVWXY(db: Knex, date: any) {
        let sql = `SELECT hn, vn AS visitno, view_opd_dx.date, diag AS diagcode
                , view_opd_dx.desc AS diag_name, short_eng AS en, short_thi AS thi
                , view_opd_dx.type AS diag_type, dr_dx AS dr
                , "IT" as codeset, lastupdate as d_update
            FROM view_opd_dx WHERE vn IN (
                SELECT vn FROM view_opd_dx 
                WHERE date= ? AND LEFT(diag,1) IN ('V','W','X','Y'))
            WHERE LEFT(diag,1) IN ('S','T','V','W','X','Y')
            ORDER BY vn, type, lastupdate LIMIT ${maxLimit}`

        const result = await db.raw(sql, [date]);
        return result[0];
    }

    getProcedureOpd(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'vn' : columnName;
        return knex('view_opd_op')
            .select('vn as visitno', 'date', 'hn', 'op as op_code',
                'desc as op_name', 'icd_9 as icdcm', 'dr')
            .where(columnName, "=", searchNo);
    }

    getChargeOpd(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'vn' : columnName;
        return knex('view_opd_charge_item')
            .select('*')
            .where(columnName, "=", searchNo);
    }

    getLabRequest(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'vn' : columnName;
        return knex('view_lab_request_item as lab')
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
            .where(columnName, "=", searchNo);
    }

    getLabResult(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'vn' : columnName;
        return knex('view_lab_result')
            .select('*')
            .where(columnName, "=", searchNo);
    }

    getDrugOpd(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'drug.vn' : ('drug.' + columnName);
        return knex('view_pharmacy_opd_drug as drug')
            .select('drug.*')
            .where(columnName, "=", searchNo);
    }

    getDrugName(knex, columnName, textSearch, typeCompare = '=', hospCode) {
        columnName = columnName === 'code' ? 'drug.aliascode' : columnName;
        columnName = columnName === 'id' ? 'drug.drugcode' : columnName;
        // ใน ezhosp aliascode = รหัสยา
        // ใน ezhosp drugcode = autorunning
        return knex('pharmacy_inventory as drug')
            .select('drug.aliascode as code', 'drug.name', 'drug.name as dfstext',
                'drug.unit', 'drug.unit_use',
                'drug.defa_use as dose', 'drug.method as sigcode', 'method.name as sigtext',
                'drug.unit as packsize',
                'drug.freq', 'freq.name as freqname',
                'drug.times', 'times.name as timesname',
                'drug.procat as product_cat',
                'drug.comment as caution', 'drug.price',
                'drug.last_tmt as tmt_code', 'drug.last_code24 as code24')
            .leftJoin('pharmacy_method as method', 'drug.method', 'method.code')
            .leftJoin('pharmacy_freq as freq', 'drug.freq', 'freq.code')
            .leftJoin('pharmacy_times as times', 'drug.times', 'times.code')
            .where(columnName, typeCompare, textSearch);
    }

    getAdmission(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'vn' : columnName;
        return knex('view_ipd_ipd')
            .where(columnName, "=", searchNo);
    }

    getDiagnosisIpd(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'vn' : columnName;
        return knex('view_diagnosis_ipd')
            .where(columnName, searchNo);
    }

    getProcedureIpd(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'vn' : columnName;
        return knex('view_procedure_ipd')
            .where(columnName, searchNo);
    }

    getChargeIpd(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'vn' : columnName;
        return knex('charge_ipd')
            .where(columnName, "=", searchNo);
    }

    getDrugIpd(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'vn' : columnName;
        return knex('drug_ipd')
            .where(columnName, "=", searchNo);
    }

    getAccident(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'vn' : columnName;
        return knex('accident')
            .where(columnName, "=", searchNo);
    }

    getAppointment(knex, columnName, searchNo, hospCode) {
        columnName = columnName === 'visitno' ? 'opd_fu.vn' : columnName;
        return knex('opd_fu')
            .select('opd_fu.hn', 'opd_fu.vn as seq',
                'opd_visit.date as date_serv', 'opd_visit.time as time_serv',
                'opd_fu.date', 'opd_fu.fu_date as appointment_date',
                'opd_fu.fu_time as appointment_time',
                'opd_visit.dep as local_code',
                'lib_clinic.standard as clinic_code',
                'lib_clinic.clinic',
                'opd_fu.detail')
            .leftJoin('opd_visit', 'opd_fu.vn', 'opd_visit.vn')
            .leftJoin('lib_clinic', 'opd_visit.dep', 'lib_clinic.code')
            .where(columnName, "=", searchNo);
    }

    getData(knex, tableName, columnName, searchNo, hospCode) {
        return knex(tableName)
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(5000);
    }
}
