/// <reference path="./../../../typings.d.ts" />

var fastify = require('fastify');
import * as moment from 'moment';
var fs = require('fs');
var http = require('http');
var querystring = require('querystring');

import { HisEzhospModel } from '../../models/refer/his_ezhosp';
import { HisThiadesModel } from '../../models/refer/his_thiades';
import { HisHosxpv3Model } from '../../models/refer/his_hosxpv3';
import { HisHosxpv4Model } from '../../models/refer/his_hosxpv4';
import { HisJhcisModel } from '../../models/refer/his_jhcis';
import { HisMdModel } from '../../models/refer/his_md';
import { HisKpstatModel } from '../../models/refer/his_kpstat';
import { HisMkhospitalModel } from '../../models/refer/his_mkhospital';
import { HisModel } from '../../models/refer/his';
import { HisNemoModel } from '../../models/refer/his_nemo';
import { HisPmkModel } from '../../models/refer/his_pmk';
import { HisMyPcuModel } from '../../models/refer/his_mypcu';
import { HisHosxpPcuModel } from '../../models/refer/his_hosxppcu';

const hisProvider = process.env.HIS_PROVIDER;
let hisModel: any;
switch (hisProvider) {
  case 'ezhosp':
    hisModel = new HisEzhospModel();
    break;
  case 'thiades':
    hisModel = new HisThiadesModel();
    break;
  case 'hosxpv3':
    hisModel = new HisHosxpv3Model();
    break;
  case 'hosxpv4':
    hisModel = new HisHosxpv4Model();
    break;
  case 'hosxppcu':
    hisModel = new HisHosxpPcuModel();
    break;
  case 'mkhospital':
    hisModel = new HisMkhospitalModel();
    break;
  case 'nemo':
  case 'nemo_refer':
    hisModel = new HisNemoModel();
    break;
  case 'ssb':
    // hisModel = new HisSsbModel();
    break;
  case 'infod':
    // hisModel = new HisInfodModel();
    break;
  case 'hi':
    // hisModel = new HisHiModel();
    break;
  case 'himpro':
    // hisModel = new HisHimproModel();
    break;
  case 'jhcis':
    hisModel = new HisJhcisModel();
    break;
  case 'hospitalos':
    // hisModel = new HisHospitalOsModel();
    break;
  case 'jhos':
    // hisModel = new HisJhosModel();
    break;
  case 'pmk':
    hisModel = new HisPmkModel();
    break;
  case 'md':
    hisModel = new HisMdModel();
    break;
  case 'spdc':
  case 'kpstat':
    hisModel = new HisKpstatModel();
    break;
  case 'mypcu':
    hisModel = new HisMyPcuModel();
    break;
  default:
    hisModel = new HisModel();
}

const hcode = process.env.HOSPCODE;
const his = process.env.HIS_PROVIDER;
const resultText = 'sent_result.txt';
let sentContent = '';
let nReferToken: any = '';
let crontabConfig: any = { client_ip: '' };
let apiVersion: string = '-';
let subVersion: string = '-';

async function sendMoph(req, reply, db) {
  const dateNow = moment().format('YYYY-MM-DD');

  const apiKey = process.env.NREFER_APIKEY || 'api-key';
  const secretKey = process.env.NREFER_SECRETKEY || 'secret-key';

  sentContent = moment().format('YYYY-MM-DD HH:mm:ss') + ' data:' + dateNow + "\r\n";

  const resultToken: any = await getNReferToken(apiKey, secretKey);
  if (resultToken && resultToken.statusCode == 200 && resultToken.token) {
    nReferToken = resultToken.token;
    sentContent += `token ${nReferToken}\r`;
  } else {
    console.log('refer get token error', resultToken.message);
    sentContent += `get token Error:` + JSON.stringify(resultToken) + `\r`;
    writeResult(resultText, sentContent);
    return false;
  }

  const hourNow = +moment().get('hours');
  const minuteNow = +moment().get('minutes');
  if ((hourNow == 1 || hourNow == 8 || hourNow == 12 || hourNow == 18 || hourNow == 22)
    && minuteNow - 1 < +process.env.NREFER_AUTO_SEND_EVERY_MINUTE) {
    const date = moment().subtract(1, 'days').format('YYYY-MM-DD');
    await getRefer_out(db, date);
    await getReferResult(db, date);
  } else if (hourNow == 3 && minuteNow - 1 < +process.env.NREFER_AUTO_SEND_EVERY_MINUTE) {
    // เวลา 03:00 get ย้อนหลัง 1 สัปดาห์
    let oldDate = moment(dateNow).subtract(7, 'days').format('YYYY-MM-DD');
    while (oldDate < dateNow) {
      // await getRefer_out(db, oldDate);
      // await getReferResult(db, oldDate);
      oldDate = moment(oldDate).add(1, 'days').format('YYYY-MM-DD');
    }
  }

  const referOut_ = getRefer_out(db, dateNow);
  const referResult_ = getReferResult(db, dateNow);
  const referOut = await referOut_;
  const referResult = await referResult_;
  return { date: dateNow, referOut, referResult };
}

async function getRefer_out(db, date) {
  try {
    const referout = await hisModel.getReferOut(db, date, hcode);
    console.log('******** >> referout', referout.length, ' case');
    sentContent += `\rsave refer_history ${date} \r`;
    sentContent += `\rsave refer service data ${date} \r`;
    let index = 0;
    let sentResult: any = {
      date,
      pid: process.pid,
      referout: { success: 0, fail: 0, vnFail: [] },
      person: { success: 0, fail: 0 },
      address: { success: 0, fail: 0 },
      service: { success: 0, fail: 0 },
      diagnosisOpd: { success: 0, fail: 0 },
      procedureOpd: { success: 0, fail: 0 },
      drugOpd: { success: 0, fail: 0 },
      drugAllergy: { success: 0, fail: 0 },
      investigationRefer: { success: 0, fail: 0 }
    };
    for (let row of referout) {
      const hn = row.hn || row.HN || row.pid || row.PID;
      const seq = row.seq || row.SEQ || row.vn || row.VN;
      const referid = row.REFERID || row.referid;
      sentContent += (index + 1) + '. refer no.' + referid + ', hn ' + hn + ', seq ' + seq + '\r';

      await sendReferOut(row, sentResult);
      await getPerson(db, hn, sentResult);
      await getAddress(db, hn, sentResult);
      await getService(db, seq, sentResult);
      await getDiagnosisOpd(db, seq, sentResult);
      await getProcedureOpd(db, seq, sentResult);
      await getDrugOpd(db, seq, sentResult);
      await getDrugAllergy(db, hn, sentResult);
      const ipd = await getAdmission(db, seq);

      const an = ipd && ipd.length ? ipd[0].an : '';
      const procedureIpd = await getProcedureIpd(db, an);

      // const drug_ipd = await getDrugIpd(db, an);

      await getLabResult(db, row, sentResult);

      index += 1;
      if (referout.length <= index) {
        sentContent += moment().format('HH:mm:ss.SSS') + ' crontab finished...\r\r';
        await writeResult(resultText, sentContent);
        console.log(moment().format('HH:mm:ss.SSS'), 'finished...');
      }
    }
    console.log(process.env.HOSPCODE, ' nrefer sent ', sentResult);
    return referout;
  } catch (error) {
    console.log('crontab error:', error.message)
    sentContent += moment().format('HH:mm:ss.SSS') + 'crontab error ' + error.message + '\r\r';
    return [];
  }
}

async function getReferResult(db, date) {
  try {
    const referResult = await hisModel.getReferResult(db, date, hcode);
    sentContent += `\rsave refer_result ${date} \r`;
    sentContent += `\rsave refer service data ${date} \r`;
    let index = 0;
    let sentResultResult: any = {
      pid: process.pid,
      referresult: { success: 0, fail: 0, vnFail: [] },
      person: { success: 0, fail: 0 },
      address: { success: 0, fail: 0 },
      service: { success: 0, fail: 0 },
      diagnosisOpd: { success: 0, fail: 0 },
      procedureOpd: { success: 0, fail: 0 },
      drugOpd: { success: 0, fail: 0 },
      drugAllergy: { success: 0, fail: 0 },
      investigationRefer: { success: 0, fail: 0 }
    };
    for (let row of referResult) {
      const hn = row.PID_IN;
      const seq = row.SEQ_IN;
      const referid = row.REFERID_SOURCE;
      sentContent += (index + 1) + '. refer no.' + referid + ', hn ' + hn + ', seq ' + seq + '\r';

      await sendReferResult(row, sentResultResult);
      await getPerson(db, hn, sentResultResult);
      await getAddress(db, hn, sentResultResult);
      await getService(db, seq, sentResultResult);
      await getDiagnosisOpd(db, seq, sentResultResult);
      await getProcedureOpd(db, seq, sentResultResult);
      await getDrugOpd(db, seq, sentResultResult);
      await getDrugAllergy(db, hn, sentResultResult);
      const ipd = await getAdmission(db, seq);

      const an = ipd && ipd.length ? ipd[0].an : '';
      const procedureIpd = await getProcedureIpd(db, an);

      // const drug_ipd = await getDrugIpd(db, an);

      await getLabResult(db, row, sentResultResult);

      index += 1;
      if (referResult.length <= index) {
        sentContent += moment().format('HH:mm:ss.SSS') + ' crontab finished...\r\r';
        await writeResult(resultText, sentContent);
        console.log(moment().format('HH:mm:ss.SSS'), 'finished...');
      }
    }
    console.log(process.env.HOSPCODE, ' nrefer result', sentResultResult);
    return referResult;
  } catch (error) {
    console.log('crontab error:', error.message)
    sentContent += moment().format('HH:mm:ss.SSS') + 'crontab error ' + error.message + '\r\r';
    return [];
  }
}

async function sendReferOut(row, sentResult) {
  const d_update = moment().format('YYYY-MM-DD HH:mm:ss');
  if (row) {
    const hcode = row.HOSPCODE || row.hospcode;
    const referId = row.REFERID || row.referid;
    const SEQ = (row.SEQ || row.seq || row.vn || '') + '';
    const referProvId = hcode + referId;
    const dServe = row.DATETIME_SERV || row.REFER_DATE || row.refer_date;
    const dAdmit = row.DATETIME_ADMIT || row.datetime_admit || null;
    const dRefer = row.DATETIME_REFER || row.REFER_DATE || row.refer_date || dServe || null;
    const destHosp = row.HOSP_DESTINATION || row.hosp_destination;

    const data = {
      HOSPCODE: hcode,
      REFERID: referId,
      PID: row.PID || row.pid || row.HN || row.hn,
      SEQ,
      AN: row.AN || row.an || '',
      CID: row.CID || row.cid,
      DATETIME_SERV: moment(dServe).format('YYYY-MM-DD HH:mm:ss'),
      DATETIME_ADMIT: moment(dAdmit).format('YYYY-MM-DD HH:mm:ss') || null,
      DATETIME_REFER: moment(dRefer).format('YYYY-MM-DD HH:mm:ss'),
      HOSP_DESTINATION: destHosp,
      REFERID_ORIGIN: row.REFERID_ORIGIN || row.referid_origin || '',
      HOSPCODE_ORIGIN: row.HOSPCODE_ORIGIN || row.hospcode_origin || '',
      CLINIC_REFER: row.CLINIC_REFER || row.clinic_refer || '',
      CHIEFCOMP: row.CHIEFCOMP || row.chiefcomp || '',
      PHYSICALEXAM: row.PHYSICALEXAM || row.physicalexam || '',
      PH: row.PH || row.ph || '',
      PI: row.PI || row.pi || '',
      FH: row.FH || row.fh || '',
      DIAGFIRST: row.DIAGFIRST || row.diagfirst || '',
      DIAGLAST: row.DIAGLAST || row.diaglast || '',
      PSTATUS: row.PSTATUS || row.ptstatus || '',
      PTYPE: row.PTYPE || row.ptype || '1',
      EMERGENCY: row.EMERGENCY || row.emergency || '5',
      PTYPEDIS: row.PTYPEDIS || row.ptypedis || '99',
      CAUSEOUT: row.CAUSEOUT || row.causeout || '',
      REQUEST: row.REQUEST || row.request || '',
      PROVIDER: row.PROVIDER || row.provider || '',
      REFERID_PROVINCE: referProvId,
      referout_type: row.referout_type || 1,
      D_UPDATE: row.D_UPDATE || row.d_update || d_update,
      his: hisProvider,
      typesave: 'autosent'
    }

    const saveResult: any = await referSending('/save-refer-history', data);
    if (saveResult.statusCode == 200) {
      sentResult.referout.success += 1;
    } else {
      sentResult.referout.fail += 1;
      sentResult.referout.vnFail.push(SEQ);
      console.log('save-refer-history', data.REFERID, saveResult);
    }
    sentContent += '  - refer_history ' + data.REFERID + ' ' + (saveResult.result || saveResult.message) + '\r';
    return saveResult;
  } else {
    return null;
  }
}

async function sendReferResult(row, sentResult) {
  const d_update = moment().format('YYYY-MM-DD HH:mm:ss');
  if (row) {
    const data = {
      HOSPCODE: row.HOSPCODE,
      REFERID: row.REFERID || null,
      REFERID_SOURCE: row.REFERID_SOURCE,
      REFERID_PROVINCE: row.REFERID_PROVINCE,
      PID_IN: row.PID_IN,
      SEQ_IN: row.SEQ_IN + '',
      AN_IN: row.AN_IN,
      CID_IN: row.CID_IN + '',
      HOSP_SOURCE: row.HOSP_SOURCE,
      REFER_RESULT: row.REFER_RESULT || 1,
      DATETIME_REFER: row.DATETIME_REFER ? moment(row.DATETIME_REFER).format('YYYY-MM-DD HH:mm:ss') : null,
      DATETIME_IN: moment(row.DATETIME_IN).format('YYYY-MM-DD HH:mm:ss'),
      REASON: row.REASON || null,
      D_UPDATE: row.D_UPDATE || d_update,
      detail: row.detail || null,
      reply_date: row.reply_date || null,
      reply_diagnostic: row.reply_diagnostic || null,
      reply_recommend: row.reply_recommend || null,
      his: process.env.HIS_PROVIDER,
      typesave: 'autoreply'
    };

    const saveResult: any = await referSending('/save-refer-result', data);
    if (saveResult.statusCode == 200) {
      sentResult.referresult.success += 1;
    } else {
      sentResult.referresult.fail += 1;
      sentResult.referresult.vnFail.push(row.SEQ_IN);
      console.log('save-refer-result', data.REFERID_SOURCE, saveResult);
    }
    sentContent += '  - refer_result ' + data.REFERID_SOURCE + ' ' + (saveResult.result || saveResult.message) + '\r';
    return saveResult;
  } else {
    return null;
  }
}

async function getPerson(db, pid, sentResult) {
  const d_update = moment().format('YYYY-MM-DD HH:mm:ss');
  const rows = await hisModel.getPerson(db, 'hn', pid, hcode);
  sentContent += '  - person = ' + rows.length + '\r';
  if (rows && rows.length) {
    for (const row of rows) {
      const person = await {
        HOSPCODE: row.HOSPCODE || row.hospcode,
        CID: row.CID || row.cid,
        PID: row.HN || row.hn || row.PID || row.pid,
        HID: row.HID || row.hid || '',
        HN: row.HN || row.hn || row.PID || row.pid,
        PRENAME: row.PRENAME || row.prename,
        NAME: row.NAME || row.name,
        LNAME: row.LNAME || row.lname,
        SEX: row.SEX || row.sex,
        BIRTH: row.BIRTH || row.birth,
        MSTATUS: row.MSTATUS || row.mstatus,
        OCCUPATION_NEW: row.OCCUPATION_NEW || row.occupation_new,
        RACE: row.RACE || row.race,
        NATION: row.NATION || row.nation,
        RELIGION: row.RELIGION || row.religion,
        EDUCATION: row.EDUCATION || row.education,
        ABOGROUP: row.ABOGROUP || row.abogroup,
        TELEPHONE: row.TELEPHONE || row.telephone,
        TYPEAREA: row.TYPEAREA || row.typearea,
        D_UPDATE: row.D_UPDATE || row.d_update || d_update,
      }

      const saveResult: any = await referSending('/save-person', person);
      if (saveResult.statusCode === 200) {
        sentResult.person.success += 1;
      } else {
        sentResult.person.fail += 1;
        console.log('save-person', person.HN, saveResult);
      }
      sentContent += '    -- PID ' + person.HN + ' ' + (saveResult.result || saveResult.message) + '\r';
    }
  }
  return rows;
}

async function getAddress(db, pid, sentResult) {
  if (pid) {
    const d_update = moment().format('YYYY-MM-DD HH:mm:ss');
    const rows = await hisModel.getAddress(db, 'hn', pid, hcode);
    sentContent += '  - address = ' + (rows ? rows.length : 0) + '\r';
    if (rows && rows.length) {
      for (const row of rows) {
        const address = await {
          HOSPCODE: row.HOSPCODE || row.hospcode,
          PID: row.PID || row.pid || row.HN || row.hn,
          ADDRESSTYPE: row.ADDRESSTYPE || row.addresstype,
          ROOMNO: row.ROOMNO || row.roomno,
          HOUSENO: row.HOUSENO || row.HOUSENO,
          CONDO: row.CONDO || row.condo || '',
          SOIMAIN: row.SOIMAIN || row.soimain,
          ROAD: row.ROAD || row.road,
          VILLANAME: row.VILLANAME || row.villaname,
          VILLAGE: row.VILLAGE || row.village,
          TAMBON: row.TAMBON || row.tambon,
          AMPUR: row.AMPUR || row.ampur,
          CHANGWAT: row.CHANGWAT || row.changwat,
          TELEPHONE: row.TELEPHONE || row.telephone || '',
          MOBILE: row.MOBILE || row.mobile || '',
          D_UPDATE: row.D_UPDATE || row.d_update || d_update,
        }

        const saveResult: any = await referSending('/save-address', address);
        if (saveResult.statusCode === 200) {
          sentResult.address.success += 1;
        } else {
          sentResult.address.fail += 1;
          console.log('save address fail', address.PID, saveResult);
        }
        sentContent += '    -- PID ' + address.PID + ' ' + (saveResult.result || saveResult.message) + '\r';
      }
    }
    return rows;
  } else {
    console.log('Address error: not found HN');
    return [];
  }
}

async function getService(db, visitNo, sentResult) {
  const rows = await hisModel.getService(db, 'visitNo', visitNo, hcode);
  sentContent += '  - service = ' + rows.length + '\r';
  const d_update = moment().format('YYYY-MM-DD HH:mm:ss');
  if (rows && rows.length) {
    for (const row of rows) {
      const data = await {
        HOSPCODE: row.HOSPCODE || row.hospcode,
        PID: row.PID || row.pid || row.HN || row.hn,
        SEQ: row.SEQ || row.seq || visitNo,
        HN: row.PID || row.pid || row.HN || row.hn,
        CID: row.CID || row.cid,
        DATE_SERV: row.DATE_SERV || row.date_serv || row.date,
        TIME_SERV: row.TIME_SERV || row.time_serv || '',
        LOCATION: row.LOCATION || row.location || '',
        INTIME: row.INTIME || row.intime || '',
        INSTYPE: row.INSTYPE || row.instype || '',
        INSID: row.INSID || row.insid || '',
        TYPEIN: row.TYPEIN || row.typein || '',
        REFERINHOSP: row.REFERINHOSP || row.referinhosp || '',
        CAUSEIN: row.CAUSEIN || row.causein || '',
        CHIEFCOMP: row.CHIEFCOMP || row.chiefcomp || '',
        SERVPLACE: row.SERVPLACE || row.servplace || '',
        BTEMP: row.BTEMP || row.btemp || '',
        SBP: row.SBP || row.sbp || '',
        DBP: row.DBP || row.dbp || '',
        PR: row.PR || row.pr || '',
        RR: row.RR || row.rr || '',
        TYPEOUT: row.TYPEOUT || row.typeout || '',
        REFEROUTHOSP: row.REFEROUTHOSP || row.referouthosp || '',
        CAUSEOUT: row.CAUSEOUT || row.causeout || '',
        COST: row.COST || row.cost || '',
        PRICE: row.PRICE || row.price || '',
        PAYPRICE: row.PAYPRICE || row.payprice || '',
        ACTUALPAY: row.ACTUALPAY || row.actualpay || '',
        OCCUPATION_NEW: row.OCCUPATION_NEW || row.occupation_new,
        MAIN: row.MAIN || row.main || '',
        HSUB: row.HSUB || row.hsub || row.SUB || row.sub || '',
        SUB: row.SUB || row.sub || '',
        D_UPDATE: row.D_UPDATE || row.d_update || d_update,
      }

      const saveResult: any = await referSending('/save-service', data);
      sentContent += '    -- SEQ ' + data.SEQ + ' ' + (saveResult.result || saveResult.message) + '\r';
      if (saveResult.statusCode === 200) {
        sentResult.service.success += 1;
      } else {
        sentResult.service.fail += 1;
        console.log('save-service', data.SEQ, saveResult);
      }
    }
  }
  return rows;
}

async function getDiagnosisOpd(db, visitNo, sentResult) {
  const rows = await hisModel.getDiagnosisOpd(db, visitNo, hcode);
  sentContent += '  - diagnosis_opd = ' + rows.length + '\r';
  if (rows && rows.length) {
    let r = [];
    for (const row of rows) {
      await r.push({
        HOSPCODE: row.HOSPCODE || row.hospcode,
        PID: row.PID || row.pid,
        SEQ: row.SEQ || row.seq,
        DATE_SERV: row.DATE_SERV || row.date_serv,
        DIAGTYPE: row.DIAGTYPE || row.diagtype,
        DIAGCODE: row.DIAGCODE || row.diagcode,
        DIAGNAME: row.DIAGNAME || row.diagname || '',
        CLINIC: row.CLINIC || row.clinic || '',
        PROVIDER: row.PROVIDER || row.provider || '',
        D_UPDATE: row.D_UPDATE || row.d_update,
        ID: row.ID || row.id || '',
        BR: row.BR || row.br || '',
        AIS: row.AIS || row.ais || '',
        CID: row.CID || row.cid || ''
      });
    }

    const saveResult: any = await referSending('/save-diagnosis-opd', r);
    sentContent += '    -- ' + visitNo + ' ' + JSON.stringify(saveResult) + '\r';
    if (saveResult.statusCode === 200) {
      sentResult.diagnosisOpd.success += 1;
    } else {
      sentResult.diagnosisOpd.fail += 1;
      console.log('save-diagnosis-opd', visitNo, saveResult);
    }
  }
  return rows;
}

async function getProcedureOpd(db, visitNo, sentResult) {
  const d_update = moment().format('YYYY-MM-DD HH:mm:ss');
  const rows = await hisModel.getProcedureOpd(db, visitNo, hcode);
  sentContent += '  - procedure_opd = ' + rows.length + '\r';
  let rowSave = [];
  if (rows && rows.length) {
    for (const row of rows) {
      await rowSave.push({
        HOSPCODE: row.HOSPCODE || row.hospcode,
        PID: row.PID || row.pid || row.HN || row.hn,
        SEQ: row.SEQ || row.seq || row.visitno || visitNo,
        PROCEDCODE: row.PROCEDCODE || row.procedcode || row.OP_CODE || row.op_code,
        PROCEDNAME: row.PROCEDNAME || row.procedname || row.OP_NAME || row.op_name || '',
        DATE_SERV: row.DATE_SERV || row.date_serv || row.date || '',
        CLINIC: row.CLINIC || row.clinic || '',
        SERVICEPRICE: row.SERVICEPRICE || row.serviceprice || 0,
        PROVIDER: row.PROVIDER || row.provider || row.dr || '',
        D_UPDATE: row.D_UPDATE || row.d_update || row.date || d_update,
        CID: row.CID || row.cid || '',
      })
    }
    const saveResult: any = await referSending('/save-procedure-opd', rowSave);
    sentContent += '    -- ' + visitNo + ' ' + JSON.stringify(saveResult) + '\r';
    if (saveResult.statusCode === 200) {
      sentResult.procedureOpd.success += 1;
    } else {
      sentResult.procedureOpd.fail += 1;
      console.log('save-procedure-opd', visitNo, saveResult);
    }
  }
  return rowSave;
}

async function getDrugOpd(db, visitNo, sentResult) {
  let opdDrug = [];
  const rows = await hisModel.getDrugOpd(db, visitNo, hcode);
  sentContent += '  - drug_opd = ' + rows.length + '\r';
  if (rows && rows.length) {
    for (let r of rows) {
      await opdDrug.push({
        HOSPCODE: r.HOSPCODE || r.hospcode || hcode,
        PID: r.PID || r.pid || r.HN || r.hn,
        SEQ: r.SEQ || r.seq || r.vn,
        DATE_SERV: r.DATE_SERV || r.date_serv,
        CLINIC: r.CLINIC || r.clinic,
        DIDSTD: r.DIDSTD || r.didstd || r.DID || r.did || r.dcode,
        DNAME: r.DNAME || r.dname,
        AMOUNT: r.AMOUNT || r.amount || null,
        UNIT: r.UNIT || r.unit || null,
        UNIT_PACKING: r.UNIT_PACKING || r.unit_packing || null,
        DRUGPRICE: r.DRUGPRICE || r.drugprice || null,
        DRUGCOST: r.DRUGCOST || r.drugcost || null,
        PROVIDER: r.PROVIDER || r.provider || null,
        D_UPDATE: r.D_UPDATE || r.d_update || null,
        DID: r.DIDSTD || r.didstd || r.DID || r.did,
        CID: r.CID || r.cid || null,
        DID_TMT: r.DID_TMT || r.did_tmt || null,
        drug_usage: r.drug_usage || null,
        caution: r.caution
      });
    }
    const saveResult: any = await referSending('/save-drug-opd', opdDrug);
    sentContent += '    -- ' + visitNo + ' ' + JSON.stringify(saveResult) + '\r';
    if (saveResult.statusCode == 200) {
      sentResult.drugOpd.success += 1;
    } else {
      console.log('drug opd error: vn ', visitNo, saveResult);
      sentResult.drugOpd.fail += 1;
    }
  }
  return opdDrug;
}

async function getLabResult(db, row, sentResult) {
  const visitNo = row.seq || row.SEQ || row.SEQ_IN || row.vn;
  const referID = row.REFERID || row.referid || row.REFERID_SOURCE;

  let rowsSave = [];
  const d_update = moment().format('YYYY-MM-DD HH:mm:ss');
  const rowsLabResult = await hisModel.getLabResult(db, 'visitNo', visitNo);
  sentContent += '  - lab result = ' + rowsLabResult.length + '\r';
  if (rowsLabResult && rowsLabResult.length) {
    for (const r of rowsLabResult) {
      const cHOSPCODE = r.HOSPCODE || r.hospcode || process.env.HOSPCODE;
      const investvalue = r.INVESTVALUE || r.investvalue || '';
      const investresult = r.INVESTRESULT || r.investresult || '';
      await rowsSave.push({
        HOSPCODE: cHOSPCODE,
        REFERID: referID,
        REFERID_PROVINCE: cHOSPCODE + referID,
        PID: r.PID || r.pid || r.HN || r.hn,
        SEQ: visitNo,
        AN: r.AN || r.an || '',
        DATETIME_INVEST: r.DATETIME_INVEST || r.datetime_invest || '',
        INVESTTYPE: r.INVESTTYPE || r.investtype || 'LAB',
        INVESTCODE: r.INVESTCODE || r.investcode || r.LOCALCODE || r.localcode || '',
        LOCALCODE: r.LOCALCODE || r.localcode || '',
        ICDCM: r.ICDCM || r.icdcm || '',
        LOINC: r.LOINC || r.loinc || '',
        INVESTNAME: r.INVESTNAME || r.investname || '',
        DATETIME_REPORT: r.DATETIME_REPORT || r.datetime_report || '',
        INVESTVALUE: investvalue.toString(),
        LH: r.LH || r.lh || '',
        UNIT: r.UNIT || r.unit || '',
        NORMAL_MIN: r.NORMAL_MIN || r.normal_min || '',
        NORMAL_MAX: r.NORMAL_MAX || r.normal_max || '',
        INVESTRESULT: investresult.toString(),
        D_UPDATE: r.D_UPDATE || r.d_update || d_update
      });
    }
    const saveResult: any = await referSending('/save-investigation-refer', rowsSave);
    if (saveResult.statusCode === 200) {
      sentResult.investigationRefer.success += rowsSave.length;
    } else {
      console.log('investigation-refer error:', saveResult);
      sentResult.investigationRefer.fail += rowsSave.length;
    }
    sentContent += '    -- SEQ ' + visitNo + ' ' + JSON.stringify(saveResult.result || saveResult.message) + '\r';
  }
  return rowsLabResult;
}

async function getAdmission(db, visitNo) {
  const d_update = moment().format('YYYY-MM-DD HH:mm:ss');
  const rows = await hisModel.getAdmission(db, 'visitNo', visitNo, hcode);
  sentContent += '  - admission = ' + rows.length + '\r';
  if (rows && rows.length) {
    for (const row of rows) {
      const data = await {
        HOSPCODE: row.HOSPCODE || row.hospcode || hcode,
        PID: row.PID || row.pid || row.HN || row.hn,
        SEQ: row.SEQ || row.seq || visitNo,
        AN: row.AN || row.an,
        CID: row.CID || row.cid || '',
        DATETIME_ADMIT: row.DATETIME_ADMIT || row.datetime_admit,
        WARDADMIT: row.WARDADMIT || row.wardadmit || '',
        INSTYPE: row.INSTYPE || row.instype || '',
        TYPEIN: row.TYPEIN || row.typein || '',
        REFERINHOSP: row.REFERINHOSP || row.referinhosp || '',
        CAUSEIN: row.CAUSEIN || row.causein || '',
        ADMITWEIGHT: row.ADMITWEIGHT || row.admitweight || 0,
        ADMITHEIGHT: row.ADMITHEIGHT || row.admitheight || 0,
        DATETIME_DISCH: row.DATETIME_DISCH || row.datetime_disch || '',
        WARDDISCH: row.WARDDISCH || row.warddish || '',
        DISCHSTATUS: row.DISCHSTATUS || row.dischstatus || '',
        DISCHTYPE: row.DISCHTYPE || row.disctype || '',
        REFEROUTHOSP: row.REFEROUTHOSP || row.referouthosp || '',
        CAUSEOUT: row.CAUSEOUT || row.causeout || '',
        COST: row.COST || row.cost || '',
        PRICE: row.PRICE || row.price || '',
        PAYPRICE: row.PAYPRICE || row.payprice || '',
        ACTUALPAY: row.ACTUALPAY || row.actualpay || '',
        PROVIDER: row.PROVIDER || row.provider || row.dr || '',
        DRG: row.DRG || row.drg || '',
        RW: row.RW || row.rw || 0,
        ADJRW: row.ADJRW || row.adjrw || 0,
        ERROR: row.ERROR || row.error || '',
        WARNING: row.WARNING || row.warning || '',
        ACTLOS: row.ACTLOS || row.actlos || 0,
        GROUPER_VERSION: row.GROUPER_VERSION || row.grouper_version || '',
        CLINIC: row.CLINIC || row.clinic || '',
        MAIN: row.MAIN || row.main || '',
        SUB: row.HSUB || row.hsub || row.SUB || row.sub || '',
        D_UPDATE: row.D_UPDATE || row.d_update || d_update,
      }

      const saveResult: any = await referSending('/save-admission', data);
      sentContent += '    -- AN ' + data.AN + ' ' + (saveResult.result || saveResult.message) + '\r';
    }
  }
  return rows;
}

async function getProcedureIpd(db, an) {
  if (!an) {
    return [];
  }
  const d_update = moment().format('YYYY-MM-DD HH:mm:ss');
  const rows = await hisModel.getProcedureIpd(db, an, hcode);
  sentContent += '  - procedure_ipd = ' + rows.length + '\r';
  let rowSave = [];
  if (rows && rows.length) {
    for (const row of rows) {
      await rowSave.push({
        HOSPCODE: row.HOSPCODE || row.hospcode,
        PID: row.PID || row.pid || row.HN || row.hn,
        AN: row.AN || row.an,
        PROCEDCODE: row.PROCEDCODE || row.procedcode || row.OP_CODE || row.op_code,
        PROCEDNAME: row.PROCEDNAME || row.procedname || row.OP_NAME || row.op_name || '',
        DATETIME_ADMIT: row.DATETIME_ADMIT || row.datetime_admit || '',
        TIMESTART: row.TIMESTART || row.timestart || '',
        TIMEFINISH: row.TIMEFINISH || row.timefinish || '',
        WARDSTAY: row.WARDSTAY || row.wardstay || '',
        SERVICEPRICE: row.SERVICEPRICE || row.serviceprice || 0,
        PROVIDER: row.PROVIDER || row.provider || row.dr || '',
        D_UPDATE: row.D_UPDATE || row.d_update || row.date || d_update,
        CID: row.CID || row.cid || '',
      })
    }
    const saveResult = await referSending('/save-procedure-ipd', rowSave);
    sentContent += '    -- ' + an + ' ' + JSON.stringify(saveResult) + '\r';
  }
  return rowSave;
}

async function getDrugAllergy(db, hn, sentResult) {
  if (!hn) {
    return [];
  }
  const d_update = moment().format('YYYY-MM-DD HH:mm:ss');
  try {
    let rowSave = [];
    const rows = await hisModel.getDrugAllergy(db, hn, hcode);
    sentResult += '  - drugallergy = ' + rows.length + '\r';
    if (rows && rows.length) {
      for (const row of rows) {
        await rowSave.push({
          HOSPCODE: hcode,
          PID: row.PID || row.pid || row.HN || row.hn,
          DATERECORD: row.DATERECORD || null,
          DRUGALLERGY: row.DRUGALLERGY || null,
          DNAME: row.DNAME || null,
          TYPEDX: row.TYPEDX || null,
          ALEVEL: row.ALEVEL || null,
          SYMPTOM: row.SYMPTOM || null,
          INFORMANT: row.INFORMANT || null,
          INFORMHOSP: row.INFORMHOSP || null,
          DETAIL: row.DETAIL || null,
          DID: row.DID || null,
          DID_TMT: row.DID_TMT,
          D_UPDATE: row.D_UPDATE || row.d_update || row.date || d_update,
          CID: row.CID || row.cid || '',
          ID: row.ID || '',
        });
      }
    }
    const saveResult = await referSending('/save-drugallergy', rowSave);
    sentResult += '    -- ' + hn + ' ' + JSON.stringify(saveResult) + '\r';
    // sentResult.drugAllergy.success += 1;
    return rowSave;
  } catch (error) {
    return [];
  }
}

async function referSending(path, dataArray) {
  // const fixedUrl = fastify.mophService.nRefer || process.env.NREFER_URL1 || 'http://connect.moph.go.th/nrefer-api';
  const fixedUrl = process.env.NREFER_URL1 || 'http://connect.moph.go.th/nrefer-api';
  const mophUrl = fixedUrl.split('/');
  let urlPath = '/' + mophUrl[3];
  urlPath += mophUrl[4] ? ('/' + mophUrl[4]) : '';
  urlPath += mophUrl[5] ? ('/' + mophUrl[5]) : '';
  const hostDetail: any = mophUrl[2].split(':');
  hostDetail[1] = hostDetail[1] ? hostDetail[1] : 80;

  const dataSending = querystring.stringify({
    ip: crontabConfig['client_ip'] || fastify.ipAddr || '127.0.0.1',
    hospcode: hcode, data: JSON.stringify(dataArray),
    processPid: process.pid, dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
    sourceApiName: 'HIS-connect', apiVersion, subVersion,
    hisProvider: process.env.HIS_PROVIDER
  });

  const options = {
    // hostname: process.env.NREFER_URL,
    // port: process.env.NREFER_PORT,
    // path: process.env.NREFER_PATH + path,
    hostname: hostDetail[0],
    port: hostDetail[1],
    path: urlPath + path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer ' + nReferToken,
      'Content-Length': Buffer.byteLength(dataSending)
    }
  };

  let ret = '';
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => {
        ret += chunk;
      });
      res.on('end', () => {
        // console.log(ret);
        const data = JSON.parse(ret);
        // console.log('ret', data);
        resolve(data);
      });
    });

    req.on('error', (e: any) => {
      reject(e);
    });

    req.write(dataSending);
    req.end();
  });

}

async function getNReferToken(apiKey, secretKey) {
  const fixedUrl = fastify.mophService.nRefer || process.env.NREFER_URL1 || 'http://connect.moph.go.th/nrefer-api/nrefer';
  const mophUrl = fixedUrl.split('/');
  let urlPath = '/' + mophUrl[3] + '/';
  urlPath += mophUrl[4] ? (mophUrl[4] + '/') : '';
  urlPath += mophUrl[5] ? (mophUrl[5] + '/') : '';

  const postData = querystring.stringify({
    ip: crontabConfig['client_ip'] || fastify.ipAddr || '127.0.0.1',
    apiKey: apiKey, secretKey: secretKey,
    hospcode: hcode,
    processPid: process.pid, dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
    sourceApiName: 'HIS-connect', apiVersion, subVersion,
    hisProvider: process.env.HIS_PROVIDER
  });

  const options = {
    // hostname: process.env.NREFER_URL,
    // port: process.env.NREFER_PORT,
    // path: process.env.NREFER_PATH + '/login/api-key',
    hostname: mophUrl[2],
    path: urlPath + 'login/api-key',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  let ret = '';
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => {
        ret += chunk;
      });
      res.on('end', (error) => {
        if (error || !ret) {
          reject(error);
        } else {
          // console.log(ret);
          const data = JSON.parse(ret);
          // console.log('ret', data);
          resolve(data);
        }
      });
    });

    req.on('error', (e: any) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });

}

async function expireToken(token) {
  const fixedUrl = fastify.mophService.nRefer || process.env.NREFER_URL1 || 'http://connect.moph.go.th/nrefer-api';
  const mophUrl = fixedUrl.split('/');
  let urlPath = '/' + mophUrl[3] + '/';
  urlPath += mophUrl[4] ? (mophUrl[4] + '/') : '';
  urlPath += mophUrl[5] ? (mophUrl[5] + '/') : '';
  // let url = process.env.NREFER_URL1;
  // url += url.substr(-1, 1) === '/' ? '' : '/';

  const postData = querystring.stringify({
    ip: crontabConfig['client_ip'] || fastify.ipAddr || '127.0.0.1',
    token: token
  });

  const options = {
    // hostname: process.env.NREFER_URL,
    // port: process.env.NREFER_PORT,
    // path: process.env.NREFER_PATH + '/login/expire-token',
    hostname: mophUrl[2],
    path: urlPath + 'login/login/expire-token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${token}`,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  let ret = '';
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => {
        ret += chunk;
      });
      res.on('end', (error) => {
        if (error || !ret) {
          reject(error);
        } else {
          const data = JSON.parse(ret);
          // console.log('ret', data);
          resolve(data);
        }
      });
    });

    req.on('error', (e: any) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

// async function getHttpHeaders(token) {
//   const httpHeaders: HttpHeaders = new HttpHeaders()
//     .set('authorization', `Bearer ${token}`);
//   return httpHeaders;
// }

async function writeResult(file, content) {
  fs.writeFile(file, content, async function (err) {
    if (err) {
      console.log(err.message);
    } else {
      let fileDesc: any;
      await fs.stat(resultText, (err, stat) => {
        if (err) {
          console.log(err.message);
        } else {
          fileDesc = stat;
        }
      });
    }
  });
}

const router = (request, reply, dbConn: any, config = {}) => {
  crontabConfig = config;
  crontabConfig['client_ip'] = '127.0.0.1';
  if (request) {
    if (request.headers) {
      crontabConfig['client_ip'] = request.headers['x-real-ip'] || request.headers['x-forwarded-for'] || request.ip || request.raw['ip'] || crontabConfig['client_ip'];
    } else {
      crontabConfig['client_ip'] = request.ip || crontabConfig['client_ip'];
    }
  }
  apiVersion = crontabConfig.version ? crontabConfig.version : '-';
  subVersion = crontabConfig.subVersion ? crontabConfig.subVersion : '-';
  return sendMoph(request, reply, dbConn);
};
module.exports = router;
