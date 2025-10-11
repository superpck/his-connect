import moment = require("moment");
import { sendingToMoph } from "../middleware/moph-refer";
import hisModel from './../routes/his/hismodel';
import { Knex } from 'knex';

const dbConnection = require('../plugins/db');
let db: Knex = dbConnection('HIS');

export const sendBedOccupancy = async () => {
  try {
    const date = moment().subtract(1, 'hour').format('YYYY-MM-DD');
    let rows: any = await hisModel.concurrentIPD(db, date);
    if (rows && rows.length) {
      rows = rows.map(v => {
        return { ...v, hospcode: process.env.HOSPCODE || '' };
      });
      const result: any = await sendingToMoph('/save-occupancy-rate', rows);
      console.log(moment().format('HH:mm:ss'), 'send Occ Rate', result.status || '', result.message || '', rows.length);
    }
    return rows;
  } catch (error) {
    console.error(moment().format('HH:mm:ss'), 'sendBedOccupancy error', error.message);
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