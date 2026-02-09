import moment = require('moment');
console.log(moment().format('HH:mm:ss'), 'Start MOPH Appointment Task');

import { Knex } from 'knex';
import { sendingToMoph, getHospitalConfig } from '../middleware/moph-refer';
import hisModel from './../routes/his/hismodel';
const dbConnection = require('../plugins/db');
const cacheDbModule = require('../plugins/cache-db');
const cacheDb = cacheDbModule.default || cacheDbModule;
let db: Knex = dbConnection('HIS');
let hospitalConfig: any = null;

// สร้างตาราง appointment_sent ถ้ายังไม่มี
async function createAppointmentTable() {
  try {
    const hasTable = await cacheDb.schema.hasTable('appointment_sent');
    if (!hasTable) {
      await cacheDb.schema.createTable('appointment_sent', (table) => {
        table.increments('id').primary();
        table.string('vn', 50).notNullable();
        table.string('clinic', 50).notNullable();
        table.date('date_serv');
        table.date('apdate');
        table.string('hn', 50);
        table.timestamp('sent_at').defaultTo(cacheDb.fn.now());
        table.unique(['vn', 'clinic']);
        table.index(['date_serv']);
      });
      console.log(moment().format('HH:mm:ss'), 'Created appointment_sent table');
    }
  } catch (error) {
    console.error('Error creating appointment_sent table:', error);
  }
}

// ลบข้อมูลย้อนหลัง 2 วัน
async function cleanOldRecords() {
  try {
    const twoDaysAgo = moment().subtract(2, 'days').format('YYYY-MM-DD');
    const deleted = await cacheDb('appointment_sent')
      .where('date_serv', '<', twoDaysAgo)
      .delete();
    if (deleted > 0) {
      console.log(moment().format('HH:mm:ss'), `Cleaned ${deleted} old records before ${twoDaysAgo}`);
    }
  } catch (error) {
    console.error('Error cleaning old records:', error);
  }
}

// ตรวจสอบว่าข้อมูลถูกส่งไปแล้วหรือยัง
async function isAlreadySent(vn: string, clinic: string): Promise<boolean> {
  try {
    const record = await cacheDb('appointment_sent')
      .where({ vn, clinic })
      .first();
    return !!record;
  } catch (error) {
    console.error('Error checking sent record:', error);
    return false;
  }
}

// บันทึกประวัติการส่ง
async function markAsSent(row: any) {
  try {
    await cacheDb('appointment_sent')
      .insert({
        vn: row.seq || row.vn,
        clinic: row.clinic,
        date_serv: row.date_serv,
        apdate: row.apdate,
        hn: row.hn
      })
      .onConflict(['vn', 'clinic'])
      .merge();
  } catch (error) {
    console.error('Error marking as sent:', error);
  }
}

const process = async (date: any = null) => {
  // สร้างตารางและลบข้อมูลเก่า
  await createAppointmentTable();
  await cleanOldRecords();

  hospitalConfig = await getHospitalConfig();
  let isAlertAppointment = false;
  if (hospitalConfig && hospitalConfig?.configure && hospitalConfig.configure?.moph_appointment){
    isAlertAppointment = hospitalConfig.configure?.moph_appointment?.alert_after_service == 1 || hospitalConfig.configure?.moph_appointment?.alert_before == 1 ? true : false;
  }
  if (!isAlertAppointment) {
    console.error(moment().format('HH:mm:ss'), 'MOPH Alert for Appointment Process: Appointment Service Disabled');
    return false;
  }

  date = date || moment().subtract(30, 'minutes').format('YYYY-MM-DD');
  console.log('');
  const result = await getData(date);
  console.log('-'.repeat(70));
  return result;
}

async function getData(date: string) {
  try {
    date = moment(date).format('YYYY-MM-DD');
    let opdVisit = await hisModel.getAppointment(db, 'visit_date', date);
    if (opdVisit.length > 0) {
      console.log(moment().format('HH:mm:ss'), 'MOPH Appointment Process Date:', date, 'Found Records:', opdVisit.length);
      let skippedCount = 0;
      let sentResult: any[] = [];
      for (let row of opdVisit) {
        for (const key in row) {
          if (key !== key.toLowerCase()) {
            row[key.toLowerCase()] = row[key];
            delete row[key];
          }
        }
        row.clinic = row?.clinic || row?.cliniccode;
        row.seq = row.vn || row.seq;
        row.date_serv = moment(row.visit_date || row.date_serv).isValid() ? moment(row.visit_date || row.date_serv).format('YYYY-MM-DD') : null;
        row.apdate = moment(row.apdate).isValid() ? moment(row.apdate).format('YYYY-MM-DD') : null;
        row.hospcode = hospitalConfig.hospitalcode || row.hospcode;
        row.hospcode9 = hospitalConfig.code9 || row.hcode9;

        // ตรวจสอบว่าส่งไปแล้วหรือยัง
        const alreadySent = await isAlreadySent(row.seq, row.clinic);
        if (alreadySent) {
          skippedCount++;
          continue;
        }

        const result = await sendingToMoph('/save-appointment', row);
        sentResult.push(result);
        
        // บันทึกประวัติการส่ง
        if (result.ok || result.statusCode === 200) {
          await markAsSent(row);
        }
      };
      console.log(moment().format('HH:mm:ss'), 'MOPH Appointment Sent:', sentResult.length, 'Skipped:', skippedCount);
      // console.log(moment().format('HH:mm:ss'), 'MOPH Appointment Sent VN:', opdVisit[0].seq, sentResult.message || sentResult);
      console.log(moment().format('HH:mm:ss'), 'MOPH Appointment Process Date:', date, 'Sent Records:', sentResult.length, '/', opdVisit.length);
    } else {
      console.log(moment().format('HH:mm:ss'), 'MOPH Appointment Process Date:', date, 'No Records Found');
    }
  } catch (error: any) {
    console.error(moment().format('HH:mm:ss'), 'MOPH Appointment Process Error:', error.message || error);
    return error;
  }
}

export default { process };