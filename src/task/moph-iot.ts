console.log('Start MOPH IoT Task');

import { Knex } from 'knex';
import moment = require('moment');
import hisModel from './../routes/his/hismodel';
const dbConnection = require('../plugins/db');
let db: Knex = dbConnection('HIS');

const process = async () => {
  const dateStart = moment().subtract(30, 'minutes').format('YYYY-MM-DD 00:00:00');
  const dateEnd = moment().subtract(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');

  console.log('MOPH IoT Process from', dateStart, 'to', dateEnd);
  return await getData(dateStart, dateEnd);
}

async function getData(dateStart: string, dateEnd: string) {
  console.log(moment().format('HH:mm:ss'), 'MOPH IoT Process from', dateStart, 'to', dateEnd);
  try {
    let date = moment(dateStart).format('YYYY-MM-DD');
    do {
      let opdVisit = await hisModel.getService(db, 'date_serv', date);
      let vsData = [];
      opdVisit = opdVisit.map((row: any) => {
        for (const key in row) {
          row[key.toLowerCase()] = row[key];
        }
        if (row.time_servlength > 3 && row.time_serv.indexOf(':') === -1) {
          row.time_serv = row.time_serv ? row.time_serv.replace(/(\d{2})(\d{2})(\d{2})/, '$1:$2:$3') : '';
        }
        row.date_serv = moment(row.date_serv).format('YYYY-MM-DD');
        row.datetime_serv = moment(row.date_serv + ' ' + (row.time_serv || '')).format('YYYY-MM-DD HH:mm:ss');
        vsData.push({
          hospcode: row.hospcode,
          vn: row.vn || row.seq,
          hn: row.hn || row.pid,
          date_serv: row.date_serv,
          time_serv: row.time_serv,
          datetime_serv: row.datetime_serv,
          tem: +(row.btemp || 0) || null,
          sbp: +(row.sbp || 0) || null,
          dbp: +(row.dbp || 0) || null,
          pr: +(row.pr || row.pulse || 0) || null,
          rr: +(row.rr || 0) || null,
          o2sat: +(row.o2sat || 0) || null,
          weight: +(row.weight || 0) || null,
          height: +(row.height || 0) || null,
          waist: +(row.waist || 0) || null,
          gcs_e: row.gcs_e,
          gcs_v: row.gcs_v,
          gcs_m: row.gcs_m,
          pupil_left: row.pupil_left,
          pupil_right: row.pupil_right
        });
        return row;
      });
      // console.table(vsData);
      console.log(moment().format('HH:mm:ss'), 'MOPH IoT Process Date:', date, 'Total Records:', vsData.length);
      const results = await sendToMoph(vsData);
      
      date = moment(date).add(1, 'day').format('YYYY-MM-DD');
    } while (date <= moment(dateEnd).format('YYYY-MM-DD'))
  } catch (error) {
    throw error;
  }
}

async function sendToMoph(rows: any[]) {
  if (rows.length === 0) return;
  let sentResult = [];
  for (const row of rows) {
    const hl7Form = hl7Formatted(row);
  }
}

function hl7Formatted(row: any) {
  return row;
}

export default { process };