"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisEzhospModel = void 0;
const moment = require("moment");
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
const dbName = process.env.HIS_DB_NAME;
const dbClient = process.env.HIS_DB_CLIENT;
class HisEzhospModel {
    check() {
        return true;
    }
    getTableName(db, dbname = dbName) {
        const whereDB = dbClient === 'mssql' ? 'TABLE_CATALOG' : 'TABLE_SCHEMA';
        return db('information_schema.tables')
            .where(whereDB, dbname);
    }
    getDepartment(db, depCode = '', depName = '') {
        let sql = db('lib_clinic');
        if (depCode) {
            sql.where('code', depCode);
        }
        else if (depName) {
            sql.whereLike('clinic', `%${depName}%`);
        }
        else {
            sql.where('isactive', 1);
        }
        return sql
            .select('code as department_code', 'clinic as department_name', 'standard as moph_code')
            .select(db.raw(`if(type='ER',1,0) as emergency`))
            .orderBy('clinic')
            .limit(maxLimit);
    }
    getWard(db, wardCode = '', wardName = '') {
        let sql = db('lib_ward');
        if (wardCode) {
            sql.where('code', wardCode);
        }
        else if (wardName) {
            sql.whereLike('ward', `%${wardName}%`);
        }
        else {
            sql.where('isactive', 1);
        }
        return sql
            .select('code as ward_code', 'ward as ward_name', 'standard as moph_code')
            .limit(maxLimit);
    }
    getDr(db, drCode = '', drName = '') {
        let sql = db('lib_dr');
        if (drCode) {
            sql.where('code', drCode);
        }
        else if (drName) {
            sql.whereLike('fname', `%${drName}%`);
        }
        return sql
            .select('code as dr_code', 'code as dr_license_code')
            .select(db.raw('concat(title,fname," ",lname) as dr_name'))
            .select('expire as expire_date')
            .limit(maxLimit);
    }
    async getPerson1(db, columnName, searchText) {
        const sql = `
            select xxx from xxx
            where ${columnName}="${searchText}"
            order by mmm `;
        const result = await db.raw(sql);
        return result[0];
    }
    getReferOut(db, date, hospCode = hcode) {
        return db('hospdata.refer_out as refer')
            .leftJoin('hospdata.opd_visit as visit', 'refer.vn', 'visit.vn')
            .leftJoin('hospdata.patient as pt', 'visit.hn', 'pt.hn')
            .leftJoin('hospdata.opd_vs as vs', 'refer.vn', 'vs.vn')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select(db.raw('concat(refer_date, " " , refer_time) as refer_date'))
            .select('refer.refer_no as referid', 'refer.refer_hcode as hosp_destination', 'visit.hn', 'pt.no_card as cid', 'refer.vn as seq', 'refer.an', 'pt.title as prename', 'pt.name as fname', 'pt.surname as lname', 'pt.birth as dob', 'pt.sex', 'refer.icd10 as dx', 'vs.pi as PI')
            .select(db.raw('case when isnull(refer.history_ill) OR refer.history_ill="" then vs.nurse_ph else refer.history_ill end as PH'))
            .select(db.raw('case when isnull(refer.history_exam) or refer.history_exam="" then vs.pe else refer.history_exam end as PE'))
            .select(db.raw('case when isnull(refer.current_ill)or refer.current_ill="" then vs.cc else refer.current_ill end as CHIEFCOMP'))
            .where('refer.hcode', hospCode)
            .whereRaw(`(refer.refer_date="${date}" OR refer.lastupdate BETWEEN "${date} 00:00:00" and "${date} 23:59:59")`)
            .orderBy('refer.refer_date')
            .limit(maxLimit);
    }
    getPerson(db, columnName, searchText, hospCode = hcode) {
        columnName = columnName === 'cid' ? 'no_card' : columnName;
        return db('hospdata.view_patient')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select(db.raw('4 as typearea'))
            .select('no_card as cid', 'hn as pid', 'title as prename', 'name', 'name as fname', 'surname as lname', 'hn', 'birth', 'sex', 'marry_std as mstatus', 'blood as abogroup', 'occ_std as occupation_new', 'race_std as race', 'nation_std as nation', 'religion_std as religion', 'edu_std as education', 'tel as telephone', 'lastupdate as d_update')
            .where(columnName, "=", searchText)
            .limit(maxLimit);
    }
    getAddress(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'cid' ? 'CID' : columnName;
        return db('view_address_hdc')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select(`PID`, `ADDRESSTYPE`, `HOUSE_ID`, `HOUSETYPE`, `ROOMNO`, `CONDO`, `HOUSENO`, `SOISUB`, `SOIMAIN`, `ROAD`, `VILLANAME`, `VILLAGE`, `TAMBON`, `AMPUR`, `CHANGWAT`, `TELEPHONE`, `MOBILE`, `D_UPDATE`)
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
    getService(db, columnName, searchText, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'vn' : columnName;
        columnName = columnName === 'date_serv' ? 'visit.date' : columnName;
        return db('view_opd_visit as visit')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('hn as pid', 'hn', 'vn as seq', 'date as date_serv', 'hospmain as main', 'hospsub as hsub', 'refer as referinhosp')
            .select(db.raw(' case when time="" or time="08:00" then time_opd else time end as time_serv '))
            .select(db.raw('"1" as servplace'))
            .select('t as btemp', 'bp as sbp', 'bp1 as dbp', 'puls as pr', 'rr', 'no_card as cid', 'pttype_std as instype', 'no_ptt as insid')
            .select(db.raw('concat(date, " " , time) as d_update'))
            .where(columnName, searchText)
            .orderBy('date', 'desc')
            .limit(maxLimit);
    }
    getDiagnosisOpd(db, visitno, hospCode = hcode) {
        return db('view_opd_dx_hdc as dx')
            .select('dx.*')
            .select(db.raw('"' + hcode + '" as HOSPCODE'))
            .select(db.raw(' "IT" as codeset'))
            .select(db.raw(`case when substr(dx.DIAGCODE,1,1) in ('V','W','X','Y') then 4 else dx.DIAGTYPE end as dxtype`))
            .where('SEQ', visitno)
            .orderBy('dxtype')
            .orderBy('dx.D_UPDATE')
            .limit(maxLimit);
    }
    getProcedureOpd(db, visitno, hospCode = hcode) {
        return db('view_opd_op')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('vn as visitno', 'date', 'hn', 'op as op_code', 'op as procedcode', 'desc as procedname', 'icd_9 as icdcm', 'dr as provider', 'clinic_std as clinic', 'price as serviceprice')
            .select(db.raw('concat(date," ",time_in) as date_serv'))
            .select(db.raw('concat(date," ",time_in) as d_update'))
            .where('vn', "=", visitno)
            .limit(maxLimit);
    }
    getChargeOpd(db, visitNo, hospCode = hcode) {
        return db('view_opd_charge_item')
            .select('*')
            .select(db.raw('"' + hcode + '" as hospcode'))
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
    getLabResult(db, columnName, searchNo, referID = '', hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'result.vn' : columnName;
        columnName = columnName === 'pid' ? 'result.hn' : columnName;
        columnName = columnName === 'cid' ? 'result.no_card' : columnName;
        return db('hospdata.view_lab_result as result')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select(db.raw('"' + hcode + referID + '" as REFERID'))
            .select(db.raw('"' + referID + '" as REFERID_PROVINCE'))
            .select(db.raw('"LAB" as INVESTTYPE'))
            .select(db.raw('CONCAT(result.date," ",result.time) as DATETIME_INVEST'))
            .select('result.hn as PID', 'result.vn as SEQ', 'result.cid as CID', 'an as AN', 'result.type_result as LH', 'result.lab_code as LOCALCODE', 'result.icdcm as INVESTCODE', 'result.lab_name as INVESTNAME', 'result.result as INVESTVALUE', 'result.unit as UNIT', 'result.result_text as INVESTRESULT', 'result.minresult as NORMAL_MIN', 'result.maxresult as NORMAL_MAX', 'result.date_result as DATETIME_REPORT')
            .select(db.raw('CONCAT(result.date," ",result.time) as D_UPDATE'))
            .where(columnName, "=", searchNo)
            .whereNotIn('result.lab_code', ['03098', '02066', '03155'])
            .whereRaw('result.lab_code NOT LIKE "03037%" AND result.lab_name NOT LIKE "HIV%"  AND result.result NOT LIKE "%ส่งตรวจภายนอก%" ')
            .limit(maxLimit);
    }
    getInvestigation(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'result.vn' : columnName;
        columnName = columnName === 'pid' ? 'result.hn' : columnName;
        columnName = columnName === 'cid' ? 'result.no_card' : columnName;
        return db('hospdata.view_lab_result as result')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select(db.raw('"LAB" as INVESTTYPE'))
            .select(db.raw('CONCAT(result.date," ",result.time) as DATETIME_INVEST'))
            .select('result.hn as PID', 'result.vn as SEQ', 'result.pid as CID', 'an as AN', 'result.type_result as LH', 'result.lab_code as LOCALCODE', 'result.icdcm as INVESTCODE', 'result.lab_name as INVESTNAME', 'result.result as INVESTVALUE', 'result.unit as UNIT', 'result.result_text as INVESTRESULT', 'result.minresult as NORMAL_MIN', 'result.maxresult as NORMAL_MAX', 'result.date_result as DATETIME_REPORT')
            .select(db.raw('CONCAT(result.date," ",result.time) as D_UPDATE'))
            .where(columnName, "=", searchNo)
            .whereNotIn('result.lab_code', ['03098', '02066', '03155'])
            .whereRaw('result.lab_code NOT LIKE "03037%" AND result.lab_code NOT LIKE "HIV%"')
            .limit(maxLimit);
    }
    async getDrugOpd(db, visitNo, hospCode = hcode) {
        const sql = `
            SELECT '${hospCode}' as hospcode, drug.hn as pid, drug.vn as seq
                , concat(visit.date,' ',visit.time) as date_serv
                , visit.clinic, std.stdcode as didstd, drug.drugname as dname
                , drug.no as amount, drug.unit, drug.price as drugprice
                , concat('ว',visit.dr) as provider
                , now() as d_update, patient.no_card as cid
                , concat(drug.methodname, ' ' , drug.no_use, ' ', drug.unit_use, ' ',drug.freqname, ' ', timesname) as drug_usage
                , drug.caution
                FROM view_pharmacy_opd_drug_item as drug
                    LEFT JOIN opd_visit as visit on drug.vn=visit.vn
                    LEFT JOIN patient on drug.hn=patient.hn
                    LEFT JOIN pharmacy_inventory_stdcode as std on drug.drugcode=std.drugcode and 
                    std.code_group='OPD' and std.type='CODE24' and (isnull(std.expire) or std.expire='0000-00-00')
                WHERE drug.vn='${visitNo}'
                limit 1000`;
        const result = await db.raw(sql);
        return result[0];
    }
    getAdmission(db, columnName, searchValue, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'ipd.vn' : columnName;
        columnName = columnName === 'dateadmit' ? 'ipd.admite' : columnName;
        columnName = columnName === 'datedisc' ? 'ipd.disc' : columnName;
        return db('view_ipd_ipd as ipd')
            .select(db.raw('"' + hcode + '" as HOSPCODE'))
            .select('ipd.hn as PID', 'ipd.vn as SEQ', 'ipd.an AS AN', 'ipd.hn')
            .select(db.raw('concat(ipd.admite, " " , ipd.time) as DATETIME_ADMIT'))
            .select('ipd.ward_std as WARDADMIT', 'ipd.ward_name as WARDADMITNAME', 'ipd.ward as WARD_LOCAL', 'ipd.pttype_std2 as INSTYPE')
            .select(db.raw('case when ipd.refer="" then 1 else 3 end as TYPEIN '))
            .select('ipd.refer as REFERINHOSP')
            .select(db.raw('1 as CAUSEIN'))
            .select('ipd.weight as ADMITWEIGHT', 'ipd.height as ADMITHEIGHT')
            .select(db.raw('concat(ipd.disc, " " , ipd.timedisc) as DATETIME_DISCH'))
            .select('ipd.ward_std as WARDDISCH', 'ipd.dischstatus as DISCHSTATUS', 'ipd.dischtype as DISCHTYPE', 'ipd.price', 'ipd.paid as PAYPRICE')
            .select(db.raw('case when ipd.disc then ipd.ward_name else "" end as WARDDISCHNAME'))
            .select(db.raw('0 as ACTUALPAY'))
            .select('ipd.dr_disc as PROVIDER')
            .select(db.raw('concat(ipd.disc, " " , ipd.timedisc) as D_UPDATE'))
            .select('ipd.drg as DRG', 'ipd.rw as RW', 'ipd.adjrw as ADJRW', 'ipd.drg_error as ERROR', 'ipd.drg_warning as WARNING', 'ipd.los as ACTLOS', 'ipd.grouper_version as GROUPER_VERSION', 'ipd.no_card as CID')
            .where(columnName, "=", searchValue)
            .whereRaw('LENGTH(ipd.refer)=5')
            .limit(maxLimit);
    }
    getDiagnosisIpd(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'dx.SEQ' : columnName;
        columnName = columnName === 'an' ? 'dx.AN' : columnName;
        columnName = columnName === 'pid' ? 'dx.PID' : columnName;
        columnName = columnName === 'cid' ? 'dx.CID' : columnName;
        return db('view_ipd_dx_hdc as dx')
            .select('dx.*')
            .select(db.raw(' "IT" as codeset'))
            .where(columnName, "=", searchNo)
            .orderBy('AN')
            .orderBy('DIAGTYPE')
            .orderBy('D_UPDATE')
            .limit(maxLimit);
    }
    getProcedureIpd(db, an, hospCode = hcode) {
        return db('view_ipd_op as op')
            .select(db.raw('"' + hcode + '" as HOSPCODE'))
            .select('hn as PID', 'an as AN', 'vn as SEQ')
            .select(db.raw('concat(admite, " " , timeadmit) as DATETIME_ADMIT'))
            .select('clinic_std as WARDSTAY', 'op as PROCEDCODE', 'desc as PROCEDNAME', 'dr as PROVIDER', 'price as SERVICEPRICE', 'cid as CID', 'lastupdate as D_UPDATE')
            .where('an', an)
            .limit(maxLimit);
    }
    getChargeIpd(db, an, hospCode = hcode) {
        return db('charge_ipd')
            .select('*')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .where('an', "=", an)
            .limit(maxLimit);
    }
    getDrugIpd(db, an, hospCode = hcode) {
        return db('view_pharmacy_ipd_psctmc as drug')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('hn as pid', 'an')
            .select(db.raw('concat(admite, " " , timeadmit) as datetime_admit'))
            .select('clinic_std as wardstay', 'drugname as dname', 'total as amount', 'unitsale as unit', 'dr_disc as provider', 'warning as caution', 'cid', 'lastupdate as d_update')
            .where('an', an)
            .where('odr_type', '1')
            .limit(maxLimit);
    }
    getAccident(db, visitNo, hospCode = hcode) {
        return db('accident')
            .select('*')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .where('vn', visitNo)
            .limit(maxLimit);
    }
    getDrugAllergy(db, hn, hospCode = hcode) {
        return db('view_drug_allergy')
            .select('*')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .where('hn', hn)
            .limit(maxLimit);
    }
    getAppointment(db, visitNo, hospCode = hcode) {
        return db('view_opd_fu')
            .select('*')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .where('vn', "=", visitNo)
            .limit(maxLimit);
    }
    async getReferHistory(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'visitNo' ? 'refer.vn' : ('refer.' + columnName);
        columnName = columnName === 'refer.referNo' ? 'refer.refer_no' : columnName;
        const sql = `
            SELECT ${hospCode} as hospcode, refer.refer_no as referid
                , concat('${hospCode}',refer.refer_no) as referid_province
                , refer.hn as pid, refer.vn as seq, refer.an
                , concat(refer.date_service,' ',refer.refer_time) as datetime_serv
                , concat(ipd.admite,' ',ipd.time) as datetime_admit
                , concat(refer.refer_date,' ',refer.refer_time) as datetime_refer
                , visit.clinic as clinic_refer, refer.refer_hcode as hosp_destination
                , refer.sendto as destination_req, vs.cc as CHIEFCOMP
                , vs.pi as PRESENTILLNESS, vs.pe AS PHYSICALEXAM
                , vs.nurse_ph as PASTHISTORY, visit.dx1 as DIAGLAST
                , case when visit.dep=1 then 3 else 1 end as ptype
                , case when refer.severity=5 then '1'
                    when refer.severity=4 then '2'
                    when refer.severity=3 then '3'
                    when refer.severity=2 then '4'
                    else '5' end as emergency
                , '99' as ptypedis, '1' as causeout
                , concat('ว',visit.dr) as provider
                , now() as d_update
            from refer_out as refer 
            LEFT JOIN opd_visit as visit on refer.vn=visit.vn
            LEFT JOIN opd_vs as vs on refer.vn=vs.vn
            LEFT JOIN ipd_ipd as ipd on refer.an=ipd.an
            WHERE refer.hcode='${hospCode}' and ${columnName}='${searchNo}'
            limit ${maxLimit};
        `;
        const result = await db.raw(sql);
        return result[0];
    }
    getClinicalRefer(db, referNo, hospCode = hcode) {
        return db('view_clinical_refer')
            .select('*')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }
    getInvestigationRefer(db, referNo, hospCode = hcode) {
        return db('view_investigation_refer')
            .select('*')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }
    getCareRefer(db, referNo, hospCode = hcode) {
        return db('view_care_refer')
            .select('*')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }
    getReferResult(db, visitDate, hospCode = hcode) {
        visitDate = moment(visitDate).format('YYYY-MM-DD');
        return db('view_opd_visit as visit')
            .leftJoin('refer_in', 'visit.vn', 'refer_in.vn')
            .select(db.raw(`(select hcode from sys_hospital) as HOSPCODE`))
            .select('visit.refer as HOSP_SOURCE', 'visit.refer_no as REFERID_SOURCE')
            .select(db.raw('concat(visit.refer,visit.refer_no) as REFERID_PROVINCE'))
            .select('visit.date as DATETIME_IN', 'visit.hn as PID_IN', 'visit.vn as SEQ_IN', 'visit.ipd_an as AN_IN', 'visit.no_card as CID_IN', 'refer_in.refer_in as REFERID', 'visit.dx1 as detail', 'visit.dr_note as reply_diagnostic', 'visit.lastupdate as reply_date')
            .select(db.raw('1 as REFER_RESULT'))
            .select(db.raw(`concat(visit.date,' ',visit.time) as D_UPDATE`))
            .where('visit.date', visitDate)
            .where('visit.refer', '!=', hcode)
            .where(db.raw('length(visit.refer)=5'))
            .groupBy('visit.vn')
            .limit(maxLimit);
    }
    getProvider(db, columnName, searchNo, hospCode = hcode) {
        columnName = columnName === 'licenseNo' ? 'code' : columnName;
        const now = moment().locale('th').format('YYYYMMDDHHmmss');
        return db('view_lib_dr')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('code as provider', 'code as council', 'councilno as registerno', 'cid', 'title as prename', 'name as fname', 'surname as lname', 'sex', 'dob as birth', 'branch as providertype')
            .select(db.raw('"" as startdate'))
            .select('expire as outdate')
            .select(db.raw('"" as movefrom'))
            .select(db.raw('"" as moveto'))
            .select(db.raw('"' + now + '" as d_update'))
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
    getData(db, tableName, columnName, searchNo, hospCode = hcode) {
        return db(tableName)
            .select('*')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
}
exports.HisEzhospModel = HisEzhospModel;
