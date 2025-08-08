"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisHosxpPcuModel = void 0;
const moment = require("moment");
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
class HisHosxpPcuModel {
    check() {
        return true;
    }
    async testConnect(db) {
        const result = await global.dbHIS('opdconfig').first();
        const hospname = result?.hospitalcode || null;
        const patient = await db('patient').select('hn').limit(1);
        return { hospname, patient };
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
            .select('ward as ward_code', 'name as ward_name', `sss_code as moph_code`)
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
    async getReferOut(db, date, hospCode = hcode, visitNo = null) {
        const filter = visitNo ? visitNo : date;
        const filterText = visitNo ? 'r.vn =?' : 'r.refer_date =?';
        const sql = `
            SELECT (SELECT hospitalcode FROM opdconfig ) AS hospcode,
                concat(r.refer_date, ' ', r.refer_time) AS refer_date,
                r.refer_number AS referid,
                case when r.refer_hospcode then r.refer_hospcode else r.hospcode end AS hosp_destination,
                r.hn AS PID, r.hn AS hn, pt.cid AS CID, r.vn, r.vn as SEQ,
                an_stat.an as AN, pt.pname AS prename,
                pt.fname AS fname,
                pt.lname AS lname,
                pt.birthday AS dob,
                pt.sex AS sex,
                r.request_text as REQUEST,
                r.pdx AS dx, r.pre_diagnosis AS DIAGFIRST,
                case when r.pmh then r.pmh else opdscreen.pmh end as PH,
                case when r.hpi then r.hpi else opdscreen.hpi end as PI,
                r.treatment_text as PHYSICALEXAM,
                r.pre_diagnosis as DISGLAST,
                IF((SELECT count(an) as cc from an_stat WHERE an =r.vn) = 1,r.vn,null) as an
            FROM
                referout r
                INNER JOIN patient pt ON pt.hn = r.hn
                left join an_stat on r.vn=an_stat.vn
                left join opdscreen on r.vn=opdscreen.vn
            WHERE
                ${filterText} and r.vn is not null and r.refer_hospcode!='' and r.refer_hospcode is not null
                and r.refer_hospcode!=?
            ORDER BY
                r.refer_date`;
        const result = await db.raw(sql, [filter, hcode]);
        return result[0];
    }
    async getPerson(db, columnName, searchText, hospCode = hcode) {
        columnName = columnName == 'hn' ? 'p.hn' : columnName;
        columnName = columnName == 'cid' ? 'p.cid' : columnName;
        columnName = columnName == 'name' ? 'p.fname' : columnName;
        columnName = columnName == 'hid' ? 'h.house_id' : columnName;
        const sql = `
        SELECT  (select hospitalcode from opdconfig) as HOSPCODE
            ,h.house_id HID
            ,p.cid as CID
            ,p.pname as PRENAME
            ,p.fname as NAME
            ,p.lname as LNAME
            ,p.hn as HN
            ,p.hn as PID
            ,p.sex as SEX
            ,p.birthday as BIRTH
            ,if(p.marrystatus in (1,2,3,4,5,6),p.marrystatus,'9') as MSTATUS
            ,if(person.person_house_position_id=1,'1','2') FSTATUS
            ,CASE WHEN o.occupation IS NULL THEN '000' ELSE o.occupation END AS OCCUPATION_OLD
            ,CASE WHEN o.nhso_code IS NULL THEN '9999' ELSE o.nhso_code END AS OCCUPATION_NEW
            ,CASE WHEN nt0.nhso_code IS NULL THEN '099' ELSE nt0.nhso_code END AS RACE
            ,CASE WHEN nt1.nhso_code IS NULL THEN '099' ELSE nt1.nhso_code END AS NATION
            ,CASE WHEN p.religion IS NULL THEN '01' ELSE p.religion END AS RELIGION
            ,if(e.provis_code is null,'9',e.provis_code) as EDUCATION
            ,p.father_cid as FATHER
            ,p.mother_cid as MOTHER
            ,p.couple_cid COUPLE
            ,(select case 
                when (select person_duty_id from person_village_duty where person_id =p.cid) in ('1','2','4','5') then '1'
                when (select person_duty_id from person_village_duty where person_id =p.cid) in ('6') then '2'
                when (select person_duty_id from person_village_duty where person_id =p.cid) in ('3') then '3'
                when (select person_duty_id from person_village_duty where person_id =p.cid) in ('10') then '4'
                when (select person_duty_id from person_village_duty where person_id =p.cid) in ('7','8','9') then '5'
                else '5' 
            end) VSTATUS
            ,person.movein_date MOVEIN
            ,CASE WHEN person.person_discharge_id THEN '9' ELSE person.person_discharge_id END AS DISCHARGE
            ,person.discharge_date DDISCHARGE
            ,case 
                when @blood='A' then '1'
                when @blood='B' then '2'
                when @blood='AB' then '3'
                when @blood='O' then '4'
                else '9' 
            end ABOGROUP
            ,p.bloodgroup_rh as RHGROUP                
            ,pl.nhso_code LABOR
            ,p.passport_no as PASSPORT
            ,p.type_area as TYPEAREA
            ,p.mobile_phone_number as MOBILE
            ,p.deathday as dead
            ,p.last_update as D_UPDATE
        from patient as p
            left join person on p.hn=person.patient_hn
            left join house h on person.house_id=h.house_id
            left join occupation o on o.occupation=p.occupation
            left join nationality nt0 on nt0.nationality=p.citizenship
            left join nationality nt1 on nt1.nationality=p.nationality
            left join provis_religion r on r.code=p.religion
            left join education e on e.education=p.educate
            left join person_labor_type pl on person.person_labor_type_id=pl.person_labor_type_id
            where ${columnName}="${searchText}"
        `;
        const result = await db.raw(sql);
        return result[0];
    }
    async getAddress(db, columnName, searchText, hospCode = hcode) {
        const sql = `
            SELECT
                (SELECT	hospitalcode FROM	opdconfig) AS hospcode,
                pt.cid,
                pt.hn, pt.hn as pid,
                IF (p.house_regist_type_id IN (1, 2),'1','2') addresstype,
                CASE WHEN h.census_id THEN '' ELSE h.census_id END AS house_id,
                IF(p.house_regist_type_id IN (4),'9',h.house_type_id) housetype,
                h.house_condo_roomno roomno,
                h.house_condo_name condo,
                IF(p.house_regist_type_id IN (4),pt.addrpart,h.address) houseno,
                '' soisub,
                '' soimain,
                IF(p.house_regist_type_id IN (4),pt.road,h.road) road,
                IF(p.house_regist_type_id IN (4),'',v.village_name)  villaname,
                IF(p.house_regist_type_id IN (4),pt.moopart,v.village_moo) village,
                IF(p.house_regist_type_id IN (4),pt.tmbpart,t.tmbpart) tambon,
                IF(p.house_regist_type_id IN (4),pt.amppart,t.amppart) ampur,
                IF(p.house_regist_type_id IN (4),pt.chwpart,t.chwpart) changwat,
                p.last_update D_Update
            FROM
                person p
                LEFT JOIN patient pt ON p.cid = pt.cid
                LEFT JOIN house h ON h.house_id = p.house_id
                LEFT JOIN village v ON v.village_id = h.village_id
                LEFT JOIN thaiaddress t ON t.addressid=v.address_id
                LEFT JOIN person_address pa ON pa.person_id = p.person_id

            where ${columnName}="${searchText}"
        `;
        const result = await db.raw(sql);
        return result[0];
    }
    async getService(db, columnName, searchText, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'os.vn' : columnName;
        columnName = columnName === 'vn' ? 'os.vn' : columnName;
        columnName = columnName === 'seq_id' ? 'os.seq_id' : columnName;
        columnName = columnName === 'hn' ? 'o.hn' : columnName;
        columnName = columnName === 'date_serv' ? 'o.vstdate' : columnName;
        const sql = `
            select 
                (select hospitalcode from opdconfig) as HOSPCODE,
                pt.hn as PID, o.hn as HN, pt.CID, os.seq_id, os.vn as SEQ,
                if(
                    o.vstdate  is null 
                        or trim(o.vstdate )='' 
                        or o.vstdate  like '0000-00-00%',
                    '',
                    date_format(o.vstdate ,'%Y-%m-%d')
                ) as DATE_SERV,
                if(
                    o.vsttime  is null 
                        or trim(o.vsttime )='' 
                        or o.vsttime like '0000-00-00%',
                    '',
                    time_format(o.vsttime,'%H%i%s')
                ) as TIME_SERV,
                if(v.village_moo <>'0' ,'1','2') as LOCATION,
                (select case  o.visit_type 
                    when 'i'  then '1' 
                    when 'o' then '2'
                    else '1' end) as INTIME,
                if(p2.pttype_std_code is null or p2.pttype_std_code ='' ,'9100',p2.pttype_std_code) as INSTYPE,
                o.hospmain as MAIN,
                (select case o.pt_subtype 
                    when '7' then '2' 
                    when '9' then '3' 
                    when '10' then '4'
                else '1' end) as TYPEIN,
                ifnull(o.rfrilct,i.rfrilct) as REFERINHOSP,
                ifnull(o.rfrics,i.rfrics) as CAUSEIN,
                concat('CC:',s.cc,' HPI:',s.hpi,' PMH:',s.pmh) as CHIEFCOMP,
                if(o.pt_subtype in('0','1'),'1','2') as SERVPLACE,
                if(s.temperature, replace(format(s.temperature,1),',',''), format(0,1))as BTEMP,
                format(s.bps,0) as SBP,
                format(s.bpd,0) as DBP,
                format(s.pulse,0) as PR,
                format(s.rr,0) as RR,
                (select case   
                    when (o.ovstost >='01' and o.ovstost <='14') then '2' 
                    when o.ovstost in ('98','99','61','62','63','00') then '1' 
                    when o.ovstost = '54' then '3' when o.ovstost = '52' then '4'
                else '7' end) as TYPEOUT,
                ifnull(o.rfrolct,i.rfrolct) as REFEROUTHOSP,
                ifnull(o.rfrocs,i.rfrocs) as CAUSEOUT,
                if(vn.inc01 + vn.inc12 , replace(format(vn.inc01 + vn.inc12,2),',',''), format(0,2))as COST,
                if(vn.item_money , replace(format(vn.item_money,2),',',''), format(0,2))as PRICE,
                if(vn.paid_money , replace(format(vn.paid_money,2),',',''), format(0,2))as PAYPRICE,
                if(vn.rcpt_money, replace(format(vn.rcpt_money,2),',',''), format(0,2))as ACTUALPAY,
                if(
                    concat(o.vstdate,' ',o.vsttime) is null 
                        or trim(concat(o.vstdate,' ',o.vsttime))='' 
                        or concat(o.vstdate,' ',o.vsttime)  like '0000-00-00%',
                    '',
                    date_format(concat(o.vstdate,' ',o.vsttime) ,'%Y-%m-%d %H:%i:%s')
                ) as D_UPDATE,
                vn.hospsub as hsub
                
            from  
                ovst o 
                left join person p on o.hn=p.patient_hn  
                left join vn_stat vn on o.vn=vn.vn and vn.hn=p.patient_hn  
                left join ipt i on i.vn=o.vn 
                left join opdscreen s on o.vn = s.vn and o.hn = s.hn 
                left join pttype p2 on p2.pttype = vn.pttype
                left join village v on v.village_id = p.village_id
                left join patient pt on pt.hn = o.hn
                left join ovst_seq os on os.vn = o.vn 
            
            where ${columnName}="${searchText}"
            `;
        const result = await db.raw(sql);
        return result[0];
    }
    async getDiagnosisOpd(db, visitNo, hospCode = hcode) {
        const sql = `
            SELECT
                (
                    SELECT
                        hospitalcode
                    FROM
                        opdconfig
                ) AS HOSPCODE,
                pt.cid CID,
                o.hn PID,
                o.hn,
                q.seq_id, q.vn SEQ, q.vn as VN,
                o.vstdate DATE_SERV,
                ifnull(odx.diagtype, '') DIAGTYPE,
                odx.icd10 DIAGCODE,
                ifnull(s.provis_code, '') CLINIC,
                d.CODE PROVIDER,
                q.update_datetime D_UPDATE
            FROM
                ovst o
            LEFT JOIN ovst_seq q ON q.vn = o.vn
            LEFT JOIN ovstdiag odx ON odx.vn = o.vn
            LEFT JOIN patient pt ON pt.hn = o.hn
            LEFT JOIN person p ON p.patient_hn = pt.hn
            LEFT JOIN spclty s ON s.spclty = o.spclty
            LEFT JOIN doctor d ON d. CODE = o.doctor
            WHERE
                q.vn = "${visitNo}"
                AND odx.icd10 REGEXP '[A-Z]'               
            `;
        const result = await db.raw(sql);
        return result[0];
    }
    async getDiagnosisOpdAccident(db, dateStart, dateEnd, hospCode = hcode) {
        if (dateStart & dateEnd) {
            return db('ovstdiag as dx')
                .whereBetween('vstdate', [dateStart, dateEnd])
                .whereRaw(`left(icd10,1) in ('V','W','X','Y')`)
                .limit(maxLimit);
        }
        else {
            throw new Error('Invalid parameters');
        }
    }
    async getProcedureOpd(db, visitNo, hospCode = hcode) {
        const sql = `
            select 
                (select hospitalcode from opdconfig) as hospcode,
                pt.hn as pid,
                os.seq_id, os.vn as seq, os.vn,
                if(o.vstdate is null or trim(o.vstdate)='' or o.vstdate like '0000-00-00%','',date_format(o.vstdate,'%Y-%m-%d')) as date_serv,
                sp.provis_code as clinic,
                h3.icd10tm as procedcode,
                if(h2 .service_price  is not null and trim(h2 .service_price )<>'', replace(format(h2 .service_price ,2),',',''), format(0,2)) as  serviceprice,
                h1.health_med_doctor_id as provider,
                if(
                    concat(o.vstdate,' ',o.vsttime) is null 
                        or trim(concat(o.vstdate,' ',o.vsttime))='' 
                        or concat(o.vstdate,' ',o.vsttime)  like '0000-00-00%',
                    '',
                    date_format(concat(o.vstdate,' ',o.vsttime) ,'%Y-%m-%d %H:%i:%s')
                ) as d_update
            from 
                health_med_service h1 
                left outer join health_med_service_operation h2 on h2.health_med_service_id = h1.health_med_service_id 
                left outer join health_med_operation_item h3 on h3.health_med_operation_item_id = h2.health_med_operation_item_id 
                left outer join health_med_organ g1 on g1.health_med_organ_id = h2.health_med_organ_id 
                left outer join health_med_operation_type t1 on t1.health_med_operation_type_id = h2.health_med_operation_type_id 
                left outer join ovst o on o.vn = h1.vn and h1.hn=o.hn
                left outer join vn_stat v on v.vn = h1.vn and h1.hn=v.hn
                left outer join person p on p.patient_hn=o.hn
                left outer join spclty sp on sp.spclty = o.spclty
                left join patient pt on pt.hn = o.hn
                left join ovst_seq os on os.vn = o.vn 
            where 
                h3.icd10tm  is not null  
                and v.cid is not null 
                and v.cid <>''
                and os.vn = "${visitNo}"
                
            union all
                
            select distinct
                (select hospitalcode from opdconfig) as hospcode,
                pt.hn as pid,
                os.seq_id, os.vn as seq, os.vn,
                if(o.vstdate is null or trim(o.vstdate)='' or o.vstdate like '0000-00-00%','',date_format(o.vstdate,'%Y-%m-%d')) as date_serv,
                sp.provis_code as clinic,
                if(e.icd10tm is null or e.icd10tm = '',e.icd9cm,e.icd10tm) as procedcode,
                if(e.price is not null and trim(e.price )<>'', replace(format(e.price ,2),',',''), format(0,2)) as  serviceprice,
                r.doctor as provider,
                if(
                    concat(o.vstdate,' ',o.vsttime) is null 
                        or trim(concat(o.vstdate,' ',o.vsttime))='' 
                        or concat(o.vstdate,' ',o.vsttime) like '0000-00-00%',
                    '',
                    date_format(concat(o.vstdate,' ',o.vsttime) ,'%Y-%m-%d %H:%i:%s')
                ) as d_update
            from 
                er_regist_oper r 
                left outer join er_oper_code e on e.er_oper_code=r.er_oper_code
                left outer join vn_stat v on v.vn=r.vn 
                left outer join ovst o on o.vn=r.vn
                left outer join person p on p.patient_hn=o.hn
                left outer join spclty sp on sp.spclty = o.spclty 
                left join patient pt on pt.hn = o.hn
                left join ovst_seq os on os.vn = o.vn 
            where 
                e.icd9cm <>'' 
                and v.cid is not null 
                and v.cid <>''
                and os.vn = "${visitNo}"
                
            union all
                
            select distinct
                (select hospitalcode from opdconfig) as hospcode,
                pt.hn as pid,
                os.seq_id, os.vn as seq, os.vn,
                if(r.vstdate is null or trim(r.vstdate)='' or r.vstdate like '0000-00-00%','',date_format(r.vstdate,'%Y-%m-%d')) as date_serv,
                sp.provis_code as clinic, 
                if(e.icd10tm_operation_code is null or e.icd10tm_operation_code= '',e.icd9cm,e.icd10tm_operation_code) as procedcode,
                if( r.fee  is not null and trim( r.fee )<>'', replace(format( r.fee ,2),',',''), format(0,2)) as  serviceprice,
                r.doctor as provider,
                if(
                    concat(o.vstdate,' ',o.vsttime) is null 
                        or trim(concat(o.vstdate,' ',o.vsttime))='' 
                        or concat(o.vstdate,' ',o.vsttime) like '0000-00-00%',
                    '',
                    date_format(concat(o.vstdate,' ',o.vsttime),'%Y-%m-%d %H:%i:%s')
                ) as d_update
            from 
                dtmain r 
                left outer join person p on p.patient_hn=r.hn
                left outer join dttm e on e.icd9cm=r.icd9
                left outer join vn_stat v on v.vn=r.vn and v.hn=r.hn
                left outer join ovst o on o.vn=r.vn and o.hn=r.hn
                left outer join spclty sp on sp.spclty = o.spclty 
                left join patient pt on pt.hn = o.hn
                left join ovst_seq os on os.vn = o.vn 
            where 
                v.cid is not null 
                and v.cid <>'' 
                and e.icd10tm_operation_code is not null
                and os.vn = "${visitNo}"
            `;
        const result = await db.raw(sql);
        return result[0];
    }
    async getChargeOpd(db, visitNo, hospCode = hcode) {
        const sql = `
            select
                (select hospitalcode from opdconfig) as hospcode,
                pt.hn as pid,
                os.seq_id, os.vn as seq, os.vn,
                if(
                    concat(ovst.vstdate) is null 
                        or trim(concat(ovst.vstdate)) = '' 
                        or concat(ovst.vstdate) like '0000-00-00%',
                    '',
                    date_format(concat(ovst.vstdate),'%Y-%m-%d')
                ) as date_serv,
                if (sp.provis_code is null or sp.provis_code ='' ,'00100',sp.provis_code ) as clinic,
                o.income as chargeitem,
                if(d.charge_list_id is null or d.charge_list_id ='' ,'0000000',right(concat('00000000',d.charge_list_id), 6)) as chargelist,
                o.qty as quantity,
                if (p2.pttype_std_code is null or p2.pttype_std_code ='' ,'9100',p2.pttype_std_code) as instype,
                format(o.cost,2) as cost,
                format(o.sum_price,2) as price,
                '0.00' as payprice,
                if(
                    concat(ovst.vstdate,' ',ovst.cur_dep_time) is null 
                        or trim(concat(ovst.vstdate,' ',ovst.cur_dep_time))='' 
                        or concat(ovst.vstdate,' ',ovst.cur_dep_time) like '0000-00-00%',
                    '',
                    date_format(concat(ovst.vstdate,' ',ovst.cur_dep_time),'%Y-%m-%d %H:%i:%s')
                ) as d_update
                
            from 
                opitemrece o  
                left join ovst on o.vn=ovst.vn
                left join person p on o.hn=p.patient_hn
                left join spclty sp on sp.spclty=ovst.spclty
                left join pttype p2 on p2.pttype = o.pttype
                left join patient pt on pt.hn = o.hn
                left join ovst_seq os on os.vn = o.vn 
                left join drugitems_charge_list d on d.icode = o.icode
                
            where 
                os.vn = "${visitNo}"
            `;
        const result = await db.raw(sql);
        return result[0];
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
    getInvestigation(db, columnName, searchNo, hospCode = hcode) {
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
            .innerJoin('ovst', 'lab_head.vn', 'ovst.vn')
            .innerJoin('patient', 'ovst.hn', 'patient.hn')
            .select(db.raw(`'${hcode}' as HOSPCODE,'LAB' as INVESTTYPE`))
            .select('lab_head.vn', 'lab_head.vn as visitno', 'lab_head.vn as SEQ', 'lab_head.hn as PID', 'patient.cid as CID', 'lab_head.lab_order_number as request_id', 'lab_order.lab_items_code as LOCALCODE', 'lab_items.tmlt_code as tmlt', 'lab_head.form_name as lab_group', 'lab_order.lab_items_name_ref as INVESTNAME', 'lab_order.lab_order_result as INVESTVALUE', 'lab_items.icode as ICDCM')
            .select(db.raw(`case when lab_order.lab_items_normal_value_ref then concat(lab_items.lab_items_unit,' (', lab_order.lab_items_normal_value_ref,')') else lab_items.lab_items_unit end  as UNIT`))
            .select(db.raw(`concat(lab_head.order_date, ' ', lab_head.order_time) as DATETIME_INVEST`))
            .select(db.raw(`concat(lab_head.report_date, ' ', lab_head.report_time) as DATETIME_REPORT`))
            .where(columnName, searchNo)
            .where(`lab_order.confirm`, 'Y')
            .whereNot(`lab_order.lab_order_result`, '')
            .whereNotNull('lab_order.lab_order_result')
            .limit(maxLimit);
    }
    getLabResult__(db, columnName, searchNo, referID = '', hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'lab.vn' : columnName;
        columnName = columnName === 'hn' ? 'ovst.hn' : columnName;
        columnName = columnName === 'cid' ? 'patient.cid' : columnName;
        return db('lab_order as o')
            .leftJoin(db.raw('lab_order_service as lab on o.lab_order_number=lab.lab_order_number and o.check_key_a=lab.lab_code'))
            .innerJoin('ovst', 'lab.vn', 'ovst.vn')
            .innerJoin('patient', 'ovst.hn', 'patient.hn')
            .select(db.raw(`'${hospCode}' as HOSPCODE`))
            .select(db.raw(`'LAB' as INVESTTYPE`))
            .select("lab.vn as visitno", "lab.vn", "lab.vn as SEQ", "ovst.hn as PID", "patient.cid as CID", "o.lab_order_number as request_id", "lab.lab_code as LOCALCODE", "lab.lab_name as lab_group", "o.lab_items_name_ref as INVESTNAME", "o.lab_order_result as INVESTRESULT", "o.lab_items_normal_value_ref as UNIT", "lab.icode as ICDCM", "o.update_datetime as DATETIME_REPORT")
            .select(db.raw("concat(ovst.vstdate,' ',ovst.vsttime) as DATETIME_INVEST"))
            .where(columnName, searchNo)
            .where(`o.confirm`, 'Y')
            .whereNot(`o.lab_order_result`, '')
            .whereRaw('!isnull(o.lab_order_result)')
            .limit(maxLimit);
    }
    async getDrugOpd(db, visitNo, hospCode = hcode) {
        const sql = `
            SELECT (select hospitalcode from opdconfig) as HOSPCODE,
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
                left join drugitems d on opi.icode=d.icode
                left join drugusage on d.drugusage=drugusage.drugusage
                left join spclty sp on o.spclty=sp.spclty
                left join person p on opi.hn=p.patient_hn 
                left join patient pt on pt.hn = o.hn
                left join ovst_seq os on os.vn = o.vn 
                
            WHERE 
                (opi.an is null or opi.an ='') 
                and opi.vn not in (select i.vn from ipt i where i.vn=opi.vn) 
                and opi.icode in (select d.icode from drugitems d) 
                and os.vn = '${visitNo}'
        `;
        const result = await db.raw(sql);
        return result[0];
    }
    async getAdmission(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'an' ? 'i.an' : columnName;
        columnName = columnName === 'hn' ? 'i.hn' : columnName;
        columnName = columnName === 'visitNo' ? 'q.vn' : columnName;
        const sql = `
            SELECT
                (select hospitalcode from opdconfig) as HOSPCODE,
                ifnull(p.person_id,'') as PID,
                q.seq_id, o.vn as SEQ,
                ifnull(i.an,'') as AN,
                ifnull(
                    date_format(
                        concat(i.regdate, ' ', i.regtime),'%Y-%m-%d %H:%i:%s'
                    ),''
                ) as DATETIME_ADMIT,
                ifnull(s.provis_code,'') wardadmit,
                ifnull(ps.pttype_std_code,'') instype,
                ifnull(
                    RIGHT (
                        (
                            SELECT export_code FROM ovstist WHERE ovstist = i.ivstist
                        ),1
                    ),'1'
                ) typein,
                ifnull(
                    i.rfrilct,
                    ''
                ) referinhosp,
                ifnull(
                    i.rfrics,
                    ''
                ) causein,
                cast(
                    IF (
                        i.bw = 0,'',
                            IF (
                                i.bw IS NOT NULL,
                                cast(i.bw / 1000 AS DECIMAL(5, 1)),
                                IF (
                                    os.bw = 0,'',
                                    ifnull(
                                        cast(os.bw AS DECIMAL(5, 1)),''
                                    )
                                )
                            )
                    ) AS CHAR (5)
                ) ddmitweight,
                IF (
                    os.height = 0,
                    '',
                    ifnull(
                        os.height,
                        ''
                    )
                ) admitheight,
                ifnull(
                    date_format(
                        concat(i.dchdate, ' ', i.dchtime),
                        '%Y-%m-%d %H:%i:%s'
                    ),''
                ) datetime_disch,
                ifnull(
                    s.provis_code,
                    ''
                ) warddisch,
                ifnull(
                    ds.nhso_dchstts,
                    ''
                ) dischstatus,
                ifnull(
                    dt.nhso_dchtype,
                    ''
                ) dischtype,            
                IF (
                    i.dchtype = 04,
                    ifnull(i.rfrolct, ''),
                    ''
                ) referouthosp,            
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
                ROUND(
                    ifnull(                    
                        sum(c.qty * c.cost),2
                    ),
                    0
                ) cost,
                ROUND(
                    ifnull(		
                        a.uc_money,
                        2
                    ),
                    2
                ) price,
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
                ROUND(
                    IFNULL(		
                        a.paid_money,
                        0
                    ),
                    2
                ) actualpay,	
                a.dx_doctor provider,
                ifnull(
                    date_format(
                    idx.modify_datetime,
                    '%Y-%m-%d %H:%i:%s'
                    ),
                    ''
                ) d_update,
                ifnull(
                    i.drg,
                    0                
                ) drg,
                ifnull(
                    a.rw,
                    0
                ) rw,                
                ifnull(
                    i.adjrw,
                    0
                ) adjrw,               
                ifnull(i.grouper_err, 1) error,
                ifnull(i.grouper_warn, 64) warning,
                ifnull(i.grouper_actlos, 0) actlos,
                ifnull(i.grouper_version, '5.1.3') grouper_version,
                ifnull(pt.cid,'') cid
            FROM
                ipt i
                LEFT JOIN an_stat a ON i.an = a.an
                LEFT JOIN iptdiag idx ON i.an = idx.an
                LEFT JOIN patient pt ON i.hn = pt.hn
                LEFT JOIN person p ON p.patient_hn = pt.hn
                LEFT JOIN ovst o ON o.vn = i.vn
                LEFT JOIN ovst_seq q ON q.vn = o.vn
                LEFT JOIN opdscreen os ON o.vn = os.vn
                LEFT JOIN spclty s ON i.spclty = s.spclty
                LEFT JOIN pttype p1 ON p1.pttype = i.pttype
                LEFT JOIN provis_instype ps ON ps. CODE = p1.nhso_code
                LEFT JOIN dchtype dt ON i.dchtype = dt.dchtype
                LEFT JOIN dchstts ds ON i.dchstts = ds.dchstts
                LEFT JOIN opitemrece c ON c.an = i.an           
            WHERE                 
                ${columnName}='${searchNo}'
            GROUP BY
                i.an
            `;
        const result = await db.raw(sql);
        return result[0];
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
            order by an, diagtype`;
        const result = await db.raw(sql);
        return result[0];
    }
    async getDiagnosisIpdAccident(db, dateStart, dateEnd, hospCode = hcode) {
        if (dateStart & dateEnd) {
            return db('iptdiag as dx')
                .innerJoin('ipt as ipd', 'dx.an', 'ipd.an')
                .whereBetween('ipd.dchdate', [dateStart, dateEnd])
                .whereRaw(`LEFT(dx.icd10,1) IN ('V','W','X','Y')`)
                .limit(maxLimit);
        }
        else {
            throw new Error('Invalid parameters');
        }
    }
    async getProcedureIpd(db, an, hospCode = hcode) {
        const sql = `
            select 
                (select hospitalcode from opdconfig) as hospcode,
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
                ipt.an="${an}"

            union all

            select
                (select hospitalcode from opdconfig) as hospcode,
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
                ipt.an="${an}"                  
            `;
        const result = await db.raw(sql);
        return result[0];
    }
    async getChargeIpd(db, an, hospCode = hcode) {
        const sql = `
            select
                (select hospitalcode from opdconfig) as hospcode,
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
                and ipt.an="${an}"                  
            `;
        const result = await db.raw(sql);
        return result[0];
    }
    async getDrugIpd(db, an, hospCode = hcode) {
        const sql = `
            select 
                (select hospitalcode from opdconfig) as HOSPCODE
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
            from ipt i
                left join an_stat a on a.an=i.an
                left join opitemrece o on o.an=i.an
                left join patient pt on pt.hn=i.hn
                left join person p on p.patient_hn=pt.hn
                left join spclty s on s.spclty=i.spclty
                left join drugitems d on d.icode=o.icode
                left join medplan_ipd m on m.an=o.an and m.icode=o.icode                    
            where                 
                i.an="${an}"       
                and d.icode is not null
                and o.qty<>0
                and o.sum_price>0
            group by i.an,o.icode,typedrug
            order by i.an,typedrug,o.icode      
            `;
        const result = await db.raw(sql);
        return result[0];
    }
    async getAccident(db, visitNo, hospCode = hcode) {
        const sql = `
            select 
                (select hospitalcode from opdconfig) as hospcode,
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
                q.vn = "${visitNo}"
            `;
        const result = await db.raw(sql);
        return result[0];
    }
    async getDrugAllergy(db, hn, hospCode = hcode) {
        return db('opd_allergy as oe')
            .leftJoin('drugitems_register as di', 'oe.agent', 'di.drugname')
            .leftJoin('patient', 'oe.hn', 'patient.hn')
            .leftJoin('person', 'oe.hn', 'person.patient_hn')
            .select(db.raw('(select distinct opdconfig.hospitalcode from opdconfig) as HOSPCODE'))
            .select('patient.hn as PID', 'patient.cid as CID', 'di.std_code as DRUGALLERGY', 'oe.agent as DNAME', 'oe.seriousness_id as ALEVE', 'oe.symptom as DETAIL', 'oe.opd_allergy_source_id as INFORMANT')
            .select(db.raw(`if(oe.report_date is null 
                    or trim(oe.report_date)=' ' 
                    or oe.report_date like '0000-00-00%',
                    '', date_format(oe.report_date,'%Y-%m-%d')) as DATERECORD`))
            .select(db.raw('(select distinct opdconfig.hospitalcode from opdconfig) as INFORMHOSP'))
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
    getAppointment(db, visitNo, hospCode = hcode) {
        return db('view_opd_fu')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('vn', "=", visitNo)
            .limit(maxLimit);
    }
    async getReferHistory(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'os.vn' : columnName;
        columnName = columnName === 'vn' ? 'os.vn' : columnName;
        columnName = columnName === 'seq_id' ? 'os.seq_id' : columnName;
        columnName = columnName === 'referNo' ? 'ro.refer_number' : columnName;
        const sql = `
            select
                (select hospitalcode from opdconfig) as HOSPCODE,
                ro.refer_number as REFERID,
                concat((select hospitalcode from opdconfig),ro.refer_number ) as REFERID_PROVINCE,
                pt.hn as PID, pt.cid,
                os.seq_id, os.vn as SEQ,
                o.an as AN,
                o.i_refer_number as REFERID_ORIGIN,
                o.rfrilct as HOSPCODE_ORIGIN,
                if(
                    concat(o.vstdate,' ', o.vsttime) is null 
                        or trim(concat(o.vstdate,' ', o.vsttime)) = '' 
                        or concat(o.vstdate,' ', o.vsttime) like '0000-00-00%',
                    '',
                    date_format(concat(o.vstdate,' ', o.vsttime),'%Y-%m-%d %H:%i:%s')
                ) as DATETIME_SERV,
                if(
                    concat(i.regdate,' ', i.regtime) is null 
                        or trim(concat(i.regdate,' ', i.regtime)) = '' 
                        or concat(i.regdate,' ', i.regtime) like '0000-00-00%',
                    '',
                    date_format(concat(i.regdate,' ', i.regtime),'%Y-%m-%d %H:%i:%s')
                ) as DATETIME_ADMIT,
                if(
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
                ) as D_UPDATE 

            from
                referout ro 
                left join patient pt on pt.hn = ro.hn 
                left join person ps on ps.cid = pt.cid 
                left join ovst o on o.vn = ro.vn or o.an=ro.vn
                left join ipt i on i.an = o.an 
                left join ovst_seq os on os.vn = o.vn
                left join spclty sp on sp.spclty = ro.spclty 
                left join opdscreen s on s.vn = o.vn 
                left join er_regist e on e.vn = o.vn 

            where
                ${columnName}='${searchNo}'
                and ro.refer_hospcode!='' and !isnull(ro.refer_hospcode)
            `;
        const result = await db.raw(sql);
        return result[0];
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
    async getCareRefer(db, referNo, hospCode = hcode) {
        const sql = `
            select 
                (select hospitalcode from opdconfig) as hospcode,
                ro.refer_number as referid,
                concat((select hospitalcode from opdconfig),ro.refer_number ) as referid_province,
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
                ro.refer_number = "${referNo}"
            `;
        const result = await db.raw(sql);
        return result[0];
    }
    getReferResult(db, visitDate, hospCode = hcode) {
        visitDate = moment(visitDate).format('YYYY-MM-DD');
        return db('referin')
            .leftJoin('patient', 'referin.hn', 'patient.hn')
            .leftJoin('ovst', 'referin.vn', 'ovst.vn')
            .leftJoin('refer_reply', 'referin.vn', 'refer_reply.vn')
            .select(db.raw(`'${hcode}' as HOSPCODE`))
            .select('referin.refer_hospcode as HOSP_SOURCE', 'patient.cid as CID_IN', 'referin.hn as PID_IN', 'referin.vn as SEQ_IN', 'referin.docno as REFERID', 'referin.refer_date as DATETIME_REFER', 'referin.icd10 as detail', 'refer_reply.diagnosis_text as reply_diagnostic', 'refer_reply.advice_text as reply_recommend')
            .select(db.raw(`case when referin.referin_number then referin.referin_number else concat('${hcode}-',referin.docno) end as REFERID_SOURCE`))
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
        const sql = `
            select 
                (select hospitalcode from opdconfig) as hospcode,
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
                ${columnName}="${searchNo}"
            `;
        const result = await db.raw(sql);
        return result[0];
    }
    getData(db, tableName, columnName, searchNo, hospCode = hcode) {
        return db(tableName)
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
}
exports.HisHosxpPcuModel = HisHosxpPcuModel;
