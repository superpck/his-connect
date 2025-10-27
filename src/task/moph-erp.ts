import moment = require("moment");
import { sendingToMoph, updateHISAlive, checkAdminRequest, updateAdminRequest } from "../middleware/moph-refer";
import hisModel from './../routes/his/hismodel';
import { Knex } from 'knex';
import { getIP } from "../middleware/utils";
const packageJson = require('../../package.json');

const dbConnection = require('../plugins/db');
let db: Knex = dbConnection('HIS');
const hisProvider = process.env.HIS_PROVIDER || '';
const hospcode = process.env.HOSPCODE || '';

export const sendBedOccupancy = async (dateProcess: any = null) => {
  let whatUTC = Intl?.DateTimeFormat().resolvedOptions().timeZone || '';
  let currDate: any;
  if (whatUTC == 'UTC' || whatUTC == 'Etc/UTC') {
    currDate = moment().locale('TH').add(7, 'hours').subtract(1, 'minutes').startOf('hour').format('YYYY-MM-DD HH:mm:ss');
  } else {
    currDate = moment().locale('TH').subtract(1, 'minutes').startOf('hour').format('YYYY-MM-DD HH:mm:ss');
  }

  // console.log('sendBedOccupancy currDate:', currDate, moment().utc().format('HH:mm:ss'));
  // console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);
  // console.log(new Date().getTimezoneOffset());

  let date = dateProcess || currDate;

  let dateOpd = date; // เฉพาะ OPD Visit
  if (moment().get('hour') == 3) {  // ทุกๆ ตี 3 ให้ส่งข้อมูลย้อนหลัง 1 เดือน
    dateOpd = moment().locale('TH').subtract(1, 'month').format('YYYY-MM-DD');
  }

  let clinicResult = null, wardResult = null, opdResult = null;
  do {
    [clinicResult, wardResult] = await Promise.all([
      sendBedOccupancyByClinic(date),
      sendBedOccupancyByWard(date),
    ]);
    date = moment(date).add(1, 'day').format('YYYY-MM-DD');
  } while (date <= currDate);

  do {
    [opdResult] = await Promise.all([
      sendOpdVisitByClinic(dateOpd)
    ]);
    dateOpd = moment(dateOpd).add(1, 'day').format('YYYY-MM-DD');
  } while (dateOpd <= currDate);

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
      return result;
    } else {
      console.log(moment().format('HH:mm:ss'), 'sendWardName', 'No ward data');
      return { statusCode: 200, message: 'No ward data' };
    }
  } catch (error) {
    console.log(moment().format('HH:mm:ss'), 'getWard error', error.message);
    return [];
  }
}

export const sendBedNo = async () => {
  try {
    let rows: any = await hisModel.getBedNo(db);
    if (rows && rows.length) {
      rows = rows.map(v => {
        return {
          ...v, hospcode: hospcode,
          hcode5: hospcode.length == 5 ? hospcode : null,
          hcode9: hospcode.length == 9 ? hospcode : null
        };
      });
      const result: any = await sendingToMoph('/save-bed-no', rows);
      console.log(moment().format('HH:mm:ss'), 'sendBedNo', result.status || '', result.message || '', rows.length);
      return result;
    } else {
      return { statusCode: 200, message: 'No bed no data' };
    }
  } catch (error) {
    console.log(moment().format('HH:mm:ss'), 'getBedNo error', error.message);
    return { statusCode: error.status || 500, message: error.message || error };
  }
}

export const updateAlive = async () => {
  const ipServer: any = getIP();
  try {
    let data = {
      api_date: global.apiStartTime,
      server_date: moment().format('YYYY-MM-DD HH:mm:ss'),
      hospcode,
      version: packageJson.version || '',
      subversion: packageJson.subVersion || '',
      port: process.env.PORT || 0,
      ip: ipServer.ip,
      his: hisProvider, ssl: process.env?.SSL_ENABLE || null,
      /* 
        `ssl` tinyint unsigned DEFAULT NULL,
        `dbconnect` tinyint unsigned DEFAULT NULL,
      */
    };
    const result: any = await updateHISAlive(data);
    const status = result.status == 200 || result.statusCode == 200 ? true : false;
    if (status) {
      console.log(moment().format('HH:mm:ss'), '✅ Sent API Alive status result', result.status || '', result.statusCode || '', result?.message || '');
    } else {
      console.log(moment().format('HH:mm:ss'), '❌ Sent API Alive status result', result.status || '', result.statusCode || '', result?.message || '');
    }
    return result;
  } catch (error) {
    console.log(moment().format('HH:mm:ss'), '❌ Sent API Alive status error:', error?.status || error?.statusCode || '', error?.message || error || '');
    return [];
  }
}

export const erpAdminRequest = async () => {
  try {
    const result: any = await checkAdminRequest();
    if (result.status == 200 || result.statusCode == 200) {
      const rows = result?.rows || result?.data || [];
      let requestResult: any;
      for (let req of rows) {
        if (req.request_type == 'bed') {
          requestResult = await sendBedNo();
          console.log('ERP admin request get bed no.', requestResult?.statusCode || requestResult?.status || '', requestResult?.message || '');
          await updateAdminRequest({
            request_id: req.request_id,
            status: requestResult.statusCode == 200 || requestResult.status == 200 ? 'success' : 'failed',
            isactive: 0
          });
        } else if (req.request_type == 'ward') {
          requestResult = await sendWardName();
          console.log('ERP admin request get ward name.', requestResult?.statusCode || requestResult?.status || '', requestResult?.message || '');
          await updateAdminRequest({
            request_id: req.request_id,
            status: requestResult.statusCode == 200 || requestResult.status == 200 ? 'success' : 'failed',
            isactive: 0
          });
        } else if (req.request_type == 'alive') {
          requestResult = await updateAlive();
          console.log('ERP admin request send alive status.', requestResult?.statusCode || requestResult?.status || '', requestResult?.message || '');
        } else if (req.request_type == 'occupancy') {
          // requestResult = await sendBedOccupancy();
          // console.log('erpAdminRequest occupancy', requestResult);
        }
      }
    } else {
      console.log(moment().format('HH:mm:ss'), 'No admin request', result.status || result?.statusCode || '', result?.data?.message || result?.message || '');
    }
    return result;
  } catch (error) {
    console.log(moment().format('HH:mm:ss'), 'API Alive error', error.message);
    return [];
  }
}