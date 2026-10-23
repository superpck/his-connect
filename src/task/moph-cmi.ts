import moment from 'moment';
import hisModel from './../routes/his/hismodel';
import { Knex } from 'knex';
import { dateLen, toLowerCaseName } from '../utils/utils';

const dbConnection = require('../plugins/db');
let db: Knex = dbConnection('HIS');
let hisHospcode: string = process.env.HOSPCODE;
let token: string;
interface DRGColumn {
  hcode?: string;
  an: string;
  hn: string;
  pid?: string;
  seq?: string;
  dateadm: string;
  timeadm: string;
  datedsc: string;
  timedsc: string;
  los?: number;
  leaveday?: number;
  actlos: number;
  discht: string;
  dischs: string;
  warddsc?: string;
  dept?: string;
  namepat?: string;
  person_id?: string;
  dob?: string;
  age?: number;
  ageday?: number;
  sex?: string;
  admwt?: number;
  changewt?: string;
  amphur?: string;
  marriage?: string;
  occupa?: string;
  nation?: string;
  pdx: string;
  drpdx?: string;
  sdx?: any[];
  sdx1?: string;
  drsdx1?: string;
  sdx2?: string;
  drsdx2?: string;
  sdx3?: string;
  drsdx3?: string;
  sdx4?: string;
  drsdx4?: string;
  sdx5?: string;
  drsdx5?: string;
  sdx6?: string;
  drsdx6?: string;
  sdx7?: string;
  drsdx7?: string;
  sdx8?: string;
  drsdx8?: string;
  sdx9?: string;
  drsdx9?: string;
  sdx10?: string;
  drsdx10?: string;
  sdx11?: string;
  drsdx11?: string;
  sdx12?: string;
  drsdx12?: string;
  proc?: any[];
  proc1?: string;
  datein1?: string;
  timein1?: string;
  dateout1?: string;
  timeout1?: string;
  drop1?: string;
  proc2?: string;
  datein2?: string;
  timein2?: string;
  dateout2?: string;
  timeout2?: string;
  drop2?: string;
  proc3?: string;
  datein3?: string;
  timein3?: string;
  dateout3?: string;
  timeout3?: string;
  drop3?: string;
  proc4?: string;
  datein4?: string;
  timein4?: string;
  dateout4?: string;
  timeout4?: string;
  drop4?: string;
  proc5?: string;
  datein5?: string;
  timein5?: string;
  dateout5?: string;
  timeout5?: string;
  drop5?: string;
  proc6?: string;
  datein6?: string;
  timein6?: string;
  dateout6?: string;
  timeout6?: string;
  drop6?: string;
  proc7?: string;
  datein7?: string;
  timein7?: string;
  dateout7?: string;
  timeout7?: string;
  drop7?: string;
  proc8?: string;
  datein8?: string;
  timein8?: string;
  dateout8?: string;
  timeout8?: string;
  drop8?: string;
  proc9?: string;
  datein9?: string;
  timein9?: string;
  dateout9?: string;
  timeout9?: string;
  drop9?: string;
  proc10?: string;
  datein10?: string;
  timein10?: string;
  dateout10?: string;
  timeout10?: string;
  drop10?: string;
  proc11?: string;
  datein11?: string;
  timein11?: string;
  dateout11?: string;
  timeout11?: string;
  drop11?: string;
  proc12?: string;
  datein12?: string;
  timein12?: string;
  dateout12?: string;
  timeout12?: string;
  drop12?: string;
  proc13?: string;
  datein13?: string;
  timein13?: string;
  dateout13?: string;
  timeout13?: string;
  drop13?: string;
  proc14?: string;
  datein14?: string;
  timein14?: string;
  dateout14?: string;
  timeout14?: string;
  drop14?: string;
  proc15?: string;
  datein15?: string;
  timein15?: string;
  dateout15?: string;
  timeout15?: string;
  drop15?: string;
  proc16?: string;
  datein16?: string;
  timein16?: string;
  dateout16?: string;
  timeout16?: string;
  drop16?: string;
  proc17?: string;
  datein17?: string;
  timein17?: string;
  dateout17?: string;
  timeout17?: string;
  drop17?: string;
  proc18?: string;
  datein18?: string;
  timein18?: string;
  dateout18?: string;
  timeout18?: string;
  drop18?: string;
  proc19?: string;
  datein19?: string;
  timein19?: string;
  dateout19?: string;
  timeout19?: string;
  drop19?: string;
  proc20?: string;
  datein20?: string;
  timein20?: string;
  dateout20?: string;
  timeout20?: string;
  drop20?: string;
  inscl?: string;
  subtype?: string;
  cid?: string;
  dateissue?: string;
  dateexpire?: string;
  hospmain?: string;
  hospsub?: string;
  referin?: string;
  chwrefer_i?: string;
  referout?: string;
  chwrefer_o?: string;
  refer_err?: string;
  operate?: number;
  x_ray?: number;
  lab?: number;
  surgery?: number;
  service?: number;
  drug?: number;
  icu?: number;
  room?: number;
  food?: number;
  others?: number;
  invalid?: string;
  pttype?: string;
  total?: number;
  paid?: number;
  insure?: string;
  grp?: string;
  insuregrp?: string;
  mdc?: string;
  drg?: string;
  rw?: number;
  adjrw?: number;
  wtlos?: number;
  ot?: number;
  result?: string;
  err?: string;
  warn?: string;
  rem?: string;
  tgrp?: string;
  udp?: string;
}
const addedColumn = ['seq', 'sdx', 'proc', 'udp'];

const processCMI = (async (dateStart: any = null, dateEnd: any = null) => {
  dateStart = dateStart ? moment(dateStart).format('YYYY-MM-DD') : moment().subtract(35, 'days').format('YYYY-MM-DD');
  dateEnd = dateEnd ? moment(dateEnd).format('YYYY-MM-DD') : moment().subtract(30, 'days').format('YYYY-MM-DD');

  return await getIPD(dateStart, dateEnd);
});

const getIPD = (async (dateStart: string, dateEnd: string) => {
  try {
    dateStart = moment(dateStart).format('YYYY-MM-DD');
    dateEnd = moment(dateEnd).format('YYYY-MM-DD');

    let rows: any[] = [];
    let date: any = dateStart;
    do {
      const result: any = await getIPDDischarge(date);
      if (result && result.length > 0) {
        rows = [...rows, ...result];
      }
      date = moment(date).add(1, 'days').format('YYYY-MM-DD');
    } while (date <= dateEnd);

    if (rows.length > 0) {
      console.log(moment().format('HH:mm:ss'), `DRG/CMI: Discharge founded ${rows.length} IPD discharges on ${dateStart} to ${dateEnd}`);
      let drgRows = [];
      for (let row of rows) {
        let data: DRGColumn = {
          hcode: hisHospcode,
          an: row.an,
          hn: row.hn || row.pid,
          pid: row.hn || row.pid,
          seq: row?.vn || row.seq || null,
          sex: row?.sex, dob: row.dob || null,
          age: row?.age?.year || 0, ageday: row?.age?.year == 0 ? row?.age?.days : 0,
          dateadm: moment(row?.datetime_admit).format('YYYY-MM-DD'),
          timeadm: moment(row?.datetime_admit).format('HHmm'),
          datedsc: moment(row?.datetime_discharge).format('YYYY-MM-DD'),
          timedsc: moment(row?.datetime_discharge).format('HHmm'),
          warddsc: row.warddsc || row.warddisch,
          dischs: row.dischstatus,
          discht: row.dischtype,
          los: Number(row?.los || 0), actlos: Number(row?.actlos || 0),
          pdx: '',
          drpdx: null,
          sdx: [],
          proc: [],
          referin: row?.referinhosp,
          admwt: Number(row?.admwt || row?.admitweight || 0),
          insure: row?.instype || null,
          total: Number(row?.price || 0),
          mdc: row.mdc || row.drg.substring(0, 2),
          drg: row.drg,
          rw: Number(row.rw || 0),
          adjrw: Number(row.adjrw || 0),
          wtlos: Number(row.wtlos || 0),
          ot: row.ot || null,
          err: row?.error || 0,
          warn: row?.warning || 0,
          tgrp: row.grouper_version,
          udp: row?.udp || row?.d_update || row?.lastupdate || null
        };
        let i = 0;
        for (const d of row.dx) {
          const dx = (d.diagcode || '').replace('.', '').toUpperCase();
          if (d.diagtype === '1') {
            data.pdx = dx;
            data.drpdx = d.provider || null;
          } else {
            if (i++ < 12) {
              data.sdx.push(dx);
              data[`sdx${i}`] = dx;
              data[`drsdx${i}`] = d.provider || null;
            }
          }
        }

        i = 0;
        for (const op of row.op) {
          const proc = op.procedcode.replace(/\/|\-|\*/g, '+').replace('.', '');
          if (proc && i++ < 20) {
            data.proc.push(proc);
            data[`proc${i}`] = proc;
            data[`drop${i}`] = op.provider || op.doctor || null;
            data[`datein${i}`] = op.timestart ? moment(op.timestart).format('YYYY-MM-DD') : null;
            data[`timein${i}`] = op.timestart ? moment(op.timestart).format('HHmm') : null;
            data[`dateout${i}`] = op.timefinish ? moment(op.timefinish).format('YYYY-MM-DD') : null;
            data[`timeout${i}`] = op.timefinish ? moment(op.timefinish).format('HHmm') : null;
          }
        }
        drgRows.push(data);
      }
      return await sendingToMoph(drgRows);
    } else {
      console.error(moment().format('HH:mm:ss'), `DRG/CMI: No data found for IPD discharge on ${date}`);
      return false;
    }
  } catch (error) {
    console.error(moment().format('HH:mm:ss'), 'DRG/CMI: Error in getIPD:', error.message || error);
    return error;
  }
});

async function getIPDDischarge(date: any) {
  try {
    date = moment(date).format('YYYY-MM-DD');
    let rows = await hisModel.getAdmission(db, 'datedisc', date, '', false);
    if (!rows || rows.length === 0) {
      return [];
    }
    rows = toLowerCaseName(rows);
    for (let row of rows) {
      row.dob = row?.dob ? moment(row.dob).format('YYYY-MM-DD') : null;
      if (row.dob && row?.datetime_admit) {
        row.age = await dateLen(row.dob, row.datetime_admit);
      } else {
        row.age = { year: 0, days: 0 };
      }
      row.dx = [];
      row.op = [];
      row.charge = [];
    }
    rows = rows.filter((r: any) => r?.drg && r?.grouper_version);

    if (!rows || rows.length === 0) {
      return [];
    }

    let anList = rows.map((r: any) => r.an);
    let dx = await hisModel.getDiagnosisIpd(db, 'an', anList);
    dx = toLowerCaseName(dx);
    dx.filter((r: any) => ['1', '2', '3', '5'].includes(r.diagtype))
      .forEach((d: any) => {
        const index = rows.findIndex((r: any) => r.an === d.an);
        rows[index].dx.push(d);
      });

    let op = await hisModel.getProcedureIpd(db, anList);
    op = toLowerCaseName(op);
    op.forEach((p: any) => {
      const index = rows.findIndex((r: any) => r.an === p.an);
      rows[index].op.push(p);
    });

    // let charge = await hisModel.getChargeIpd(db, anList);
    // charge = toLowerCaseName(charge);
    // charge.forEach((c: any) => {
    //   const index = rows.findIndex((r: any) => r.an === c.an);
    //   rows[index].charge.push(c);
    // });

    return rows;
  } catch (error) {
    console.error(moment().format('HH:mm:ss'), error.message || error);
    throw error;
  }
}

async function sendingToMoph(rows: any) {
  try {
    // get CMI token
    await getToken();
    // if (!token) {
    //   console.error(moment().format('HH:mm:ss'), 'DRG/CMI: Cannot get MOPH API token.');
    //   return null;
    // }
    // console.log(moment().format('HH:mm:ss'), `DRG/CMI: Sending ${rows.length} records to MOPH CMI API...`);
    // // send data to MOPH CMI API
    // const result = await mophApi.sendCMIData(token, rows);
    // if (result && result.status === 'success') {
    //   console.log(moment().format('HH:mm:ss'), `DRG/CMI: Successfully sent ${rows.length} records to MOPH CMI API.`);
    //   return rows.length;
    // } else {
    //   console.error(moment().format('HH:mm:ss'), 'DRG/CMI: Failed to send data to MOPH CMI API.', result);
    //   return null;
    // }

    let results = [];
    for (let row of rows) {
      const result = await sendRow(row);
      results.push(result);
    }
    console.table(rows[2]);
    return results;
  } catch (error) {
    console.error(moment().format('HH:mm:ss'), 'DRG/CMI: Error in sendingToMoph:', error.message || error);
    throw error;
  }
}

async function getToken() {
  if (token) {
    return token;
  }
  // token = await mophApi.getToken();
  return token;
}
async function sendRow(row: any) {
  try {
    // console.log(moment().format('HH:mm:ss'), `DRG/CMI: Sending 1 record to MOPH CMI API...`);
    // // send data to MOPH CMI API
    // const result = await mophApi.sendCMIData(token, [row]);
    // if (result && result.status === 'success') {
    //   console.log(moment().format('HH:mm:ss'), `DRG/CMI: Successfully sent 1 record to MOPH CMI API.`);
    //   return true;
    // } else {
    //   console.error(moment().format('HH:mm:ss'), 'DRG/CMI: Failed to send data to MOPH CMI API.', result);
    //   return false;
    // }
    console.log(row);
    return true;
  } catch (error) {
    console.error(moment().format('HH:mm:ss'), 'DRG/CMI: Error in sendRow:', error.message || error);
    throw error;
  }
}

export default { processCMI };