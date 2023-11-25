import { Knex } from 'knex';
import * as moment from 'moment';
const maxLimit = 250;
const hcode = process.env.HOSPCODE;

export class HisKpstatModel {
    check() {
        return true;
    }

    testConnect(db: Knex) {
        return db('pt').select('hn').limit(1)
    }
    
    getTableName(db: Knex, dbName = process.env.HIS_DB_NAME) {
        return db('information_schema.tables')
            .select('table_name')
            .where('table_schema', '=', dbName);
    }

    getPerson(db: Knex, columnName, searchText, hospCode=hcode) {
        //columnName = cid, hn
        columnName = columnName === 'cid' ? 'idpop' : columnName;
        return db('mrls.pt')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('pt.idpop as cid','pt.hn as pid', 'pt.pname as prename',
                'pt.fname as name', 'lname','pt.hn', 'mate as sex', 'brthdate as birth',
                'mrtlst as mstatus')
            .select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="08" AND syscode.code=pt.occptn) as occupation_new'))
            .select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="08OLD" AND syscode.code=pt.occptn) as occupation_old'))
            .select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="04" AND syscode.code=pt.ctzshp) as race'))
            .select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="04" AND syscode.code=pt.nthlty) as nation'))
            .select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="11" AND syscode.code=pt.rlgn) as religion'))
            .select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="21" AND syscode.code=pt.educate) as education'))
            .select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="16" AND syscode.code=pt.bloodgrp) as abogroup'))
            .select(db.raw('4 as typearea'))
            .select('rhgroup', 'd_update')
            .where(columnName, "=", searchText)
            .limit(maxLimit);
    }

    getAddress(db, columnName, searchNo, hospCode=hcode) {
        columnName = columnName === 'cid' ? 'idpop' : columnName;
        return db('mrls.pt')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('hn as pid','housetype','addrpart as houseno','moopart as village',
            'tmbpart as tambon','amppart as ampur','chwpart as changwat','d_update','idpop as cid')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }

    getService(db, columnName, searchText, hospCode=hcode) {
        //columnName = visitNo, hn
        columnName = columnName === 'visitNo' ? 'ovst.vstno' : columnName;
        return db('ovst')
            .leftJoin('pt', 'ovst.hn', 'pt.hn')
            .leftJoin('rfrin', 'ovst.vstno', 'rfrin.vstno')
            .leftJoin('rfrout', 'ovst.vstno', 'rfrout.vstno')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('ovst.hn as pid', 'ovst.vstno as visitno','ovst.vstno as seq', 'ovst.vstdate as date_serv',
                'vsttime as time_serv','ovst.intime','ovst.nopoor as insid')
            .select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="09" AND syscode.code=ovst.pttype) as instype'))
            .select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="19" AND syscode.code=rfrin.rfrilct) as referinhosp'))
            .select('rfrin.rfrics as causein','ovst.nurse as chiefcomp',
                'ovst.ovstplace as servplace','ovst.temp1 as btemp','ovst.bp1 as sbp','ovst.bp2 as dbp',
                'ovst.pulse as pr', 'ovst.rate as rr','ovst.ovstost as typeout')
            .select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="19" AND syscode.code=rfrout.rfrolct) as referouthosp'))
            .select('rfrout.rfrocs as causeout','ovst.d_update','pt.idpop as cid')
            .where(columnName, searchText)
            .orderBy('vstdate')
            .limit(maxLimit);
    }

    getDiagnosisOpd(db, visitno, hospCode=hcode) {
        return db('ovstdiag as dx')
            .rightJoin('ovst', 'dx.vstno', 'ovst.vstno')
            .rightJoin('pt', 'ovst.hn', 'pt.hn')
            .select(db.raw('"' + hospCode + '" as hospcode'))
            .select('ovst.hn as pid', 'dx.vstno as seq', 'ovst.vstdate as date_serv',
                'dx.dxtype as diagtype', 'dx.icd10 as diagcode')
            .select(db.raw('(SELECT CONCAT("0",TRIM(icd),"00") FROM syscode WHERE idkey="10" AND syscode.code=dx.dpm) as clinic'))
            .select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="20" AND syscode.code=dx.drdx) as provider'))
            .select('pt.idpop as cid', 'dx.d_update')
            .where('ovst.vstno', visitno)
            .limit(maxLimit);
    }

    getProcedureOpd(db, visitno, hospCode=hcode) {
        return db('ovstoprt as op')
            .leftJoin('ovst', 'ovst.vstno', 'op.vstno')
            .leftJoin('pt', 'pt.hn', 'ovst.hn')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('ovst.hn as pid','op.vstno as seq','ovst.vstdate as date_serv')
            .select(db.raw('(SELECT CONCAT("0",TRIM(icd),"00") FROM syscode WHERE idkey="10" AND syscode.code=op.cln) as clinic'))
            .select('op.icd9cm as procedcode','sumpay as serviceprice','d_update','pt.idpop as cid')
            .select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="20" AND syscode.code=op.droprt) as provider'))
            .where('ovst.vstno', visitno)
            .limit(maxLimit);
    }

    getChargeOpd(db, visitNo, hospCode=hcode) {
        return db('view_opd_charge_item')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('vn', visitNo)
            .limit(maxLimit);
    }

    getLabRequest(db, columnName, searchNo, hospCode=hcode) {
        columnName = columnName === 'visitNo' ? 'vn' : columnName;
        return db('view_lab_request_item as lab')
            .select(db.raw('"' + hcode + '" as hospcode'))
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
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }

    getLabResult(db, columnName, searchNo, hospCode=hcode) {
        columnName = columnName === 'visitNo' ? 'vn' : columnName;
        return db('view_lab_result')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }

    getDrugOpd(db, visitno, hospCode=hcode) {
        //columnName = columnName === 'visitNo' ? 'y1.vstno' : columnName;
        return db('pharmc.prscdt as y1')
            .leftJoin('pharmc.prsc', 'prsc.vstno', 'y1.vstno')    
            .leftJoin('ovst', 'y1.vstno', 'ovst.vstno')
            .leftJoin('pharmc.meditem as y2', 'y1.meditem', 'y2.meditem')
            .leftJoin('pt', 'ovst.hn', 'pt.hn')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('ovst.hn as pid','y1.vstno as seq','ovst.vstdate as date_serv')
            .select(db.raw('(SELECT CONCAT("0",TRIM(icd),"00") FROM syscode WHERE idkey="10" AND syscode.code=ovst.roomno) as clinic'))
            .select('y2.didstd','y2.medname as dname','y1.qty as amount')
            .select(db.raw('(SELECT TRIM(icd) FROM pharmc.sysyha WHERE idkey="31" AND sysyha.code=y2.medunit) as unit'))
            .select('y1.costrate as drugcost','y1.salerate as drugprice','prsc.d_update','pt.idpop as cid')
            .where('y1.vstno', visitno)
            .limit(maxLimit);
    }

    getAdmission(db,  visitno, hospCode = hcode) {
		//columnName = columnName === 'visitno' ? 'ipt.vstno' : columnName;
        return db('mrls.ipt')
		.leftJoin('pt', 'ipt.hn', 'pt.hn')
		.leftJoin('ovst', 'ipt.vstno', 'ovst.vstno')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('ipt.hn as pid','ipt.vstno as seq','ipt.an')
            .select(db.raw('CONCAT(ipt.rgtdate," ",ipt.rgttime,":00") as datetime_admit'))
			.select(db.raw('(SELECT CONCAT("1",TRIM(icd),"00") FROM syscode WHERE idkey="10" AND syscode.code=ipt.ward) as wardadmit'))
			.select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="09" AND syscode.code=ipt.pttype) as instype'))
			.select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="05" AND syscode.code=ovst.ovstist) as typein'))
            .select('ipt.weight as admitweight','ipt.height as admitheight')
            .select(db.raw('CONCAT(ipt.dchdate," ",ipt.dchtime,":00") as datetime_disch'))
			.select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="35" AND syscode.code=ipt.dischs) as dischstatus'))
			.select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="34" AND syscode.code=ipt.discht) as dischtype'))
			.select(db.raw('(SELECT CONCAT("1",TRIM(icd),"00") FROM syscode WHERE idkey="10" AND syscode.code=ipt.ward) as warddisch'))
			.select('pt.idpop as cid')
            .where('ipt.vstno', "=", visitno)
            .limit(maxLimit);
    }

    getDiagnosisIpd(db, columnName, searchNo, hospCode=hcode) {
        columnName = columnName === 'an' ? 'iptdiag.an' : columnName;
        return db('iptdiag')
		.leftJoin('ipt', 'ipt.an', 'iptdiag.an')
        .leftJoin('ovst', 'ipt.vstno', 'ovst.vstno')
        .leftJoin('pt', 'ipt.hn', 'pt.hn')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('ipt.hn as pid','iptdiag.an')
			.select(db.raw('CONCAT(ipt.rgtdate," ",ipt.rgttime,":00") as datetime_admit'))
			.select(db.raw('(SELECT CONCAT("1",TRIM(icd),"00") FROM syscode WHERE idkey="10" AND syscode.code=ipt.ward) as warddiag'))
			.select('iptdiag.dxtype as diagtype','iptdiag.icd10 as diagcode')
			.select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="20" AND syscode.code=ipt.disdct) as provider'))
			.select('ipt.d_update','pt.idpop as cid')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }

    getProcedureIpd(db, an, hospCode=hcode) {
        return db('iptoprt')
            .leftJoin('ipt', 'ipt.an', 'iptoprt.an')
            .leftJoin('pt', 'ipt.hn', 'pt.hn')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('ipt.hn as pid','iptdiag.an')
			.select(db.raw('CONCAT(ipt.rgtdate," ",ipt.rgttime,":00") as datetime_admit'))
            .select(db.raw('(SELECT CONCAT("1",TRIM(icd),"00") FROM syscode WHERE idkey="10" AND syscode.code=ipt.ward) as wardstay'))
            .select('iptoprt.icd9cm as procedcode','iptoprt.sumpay as serviceprice')
            .select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="20" AND syscode.code=iptoprt.droprt) as provider'))
            .select('pt.idpop as cid')
            .where('an', an)
            .limit(maxLimit);
    }

    getChargeIpd(db, an, hospCode=hcode) {
        return db('charge_ipd')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('an', "=", an)
            .limit(maxLimit);
    }

    getDrugIpd(db, visitno, hospCode=hcode) {
        //columnName = columnName === 'visitNo' ? 'y1.vstno' : columnName;
        return db('pharmc.prscdt as y1')
            .leftJoin('ipt', 'y1.vstno', 'ipt.vstno')
            .leftJoin('pharmc.meditem as y2', 'y1.meditem', 'y2.meditem')
            .leftJoin('pt', 'ipt.hn', 'pt.hn')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('ipt.hn as pid','ipt.an')
            .select(db.raw('CONCAT(ipt.rgtdate," ",ipt.rgttime,":00") as datetime_admit'))
            .select(db.raw('(SELECT CONCAT("1",TRIM(icd),"00") FROM syscode WHERE idkey="10" AND syscode.code=ipt.ward) as wardstay'))
            .select(db.raw('"2" as typedrug'))
            .select('y2.didstd','y2.medname as dname','ipt.dchdate as datestart','y1.qty as amount')
            .select(db.raw('(SELECT TRIM(icd) FROM pharmc.sysyha WHERE idkey="31" AND sysyha.code=y2.medunit) as unit'))
            .select('y1.costrate as drugcost','y1.salerate as drugprice','pt.idpop as cid')
            .select(db.raw('CONCAT(ipt.dchdate," ",ipt.dchtime,":00") as d_update'))
            .where('y1.vstno', visitno)
            .limit(maxLimit);
    }

    getAccident(db, visitNo, hospCode=hcode) {
        return db('accident')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('vn', visitNo)
            .limit(maxLimit);
    }

    getDrugAllergy(db, hn, hospCode=hcode) {
        return db('view_drug_allergy')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('hn', hn)
            .limit(maxLimit);
    }

    getAppointment(db, visitNo, hospCode=hcode) {
        return db('view_opd_fu')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('vn', "=", visitNo)
            .limit(maxLimit);
    }

    getReferHistory(db, columnName, searchNo, hospCode=hcode) {
        //columnName = visitNo, referNo
        columnName = columnName === 'visitNo' ? 'rfrout.vstno' : columnName;
        return db('rfrout')
            .leftJoin('mrls.ovst', 'rfrout.vstno', 'ovst.vstno')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('rfrout.rfrono as referid','ovst.hn as pid','rfrout.vstno as seq','rfrout.an')
            .select(db.raw('concat(ovst.vstdate," ",ovst.vsttime,":00") as datetime_serv'))
            .select(db.raw('concat(rfrout.rfrodate," ",rfrout.rfrotime,":00") as datetime_refer'))
            .select(db.raw('(SELECT CONCAT("1",TRIM(icd),"00") FROM syscode WHERE idkey="10" AND syscode.code=rfrout.cln) as clinic_refer'))
            .select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="19" AND syscode.code=rfrout.rfrolct) as hosp_destination'))
            .select('rfrout.treat_note as chiefcomp','rfrout.dx_note as physicalexam','rfrout.icd10 as diaglast','rfrout.severity as emergency')
			.select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="33" AND syscode.code=ovst.tvisit) as ptype'))
			.select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="12" AND syscode.code=rfrout.rfrocs) as causeout'))
			.select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="20" AND syscode.code=rfrout.rfrodr) as provider'))
			.select(db.raw('CONCAT(rfrout.rfrodate," ",rfrout.rfrotime,":00") as d_update'))
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }

    // select รายชื่อเพื่อแสดงทะเบียน
    getReferOut(db: Knex, date, hospCode=hcode) {
        return db('mrls.rfrout as refer')
            .leftJoin('mrls.pt', 'refer.hn', 'pt.hn')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select(db.raw('CONCAT(refer.rfrodate," ",refer.rfrotime) as refer_date'))
            .select(db.raw('(SELECT TRIM(icd) FROM syscode WHERE idkey="19" AND syscode.code=refer.rfrolct) as hosp_destination'))
            .select('refer.rfrono as referid','refer.hn', 'pt.idpop as cid', 'refer.vstno as seq', 'refer.an',
                'pt.pname as prename', 'pt.fname', 'pt.lname','pt.brthdate as dob', 'pt.mate as sex', 'refer.icd10 as dx'
            )
            .where('refer.rfrodate', date)
            .orderBy('refer.rfrodate')
            .limit(maxLimit);
    }

    getClinicalRefer(db, referNo, hospCode=hcode) {
        return db('view_clinical_refer')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }

    getInvestigationRefer(db, referNo, hospCode=hcode) {
        return db('view_investigation_refer')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }

    getCareRefer(db, referNo, hospCode=hcode) {
        return db('view_care_refer')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }

    getReferResult(db, hospDestination, referNo, hospCode=hcode) {
        return [];
    }

    getData(db, tableName, columnName, searchNo, hospCode=hcode) {
        return db(tableName)
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
}
