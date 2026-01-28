import moment = require('moment');
console.log(moment().format('HH:mm:ss'), 'Start MOPH Appointment Task');

import { Knex } from 'knex';
import { sendingToMoph, getHospitalConfig } from '../middleware/moph-refer';
import hisModel from './../routes/his/hismodel';
const dbConnection = require('../plugins/db');
let db: Knex = dbConnection('HIS');
let hospitalConfig: any = null;

const process = async () => {
  hospitalConfig = await getHospitalConfig();
  // console.log(moment().format('HH:mm:ss'), 'MOPH Appointment Hospital Config:', hospitalConfig);
  // console.log(moment().format('HH:mm:ss'), 'MOPH Appointment Hospital Config:', hospitalConfig.configure?.moph_appointment?.enable);
  if (!hospitalConfig || !hospitalConfig.configure) {
    console.error(moment().format('HH:mm:ss'), 'MOPH Appointment Process Stop: No Hospital Config');
    return false;
  }
  if (!hospitalConfig.configure || !hospitalConfig.configure?.moph_appointment || hospitalConfig.configure?.moph_appointment?.enable != 1) {
    console.error(moment().format('HH:mm:ss'), 'MOPH Appointment Process Stop: Appointment Service Disabled');
    return false;
  }

  const date = moment().subtract(30, 'minutes').format('YYYY-MM-DD 00:00:00');

  return await getData(date);
}

async function getData(date: string) {
  try {
    date = moment(date).format('YYYY-MM-DD');
    let opdVisit = await hisModel.getAppointment(db, 'visit_date', date);
    if (opdVisit.length > 0) {
      console.log(moment().format('HH:mm:ss'), 'MOPH Appointment Process:', date, ' founded:', opdVisit.length, 'rows');
      opdVisit = opdVisit.filter((row: any) => (row.vn || row.VN || row.seq || row.SEQ));

      for (let row of opdVisit) {
        for (const key in row) {
          if (key !== key.toLowerCase()) {
            row[key.toLowerCase()] = row[key];
            delete row[key];
          }
        }
        row.seq = row.vn || row.seq;
        row.date_serv = moment(row.visit_date || row.date_serv).isValid() ? moment(row.visit_date || row.date_serv).format('YYYY-MM-DD') : null;
        row.apdate = moment(row.fu_date).isValid() ? moment(row.fu_date).format('YYYY-MM-DD') : null;
        row.hospcode = hospitalConfig.hospitalcode || row.hospcode;
        row.hcode9 = hospitalConfig.code9 || row.hcode9;
        // const sentResult = await sendingToMoph('/save-appointment', row);
        // console.log(moment().format('HH:mm:ss'), 'MOPH Appointment Sent VN:', row.seq, 'Result:', sentResult);
      };
      const sentResult = await sendingToMoph('/save-appointment', opdVisit[0]);
      console.log(moment().format('HH:mm:ss'), 'MOPH Appointment Sent VN:', sentResult.message || sentResult);
      console.log(moment().format('HH:mm:ss'), 'MOPH Appointment Process Date:', date, 'Sent Records:', opdVisit.length);
    } else {
      console.log(moment().format('HH:mm:ss'), 'MOPH Appointment Process Date:', date, 'No Records Found');
    }
  } catch (error) {
    throw error;
  }
}

export default { process };