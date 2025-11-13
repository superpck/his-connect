import moment = require("moment");
import { sendingToMoph } from "../middleware/moph-refer";
import hisModel from './../routes/his/hismodel';
import { Knex } from 'knex';

const dbConnection = require('../plugins/db');
let db: Knex = dbConnection('HIS');
const hospcode = process.env.HOSPCODE || '';

export const opdVisit = async (date: any) => {
  try {
    let rows: any = await hisModel.getVisitForMophAlert(db, date);
    if (rows && rows.length) {
      for (let row of rows) {
        row.hospcode = hospcode;
        const result: any = await sendingToMoph('/save-moph-alert', row);
        console.log(moment().format('HH:mm:ss'), 'send moph alert', result.status || '', result.message || '', rows.length);
        // return result;
      }
    } else {
      console.log(moment().format('HH:mm:ss'), 'send moph alert', 'No opd visit data');
      return { statusCode: 200, message: 'No opd visit data' };
    }
  } catch (error) {
    console.log(moment().format('HH:mm:ss'), 'getVisitForMophAlert error', error.message);
    return [];
  }
}
