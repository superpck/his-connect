import moment = require("moment");
import { sendingToMoph } from "../middleware/moph-refer";
import hisModel from './../routes/his/hismodel';
import { Knex } from 'knex';

const dbConnection = require('../plugins/db');
let db: Knex = dbConnection('HIS');
const hisProvider = process.env.HIS_PROVIDER || '';
const hospcode = process.env.HOSPCODE || '';

export const sendBedOccupancy = async (date: any = null) => {
  if (moment().get('hour') == 3) {
    date = moment().subtract(1, 'month').format('YYYY-MM-DD');
  }
  let currDate = moment().subtract(1, 'hour').format('YYYY-MM-DD');
  date = date || currDate;
  let clinicResult = null, wardResult = null;
  let opdResult = null;
  do {
    [clinicResult, wardResult, opdResult] = await Promise.all([
      sendBedOccupancyByClinic(date),
      sendBedOccupancyByWard(date),
      sendOpdVisitByClinic(date)
    ]);
    date = moment(date).add(1, 'day').format('YYYY-MM-DD');
  } while (date <= currDate);
  return { clinicResult, wardResult, opdResult };
}

const sendBedOccupancyByWard = async (date: any) => {
  try {
    let rows: any = await hisModel.concurrentIPDByWard(db, date);
    if (rows && rows.length) {
      rows = rows.map(v => {
        return { ...v, date, hospcode, his: hisProvider || '' };
      });
      const result: any = await sendingToMoph('/save-occupancy-rate-by-ward', rows);
      console.log(moment().format('HH:mm:ss'), 'send Occ Rate by ward', date, result.status || '', result.message || '', rows.length, 'rows');
    }
    return rows;
  } catch (error) {
    console.error(moment().format('HH:mm:ss'), 'sendBedOccupancy error by ward', date, error.message);
    return false;
  }
}

const sendBedOccupancyByClinic = async (date: any) => {
  try {
    let rows: any = await hisModel.concurrentIPDByClinic(db, date);
    if (rows && rows.length) {
      rows = rows.map(v => {
        return { ...v, date, hospcode, his: hisProvider || '' };
      });
      const result: any = await sendingToMoph('/save-occupancy-rate-by-clinic', rows);
      console.log(moment().format('HH:mm:ss'), 'send Occ rate by clinic', date, result.status || '', result.message || '', rows.length, 'rows');
    }
    return rows;
  } catch (error) {
    console.error(moment().format('HH:mm:ss'), 'sendBedOccupancy by clinic error', date, error.message);
    return false;
  }
}

const sendOpdVisitByClinic = async (date: any) => {
  try {
    let rows: any = await hisModel.sumOpdVisitByClinic(db, date);
    if (rows && rows.length) {
      rows = rows.map((v: any) => {
        return {
          ...v, hospcode, his: hisProvider || ''
        };
      });
      const result: any = await sendingToMoph('/save-sum-opd-visit-by-clinic', rows);
      console.log(moment().format('HH:mm:ss'), 'send Sum OPD visit by clinic', date, result.status || '', result.message || '', rows.length, 'rows');
    }
    return rows;
  } catch (error) {
    console.error(moment().format('HH:mm:ss'), 'sendSumOpdVisit by clinic error', date, error.message);
    return false;
  }
}

export const sendWardName = async () => {
  try {
    let rows: any = await hisModel.getWard(db);
    if (rows && rows.length) {
      rows = rows.map(v => {
        return { ...v, hospcode: process.env.HOSPCODE || '' };
      });
      const result: any = await sendingToMoph('/save-ward', rows);
      console.log(moment().format('HH:mm:ss'), 'sendWardName', result.status || '', result.message || '', rows.length);
    }
    return rows;
  } catch (error) {
    console.log(moment().format('HH:mm:ss'), 'getWard error', error.message);
    return [];
  }
}


/*
select * from visit_pttype where auth_code like 'EP%' and vn like '680922%';

*/