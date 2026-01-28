import moment = require('moment');
console.log(moment().format('HH:mm:ss'), 'Start MOPH IoT Task');

import { Knex } from 'knex';
import { sendingToMoph, getHospitalConfig } from '../middleware/moph-refer';
import hisModel from './../routes/his/hismodel';
const dbConnection = require('../plugins/db');
let db: Knex = dbConnection('HIS');
let hospitalConfig: any = null;

const processIoT = async () => {
  hospitalConfig = await getHospitalConfig();
  console.log(moment().format('HH:mm:ss'), 'MOPH IoT Hospital Config:', hospitalConfig);
  console.log(moment().format('HH:mm:ss'), 'MOPH IoT Hospital Config:', hospitalConfig.configure?.iot_service?.enable);
  if (!hospitalConfig || !hospitalConfig.configure) {
    console.error(moment().format('HH:mm:ss'), 'MOPH IoT Process Stop: No Hospital Config');
    return false;
  }
  if (!hospitalConfig.configure || !hospitalConfig.configure?.iot_service || hospitalConfig.configure?.iot_service?.enable != 1) {
    console.error(moment().format('HH:mm:ss'), 'MOPH IoT Process Stop: IoT Service Disabled');
    return false;
  }

  const dateStart = moment().subtract(30, 'minutes').format('YYYY-MM-DD 00:00:00');
  const dateEnd = moment().subtract(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');

  return await getData(dateStart, dateEnd);
}

async function getData(dateStart: string, dateEnd: string) {
  try {
    let date = moment(dateStart).format('YYYY-MM-DD');
    do {
      let opdVisit = await hisModel.getService(db, 'date_serv', date);
      if (opdVisit.length > 0) {
        console.log(moment().format('HH:mm:ss'), 'MOPH IoT Process:', date, ' founded:', opdVisit.length, 'rows');
        opdVisit = opdVisit.filter((row: any) => (row.cid || row.CID) && ((row.cid || row.CID).length == 13));

        for (let row of opdVisit) {
          for (const key in row) {
            if (key !== key.toLowerCase()) {
              row[key.toLowerCase()] = row[key];
              delete row[key];
            }
          }
          if (Number(row?.sbp || 0) + Number(row?.dbp || 0) + Number(row?.weight || 0)
            + Number(row?.height || 0) + Number(row?.pr || 0) + Number(row?.rr || 0)
            + Number(row?.o2sat || 0) + Number(row?.btemp || 0) + Number(row?.waist || 0)
            == 0) {
            continue;
          }
          row.dob = row.dob || row.birth || null;
          row.dob = moment(row.dob).isValid() ? moment(row.dob).format('YYYY-MM-DD') : null;
          row.date_serv = moment(row.date_serv).format('YYYY-MM-DD');
          if (row.time_servlength > 3 && row.time_serv.indexOf(':') === -1) {
            row.time_serv = row.time_serv ? row.time_serv.replace(/(\d{2})(\d{2})(\d{2})/, '$1:$2:$3') : '';
          }
          row.datetime_serv = moment(row.date_serv + ' ' + (row.time_serv || '')).format('YYYY-MM-DD HH:mm:ss');
          const sentResult = await sendingToMoph('/save-service', row);
        };
        console.log(moment().format('HH:mm:ss'), 'MOPH IoT Process Date:', date, 'Sent Records:', opdVisit.length);
      } else {
        console.log(moment().format('HH:mm:ss'), 'MOPH IoT Process Date:', date, 'No Records Found');
      }
      date = moment(date).add(1, 'day').format('YYYY-MM-DD');
    } while (date <= moment(dateEnd).format('YYYY-MM-DD'))
  } catch (error) {
    throw error;
  }
}

export default { processIoT };