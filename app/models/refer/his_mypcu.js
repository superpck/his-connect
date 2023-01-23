"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisMyPcuModel = void 0;
const moment = require("moment");
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
class HisMyPcuModel {
    check() {
        return true;
    }
    getTableName(db, dbName = process.env.HIS_DB_NAME) {
        return db('information_schema.tables')
            .select('TABLE_NAME')
            .where('TABLE_SCHEMA', '=', dbName);
    }
    getReferOut(db, date, hospCode = hcode) {
        return db('m_service as service')
            .leftJoin('m_accident as accident', 'service.SEQ', 'accident.SEQ')
            .select('service.HOSPCODE', 'service.PID', 'service.SEQ')
            .select(db.raw(`concat(STR_TO_DATE(service.DATE_SERV,'%Y%m%d'),' ',STR_TO_DATE(service.TIME_SERV,'%H%i%s')) as DATETIME_SERV`))
            .select(db.raw(`concat(STR_TO_DATE(service.DATE_SERV,'%Y%m%d'),' ',STR_TO_DATE(service.TIME_SERV,'%H%i%s')) as DATETIME_REFER`))
            .select('service.REFEROUTHOSP as HOSP_DESTINATION', 'service.CAUSEOUT', 'service.SEQ as REFERID', 'service.CHIEFCOMP', 'service.PDX as DIAGLAST', 'service.REFERINHOSP as HOSPCODE_ORIGIN', 'service.ROWID as REFERID_ORIGIN')
            .select(db.raw('CONCAT(service.SEQ,service.HOSPCODE) as REFERID_PROVINCE'))
            .select(db.raw(`case when accident.URGENCY=6 then 5 else accident.URGENCY end as EMERGENCY`))
            .select(db.raw(`STR_TO_DATE(service.D_UPDATE,'%Y%m%d %H%i%s') as D_UPDATE`))
            .where('service.DATE_SERV', '=', date)
            .where('service.REFEROUTHOSP', '!=', '')
            .limit(maxLimit);
    }
    getPerson(db, columnName, searchText, hospCode = hcode) {
        columnName = columnName == 'hn' ? 'p.HN' : columnName;
        columnName = columnName == 'cid' ? 'p.CID' : columnName;
        columnName = columnName == 'name' ? 'p.NAME' : columnName;
        columnName = columnName == 'hid' ? 'h.HID' : columnName;
        return db('send_person as p')
            .select('p.HOSPCODE', 'p.CID', 'p.PID', 'p.HID', 'p.PRENAME', 'p.NAME', 'p.LNAME', 'p.HN', 'p.SEX', 'p.MSTATUS', 'p.OCCUPATION_OLD', 'p.OCCUPATION_NEW', 'p.RACE', 'p.NATION', 'p.RELIGION', 'p.EDUCATION', 'p.FSTATUS', 'p.FATHER', 'p.MOTHER', 'p.COUPLE', 'p.VSTATUS', 'p.DISCHARGE', 'p.ABOGROUP', 'p.RHGROUP', 'p.LABOR', 'p.PASSPORT', 'p.TYPEAREA')
            .select(db.raw(`STR_TO_DATE(p.BIRTH,'%Y%m%d') as BIRTH`))
            .select(db.raw(`STR_TO_DATE(p.MOVEIN,'%Y%m%d') as MOVEIN`))
            .select(db.raw(`STR_TO_DATE(p.DDISCHARGE,'%Y%m%d') as DDISCHARGE`))
            .select(db.raw(`STR_TO_DATE(p.D_UPDATE,'%Y%m%d %H%i%s') as D_UPDATE`))
            .where(columnName, searchText)
            .limit(maxLimit);
    }
    getAddress(db, columnName, searchText, hospCode = hcode) {
        columnName = columnName == 'hn' ? 'p.PID' : columnName;
        columnName = columnName == 'pid' ? 'p.PID' : columnName;
        return db('m_address as a')
            .select(`a.HOSPCODE`, `a.PID`, 'a.ADDRESSTYPE', 'a.HOUSE_ID', 'a.HOUSETYPE', 'a.ROOMNO', 'a.CONDO', 'a.HOUSENO', 'a.SOISUB', 'a.SOIMAIN', 'a.ROAD', 'a.VILLANAME', 'a.VILLAGE', 'a.TAMBON', 'a.AMPUR', 'a.CHANGWAT', 'a.TELEPHONE', 'a.MOBILE')
            .select(db.raw(`STR_TO_DATE(a.D_UPDATE,'%Y%m%d %H%i%s') as D_UPDATE`))
            .where(columnName, searchText);
    }
    getService(db, columnName, searchText, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'service.SEQ' : columnName;
        columnName = columnName === 'vn' ? 'service.SEQ' : columnName;
        columnName = columnName === 'pid' ? 'service.PID' : columnName;
        columnName = columnName === 'hn' ? 'service.PID' : columnName;
        columnName = columnName === 'date_serv' ? 'service.DATE_SERV' : columnName;
        return db('m_service')
            .select('service.HOSPCODE', 'service.PID', 'service.HN', 'service.SEQ', 'service.LOCATION', 'service.INTIME', 'service.INSTYPE', 'service.INSID', 'service.MAIN', 'service.TYPEIN', 'service.REFERINHOSP', 'service.CAUSEIN', 'service.CHIEFCOMP', 'service.FAMILYHISTORY', 'service.PRESENTILLNESS', 'service.PASTHISTORY', 'service.PHYSICALEXAM', 'service.SERVPLACE', 'service.WEIGHT', 'service.HEIGHT', 'service.BTEMP', 'service.SBP', 'service.DBP', 'service.PR', 'service.RR', 'service.TYPEOUT', 'service.REFEROUTHOSP', 'service.CAUSEOUT', 'service.COST', 'service.PRICE', 'service.PAYPRICE', 'service.ACTUALPAY', 'service.ID', 'service.SUB', 'service.HSUB', 'service.CID')
            .select(db.raw(`STR_TO_DATE(service.DATE_SERV,'%Y%m%d') as DATE_SERV`))
            .select(db.raw(`STR_TO_DATE(service.TIME_SERV,'%H%i%s') as TIME_SERV`))
            .select(db.raw(`STR_TO_DATE(service.D_UPDATE,'%Y%m%d %H%i%s') as D_UPDATE`))
            .where(columnName, searchText);
    }
    getDiagnosisOpd(db, visitNo, hospCode = hcode) {
        return db('m_diagnosis_opd')
            .where('SEQ', visitNo);
    }
    getProcedureOpd(db, visitNo, hospCode = hcode) {
        return db('m_procedure_opd')
            .where('SEQ', visitNo);
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
    getLabResult(db, columnName, searchNo, referID = '', hospCode = hcode) {
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
    getDrugOpd(db, visitNo, hospCode = hcode) {
        return db('m_drug_opd')
            .where('SEQ', visitNo);
    }
    getAdmission(db, columnName, searchNo, hospCode = hcode) {
        return [];
    }
    getDiagnosisIpd(db, columnName, searchNo, hospCode = hcode) {
        return [];
    }
    getProcedureIpd(db, an, hospCode = hcode) {
        return [];
    }
    getChargeIpd(db, an, hospCode = hcode) {
        return [];
    }
    getDrugIpd(db, an, hospCode = hcode) {
        return [];
    }
    getAccident(db, visitNo, hospCode = hcode) {
        return db('m_accident')
            .where('SEQ', visitNo);
    }
    getDrugAllergy(db, hn, hospCode = hcode) {
        return [];
    }
    getAppointment(db, visitNo, hospCode = hcode) {
        return db('m_appointment')
            .where('SEQ', visitNo);
    }
    getReferHistory(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'service.SEQ' : columnName;
        columnName = columnName === 'vn' ? 'service.SEQ' : columnName;
        columnName = columnName === 'hn' ? 'service.PID' : columnName;
        columnName = columnName === 'pid' ? 'service.PID' : columnName;
        columnName = columnName === 'referNo' ? 'service.SEQ' : columnName;
        return db('m_service as service')
            .leftJoin('m_accident as accident', 'service.SEQ', 'accident.SEQ')
            .select('service.HOSPCODE', 'service.PID', 'service.SEQ')
            .select(db.raw(`concat(STR_TO_DATE(service.DATE_SERV,'%Y%m%d'),' ',STR_TO_DATE(service.TIME_SERV,'%H%i%s')) as DATETIME_SERV`))
            .select(db.raw(`concat(STR_TO_DATE(service.DATE_SERV,'%Y%m%d'),' ',STR_TO_DATE(service.TIME_SERV,'%H%i%s')) as DATETIME_REFER`))
            .select('service.REFEROUTHOSP as HOSP_DESTINATION', 'service.CAUSEOUT', 'service.SEQ as REFERID', 'CONCAT(service.SEQ,service.HOSPCODE) as REFERID_PROVINCE', 'service.CHIEFCOMP', 'service.PDX as DIAGLAST', 'service.REFERINHOSP as HOSPCODE_ORIGIN', 'service.ROWID as REFERID_ORIGIN')
            .select(db.raw(`cause when accident.URGENCY=6 then 5 else accident.URGENCY end as EMERGENCY`))
            .select(db.raw(`STR_TO_DATE(service.D_UPDATE,'%Y%m%d %H%i%s') as D_UPDATE`))
            .where(columnName, searchNo)
            .where('service.REFEROUTHOSP', '!=', '');
    }
    getClinicalRefer(db, referNo, hospCode = hcode) {
        return [];
    }
    getInvestigationRefer(db, referNo, hospCode = hcode) {
        return [];
    }
    getCareRefer(db, referNo, hospCode = hcode) {
        return [];
    }
    getReferResult(db, visitDate, hospCode = hcode) {
        let ret = [];
        visitDate = moment(visitDate).format('YYYY-MM-DD');
        return [];
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
exports.HisMyPcuModel = HisMyPcuModel;
