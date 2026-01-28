import * as moment from 'moment';
import hisModel from './../routes/his/hismodel';
import { Knex } from 'knex';
import { dateLen } from '../middleware/utils';

const dbConnection = require('../plugins/db');
let db: Knex = dbConnection('HIS');
let hisHospcode: string = process.env.HOSPCODE;
let token: string;

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
        let data: any = {
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
        data.pdx = '';
        data.drpdx = null;
        let i = 0;
        for (const d of row.dx) {
          if (d.diagtype === '1') {
            data.pdx = (d.diagcode || '').replace('.', '').toUpperCase();
            data.drpdx = d.provider || null;
          } else {
            if (i++ < 12) {
              data[`sdx${i}`] = (d.diagcode || '').replace('.', '').toUpperCase();
              data[`drsdx${i}`] = d.provider || null;
            }
          }
        }

        i = 0;
        for (const op of row.op) {
          if (i++ < 20) {
            data[`proc${i}`] = op.procedcode.replace(/\/|\-|\*/g, '+').replace('.', '');
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
    rows = toLowerColumnName(rows);
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
    dx = toLowerColumnName(dx);
    dx.filter((r: any) => ['1', '2', '3', '5'].includes(r.diagtype))
      .forEach((d: any) => {
        const index = rows.findIndex((r: any) => r.an === d.an);
        rows[index].dx.push(d);
      });

    let op = await hisModel.getProcedureIpd(db, anList);
    op = toLowerColumnName(op);
    op.forEach((p: any) => {
      const index = rows.findIndex((r: any) => r.an === p.an);
      rows[index].op.push(p);
    });

    // let charge = await hisModel.getChargeIpd(db, anList);
    // charge = toLowerColumnName(charge);
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
function toLowerColumnName(data: any) {
  if (!data) {
    return data;
  }
  const isArray = Array.isArray(data);
  const dataArray = isArray ? data : [data];

  const result = dataArray.map(row => {
    const newRow: any = {};
    for (const key in row) {
      if (row.hasOwnProperty(key)) {
        newRow[key.toLowerCase()] = row[key];
      }
    }
    return newRow;
  });

  return isArray ? result : result[0];
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

async function getToken(){
  if (token){
    return token;
  }
  // token = await mophApi.getToken();
  return token;
}
async function sendRow(row: any){
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