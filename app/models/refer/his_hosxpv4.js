"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisHosxpv4Model = void 0;
const moment = require("moment");
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
class HisHosxpv4Model {
    check() {
        return true;
    }
    getTableName(db, dbName = process.env.HIS_DB_NAME, schemaName = process.env.HIS_DB_SCHEMA, dbClient = process.env.HIS_DB_CLIENT) {
        if (dbClient == 'pg') {
            return db('information_schema.tables')
                .select('table_name')
                .where('table_schema', '=', schemaName)
                .where('table_catalog', '=', dbName);
        }
        else {
            return db('information_schema.tables')
                .select('table_name')
                .where('table_schema', '=', dbName);
        }
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
            .select(db.raw(`LOCATE('ฉุกเฉิน',name)>0,1,0) as emergency`))
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
            .select('ward as ward_code', 'name as ward_name', `'-' as moph_code`)
            .orderBy('name')
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
    async getReferOut(db, date, hospCode = hcode) {
        const result = await db({ r: 'referout' })
            .select({
            hospcode: db.raw('(select distinct opdconfig.hospitalcode from opdconfig)'),
            referid: 'r.refer_number',
            hosp_destination: 'r.refer_hospcode',
            PID: 'r.hn',
            hn: 'r.hn',
            CID: 'pt.cid',
            seq: 'r.vn',
            an: 'an_stat.an',
            prename: 'pt.pname',
            dob: 'pt.birthday',
            EMERGENCY: 'r.referout_emergency_type_id',
            REQUEST: 'r.request_text',
            dx: 'r.pdx',
            DIAGFIRST: 'r.pre_diagnosis',
            PHYSICALEXAM: 'r.treatment_text',
            DISGLAST: 'r.pre_diagnosis',
            PH: db.raw("case when r.pmh is not null then r.pmh else opdscreen.pmh end"),
            PI: db.raw("case when r.hpi is not null then r.hpi else opdscreen.hpi end"),
            refer_date: db.raw("CONCAT(r.refer_date, ' ', r.refer_time)")
        })
            .select('r.vn', 'pt.sex', 'pt.fname', 'pt.lname')
            .innerJoin({ 'pt': 'patient' }, 'pt.hn', 'r.hn')
            .leftJoin('an_stat', 'r.vn', 'an_stat.vn')
            .leftJoin('opdscreen', 'r.vn', 'opdscreen.vn')
            .where('r.refer_date', '=', date)
            .whereNotNull('r.vn')
            .whereNotNull('r.refer_hospcode')
            .whereNot('r.vn', '')
            .orderBy('r.refer_date', 'asc');
        return result;
    }
    async getPerson(db, columnName, searchText, hospCode = hcode) {
        columnName = columnName == 'hn' ? 'p.hn' : columnName;
        columnName = columnName == 'cid' ? 'p.cid' : columnName;
        columnName = columnName == 'name' ? 'p.fname' : columnName;
        columnName = columnName == 'hid' ? 'h.house_id' : columnName;
        const result = await db({ p: 'patient' })
            .select({
            HOSPCODE: db.raw('(select distinct opdconfig.hospitalcode from opdconfig)'),
            HID: 'h.house_id',
            CID: 'p.cid',
            PRENAME: 'p.pname',
            NAME: 'p.fname',
            LNAME: 'p.lname',
            HN: 'p.hn',
            PID: 'p.hn',
            SEX: 'p.sex',
            BIRTH: 'p.birthday',
            MSTATUS: db.raw("case when p.marrystatus in ('1','2','3','4','5','6') then p.marrystatus else '9' end"),
            FSTATUS: db.raw("case when person.person_house_position_id='1' then '1' else '2' end"),
            OCCUPATION_OLD: db.raw("case when o.occupation is null then '000' else o.occupation end"),
            OCCUPATION_NEW: db.raw("case when o.nhso_code is null then '9999' else o.nhso_code end"),
            RACE: db.raw("case when nt0.nhso_code is null then '099' else nt0.nhso_code end"),
            NATION: db.raw("case when nt1.nhso_code is null then '099' else nt1.nhso_code end"),
            RELIGION: db.raw("case when p.religion is null then '01' else p.religion end"),
            EDUCATION: db.raw("case when e.provis_code is null then '9' else e.provis_code end"),
            FATHER: 'p.father_cid',
            MOTHER: 'p.mother_cid',
            COUPLE: 'p.couple_cid',
            VSTATUS: db.raw(`(select case 
                when (select person_duty_id from person_village_duty where person_id =person.person_id) in (1,2,4,5) then '1'
                when (select person_duty_id from person_village_duty where person_id =person.person_id) in (6) then '2'
                when (select person_duty_id from person_village_duty where person_id =person.person_id) in (3) then '3'
                when (select person_duty_id from person_village_duty where person_id =person.person_id) in (10) then '4'
                when (select person_duty_id from person_village_duty where person_id =person.person_id) in (7,8,9) then '5'
                else '5' 
            end)`),
            MOVEIN: 'person.movein_date',
            DISCHARGE: db.raw(`case when person.person_discharge_id is null then '9' else  person.person_discharge_id end`),
            DDISCHARGE: 'person.discharge_date',
            ABOGROUP: db.raw(`case 
                when p.bloodgrp='A' then '1'
                when p.bloodgrp='B' then '2'
                when p.bloodgrp='AB' then '3'
                when p.bloodgrp='O' then '4'
                else '9' 
            end`),
            RHGROUP: 'p.bloodgroup_rh',
            LABOR: 'pl.nhso_code',
            PASSPORT: 'p.passport_no',
            TYPEAREA: 'p.type_area',
            MOBILE: 'p.mobile_phone_number',
            dead: 'p.deathday',
            D_UPDATE: 'p.last_update'
        })
            .leftJoin('person', 'p.hn', 'person.patient_hn')
            .leftJoin({ h: 'house' }, 'person.house_id', 'h.house_id')
            .leftJoin({ o: 'occupation' }, 'o.occupation', 'p.occupation')
            .leftJoin({ nt0: 'nationality' }, 'nt0.nationality', 'p.citizenship')
            .leftJoin({ nt1: 'nationality' }, 'nt1.nationality', 'p.nationality')
            .leftJoin({ r: 'provis_religion' }, 'r.code', 'p.educate')
            .leftJoin({ e: 'education' }, 'e.education', 'p.educate')
            .leftJoin({ pl: 'person_labor_type' }, 'person.person_labor_type_id', 'pl.person_labor_type_id')
            .where(columnName, '=', searchText);
        return result;
    }
    async getAddress(db, columnName, searchText, hospCode = hcode) {
        const result = db({ p: 'person' })
            .select({
            hospcode: db.raw('(select distinct opdconfig.hospitalcode from opdconfig)'),
            pid: 'pt.hn',
            addresstype: db.raw("case when p.house_regist_type_id IN (1, 2) then '1' else '2' end"),
            house_id: db.raw("case when h.census_id is null then '' else h.census_id end"),
            housetype: db.raw("case when p.house_regist_type_id IN (4) then '9' else h.house_type_id end"),
            roomno: 'h.house_condo_roomno',
            condo: 'h.house_condo_name',
            houseno: db.raw("case when p.house_regist_type_id IN (4) then pt.addrpart else h.address end"),
            road: db.raw("case when p.house_regist_type_id IN (4) then pt.road else h.road end"),
            villaname: db.raw("case when p.house_regist_type_id IN (4) then '' else v.village_name end"),
            village: db.raw("case when p.house_regist_type_id IN (4) then pt.moopart else v.village_moo end"),
            tambon: db.raw("case when p.house_regist_type_id IN (4) then pt.tmbpart else t.tmbpart end"),
            ampur: db.raw("case when p.house_regist_type_id IN (4) then pt.amppart else t.amppart end"),
            changwat: db.raw("case when p.house_regist_type_id IN (4) then pt.chwpart else t.chwpart end"),
            D_Update: 'p.last_update'
        })
            .select('pt.cid', 'pt.hn')
            .leftJoin({ pt: 'patient' }, 'p.cid', 'pt.cid')
            .leftJoin({ h: 'house' }, 'h.house_id', 'p.house_id')
            .leftJoin({ v: 'village' }, 'v.village_id', 'h.village_id')
            .leftJoin({ t: 'thaiaddress' }, 't.addressid', 'v.address_id')
            .leftJoin({ pa: 'person_address' }, 'pa.person_id', 'p.person_id')
            .where(columnName, '=', searchText);
        return result;
    }
    async getService(db, columnName, searchText, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'os.vn' : columnName;
        columnName = columnName === 'vn' ? 'os.vn' : columnName;
        columnName = columnName === 'seq_id' ? 'os.seq_id' : columnName;
        columnName = columnName === 'hn' ? 'o.hn' : columnName;
        columnName = columnName === 'date_serv' ? 'o.vstdate' : columnName;
        const result = db({ o: 'ovst' })
            .select({
            MAIN: 'o.hospmain',
            HOSPCODE: db.raw('(select distinct opdconfig.hospitalcode from opdconfig)'),
            PID: 'pt.hn',
            HN: 'o.hn',
            SEQ: 'os.vn',
            CID: 'pt.cid',
            DATE_SERV: db.raw(`TO_CHAR( o.vstdate::date, 'YYYY-mm-dd')`),
            TIME_SERV: db.raw(`TO_CHAR( o.vsttime::time, 'HH24:MI:SS' )`),
            LOCATION: db.raw("case when v.village_moo <>'0' then '1' else '2' end"),
            INTIME: db.raw(`case  o.visit_type 
                when 'i'  then '1' 
                when 'o' then '2'
                else '1' end`),
            INSTYPE: db.raw(`case when p2.pttype_std_code is null or p2.pttype_std_code ='' then '9100' else p2.pttype_std_code end`),
            TYPEIN: db.raw(`case o.pt_subtype 
                    when '7' then '2' 
                    when '9' then '3' 
                    when '10' then '4'
                else '1' end`),
            REFERINHOSP: db.raw(`case when o.rfrilct is null then i.rfrilct else o.rfrilct end`),
            CAUSEIN: db.raw(`case when o.rfrics is null then i.rfrics else o.rfrics end`),
            CHIEFCOMP: db.raw(`concat('CC:',s.cc,' HPI:',s.hpi,' PMH:',s.pmh)`),
            SERVPLACE: db.raw(`case when o.pt_subtype in ('0','1') then '1' else '2' end`),
            BTEMP: db.raw(`case when s.temperature is not null then to_char(s.temperature,'FM990.099') else '0.0'  end`),
            SBP: db.raw(`to_char(s.bps,'999.')`),
            DBP: db.raw(`to_char(s.bpd,'999.')`),
            PR: db.raw(`to_char(s.pulse,'999.')`),
            RR: db.raw(`to_char(s.rr,'999.') `),
            TYPEOUT: db.raw(`case   
                    when (o.ovstost >='01' and o.ovstost <='14') then '2' 
                    when o.ovstost in ('98','99','61','62','63','00') then '1' 
                    when o.ovstost = '54' then '3' when o.ovstost = '52' then '4'
                else '7' end`),
            REFEROUTHOSP: db.raw(`case when o.rfrolct isnull then i.rfrolct else o.rfrolct end`),
            CAUSEOUT: db.raw(`case when o.rfrocs is null then i.rfrocs else o.rfrocs end`),
            COST: db.raw(`to_char(vn.inc01+vn.inc12,'FM990.009')`),
            PRICE: db.raw(`to_char(vn.item_money,'FM990.009')`),
            PAYPRICE: db.raw(`to_char(vn.paid_money,'FM990.009')`),
            ACTUALPAY: db.raw(`to_char(vn.rcpt_money,'FM990.009')`),
            D_UPDATE: db.raw(`TO_CHAR( concat ( o.vstdate, ' ', o.vsttime )::timestamp, 'YYYY-MM-DD HH24:MI:SS' )`),
            hsub: 'vn.hospsub'
        })
            .leftJoin({ p: 'person' }, 'o.hn', 'p.patient_hn')
            .leftJoin({ vn: 'vn_stat' }, function () {
            this
                .on('o.vn', 'vn.vn')
                .on('vn.hn', 'p.patient_hn');
        })
            .leftJoin({ i: 'ipt' }, 'i.vn', 'o.vn')
            .leftJoin({ s: 'opdscreen' }, function () {
            this
                .on('o.vn', 's.vn')
                .on('o.hn', 's.hn');
        })
            .leftJoin({ p2: 'pttype' }, 'p2.pttype', 'vn.pttype')
            .leftJoin({ v: 'village' }, 'v.village_id', 'p.village_id')
            .leftJoin({ pt: 'patient' }, 'pt.hn', 'o.hn')
            .leftJoin({ os: 'ovst_seq' }, 'os.vn', 'o.vn')
            .where(columnName, '=', searchText);
        return result;
    }
    async getDiagnosisOpd(db, visitNo, hospCode = hcode) {
        const result = await db({ o: 'ovst' })
            .select({
            HOSPCODE: db.raw('(select distinct opdconfig.hospitalcode from opdconfig)'),
            CID: 'pt.cid',
            PID: 'o.hn',
            SEQ: 'q.vn',
            VN: 'q.vn',
            DATE_SERV: 'o.vstdate',
            DIAGTYPE: db.raw(`case when odx.diagtype is null then '' else odx.diagtype end`),
            DIAGCODE: 'odx.icd10',
            CLINIC: db.raw(`case when s.provis_code is null then '' else s.provis_code end`),
            PROVIDER: 'd.code',
            D_UPDATE: 'q.update_datetime'
        })
            .select('o.hn')
            .leftJoin({ q: 'ovst_seq' }, 'q.vn', 'o.vn')
            .leftJoin({ odx: 'ovstdiag' }, 'odx.vn', 'o.vn')
            .leftJoin({ pt: 'patient' }, 'pt.hn', 'o.hn')
            .leftJoin({ p: 'person' }, 'p.patient_hn', 'pt.hn')
            .leftJoin({ s: 'spclty' }, 's.spclty', 'o.spclty')
            .leftJoin({ d: 'doctor' }, 'd.code', 'o.doctor')
            .where('q.vn', '=', visitNo);
        return result;
    }
    async getProcedureOpd(db, visitNo, hospCode = hcode) {
        const result = await db({ h1: 'health_med_service' })
            .select({
            hospcode: db.raw('(select distinct opdconfig.hospitalcode from opdconfig)'),
            pid: 'pt.hn',
            seq: 'os.vn',
            vn: 'os.vn',
            date_serv: db.raw(`case when o.vstdate is null or trim(o.vstdate)='' or o.vstdate::TEXT like '0000-00-00%' then '' else TO_CHAR(o.vstdate, 'YYYY-MM-DD') end`),
            clinic: 'sp.provis_code',
            procedcode: 'h3.icd10tm',
            serviceprice: db.raw(`case when h2.service_price is not null and trim(h2.service_price )<>'' then to_char(replace(h2.service_price,',',''),'FM990.009') else to_char(0,'FM990.009') end`),
            provider: 'h1.health_med_doctor_id',
            d_update: db.raw(`case when
                                concat(o.vstdate, ' ', o.vsttime) is null 
                                or trim(concat(o.vstdate, ' ', o.vsttime)) = '' 
                                or concat(o.vstdate, ' ', o.vsttime) like '0000-00-00%' then '' 
                                else  TO_CHAR( concat ( o.vstdate, ' ', o.vsttime )::timestamp, 'YYYY-MM-DD HH24:MI:SS' ) end`)
        })
            .leftJoin({ h2: 'health_med_service_operation' }, 'h2.health_med_service_id', 'h1.health_med_service_id')
            .leftJoin({ h3: 'health_med_operation_item' }, 'h3.health_med_operation_item_id', 'h2.health_med_operation_item_id')
            .leftJoin({ g1: 'health_med_organ' }, 'g1.health_med_organ_id', 'h2.health_med_organ_id')
            .leftJoin({ t1: 'health_med_operation_type' }, 't1.health_med_operation_type_id', 'h2.health_med_operation_type_id')
            .leftJoin({ o: 'ovst' }, function () { this.on('o.vn', 'h1.vn').on('h1.hn', 'o.hn'); })
            .leftJoin({ p: 'person' }, 'p.patient_hn', 'o.hn')
            .leftJoin({ v: 'vn_stat' }, function () { this.on('v.vn', 'h1.vn').on('h1.hn', 'v.hn'); })
            .leftJoin({ sp: 'spclty' }, 'sp.spclty', 'o.spclty')
            .leftJoin({ pt: 'patient' }, 'pt.hn', 'o.hn')
            .leftJoin({ os: 'ovst_seq' }, 'os.vn', 'o.vn')
            .whereNot('v.cid', '')
            .whereNot('h3.icd10tm', '')
            .whereNotNull('v.cid')
            .where('os.vn', '=', visitNo)
            .unionAll(db({ r: 'er_regist_oper' })
            .distinct({
            hospcode: db.raw('(select distinct opdconfig.hospitalcode from opdconfig)'),
            pid: 'pt.hn',
            seq: 'os.vn',
            vn: 'os.vn',
            date_serv: db.raw(`case when r.vstdate is null or trim(r.vstdate)='' or r.vstdate::TEXT like '0000-00-00%' then '' else TO_CHAR(r.vstdate, 'YYYY-MM-DD') end`),
            clinic: 'sp.provis_code',
            procedcode: db.raw(`case when e.icd10tm is null or e.icd10tm = '' then e.icd9cm else e.icd10tm end`),
            serviceprice: db.raw(`case when e.price is not null and trim(e.price )<>'' then to_char(replace(e.price,',',''),'FM990.009') else to_char(0,'FM990.009') end`),
            provider: 'r.doctor',
            d_update: db.raw(`case when
                                concat(o.vstdate, ' ', o.vsttime) is null 
                                or trim(concat(o.vstdate, ' ', o.vsttime)) = '' 
                                or concat(o.vstdate, ' ', o.vsttime) like '0000-00-00%' then '' 
                                else  TO_CHAR( concat ( o.vstdate, ' ', o.vsttime )::timestamp, 'YYYY-MM-DD HH24:MI:SS' ) end`)
        })
            .leftJoin({ p: 'person' }, 'p.patient_hn', 'r.hn')
            .leftJoin({ e: 'er_oper_code' }, 'e.er_oper_code', 'r.er_oper_code')
            .leftJoin({ v: 'vn_stat' }, 'v.vn', 'r.vn')
            .leftJoin({ o: 'ovst' }, 'o.vn', 'r.vn')
            .leftJoin({ sp: 'spclty' }, 'sp.spclty', 'o.spclty')
            .leftJoin({ pt: 'patient' }, 'pt.hn', 'o.hn')
            .leftJoin({ os: 'ovst_seq' }, 'os.vn', 'o.vn')
            .whereNot('v.cid', '')
            .whereNot('e.icd9cm', '')
            .whereNotNull('v.cid')
            .where('os.vn', '=', visitNo), db({ d: 'dtmain' })
            .distinct({
            hospcode: db.raw('(select distinct opdconfig.hospitalcode from opdconfig)'),
            pid: 'pt.hn',
            seq: 'os.vn',
            vn: 'os.vn',
            date_serv: db.raw(`case when d.vstdate is null or trim(d.vstdate)='' or d.vstdate::TEXT like '0000-00-00%' then '' else date_format(d.vstdate, '%Y-%m-%d') end`),
            clinic: 'sp.provis_code',
            procedcode: db.raw(`case when e.icd10tm_operation_code is null or e.icd10tm_operation_code = '' then e.icd9cm else e.icd10tm_operation_code end`),
            serviceprice: db.raw(`case when d.fee  is not null and trim(d.fee) <> '' then to_char(replace(d.fee,',', ''),'FM990.009') else to_char(0,'FM990.009') end`),
            provider: 'd.doctor',
            d_update: db.raw(`case when
                            concat(o.vstdate, ' ', o.vsttime) is null 
                            or trim(concat(o.vstdate, ' ', o.vsttime)) = '' 
                            or concat(o.vstdate, ' ', o.vsttime) like '0000-00-00%' then '' 
                            else  TO_CHAR( concat ( o.vstdate, ' ', o.vsttime )::timestamp, 'YYYY-MM-DD HH24:MI:SS' ) end`)
        })
            .leftJoin({ p: 'person' }, 'p.patient_hn', 'd.hn')
            .leftJoin({ e: 'dttm' }, 'e.icd9cm', 'd.icd9')
            .leftJoin({ v: 'vn_stat' }, function () { this.on('v.vn', 'd.vn').on('v.hn', 'd.hn'); })
            .leftJoin({ o: 'ovst' }, function () { this.on('o.vn', 'd.vn').on('o.hn', 'd.hn'); })
            .leftJoin({ sp: 'spclty' }, 'sp.spclty', 'o.spclty')
            .leftJoin({ pt: 'patient' }, 'pt.hn', 'o.hn')
            .leftJoin({ os: 'ovst_seq' }, 'os.vn', 'o.vn')
            .whereNotNull('v.cid')
            .whereNot('v.cid', '')
            .whereNotNull('e.icd10tm_operation_code')
            .where('os.vn', '=', visitNo));
        return result;
    }
    async getChargeOpd(db, visitNo, hospCode = hcode) {
        const result = await db({ o: 'opitemrece' })
            .select({ hospcode: db.raw('(select distinct opdconfig.hospitalcode from opdconfig)'),
            pid: 'pt.hn',
            seq: 'os.vn',
            date_serv: db.raw(`case when concat(ovst.vstdate) is null 
                        or trim(concat(ovst.vstdate)) = '' 
                        or ovst.vstdate::TEXT like '0000-00-00%' then
                    '' else 
                    date_format(concat(ovst.vstdate),'%Y-%m-%d') end `),
            clinic: db.raw(`case  when sp.provis_code is null or sp.provis_code ='' then '00100' else sp.provis_code end`),
            chargeitem: 'o.income',
            chargelist: db.raw(`case when d.charge_list_id is null or d.charge_list_id ='' then '0000000' else right(concat('00000000',d.charge_list_id), 6) end `),
            quantity: 'o.qty',
            instype: db.raw(`case when p2.pttype_std_code is null or p2.pttype_std_code ='' then '9100' else p2.pttype_std_code end `),
            cost: db.raw(`format(o.cost,2)`),
            price: db.raw(`format(o.sum_price,2)`),
            payprice: '0.00',
            d_update: db.raw(`case when
                    concat(ovst.vstdate,' ',ovst.cur_dep_time) is null 
                        or trim(concat(ovst.vstdate,' ',ovst.cur_dep_time))='' 
                        or concat(ovst.vstdate,' ',ovst.cur_dep_time) like '0000-00-00%' then 
                    '' else 
                    date_format(concat(ovst.vstdate,' ',ovst.cur_dep_time),'%Y-%m-%d %H:%i:%s') end`)
        })
            .leftJoin('ovst', 'o.vn', 'ovst.vn')
            .leftJoin({ p: 'person' }, 'o.hn', 'p.patient_hn')
            .leftJoin({ sp: 'spclty' }, 'so.spclty', 'ovst.spclty')
            .leftJoin({ p2: 'pttype' }, 'p2.pttype', 'o.pttype')
            .leftJoin({ pt: 'patient' }, 'pt.hn', 'o.hn')
            .leftJoin({ os: 'ovst_seq' }, 'os.vn', 'o.vn')
            .leftJoin({ d: 'drugitems_charge_list' }, 'd.icode', 'o.icode')
            .where('os.vn', '=', visitNo);
        return result;
    }
    getLabRequest(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'vn' : columnName;
        return db('lab_order as o')
            .leftJoin('lab_order_service as s', 'o.lab_order_number', 's.lab_order_number')
            .select(db.raw(`"${hospCode}" as hospcode`))
            .select('vn as visitno', 'lab.hn as hn', 'lab.an as an', 'lab.lab_no as request_id', 'lab.lab_code as LOCALCODE', 'lab.lab_name as INVESTNAME', 'lab.loinc as loinc', 'lab.icdcm as icdcm', 'lab.standard as cgd', 'lab.cost as cost', 'lab.lab_price as price', 'lab.date as DATETIME_REPORT')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
    getLabResult(db, columnName, searchNo) {
        columnName = columnName === 'visitNo' ? 'lab_head.vn' : columnName;
        columnName = columnName === 'hn' ? 'ovst.hn' : columnName;
        columnName = columnName === 'cid' ? 'patient.cid' : columnName;
        return db('lab_head')
            .leftJoin('lab_order', 'lab_head.lab_order_number', 'lab_order.lab_order_number')
            .leftJoin('lab_items', 'lab_order.lab_items_code', 'lab_items.lab_items_code')
            .innerJoin('ovst', 'lab_head.vn', 'ovst.vn')
            .innerJoin('patient', 'ovst.hn', 'patient.hn')
            .select(db.raw(`'${hcode}' as HOSPCODE,'LAB' as INVESTTYPE`))
            .select('lab_head.vn', 'lab_head.vn as visitno', 'lab_head.vn as SEQ', 'lab_head.hn as PID', 'patient.cid as CID', 'lab_head.lab_order_number as request_id', 'lab_order.lab_items_code as LOCALCODE', 'lab_items.tmlt_code as tmlt', 'lab_head.form_name as lab_group', 'lab_order.lab_items_name_ref as INVESTNAME', 'lab_order.lab_order_result as INVESTVALUE', 'lab_items.icode as ICDCM')
            .select(db.raw(`case when lab_order.lab_items_normal_value_ref is not null then concat(lab_items.lab_items_unit,' (', lab_order.lab_items_normal_value_ref,')') else lab_items.lab_items_unit end  as UNIT`))
            .select(db.raw(`concat(lab_head.order_date, ' ', lab_head.order_time) as DATETIME_INVEST`))
            .select(db.raw(`concat(lab_head.report_date, ' ', lab_head.report_time) as DATETIME_REPORT`))
            .where(columnName, searchNo)
            .where(`lab_order.confirm`, 'Y')
            .whereNot(`lab_order.lab_order_result`, '')
            .whereNotNull('lab_order.lab_order_result')
            .limit(maxLimit);
    }
    async getDrugOpd(db, visitNo, hospCode = hcode) {
        const result = await db({ opi: 'opitemrece' })
            .select({
            hospcode: db.raw('(select distinct opdconfig.hospitalcode from opdconfig)'),
            PID: 'pt.hn',
            CID: 'pt.cid',
            SEQ: 'os.vn',
            date_serv: db.raw(`case when
                opi.vstdate  is null 
                    or trim(opi.vstdate::text)='' 
                    or opi.vstdate::text  like '0000-00-00%' then ''
                    else to_char(opi.vstdate ,'YYYY-MM-DD') end`),
            clinic: 'sp.provis_code',
            DID: 'd.did',
            DID_TMT: 'd.tmt_tp_code',
            dcode: 'd.icode',
            dname: 'd.name',
            amount: 'opi.qty',
            unit: 'd.packqty',
            unit_packing: 'd.units',
            usage_code: db.raw(`concat(d.usage_code, ' ' , d.frequency_code, ' ', d.usage_unit_code, ' ', d.time_code)`),
            drug_usage: db.raw(`concat(drugusage.name1, ' ', drugusage.name2 , ' ' , drugusage.name3)`),
            caution: 'd.therapeutic',
            drugprice: db.raw(`to_char(opi.unitprice,'FM990.009')`),
            drugcost: db.raw(`to_char(d.unitcost,'FM990.009') `),
            provider: 'opi.doctor',
            d_update: db.raw(`case when
                opi.last_modified  is null 
                    or trim(opi.last_modified::text)='' 
                    or opi.last_modified::text  like '0000-00-00%' then
                to_char(concat(opi.rxdate,' ',opi.rxtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') else
                to_char(opi.last_modified::timestamp,'YYYY-MM-DD HH24:MI:SS') end `)
        })
            .leftJoin({ o: 'ovst' }, function () { this.on('o.vn', 'opi.vn').on('o.hn', 'opi.hn'); })
            .leftJoin({ d: 'drugitems' }, 'opi.icode', 'd.icode')
            .leftJoin('drugusage', 'd.drugusage', 'drugusage.drugusage')
            .leftJoin({ sp: 'spclty' }, 'o.spclty', 'sp.spclty')
            .leftJoin({ p: 'person' }, 'opi.hn', 'p.patient_hn')
            .leftJoin({ pt: 'patient' }, 'pt.hn', 'o.hn')
            .leftJoin({ os: 'ovst_seq' }, 'os.vn', 'o.vn')
            .where(function () { this.where('opi.an', null).orWhere('opi.an', ''); })
            .whereNotIn('opi.vn', function () {
            this.select('i.vn').from({ i: 'ipt' }).where('i.vn', '=', 'opi.vn');
        })
            .whereIn('opi.icode', function () {
            this.select('d.icode').from({ d: 'drugitems' });
        })
            .andWhere('os.vn', '=', visitNo);
        return result;
    }
    async getAdmission(db, columnName, searchValue, hospCode = hcode) {
        columnName = columnName === 'an' ? 'i.an' : columnName;
        columnName = columnName === 'hn' ? 'i.hn' : columnName;
        columnName = columnName === 'visitNo' ? 'q.vn' : columnName;
        columnName = columnName === 'dateadmit' ? 'i.regdate' : columnName;
        columnName = columnName === 'datedisc' ? 'i.dchdate' : columnName;
        let validRefer = columnName === 'datedisc' ? ' AND LENGTH(i.rfrilct)=5 ' : '';
        const result = db({ i: 'ipt' })
            .leftJoin({ a: 'an_stat' }, 'i.an', 'a.an')
            .leftJoin({ idx: 'iptdiag' }, 'i.an', 'idx.an')
            .leftJoin({ pt: 'patient' }, 'i.hn', 'pt.hn')
            .leftJoin({ p: 'person' }, 'p.patient_hn', 'pt.hn')
            .leftJoin({ o: 'ovst' }, 'o.vn', 'i.vn')
            .leftJoin({ q: 'ovst_seq' }, 'q.vn', 'o.vn')
            .leftJoin({ os: 'opdscreen' }, 'o.vn', 'os.vn')
            .leftJoin({ s: 'spclty' }, 'i.spclty', 's.spclty')
            .leftJoin({ p1: 'pttype' }, 'p1.pttype', 'i.pttype')
            .leftJoin({ ps: 'provis_instype' }, 'ps.code', 'p1.nhso_code')
            .leftJoin({ dt: 'dchtype' }, 'i.dchtype', 'dt.dchtype')
            .leftJoin({ ds: 'dchstts' }, 'i.dchstts', 'ds.dchstts')
            .leftJoin({ c: 'opitemrece' }, 'c.an', 'i.an')
            .leftJoin('ward', 'i.ward', 'ward.ward')
            .leftJoin('ovstist', 'ovstist.ovstist', 'i.ivstist')
            .where(columnName, '=', searchValue + validRefer)
            .select({
            HOSPCODE: db.raw('(select distinct opdconfig.hospitalcode from opdconfig)'),
            pid: 'i.hn',
            seq: 'o.vn',
            an: db.raw(`case when i.an is null then '' else i.an end`),
            datetime_admit: db.raw(`case when i.regdate is null 
                    then '' 
                    else to_char(concat(i.regdate, ' ', i.regtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') end`),
            wardadmit: db.raw(`case when s.provis_code is null then '' else s.provis_code end`),
            wardadmitname: 'ward.name',
            instype: db.raw(`case when ps.pttype_std_code is null then '' else ps.pttype_std_code end`),
            typein: db.raw(`case when ovstist.export_code is null then '1' else ovstist.export_code end`),
            referinhosp: db.raw(`case when i.rfrilct is null then '' else i.rfrilct end`),
            causein: db.raw(`case when i.rfrics is null then '' else i.rfrics end`),
            admitweight: db.raw(`case when i.bw is null then os.bw::char(5) else i.bw::char(5) end `),
            admitheight: db.raw(`case when os.height is not null then os.height::char else '' end `),
            datetime_disch: db.raw(`case when i.dchdate is null then '' else TO_CHAR( concat ( i.dchdate, ' ', i.dchtime )::TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS' ) end`),
            warddisch: 's.provis_code',
            warddischname: 'ward.name',
            dischstatus: 'ds.nhso_dchstts',
            dischtype: 'dt.nhso_dchtype',
            referouthosp: db.raw(`case when i.dchtype='04' then i.rfrolct else '' end`),
            causeout: db.raw(`case when i.dchtype='04' then (case when i.rfrocs ='7' then '5' else (case when i.rfrocs is not null then '1' else '' end) end) else '' end`),
            cost: db.raw(`round(case when sum(c.qty * c.cost) is null then 2 else sum(c.qty * c.cost) end,0)`),
            price: db.raw(`round( sum(case when a.uc_money is null then 2 else a.uc_money end),2)`),
            payprice: db.raw(`ROUND(     sum(case when      c.paidst IN ('01', '03') then   c.sum_price else 0 end ),2    )`),
            actualpay: db.raw(`round(sum( case when a.paid_money is null then 2 else a.paid_money end),2)`),
            provider: 'a.dx_doctor',
            d_update: db.raw(`TO_CHAR( max(idx.modify_datetime::timestamp), 'YYYY-MM-DD HH24:MI:SS' )`),
            drg: db.raw(`case when i.drg is null then '0' else i.drg end`),
            rw: db.raw('case when a.rw is null then 0 else a.rw end'),
            adjrw: db.raw('case when i.adjrw is null then 0 else i.adjrw end'),
            error: db.raw('case when i.grouper_err is null then 1 else i.grouper_err end'),
            warning: db.raw('case when i.grouper_warn is null then 64 else i.grouper_warn end'),
            actlos: db.raw('case when i.grouper_actlos is null then 0 else i.grouper_actlos end'),
            grouper_version: db.raw(`case when i.grouper_version is null then '5.1.3' else i.grouper_version end`),
            cid: db.raw(`case when pt.cid is null then '' else pt.cid end`)
        })
            .groupBy('i.hn', 'pt.cid', 'o.vn', 'i.an', 's.provis_code', 'ward.name', 'ps.pttype_std_code', 'ovstist.export_code', 'os.bw', 'os.height', 'ds.nhso_dchstts', 'dt.nhso_dchtype', 'a.dx_doctor', 'a.rw', 'i.adjrw', 'i.grouper_err');
        return result;
    }
    async getDiagnosisIpd(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'q.vn' : columnName;
        columnName = columnName === 'an' ? 'ipt.an' : columnName;
        const sql = `
            select 
                (select hospitalcode from opdconfig) as hospcode,
                pt.hn as pid,
                ipt.an as an,
                ifnull(date_format(concat(ipt.regdate,' ',ipt.regtime),'%Y-%m-%d %H:%i:%s'),'') as datetime_admit,
                concat('0',right(spclty.provis_code,4)) as warddiag,
                iptdiag.diagtype as diagtype,
                iptdiag.icd10 as diagcode,
                iptdiag.doctor as provider,
                ifnull(date_format(iptdiag.modify_datetime,'%Y-%m-%d %H:%i:%s'),date_format(NOW(),'%Y-%m-%d %H:%i:%s')) d_update,
                pt.cid as CID
                
            from 
                iptdiag
                left join ipt on ipt.an=iptdiag.an
                left join ovst_seq q ON q.vn = ipt.vn
                left join patient pt on pt.hn = ipt.hn
                left join person p on p.patient_hn = ipt.hn
                left outer join spclty on spclty.spclty=ipt.spclty              
            where ${columnName}='${searchNo}'
            order by ipt.an, iptdiag.diagtype`;
        const result = await db('iptdiag')
            .select({ hospcode: db.raw('(select distinct opdconfig.hospitalcode from opdconfig)'),
            pid: 'pt.hn',
            an: 'ipt.an',
            datetime_admit: db.raw(`case when to_char(concat(ipt.regdate, ' ', ipt.regtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') is null 
                    then '' 
                    else to_char(concat(ipt.regdate, ' ', ipt.regtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') end`),
            warddiag: db.raw(`concat('0',right(spclty.provis_code,4))`),
            diagtype: 'iptdiag.diagtype',
            diagcode: 'iptdiag.icd10',
            provider: 'iptdiag.doctor',
            d_update: db.raw(`TO_CHAR( max(iptdiag.modify_datetime::timestamp), 'YYYY-MM-DD HH24:MI:SS' )`),
            cid: 'pt.cid'
        })
            .leftJoin('ipt', 'ipt.an', 'iptdiag.an')
            .leftJoin({ q: 'ovst_seq' }, 'q.vn', 'ipt.vn')
            .leftJoin({ pt: 'patient' }, 'pt.hn', 'ipt.hn')
            .leftJoin({ p: 'person' }, 'p.patient_hn', 'ipt.hn')
            .leftJoin('spclty', 'spclty.spclty', 'ipt.spclty')
            .where(columnName, '=', searchNo)
            .groupBy('pt.hn', 'ipt.an', 'spclty.provis_code', 'iptdiag.diagtype', 'iptdiag.icd10', 'iptdiag.doctor', 'pt.cid')
            .orderBy('ipt.an', 'iptdiag.diagtype');
        return result;
    }
    async getProcedureIpd(db, an, hospCode = hcode) {
        const result = await db({ i: 'ipt_nurse_oper' })
            .select({
            hospcode: db.raw('(select distinct opdconfig.hospitalcode from opdconfig)'),
            pid: 'pt.hn',
            an: 'ipt.an',
            datetime_admit: db.raw(`case when to_char(concat(ipt.regdate, ' ', ipt.regtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') is null 
                    then '' 
                    else to_char(concat(ipt.regdate, ' ', ipt.regtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') end`),
            wardstay: db.raw(`concat('0',right(spclty.provis_code,4))`),
            procedcode: 'i.icd9',
            timestart: db.raw(`case when to_char(i.begin_date_time::timestamp,'YYYY-MM-DD HH24:MI:SS') is null 
             then '' 
             else to_char(i.begin_date_time::timestamp,'YYYY-MM-DD HH24:MI:SS') end`),
            timefinish: db.raw(`case when to_char(i.end_date_time::timestamp,'YYYY-MM-DD HH24:MI:SS') is null 
             then '' 
             else to_char(i.end_date_time::timestamp,'YYYY-MM-DD HH24:MI:SS') end`),
            serviceprice: db.raw(`case when i.iprice is not null then replace(to_char(i.iprice,'FM990.009'),',','') else  to_char(0,'FM990.009') end `),
            provider: 'i.doctor',
            d_update: db.raw(`case when
             ipt.dchdate  is not null 
                 or trim(ipt.dchdate::text)='' 
                 or ipt.dchdate::text  like '0000-00-00%' then
             to_char(concat(ipt.dchdate,' ',ipt.dchtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') else
             to_char(concat(ipt.regdate,' ',ipt.regtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') end `)
        })
            .leftJoin({ a: 'an_stat' }, 'a.an', 'i.an')
            .leftJoin('ipt', 'ipt.an', 'a.an')
            .leftJoin({ pt: 'patient' }, 'pt.hn', 'ipt.hn')
            .leftJoin({ p: 'person' }, 'p.patient_hn', 'ipt.hn')
            .leftJoin('spclty', 'spclty.spclty', 'ipt.spclty')
            .leftJoin({ ipc: 'ipt_oper_code' }, 'ipc.ipt_oper_code', 'i.ipt_oper_code')
            .where('ipt.an', '=', an)
            .unionAll(db({ i: 'iptoprt' })
            .select({
            hospcode: db.raw('(select distinct opdconfig.hospitalcode from opdconfig)'),
            pid: 'pt.hn',
            an: 'ipt.an',
            datetime_admit: db.raw(`case when to_char(concat(ipt.regdate, ' ', ipt.regtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') is null 
                    then '' 
                    else to_char(concat(ipt.regdate, ' ', ipt.regtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') end`),
            wardstay: db.raw(`concat('0',right(spclty.provis_code,4))`),
            procedcode: 'i.icd9',
            timestart: db.raw(`case when to_char(concat(i.opdate, ' ', i.optime)::timestamp,'YYYY-MM-DD HH24:MI:SS') is null 
             then '' 
             else to_char(concat(i.opdate, ' ', i.optime)::timestamp,'YYYY-MM-DD HH24:MI:SS') end`),
            timefinish: db.raw(`case when to_char(concat(i.enddate, ' ', i.endtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') is null 
             then '' 
             else to_char(concat(i.enddate, ' ', i.endtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') end`),
            serviceprice: db.raw(`case when i.iprice is null then to_char(0,'FM990.009') else replace(to_char(i.iprice,'FM990.009'),',','') end `),
            provider: 'i.doctor',
            d_update: db.raw(`case when
             ipt.dchdate  is not null 
                 or trim(ipt.dchdate::text)='' 
                 or ipt.dchdate::text  like '0000-00-00%' then
             to_char(concat(ipt.dchdate,' ',ipt.dchtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') else
             to_char(concat(ipt.regdate,' ',ipt.regtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') end `)
        })
            .leftJoin({ a: 'an_stat' }, 'a.an', 'i.an')
            .leftJoin('ipt', 'ipt.an', 'a.an')
            .leftJoin({ pt: 'patient' }, 'pt.hn', 'ipt.hn')
            .leftJoin({ p: 'person' }, 'p.patient_hn', 'ipt.hn')
            .leftJoin('spclty', 'spclty.spclty', 'ipt.spclty')
            .where('ipt.an', '=', an));
        return result;
    }
    async getChargeIpd(db, an, hospCode = hcode) {
        const result = await db({ o: 'opitemrece' })
            .select({
            hospcode: db.raw('(select distinct opdconfig.hospitalcode from opdconfig)'),
            pid: 'pt.hn',
            an: 'o.an',
            datetime_admit: db.raw(`case when to_char(concat(ipt.regdate, ' ', ipt.regtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') is null 
                    then '' 
                    else to_char(concat(ipt.regdate, ' ', ipt.regtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') end`),
            wardstay: db.raw(`concat('1',right(sp.provis_code,4))`),
            chargeitem: 'o.income',
            chargelist: db.raw(`case when d.charge_list_id is null or d.charge_list_id = '' then '000000' else right(concat('000000',d.charge_list_id), 6) end`),
            quantity: db.raw(`to_char(o.qty,'FM990.009')`),
            instype: db.raw(`case when psi.pttype_std_code is null or psi.pttype_std_code ='' then '9100' else psi.pttype_std_code end`),
            cost: db.raw(`to_char(o.cost,'FM990.009')`),
            price: db.raw(`to_char(o.sum_price,'FM990.009')`),
            payprice: db.raw(`to_char(0,'FM990.009')`),
            d_update: db.raw(`case when
            o.rxdate  is not null 
                 or trim(o.rxdate::text)='' 
                 or o.rxdate::text  like '0000-00-00%' then
             to_char(concat(o.rxdate,' ',o.rxtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') else
             to_char(concat(o.rxdate,' ',o.rxtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') end `)
        })
            .leftJoin({ ipt: 'ipt' }, function () { this.on('o.hn', 'ipt.hn').on('o.an', 'ipt.an'); })
            .leftJoin({ p: 'person' }, 'o.hn', 'p.patient_hn')
            .leftJoin({ sp: 'spclty' }, 'sp.spclty', 'ipt.spclty')
            .leftJoin({ psi: 'provis_instype' }, 'psi.code', 'ipt.pttype')
            .leftJoin({ pt: 'patient' }, 'pt.hn', 'ipt.hn')
            .leftJoin({ d: 'drugitems_charge_list' }, 'd.icode', 'o.icode')
            .whereNot({ 'o.an': '', 'o.unitprice': '0' })
            .whereNotNull('o.an')
            .where('ipt.an', '=', an);
        return result;
    }
    async getDrugIpd(db, an, hospCode = hcode) {
        const result = await db({ i: 'ipt' })
            .select({ HOSPCODE: db.raw('(select distinct opdconfig.hospitalcode from opdconfig)'),
            pid: `p.person_id`,
            an: db.raw(`case when  i.an is null then '' else i.an end `),
            datetime_admit: db.raw(`case when to_char(concat(i.regdate, ' ', i.regtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') is null 
                then '' 
                else to_char(concat(i.regdate, ' ', i.regtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') end`),
            wardstay: db.raw(`case when s.provis_code is null then '' else s.provis_code end `),
            typedrug: db.raw(`case when o.item_type='H' then '2' else '1' end`),
            didstd: db.raw(`case when d.did is null then '' else d.did end `),
            dname: db.raw(`case when concat(d.name,' ',d.strength) is null then '' else concat(d.name,' ',d.strength) end`),
            datestart: db.raw(`case when to_char(m.orderdate::timestamp,'YYYY-MM-DD' ) is null then '' else to_char(m.orderdate::timestamp,'YYYY-MM-DD' ) end `),
            datefinish: db.raw(`case when to_char(m.offdate::timestamp,'YYYY-MM-DD') is null then '' else to_char(m.offdate::timestamp,'YYYY-MM-DD') end `),
            amount: db.raw(`sum(case when o.qty is null then 0 else o.qty end)::decimal(12,0)`),
            unit: db.raw(`case when d.provis_medication_unit_code is null then '' else d.provis_medication_unit_code end `),
            unit_packing: `d.packqty`,
            drugprice: db.raw(`(case when d.unitprice is null then 0 else d.unitprice end)::decimal(11,2) `),
            drugcost: db.raw(`(case when (d.unitcost is null or d.unitcost=0) then (case when d.unitprice is null then 0 else d.unitprice end) else d.unitcost end)::decimal(11,2) `),
            provider: 'o.doctor',
            d_update: db.raw(`max(case when to_char(concat(o.rxdate,' ',o.rxtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') is null then '' else to_char(concat(o.rxdate,' ',o.rxtime)::timestamp,'YYYY-MM-DD HH24:MI:SS') end )`),
            cid: 'pt.cid'
        })
            .leftJoin({ a: 'an_stat' }, 'a.an', 'i.an')
            .leftJoin({ o: 'opitemrece' }, 'o.an', 'i.an')
            .leftJoin({ pt: 'patient' }, 'pt.hn', 'i.hn')
            .leftJoin({ p: 'person' }, 'p.patient_hn', 'pt.hn')
            .leftJoin({ s: 'spclty' }, 's.spclty', 'i.spclty')
            .leftJoin({ d: 'drugitems' }, 'd.icode', 'o.icode')
            .leftJoin({ m: 'medplan_ipd' }, function () {
            this
                .on('m.an', 'o.an')
                .on('m.icode', 'o.icode');
        })
            .where('i.an', '=', an)
            .whereNotNull('d.icode')
            .whereNot('o.qty', 0)
            .where('o.sum_price', '>', 0)
            .groupBy('p.person_id', 's.provis_code', 'd.did', 'd.name', 'd.strength', 'm.orderdate', "i.an", "o.icode", 'm.offdate', 'd.provis_medication_unit_code', 'd.unitprice', 'd.packqty', 'd.unitcost', 'o.doctor', 'pt.cid', db.raw(`CASE
                WHEN o.item_type = 'H' THEN
                '2' ELSE '1' 
            END`))
            .orderBy(['i.an', 'o.icode', { column: db.raw(`CASE
        WHEN o.item_type = 'H' THEN
        '2' ELSE '1' 
    END`), order: 'asc' }]);
        return result;
    }
    async getAccident(db, visitNo, hospCode = hcode) {
        const result = db({ er: 'er_regist' })
            .select({
            hospcode: db.raw('(select hospitalcode from opdconfig)'),
            hn: 'p.hn',
            pid: 'p.hn as ',
            cid: 'p.cid',
            seq: 'q.vn as seq',
            datetime_serv: db.raw("to_char(concat(o.vstdate, ' ', o.vsttime), 'YYYY-MM-DD HH24:MI:SS')"),
            datetime_ae: db.raw("to_char(concat(o.vstdate, ' ', o.vsttime), 'YYYY-MM-DD HH24:MI:SS') "),
            aetype: db.raw("coalesce(lpad(d.er_accident_type_id, 2, '0'), '')"),
            aeplace: db.raw("coalesce(lpad(d.accident_place_type_id, 2, '0'), '99') "),
            typein_ae: db.raw("coalesce(vt.export_code, '1') "),
            traffic: db.raw("coalesce(d.accident_person_type_id, '9')"),
            vehicle: db.raw("coalesce(tt.export_code, '99') "),
            alcohol: db.raw("coalesce(d.accident_alcohol_type_id, '9')"),
            nacrotic_drug: db.raw("coalesce(d.accident_drug_type_id, '9')"),
            belt: db.raw("coalesce(d.accident_belt_type_id, '9')"),
            helmet: db.raw("coalesce(d.accident_helmet_type_id, '9')  "),
            airway: db.raw("coalesce(d.accident_airway_type_id, '3')  "),
            stopbleed: db.raw("coalesce(d.accident_bleed_type_id, '3') "),
            splint: db.raw("coalesce(d.accident_splint_type_id, '3') "),
            fluid: db.raw("coalesce(d.accident_fluid_type_id, '3') "),
            urgency: db.raw("coalesce(d.er_emergency_type, '6')  "),
            coma_eye: db.raw("CASE WHEN d.gcs_e IN (1, 2, 3, 4) THEN d.gcs_e ELSE '4' END "),
            coma_speak: db.raw("CASE WHEN d.gcs_v IN (1, 2, 3, 4, 5) THEN d.gcs_v ELSE '5' END  "),
            coma_movement: db.raw("CASE WHEN d.gcs_m IN (1, 2, 3, 4, 5, 6) THEN d.gcs_m ELSE '6' END"),
            d_update: db.raw("to_char(current_timestamp, 'YYYY-MM-DD HH24:MI:SS')")
        })
            .leftJoin('ovst as o', 'er.vn', '=', 'o.vn')
            .leftJoin('er_pt_type as t', 't.er_pt_type', '=', 'er.er_pt_type')
            .leftJoin('ovst_seq as q', 'o.vn', '=', 'q.vn')
            .leftJoin('patient as pt', 'pt.hn', '=', 'o.hn')
            .leftJoin('person as p', 'p.patient_hn', '=', 'pt.hn')
            .leftJoin('er_nursing_detail as d', 'er.vn', '=', 'd.vn')
            .leftJoin('er_nursing_visit_type as vt', 'vt.visit_type', '=', 'd.visit_type')
            .leftJoin('accident_transport_type as tt', 'tt.accident_transport_type_id', '=', 'd.accident_transport_type_id')
            .where('q.vn', '=', visitNo);
        return result;
    }
    async getDrugAllergy(db, hn, hospCode = hcode) {
        return db({ oe: 'opd_allergy' })
            .leftJoin('drugitems_register as di', 'oe.agent', 'di.drugname')
            .leftJoin('patient', 'oe.hn', 'patient.hn')
            .leftJoin('person', 'oe.hn', 'person.patient_hn')
            .select(db.raw('(select distinct opdconfig.hospitalcode from opdconfig) as HOSPCODE'))
            .select('patient.hn as PID', 'patient.cid as CID', 'di.std_code as DRUGALLERGY', 'oe.agent as DNAME', 'oe.seriousness_id as ALEVE', 'oe.symptom as DETAIL', 'oe.opd_allergy_source_id as INFORMANT')
            .select(db.raw(`if(oe.report_date is null 
                    or trim(oe.report_date)=' ' 
                    or oe.report_date::TEXT like '0000-00-00%',
                    '', to_char(oe.report_date,'YYYY-MM-DD HH24:MI:SS')) as DATERECORD`))
            .select(db.raw('(select distinct opdconfig.hospitalcode from opdconfig) as INFORMHOSP'))
            .select(db.raw(`(select case when 
                    oe.allergy_relation_id in ('1','2','3','4','5') 
                then  oe.allergy_relation_id
                else  '1'  end) as TYPEDX`))
            .select(db.raw(`'' as SYMPTOM`))
            .select(db.raw(`if(oe.update_datetime is null or trim(oe.update_datetime) = '' 
                or oe.update_datetime::TEXT like '0000-00-00%', '', 
                to_char(oe.update_datetime,'YYYY-MM-DD HH24:MI:SS')) as D_UPDATE`))
            .where('oe.hn', hn);
    }
    getAppointment(db, visitNo, hospCode = hcode) {
        return db('view_opd_fu')
            .select(db.raw('select distinct opdconfig.hospitalcode from opdconfig'))
            .select('*')
            .where('vn', "=", visitNo)
            .limit(maxLimit);
    }
    async getReferHistory(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'os.vn' : columnName;
        columnName = columnName === 'vn' ? 'os.vn' : columnName;
        columnName = columnName === 'seq_id' ? 'os.seq_id' : columnName;
        columnName = columnName === 'referNo' ? 'ro.refer_number' : columnName;
        const result = db({ ro: 'referout' })
            .select({
            HOSPCODE: db.raw('(select hospitalcode from opdconfig)'),
            REFERID: 'ro.refer_number',
            REFERID_PROVINCE: db.raw(`concat((select hospitalcode from opdconfig), ro.refer_number)`),
            PID: 'pt.hn',
            cid: 'pt.cid',
            seq_id: 'os.seq_id',
            SEQ: 'os.vn',
            AN: 'o.an',
            REFERID_ORIGIN: 'o.i_refer_number',
            HOSPCODE_ORIGIN: 'o.rfrilct',
            DATETIME_SERV: db.raw(`CASE 
                      WHEN concat(o.vstdate, ' ', o.vsttime) IS NULL OR trim(concat(o.vstdate, ' ', o.vsttime)) = '' OR concat(o.vstdate, ' ', o.vsttime) LIKE '0000-00-00%' THEN ''
                      ELSE to_char(concat(o.vstdate, ' ', o.vsttime)::timestamp, 'YYYY-MM-DD HH24:MI:SS')
                    END`),
            DATETIME_ADMIT: db.raw(`CASE 
                      WHEN concat(i.regdate, ' ', i.regtime) IS NULL OR trim(concat(i.regdate, ' ', i.regtime)) = '' OR concat(i.regdate, ' ', i.regtime) LIKE '0000-00-00%' THEN ''
                      ELSE to_char(concat(i.regdate, ' ', i.regtime)::timestamp, 'YYYY-MM-DD HH24:MI:SS')
                    END`),
            DATETIME_REFER: db.raw(`CASE 
                      WHEN concat(ro.refer_date, ' ', ro.refer_time) IS NULL OR trim(concat(ro.refer_date, ' ', ro.refer_time)) = '' OR concat(ro.refer_date, ' ', ro.refer_time) LIKE '0000-00-00%' THEN ''
                      ELSE to_char(concat(ro.refer_date, ' ', ro.refer_time)::timestamp, 'YYYY-MM-DD HH24:MI:SS')
                    END `),
            CLINIC_REFER: db.raw(`CASE 
                      WHEN sp.provis_code IS NULL OR sp.provis_code = '' THEN '00100'
                      ELSE sp.provis_code
                    END`),
            HOSP_DESTINATION: 'ro.refer_hospcode ',
            CHIEFCOMP: db.raw(`concat('CC:', s.cc, ' HPI:', s.hpi, ' PMH:', s.pmh)`),
            PHYSICALEXAM: db.raw(`''`),
            DIAGFIRST: db.raw(`COALESCE(ro.pre_diagnosis, 'ไม่ระบุ')`),
            DIAGLAST: db.raw(`COALESCE(ro.pre_diagnosis, 'ไม่ระบุ')`),
            PSTATUS: db.raw(`COALESCE(ro.ptstatus_text, 'ไม่ระบุ')`),
            PTYPE: db.raw(`CASE e.er_pt_type
                      WHEN '2' THEN '2'
                      WHEN '1' THEN '3'
                      ELSE '1'
                    END`),
            EMERGENCY: db.raw(`COALESCE(e.er_emergency_level_id, '5') `),
            PTYPEDIS: db.raw(`'99'`),
            CAUSEOUT: db.raw(`CASE 
                      WHEN ro.refer_cause = '1' OR ro.refer_cause = '2' THEN ro.refer_cause
                      ELSE '1'
                    END`),
            REQUEST: 'ro.request_text',
            PROVIDER: 'ro.doctor',
            D_UPDATE: db.raw(`CASE 
                      WHEN concat(o.vstdate, ' ', o.vsttime) IS NULL OR trim(concat(o.vstdate, ' ', o.vsttime)) = '' OR concat(o.vstdate, ' ', o.vsttime) LIKE '0000-00-00%' THEN ''
                      ELSE to_char(concat(o.vstdate, ' ', o.vsttime)::timestamp, 'YYYY-MM-DD HH24:MI:SS')
                    END`)
        })
            .leftJoin('ovst as o', function () {
            this.on('o.vn', '=', 'ro.vn').orOn('o.an', '=', 'ro.vn');
        })
            .leftJoin('patient as pt', 'pt.hn', '=', 'ro.hn')
            .leftJoin('person as ps', 'ps.cid', '=', 'pt.cid')
            .leftJoin('ipt as i', 'i.an', '=', 'o.an')
            .leftJoin('ovst_seq as os', 'os.vn', '=', 'o.vn')
            .leftJoin('spclty as sp', 'sp.spclty', '=', 'ro.spclty')
            .leftJoin('opdscreen as s', 's.vn', '=', 'o.vn')
            .leftJoin('er_regist as e', 'e.vn', '=', 'o.vn')
            .where(columnName, '=', searchNo)
            .whereNot('ro.refer_hospcode', null)
            .whereNotNull('ro.refer_hospcode');
        return result;
    }
    getClinicalRefer(db, referNo, hospCode = hcode) {
        return db('view_clinical_refer')
            .select(db.raw('(select hospitalcode from opdconfig) as hospcode'))
            .select('*')
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }
    getInvestigationRefer(db, referNo, hospCode = hcode) {
        return db('view_investigation_refer')
            .select(db.raw('(select hospitalcode from opdconfig) as hospcode'))
            .select('*')
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }
    async getCareRefer(db, referNo, hospCode = hcode) {
        const result = db({ ro: 'referout' })
            .select(db.raw('(select hospitalcode from opdconfig) as hospcode'), 'ro.refer_number as referid', db.raw(`concat((select hospitalcode from opdconfig), ro.refer_number) as referid_province`), db.raw(`'' as caretype`), db.raw(`CASE 
                                    WHEN concat(ro.refer_date, ' ', ro.refer_time) IS NULL OR trim(concat(ro.refer_date, ' ', ro.refer_time)) = '' OR concat(ro.refer_date, ' ', ro.refer_time) LIKE '0000-00-00%' THEN ''
                                    ELSE to_char(concat(ro.refer_date, ' ', ro.refer_time)::timestamp, 'YYYY-MM-DD HH24:MI:SS')
                                END AS d_update`))
            .where('ro.refer_number', '=', referNo);
        return result;
    }
    getReferResult(db, visitDate, hospCode = hcode) {
        visitDate = moment(visitDate).format('YYYY-MM-DD');
        return db('referin')
            .leftJoin('patient', 'referin.hn', 'patient.hn')
            .leftJoin('ovst', 'referin.vn', 'ovst.vn')
            .leftJoin('refer_reply', 'referin.vn', 'refer_reply.vn')
            .select(db.raw(`'${hcode}' as HOSPCODE`))
            .select('referin.refer_hospcode as HOSP_SOURCE', 'patient.cid as CID_IN', 'referin.hn as PID_IN', 'referin.vn as SEQ_IN', 'referin.docno as REFERID', 'referin.refer_date as DATETIME_REFER', 'referin.icd10 as detail', 'refer_reply.diagnosis_text as reply_diagnostic', 'refer_reply.advice_text as reply_recommend')
            .select(db.raw(`case when referin.referin_number is not null then referin.referin_number else concat('${hcode}-',referin.docno) end as REFERID_SOURCE`))
            .select(db.raw(`concat(refer_reply.reply_date, ' ',refer_reply.reply_time) as reply_date`))
            .select(db.raw(`'' as AN_IN, concat(referin.refer_hospcode,referin.referin_number) as REFERID_PROVINCE`))
            .select(db.raw(`concat(ovst.vstdate, ' ',ovst.vsttime) as DATETIME_IN, '1' as REFER_RESULT`))
            .select(db.raw(`concat(ovst.vstdate, ' ',ovst.vsttime) as D_UPDATE`))
            .where(db.raw(`(referin.refer_date='${visitDate}' or referin.date_in='${visitDate}')`))
            .where(db.raw('length(referin.refer_hospcode)=5'))
            .whereNotNull('referin.vn')
            .whereNotNull('patient.hn')
            .limit(maxLimit);
    }
    async getProvider(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'licenseNo' ? 'd.code' : columnName;
        columnName = columnName === 'cid' ? 'd.cid' : columnName;
        const result = db({ d: 'doctor' })
            .select(db.raw('(select hospitalcode from opdconfig) as hospcode'), 'd.code as provider', 'd.licenseno as registerno', 'd.council_code as council', 'd.cid as cid', db.raw('COALESCE(p2.provis_pname_long_name, d.pname) as prename'), db.raw('COALESCE(p.fname, d.fname) as name'), db.raw('COALESCE(p.lname, d.lname) as lname'), 'd.sex as sex', db.raw(`CASE 
                                    WHEN p.birthday IS NULL OR trim(p.birthday) = '' OR p.birthday::TEXT LIKE '0000-00-00%' THEN ''
                                    ELSE to_char(p.birthday, 'YYYY-MM-DD')
                                END AS birth`), 'd.provider_type_code as providertype', db.raw(`CASE 
                                    WHEN d.start_date IS NULL OR trim(d.start_date) = '' OR d.start_date::TEXT LIKE '0000-00-00%' THEN ''
                                    ELSE to_char(d.start_date, 'YYYY-MM-DD')
                                END AS startdate`), db.raw(`CASE 
                                    WHEN d.finish_date IS NULL OR trim(d.finish_date) = '' OR d.finish_date::TEXT LIKE '0000-00-00%' THEN ''
                                    ELSE to_char(d.finish_date, 'YYYY-MM-DD')
                                END AS outdate`), 'd.move_from_hospcode as movefrom', 'd.move_to_hospcode as moveto', db.raw(`CASE 
                                    WHEN d.update_datetime IS NULL OR trim(d.update_datetime) = '' OR d.update_datetime::TEXT LIKE '0000-00-00%' THEN ''
                                    ELSE to_char(d.update_datetime::timestamp, 'YYYY-MM-DD HH24:MI:SS')
                                END AS d_update`))
            .leftJoin('patient as p', 'd.cid', '=', 'p.cid')
            .leftJoin('pname as pn', 'p.name', '=', 'pn.provis_code')
            .leftJoin('provis_pname as p2', 'p2.provis_pname_code', '=', 'pn.provis_code')
            .where(columnName, '=', searchNo);
        return result;
    }
    getData(db, tableName, columnName, searchNo, hospCode = hcode) {
        return db(tableName)
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
}
exports.HisHosxpv4Model = HisHosxpv4Model;
