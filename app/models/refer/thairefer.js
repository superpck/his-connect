"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThaiReferModel = void 0;
const maxLimit = 500;
const dbName = process.env.THAI_REFER_DB_NAME;
const dbClient = process.env.THAI_REFER_DB_CLIENT;
const hcode = process.env.HOSPCODE;
class ThaiReferModel {
    getTableName(db, dbname = dbName) {
        const whereDB = dbClient === "mssql" ? "TABLE_CATALOG" : "TABLE_SCHEMA";
        return db("information_schema.tables").where(whereDB, dbname);
    }
    person(db, columnSearch, valueSearch) {
        return db("person").where(columnSearch, valueSearch).limit(maxLimit);
    }
    referOut(db, columnSearch, valueSearch) {
        let sql = db("referout")
            .select("hcode as HOSPCODE", "refer_no as REFERID")
            .select(db.raw("concat(hcode,refer_no) as REFERID_PROVINCE"))
            .select("hn as PID", "vn as SEQ", "cid as CID", "refer_date as DATETIME_SERV", "refer_date as DATETIME_REFER", "refer_hospcode as HOSP_DESTINATION", "cc as CHIEFCOMP", 'memodiag as DIAGLAST', "ClinicGroup as CLINIC_REFER", "doctor_id as PROVIDER")
            .select(db.raw(`'Thai Refer' as refer_provider`))
            .select(db.raw("1 as referout_type"))
            .where(columnSearch, valueSearch)
            .where('cid', '3570501264213')
            .limit(maxLimit);
        sql.select("referout.*");
        return sql;
    }
    sumReferOut(db, columnSearch, valueSearch) {
        let sql = db("referout")
            .select(`hcode`)
            .count('hn as cases')
            .where(columnSearch, valueSearch)
            .groupBy(`hcode`)
            .limit(maxLimit);
        return sql;
    }
    address(db, columnSearch, valueSearch) {
        return db("address").where(columnSearch, valueSearch).limit(maxLimit);
    }
    service(db, columnSearch, valueSearch) {
        return db("service").where(columnSearch, valueSearch).limit(maxLimit);
    }
    opdDx(db, columnSearch, valueSearch) {
        return db("diagnosis_opd").where(columnSearch, valueSearch).limit(maxLimit);
    }
    opdDrug(db, columnSearch, valueSearch) {
        return db("drug_opd").where(columnSearch, valueSearch).limit(maxLimit);
    }
    admission(db, columnSearch, valueSearch) {
        return db("admission").where(columnSearch, valueSearch).limit(maxLimit);
    }
    ipdDx(db, columnSearch, valueSearch) {
        return db("diagnosis_ipd").where(columnSearch, valueSearch).limit(maxLimit);
    }
    ipdDrug(db, columnSearch, valueSearch) {
        return db("drug_ipd").where(columnSearch, valueSearch).limit(maxLimit);
    }
    check() {
        return true;
    }
    getReferOut(db, date, hospCode = hcode) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `
              select 
                  (select hospitalcode from opdconfig) as HOSPCODE,
                  refer.refer_hospcode as HOSP_DESTINATION,
                  refer.refer_date as refer_date,
                  refer.refer_number as referid,
                  refer.hn as hn,
                  pt.cid as cid,
                  os.seq_id as seq,
                  null as an,
                  pt.pname as prename,
                  pt.fname as fname,
                  pt.lname as lname,
                  pt.birthday as dob,
                  pt.sex as sex,
                  refer.pdx as dx
              from
                  referout as refer
                  left join patient pt on refer.hn = pt.hn
                  left join ovst_seq os on refer.vn = os.vn
              where 
                  refer.refer_date="${date}"
                  and os.seq_id is not null
              union
              select 
                  (select hospitalcode from opdconfig) as hospcode,
                  refer.refer_hospcode as hosp_destination,
                  refer.refer_date as refer_date,
                  refer.refer_number as referid,
                  refer.hn as hn,
                  pt.cid as cid,
                  os.seq_id as seq,
                  ipt.an as an,
                  pt.pname as prename,
                  pt.fname as fname,
                  pt.lname as lname,
                  pt.birthday as dob,
                  pt.sex as sex,
                  refer.pdx as dx
                  
              from
                  referout as refer
                  left join patient pt on refer.hn = pt.hn
                  left join ipt on refer.vn = ipt.an
                  left join ovst_seq os on ipt.vn = os.vn
              where
                  refer.refer_date="${date}"
                  and os.seq_id is not null              
          `;
            const result = yield db.raw(sql);
            return result[0];
        });
    }
    getPerson(db, columnName, searchText, hospCode = hcode) {
        return db("patient as pt")
            .leftJoin("occupation as op", "pt.occupation", "op.occupation")
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select("pt.hn", "pt.cid as cid", "pt.pname as prename", "pt.fname as fname", "pt.midname as mname", "pt.lname as lname", "pt.birthday as dob", "pt.sex", "pt.addrpart as address", "pt.moopart as moo", "pt.road as road", "addr_soi as soi", "pt.addressid as addcode", "pt.hometel as tel", "pt.po_code as zip", "op.nhso_code as occupation")
            .where(columnName, "=", searchText)
            .limit(maxLimit);
    }
    getAddress(db, columnName, searchText, hospCode = hcode) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `
              select distinct 
                  (select hospitalcode from opdconfig) as hospcode,
                  pt.hn as pid,
                  if(p.person_id = '' or p.person_id is null,'2','1') as addresstype,
                  concat(if(pt.chwpart is null or pt.chwpart = '','00',pt.chwpart),if(pt.amppart is null or pt.amppart = '','00',pt.amppart),if(pt.tmbpart is null or pt.tmbpart = '','00',pt.tmbpart),'00') as house_id,
                  (select case 
                      when (select h.house_type_id from house h where h.house_id=p.house_id) = '1' then '1'
                      when (select h.house_type_id from house h where h.house_id=p.house_id) = '7' then '2'
                      when (select h.house_type_id from house h where h.house_id=p.house_id) = '8' then '3'
                      when (select h.house_type_id from house h where h.house_id=p.house_id) = '9' then '4'
                      when (select h.house_type_id from house h where h.house_id=p.house_id) = '10' then '5'
                      when (select h.house_type_id from house h where h.house_id=p.house_id) = '11' then '8'
                      when (select h.house_type_id from house h where h.house_id=p.house_id) = '12' then '9'
                      when (select h.house_type_id from house h where h.house_id=p.house_id) in ('2','3','4','5','6') then '8'
                  else 
                      '9' 
                  end
                  ) as housetype,
                  (select ' ') as roomno,
                  (select ' ') as condo,
                  pt.addrpart as houseno,
                  pt.addr_soi as soisub,
                  (select ' ') as soimain,
                  (select case
                  when 
                      pt.road <> ''  
                  then 
                      pt.road 
                  else 
                      (select  h.road from house h where h.house_id=p.house_id) end) 
                  as road,
                  '' as villaname,
                  pt.moopart as village,
                  if(pt.tmbpart is null or pt.tmbpart = '','00',pt.tmbpart) as tambon,
                  if(pt.amppart is null or pt.amppart = '','00',pt.amppart) as ampur,
                  if(pt.chwpart is null or pt.chwpart = '','00',pt.chwpart) as changwat,
                  pt.hometel as telephone,
                  pt.informtel as mobile,
                  if(pt.last_update is null or trim(pt.last_update )='' or pt.last_update like '0000-00-00%','',date_format(pt.last_update ,'%Y-%m-%d %H:%i:%s') ) as d_update
              
              from 
                  patient pt
                  left join person p on pt.hn=p.patient_hn
  
              where ${columnName}="${searchText}"
          `;
            const result = yield db.raw(sql);
            return result[0];
        });
    }
    getService(db, columnName, searchText, hospCode = hcode) {
        return __awaiter(this, void 0, void 0, function* () {
            columnName = columnName === "visitNo" ? "os.seq_id" : columnName;
            const sql = `
              select 
                  (select hospitalcode from opdconfig) as hospcode,
                  pt.hn as pid,
                  o.hn as hn,
                  os.seq_id as seq,
                  if(
                      o.vstdate  is null 
                          or trim(o.vstdate )='' 
                          or o.vstdate  like '0000-00-00%',
                      '',
                      date_format(o.vstdate ,'%Y-%m-%d')
                  ) as date_serv,
                  if(
                      o.vsttime  is null 
                          or trim(o.vsttime )='' 
                          or o.vsttime like '0000-00-00%',
                      '',
                      time_format(o.vsttime,'%H:%i:%s')
                  ) as time_serv,
                  if(v.village_moo <>'0' ,'1','2') as location,
                  (select case  o.visit_type 
                      when 'i'  then '1' 
                      when 'o' then '2'
                      else '1' end) as intime,
                  if(p2.pttype_std_code is null or p2.pttype_std_code ='' ,'9100',p2.pttype_std_code) as instype,
                  vn.pttypeno as insid,
                  o.hospmain as main,
                  (select case o.pt_subtype 
                      when '7' then '2' 
                      when '9' then '3' 
                      when '10' then '4'
                  else '1' end) as typein,
                  refi.hospcode as referinhosp,
                  (select case o.pt_subtype
                      when '1' then '3' 
                      when '2' then '3' 
                      when '3' then '2'
                      when '5' then '2' 
                      when '6' then '3' 
                      when '7' then '4' 
                      when '8' then '5' 
                  else '1' end) as causein,
                  concat('CC:',s.cc,' HPI:',s.hpi,' PMH:',s.pmh) as chiefcomp,
                  if(o.pt_subtype in('1','2'),'1','2') as servplace,
                  if(s.temperature, replace(format(s.temperature,1),',',''), format(0,1))as btemp,
                  format(s.bps,0) as sbp,
                  format(s.bpd,0) as dbp,
                  format(s.pulse,0) as pr,
                  format(s.rr,0) as rr,
                  (select case   
                      when (o.ovstost >='01' and o.ovstost <='14') then '2' 
                      when o.ovstost in ('98','99','61','62','63','00') then '1' 
                      when o.ovstost = '54' then '3' when o.ovstost = '52' then '4'
                  else '7' end) as typeout,
                  refo.hospcode as referouthosp,
                  refo.refer_cause as causeout,
                  if(vn.inc01 + vn.inc12 , replace(format(vn.inc01 + vn.inc12,2),',',''), format(0,2))as cost,
                  if(vn.item_money , replace(format(vn.item_money,2),',',''), format(0,2))as price,
                  if(vn.paid_money , replace(format(vn.paid_money,2),',',''), format(0,2))as payprice,
                  if(vn.rcpt_money, replace(format(vn.rcpt_money,2),',',''), format(0,2))as actualpay,
                  if(
                      concat(o.vstdate,' ',o.vsttime) is null 
                          or trim(concat(o.vstdate,' ',o.vsttime))='' 
                          or concat(o.vstdate,' ',o.vsttime)  like '0000-00-00%',
                      '',
                      date_format(concat(o.vstdate,' ',o.vsttime) ,'%Y-%m-%d %H:%i:%s')
                  ) as d_update
              
              from  
                  ovst o 
                  left join person p on o.hn=p.patient_hn  
                  left join vn_stat vn on o.vn=vn.vn and vn.hn=p.patient_hn  
                  left join opdscreen s on o.vn = s.vn and o.hn = s.hn 
                  left join referin refi on o.vn=refi.vn and o.hn = refi.hn
                  left join referout refo on o.vn=refo.vn and o.hn = refo.hn
                  left join pttype p2 on p2.pttype = vn.pttype
                  left join village v on v.village_id = p.village_id
                  left join patient pt on pt.hn = o.hn
                  left join ovst_seq os on os.vn = o.vn 
              where ${columnName}="${searchText}"
              `;
            const result = yield db.raw(sql);
            return result[0];
        });
    }
    getDiagnosisOpd(db, visitNo, hospCode = hcode) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `
              select 
                  (select hospitalcode from opdconfig) as hospcode,
                  pt.hn as pid,
                  os.seq_id as seq,
                  if(
                      o.vstdate  is null 
                          or trim(o.vstdate)='' 
                          or o.vstdate  like '0000-00-00%',
                      '',
                      date_format(o.vstdate ,'%Y-%m-%d')
                  ) as date_serv,
                  og.diagtype as diagtype,
                  og.icd10 as diagcode,
                  sp.provis_code as clinic,
                  (select cid from doctor where og.doctor = 'code') as provider,
                  if(
                      pt.last_update  is null 
                          or trim(pt.last_update )='' 
                          or pt.last_update  like '0000-00-00%',
                      '',
                      date_format(pt.last_update ,'%Y-%m-%d %H:%i:%s')
                  ) as d_update
              
              from  
                  ovstdiag og
                  left join ovst o on o.vn=og.vn
                  left join patient pt on pt.hn = og.hn
                  left join person p on p.patient_hn = og.hn
                  left join spclty sp on o.spclty=sp.spclty
                  left join ovst_seq os on os.vn = o.vn 
              
              where 
                  o.vn <>'' and o.vn is not null 
                  and og.icd10 in (select code from icd101) 
                  and os.seq_id = "${visitNo}"
              `;
            const result = yield db.raw(sql);
            return result[0];
        });
    }
    getProcedureOpd(db, visitNo, hospCode = hcode) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `
              select 
                  (select hospitalcode from opdconfig) as hospcode,
                  pt.hn as pid,
                  os.seq_id as seq,
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
                  and os.seq_id = "${visitNo}"
              
              union all
              
              select distinct
                  (select hospitalcode from opdconfig) as hospcode,
                  pt.hn as pid,
                  os.seq_id as seq,
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
                  and os.seq_id = "${visitNo}"
              
              union all
              
              select distinct
                  (select hospitalcode from opdconfig) as hospcode,
                  pt.hn as pid,
                  os.seq_id as seq,
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
                  and os.seq_id = "${visitNo}"
              `;
            const result = yield db.raw(sql);
            return result[0];
        });
    }
    getChargeOpd(db, visitNo, hospCode = hcode) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `
              select
                  (select hospitalcode from opdconfig) as hospcode,
                  pt.hn as pid,
                  os.seq_id as seq,
                  if(
                      concat(ovst.vstdate) is null 
                          or trim(concat(ovst.vstdate)) = '' 
                          or concat(ovst.vstdate) like '0000-00-00%',
                      '',
                      date_format(concat(ovst.vstdate),'%Y-%m-%d')
                  ) as date_serv,
                  if (sp.provis_code is null or sp.provis_code ='' ,'00100',sp.provis_code ) as clinic,
                  o.income as chargeitem,
                  if(d.charge_list_id is null or d.charge_list_id ='' ,'000000',right(concat('000000',d.charge_list_id),6)) as chargelist,
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
                  os.seq_id = "${visitNo}"
              `;
            const result = yield db.raw(sql);
            return result[0];
        });
    }
    getLabRequest(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === "visitNo" ? "vn" : columnName;
        return db("lab_order as o")
            .leftJoin("lab_order_service as s", "o.lab_order_number", "s.lab_order_number")
            .select(db.raw(`"${hospCode}" as hospcode`))
            .select("vn as visitno", "lab.hn as hn", "lab.an as an", "lab.lab_no as request_id", "lab.lab_code as lab_code", "lab.lab_name as lab_name", "lab.loinc as loinc", "lab.icdcm as icdcm", "lab.standard as cgd", "lab.cost as cost", "lab.lab_price as price", "lab.date as request_date")
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
    getLabResult(db, columnName, searchNo, referID = "", hospCode = hcode) {
        columnName = columnName === "visitNo" ? "vn" : columnName;
        return db("lab_order as o")
            .leftJoin("lab_order_service as s", "o.lab_order_number", "s.lab_order_number")
            .select(db.raw(`"${hospCode}" as HOSPCODE`))
            .select("vn as visitno", "o.lab_order_number as INVESTCODE", "o.lab_items_code as LOCALCODE", "o.lab_items_name_ref as INVESTNAME", "o.lab_order_result as INVESTRESULT", "o.lab_items_normal_value_ref as UNIT", "o.update_datetime as DATETIME_REPORT")
            .where(columnName, "=", searchNo)
            .where("confirm", "=", "Y")
            .limit(maxLimit);
    }
    getDrugOpd(db, visitNo, hospCode = hcode) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `
              select 
                  (select hospitalcode from opdconfig) as hospcode,
                  pt.hn as pid,
                  os.seq_id as seq,
                  if(
                      opi.vstdate  is null 
                          or trim(opi.vstdate)='' 
                          or opi.vstdate  like '0000-00-00%',
                      '',
                      date_format(opi.vstdate ,'%Y-%m-%d')
                  ) as date_serv,
                  sp.provis_code as clinic,
                  d.did as didstd,
                  d.name as dname,
                  opi.qty as amount,
                  d.packqty as unit,
                  d.units  as unit_packing,
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
              
              from 
                  opitemrece opi 
                  left join ovst o on o.vn=opi.vn  and o.hn=opi.hn
                  left join drugitems d on opi.icode=d.icode
                  left join spclty sp on o.spclty=sp.spclty
                  left join person p on opi.hn=p.patient_hn 
                  left join patient pt on pt.hn = o.hn
                  left join ovst_seq os on os.vn = o.vn 
              
              where 
                  (opi.an is null or opi.an ='') 
                  and opi.vn not in (select i.vn from ipt i where i.vn=opi.vn) 
                  and opi.icode in (select d.icode from drugitems d) 
                  and os.seq_id = "${visitNo}"
              `;
            const result = yield db.raw(sql);
            return result[0];
        });
    }
    getAdmission(db, columnName, searchNo, hospCode = hcode) {
        return __awaiter(this, void 0, void 0, function* () {
            columnName = columnName === "an" ? "ipt.an" : columnName;
            columnName = columnName === "hn" ? "ipt.hn" : columnName;
            columnName = columnName === "visitNo" ? "ipt.vn" : columnName;
            const sql = `
              select 
                  (select hospitalcode from opdconfig) as hospcode,
                  pt.hn as pid,
                  os.seq_id as seq,
                  ipt.an as an,
                  if(
                      concat(ipt.regdate,' ',ipt.regtime) is null 
                          or trim(concat(ipt.regdate,' ',ipt.regtime)) = '' 
                          or concat(ipt.regdate,' ',ipt.regtime) like '0000-00-00%',
                      '',
                      date_format(concat(ipt.regdate,' ',ipt.regtime),'%Y-%m-%d %H:%i:%s')
                  ) as datetime_admit,
                  concat('1',right(spclty.provis_code,4)) as wardadmit,
                  if (ps.pttype_std_code is null or ps.pttype_std_code ='' ,'9100',ps.pttype_std_code ) as instype,
                  substr(ipt.ivstist,2,1) as typein,
                  ipt.rfrilct as referinhosp,
                  case ipt.rfrics 
                      when '1' then '2'
                      when '2' then '1'
                      when '3' then '2'
                      when '4' then '1'
                      when '5' then '2'
                      when '6' then '1'
                      when '7' then '1'
                      when '8' then '1'
                      when '9' then '1'
                      when 'a' then '5'
                      when 'b' then '5'
                      when 'c' then '3'
                      when 'd' then '3'
                  else null end  as causein,
                  if(
                      ipt.bw/1000 is not null 
                          and trim(ipt.bw/1000 )<>'', 
                      replace(format(ipt.bw/1000,1),',',''), 
                      format(0,2)
                  ) as admitweight,
                  patient.height as admitheight,
                  if(
                      concat(ipt.dchdate,' ',ipt.dchtime) is null 
                          or trim(concat(ipt.dchdate,' ',ipt.dchtime))='' 
                          or concat(ipt.dchdate,' ',ipt.dchtime)  like '0000-00-00%',
                      '',
                      date_format(concat(ipt.dchdate,' ',ipt.dchtime) ,'%Y-%m-%d %H:%i:%s')
                  ) as datetime_disch,
                  concat('1',right(s2.provis_code,4))as warddisch,
                  dc2.nhso_dchstts as dischstatus,
                  dc1.nhso_dchtype as dischtype,
                  ipt.rfrolct as referouthosp,
                  case ipt.rfrocs 
                      when '1' then '2'
                      when '2' then '1'
                      when '3' then '2'
                      when '4' then '1'
                      when '5' then '2'
                      when '6' then '1'
                      when '7' then '1'
                      when '8' then '1'
                      when '9' then '1'
                      when 'a' then '5'
                      when 'b' then '5'
                      when 'c' then '3'
                      when 'd' then '3'
                  else null end as causeout,
                  if(((aa.item_money*95)/100), replace(format(((aa.item_money*95)/100),2),',',''), format(0,2))as cost,
                  if(aa.item_money, replace(format(aa.item_money,2),',',''), format(0,2))as price,
                  if(aa.item_money-aa.uc_money , replace(format(aa.item_money-aa.uc_money,2),',',''), format(0,2))as payprice,
                  if(aa.paid_money , replace(format(aa.paid_money,2),',',''), format(0,2))as actualpay,
                  ipt.admdoctor as provider,
                  if(
                      ipt.dchdate is not null 
                          or ipt.dchdate <> ' ',
                      if(
                          concat(ipt.dchdate,' ',ipt.dchtime) is null 
                              or trim(concat(ipt.dchdate,' ',ipt.dchtime)) = '' 
                              or concat(ipt.dchdate,' ',ipt.dchtime) like '0000-00-00%',
                          '',
                          date_format(concat(ipt.dchdate,' ',ipt.dchtime),'%Y-%m-%d %H:%i:%s')),
                      if(
                          concat(ipt.regdate,' ',ipt.regtime) is null 
                              or trim(concat(ipt.regdate,' ',ipt.regtime)) = '' 
                              or concat(ipt.regdate,' ',ipt.regtime) like '0000-00-00%',
                          '',
                          date_format(concat(ipt.regdate,' ',ipt.regtime),'%Y-%m-%d %H:%i:%s'))
                  ) as d_update
              
              from 
                  ipt  
                  left join spclty on spclty.spclty=ipt.spclty  
                  left join spclty s2 on s2.spclty=ipt.ipt_spclty
                  left join iptadm on iptadm.an=ipt.an  
                  left join patient on patient.hn=ipt.hn  
                  left join doctor dt on dt.code = ipt.admdoctor  
                  left join roomno on roomno.roomno=iptadm.roomno  
                  left join iptdiag on iptdiag.an=ipt.an and iptdiag.hn=ipt.hn  
                  left join icd101 i1 on i1.code=substring(iptdiag.icd10,1,3)  
                  left join an_stat aa on aa.an=ipt.an  and aa.hn=ipt.hn
                  left join ward w on w.ward = ipt.ward  
                  left join dchtype dc1 on dc1.dchtype = ipt.dchtype  
                  left join dchstts dc2 on dc2.dchstts = ipt.dchstts  
                  left join ipt_finance_status fs on fs.an = ipt.an  
                  left join finance_status ft on ft.finance_status = fs.finance_status  
                  left join doctor di on di.code = ipt.incharge_doctor  
                  left join pttype ptt on ptt.pttype=ipt.pttype  
                  left join provis_instype ps on ps.code = ptt.nhso_code
                  left join person p on p.patient_hn = ipt.hn and patient.cid=p.cid
                  left join ovst o on o.vn = ipt.vn
                  left join patient pt on pt.hn = ipt.hn
                  left join ovst_seq os on os.vn = ipt.vn 
              
              where 
                  (ipt.an is not null or ipt.an <> '') 
                  and ${columnName}="${searchNo}"
              `;
            const result = yield db.raw(sql);
            return result[0];
        });
    }
    getDiagnosisIpd(db, an, hospCode = hcode) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `
              select 
                  (select hospitalcode from opdconfig) as hospcode,
                  pt.hn as pid,
                  if(
                      concat(ipt.regdate,' ',ipt.regtime) is null 
                          or trim(concat(ipt.regdate,' ',ipt.regtime)) = '' 
                          or concat(ipt.regdate,' ',ipt.regtime) like '0000-00-00%',
                      '',
                      date_format(concat(ipt.regdate,' ',ipt.regtime),'%Y-%m-%d %H:%i:%s')
                  ) as datetime_admit,
                  concat('0',right(spclty.provis_code,4)) as warddiag,
                  iptdiag.diagtype as diagtype,
                  iptdiag.icd10 as diagcode,
                  iptdiag.doctor as provider,
                  iptdiag.modify_datetime as d_update
              
              from 
                  iptdiag
                  left join ipt on ipt.an=iptdiag.an
                  left join patient pt on pt.hn = ipt.hn
                  left join person p on p.patient_hn = ipt.hn
                  left outer join spclty on spclty.spclty=ipt.spclty              
              where 
                  ipt.an="${an}"
              `;
            const result = yield db.raw(sql);
            return result[0];
        });
    }
    getProcedureIpd(db, an, hospCode = hcode) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const result = yield db.raw(sql);
            return result[0];
        });
    }
    getChargeIpd(db, an, hospCode = hcode) {
        return __awaiter(this, void 0, void 0, function* () {
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
                  if(d.charge_list_id is null or d.charge_list_id = '' ,'000000',right(concat('000000',d.charge_list_id),6)) as chargelist,
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
            const result = yield db.raw(sql);
            return result[0];
        });
    }
    getDrugIpd(db, an, hospCode = hcode) {
        return __awaiter(this, void 0, void 0, function* () {
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
                  (select case 
                  when opi.item_type = ' h' then '2'
                  else '1' end) as typedrug,
                  d.did as didstd,
                  d.name as dname,
                  min(opi.rxdate) as datestart,
                  max(opi.rxdate) as datefinish,
                  sum(opi.qty) as amount,
                  d.provis_medication_unit_code as unit,
                  d.packqty as unit_packing,
                  format(opi.unitprice,2) as drugprice,
                  format(d.unitcost,2) as drugcost,
                  opi.doctor as provider,
                  date_format(max(concat(opi.rxdate,' ',opi.rxtime)),'%Y-%m-%d %H:%i:%s') as d_update
              
              from 
                  opitemrece opi 
                  left outer join ipt on opi.hn=ipt.hn and opi.an=ipt.an
                  left outer join drugitems d on d.icode=opi.icode
                  left join patient pt on pt.hn = ipt.hn
                  left join person p on p.patient_hn = ipt.hn
                  left outer join spclty on spclty.spclty=ipt.spclty  
              
              where 
                  d.icode is not null
                  and ipt.an="${an}"       
              group by d.name           
              `;
            const result = yield db.raw(sql);
            return result[0];
        });
    }
    getAccident(db, visitNo, hospCode = hcode) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `
              select 
                  (select hospitalcode from opdconfig) as hospcode,
                  pt.hn as pid,
                  os.seq_id as seq,
                  if(er.enter_er_time is null or trim(er.enter_er_time)='' or er.enter_er_time like '0000-00-00%','',date_format(er.enter_er_time,'%Y-%m-%d %H:%i:%s')) as datetime_serv,
                  if(er.enter_er_time is null or trim(er.enter_er_time)='' or er.enter_er_time like '0000-00-00%','',date_format(er.enter_er_time,'%Y-%m-%d %H:%i:%s')) as datetime_ae,
                  case length(r.er_accident_type_id )
                      when 1 
                          then concat('0',r.er_accident_type_id)
                      else 
                          r.er_accident_type_id 
                      end 
                  as aetype,
                  ifnull(r.accident_place_type_id,'99') as aeplace,
                  ifnull(r.visit_type,'9') as typein_ae,
                  ifnull(r.accident_person_type_id,'9') as traffic,
                  ifnull(r.accident_transport_type_id,'99') as  vehicle,
                  ifnull(r.accident_alcohol_type_id,'9') as alcohol,
                  ifnull(r.accident_drug_type_id,'9') as nacrotic_drug,
                  ifnull(r.accident_belt_type_id,'9') as belt,
                  ifnull(r.accident_helmet_type_id,'9') as helmet,
                  r.accident_airway_type_id  as airway,
                  r.accident_bleed_type_id as stopbleed,
                  r.accident_splint_type_id as splint,
                  r.accident_fluid_type_id as fluid,
                  (select case r.er_emergency_type
                      when  '1' then  '2'
                      when  '2' then  '3'
                      when  '3' then  '4'
                      when  '4' then  '5'
                  else 
                      '6' 
                  end 
                  ) as urgency,
                  r.gcs_e as coma_eye,
                  r.gcs_v as coma_speak,
                  r.gcs_m as coma_movement,
                  if(
                      er.finish_time is null or trim(er.finish_time)='' 
                          or er.finish_time like '0000-00-00%',
                      '',
                      date_format(er.finish_time,'%Y-%m-%d %H:%i:%s')
                  ) as d_update
              
              from 
                  er_nursing_detail r  
                  left join ovst o on o.vn=r.vn 
                  left join patient pt on o.hn = pt.hn 
                  left join person p on o.hn = p.patient_hn 
                  left join er_regist er on r.vn =er.vn and o.vn=er.vn
                  left join ovst_seq os on os.vn =er.vn
              
              where                 
                  os.seq_id = "${visitNo}"
              `;
            const result = yield db.raw(sql);
            return result[0];
        });
    }
    getDrugAllergy(db, hn, hospCode = hcode) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `
              select 
                  (select hospitalcode from opdconfig) as hospcode,
                  pt.hn as pid,
                  if(
                      oe.report_date is null 
                          or trim(oe.report_date)=' ' 
                          or oe.report_date like '0000-00-00%',
                          '',
                          date_format(oe.report_date,'%Y-%m-%d')
                  ) as daterecord,
                  di.std_code  as drugallergy,
                  oe.agent as dname,
                  (select case
                      when 
                          oe.allergy_relation_id in ('1','2','3','4','5') 
                      then 
                          oe.allergy_relation_id
                      else 
                          '1' 
                      end
                  ) as typedx,
                  oe.seriousness_id as alevel,
                  '' as symptom,
                  '' as informant,
                  (select distinct opdconfig.hospitalcode from opdconfig) as informhosp,
                  if(
                      oe.update_datetime is null 
                          or trim(oe.update_datetime) = '' 
                          or oe.update_datetime like '0000-00-00%', 
                      '', 
                      date_format(oe.update_datetime,'%Y-%m-%d %H:%i:%s')
                  ) as d_update
              
              from 
                  opd_allergy  oe
                  left join drugitems_register di on oe.agent=di.drugname
                  left join patient pt on oe.hn=pt.hn
                  left join person p on oe.hn=p.patient_hn
              
              where                 
                  oe.hn = "${hn}"
              `;
            const result = yield db.raw(sql);
            return result[0];
        });
    }
    getAppointment(db, visitNo, hospCode = hcode) {
        return db("view_opd_fu")
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select("view_opd_fu.*")
            .where("vn", "=", visitNo)
            .limit(maxLimit);
    }
    getReferHistory(db, columnName, searchNo, hospCode = hcode) {
        return __awaiter(this, void 0, void 0, function* () {
            columnName = columnName === "visitNo" ? "os.seq_id" : columnName;
            columnName = columnName === "referNo" ? "ro.refer_number" : columnName;
            const sql = `
              select
                  (select hospitalcode from opdconfig) as hospcode,
                  ro.refer_number as referid,
                  '' as referid_province,
                  pt.hn as pid,
                  os.seq_id as seq,
                  '' as an,
                  '' as referid_origin,
                  '' as hospcode_origin,
                  if(
                      concat(o.vstdate, ' ', o.vsttime) is null 
                          or trim(concat(o.vstdate, ' ', o.vsttime)) = '' 
                          or concat(o.vstdate, ' ', o.vsttime) like '0000-00-00%',
                      '',
                      date_format(concat(o.vstdate, ' ', o.vsttime),'%Y-%m-%d %H:%i:%s')
                  ) as datetime_serv,
                  '' as datetime_admit,
                  if(
                      concat(ro.refer_date, ' ', ro.refer_time) is null 
                          or trim(concat(ro.refer_date, ' ', ro.refer_time)) = '' 
                          or concat(ro.refer_date, ' ', ro.refer_time) like '0000-00-00%',
                      '',
                      date_format(concat(ro.refer_date, ' ', ro.refer_time),'%Y-%m-%d %H:%i:%s')
                  ) as datetime_refer,
                  if (
                      sp.provis_code is null 
                          or sp.provis_code = '',
                      '00100',
                      sp.provis_code
                  ) as clinic_refer,
                  ro.refer_hospcode as hosp_destination,
                  concat('CC:',s.cc,' HPI:',s.hpi,' PMH:',s.pmh) as chiefcomp,
                  '' as physicalexam,
                  ifnull(ro.pre_diagnosis,'ไม่ระบุ') as diagfirst,
                  ifnull(ro.pre_diagnosis,'ไม่ระบุ') as diaglast,
                  ifnull(ro.ptstatus_text,'ไม่ระบุ') as pstatus,
                  (select case e.er_pt_type 
                      when '2' then '2' 
                      when '1' then '3' 
                  else 
                      '1' 
                  end
                  ) as ptype,
                  ifnull(e.er_emergency_level_id,'5') as emergency,
                  '' as ptypedis,
                  if(
                      ro.refer_cause = '1' 
                          or ro.refer_cause = '2' ,
                      ro.refer_cause,
                      '1'
                  ) as causeout,
                  '' as request,
                  ro.doctor as provider,
                  if(
                      concat(o.vstdate, ' ', o.vsttime) is null 
                          or trim(concat(o.vstdate, ' ', o.vsttime)) = '' 
                          or concat(o.vstdate, ' ', o.vsttime) like '0000-00-00%',
                      '',
                      date_format(concat(o.vstdate, ' ', o.vsttime),'%Y-%m-%d %H:%i:%s')
                  ) as d_update 
  
              from
                  referout ro 
                  left join patient pt on pt.hn = ro.hn 
                  left join person ps on ps.patient_hn = ro.hn 
                  left join ovst_seq os on os.vn = ro.vn 
                  left join ovst o on o.vn = ro.vn 
                  left join spclty sp on sp.spclty = ro.spclty 
                  left join opdscreen s on s.vn = ro.vn 
                  left join er_regist e on e.vn = ro.vn 
  
              where 
                  ${columnName}="${searchNo}"
              `;
            const result = yield db.raw(sql);
            return result[0];
        });
    }
    getClinicalRefer(db, referNo, hospCode = hcode) {
        return db("view_clinical_refer")
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select("view_clinical_refer.*")
            .where("refer_no", "=", referNo)
            .limit(maxLimit);
    }
    getInvestigationRefer(db, referNo, hospCode = hcode) {
        return db("view_investigation_refer")
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select("view_investigation_refer.*")
            .where("refer_no", "=", referNo)
            .limit(maxLimit);
    }
    getCareRefer(db, referNo, hospCode = hcode) {
        return __awaiter(this, void 0, void 0, function* () {
            const sql = `
              select 
                  (select hospitalcode from opdconfig) as hospcode,
                  ro.refer_number as referid,
                  '' as referid_province,
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
            const result = yield db.raw(sql);
            return result[0];
        });
    }
    getReferResult(db, hospDestination, referNo, hospCode = hcode) {
        return [];
    }
    getProvider(db, columnName, searchNo, hospCode = hcode) {
        return __awaiter(this, void 0, void 0, function* () {
            columnName = columnName === "licenseNo" ? "d.code" : columnName;
            columnName = columnName === "cid" ? "d.cid" : columnName;
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
            const result = yield db.raw(sql);
            return result[0];
        });
    }
    getData(db, tableName, columnName, searchNo, hospCode = hcode) {
        return db(tableName)
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select(tableName + ".*")
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
}
exports.ThaiReferModel = ThaiReferModel;
