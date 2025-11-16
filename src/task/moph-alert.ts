import moment = require("moment");
import { sendingToMoph } from "../middleware/moph-refer";
import hisModel from './../routes/his/hismodel';
import { Knex } from 'knex';
import {
  initializeCacheDb,
  getExistingVns,
  insertSentVns,
  cleanupOldRecords
} from '../plugins/cache-db';

const dbConnection = require('../plugins/db');
let db: Knex = dbConnection('HIS');
const hospcode = process.env.HOSPCODE || '';

// Initialize cache database on module load
let cacheInitialized = false;

export const mophAlertSurvey = async (date: any = null) => {
  try {
    // Initialize cache database if not already done
    if (!cacheInitialized) {
      await initializeCacheDb();
      cacheInitialized = true;
    }

    date = date ? moment(date).format('YYYY-MM-DD') : moment().subtract(3, 'hours').format('YYYY-MM-DD');
    let result: any = await hisModel.getVisitForMophAlert(db, date, true);
    const totalRows = result?.total_rows || 0;
    if (totalRows === 0) {
      console.log(moment().format('HH:mm:ss'), 'No opd visit data to process for date', date);
      return { statusCode: 200, message: 'No opd visit data' };
    }

    console.log(moment().format('HH:mm:ss'), 'Total rows to process for date', date, ':', totalRows);
    let times = 0;
    let startRow = 0;
    const limitRow = 500;
    let sentResult = [];
    do {
      const result = await getAndSend(date, startRow, limitRow);
      sentResult.push(result);
      times++;
      startRow += limitRow;
    } while (startRow < totalRows - 1);

    // let rows: any = await hisModel.getVisitForMophAlert(db, date);
    // console.log(moment().format('HH:mm:ss'), 'getVisitForMophAlert', date, 'rows:', rows.length);

    // if (rows && rows.length > 0) {
    //   // Extract VNs from rows
    //   const allVns = rows.map((row: any) => row.vn).filter((vn: string) => vn);

    //   // Check which VNs already exist in cache
    //   const existingVns = await getExistingVns(allVns, hospcode);
    //   console.log(moment().format('HH:mm:ss'), 'Found', existingVns.length, 'VNs already sent in cache');

    //   // Filter out VNs that were already sent
    //   const filteredRows = rows.filter((row: any) => !existingVns.includes(row.vn));

    //   if (filteredRows.length === 0) {
    //     console.log(moment().format('HH:mm:ss'), 'send moph alert', 'All VNs already sent.');
    //     return { statusCode: 200, message: 'All VNs already sent' };
    //   }

    //   console.log(moment().format('HH:mm:ss'), 'Sending', filteredRows.length, 'new VNs to MOPH');

    //   // Add hospcode to rows
    //   const rowsToSend = filteredRows.map((item: any) => { return { ...item, hospcode }; });

    //   // Send to MOPH
    //   const result: any = await sendingToMoph('/save-moph-alert', rowsToSend);
    //   console.log(moment().format('HH:mm:ss'), 'send moph alert', result.statusCode || '', result.message || '', result);

    //   // If successful, insert sent VNs into cache
    //   if (result.statusCode === 200) {
    //     const sentVns = filteredRows.map((row: any) => row.vn);
    //     await insertSentVns(sentVns, hospcode);

    //     // Cleanup old records (older than 2 days)
    //     await cleanupOldRecords(2);
    //   }

    //   return result;
    // } else {
    //   console.log(moment().format('HH:mm:ss'), 'send moph alert', 'No opd visit data');

    //   // Still run cleanup even if no data to send
    //   await cleanupOldRecords(2);

    //   return { statusCode: 200, message: 'No opd visit data' };
    // }
    return sentResult;
  } catch (error) {
    console.log(moment().format('HH:mm:ss'), 'getVisitForMophAlert error', error.message);
    return [];
  }
}

async function getAndSend(date: any, startRow: number, limitRow: number) {
  let rows: any = await hisModel.getVisitForMophAlert(db, date, false, startRow, limitRow);
  console.log(moment().format('HH:mm:ss'), 'getVisitForMophAlert', date, 'rows:', rows.length);

  if (rows && rows.length > 0) {
    // Extract VNs from rows
    const allVns = rows.map((row: any) => row.vn).filter((vn: string) => vn);

    // Check which VNs already exist in cache
    const existingVns = await getExistingVns(allVns, hospcode);
    console.log(moment().format('HH:mm:ss'), 'Found', existingVns.length, 'VNs already sent in cache');

    // Filter out VNs that were already sent
    const filteredRows = rows.filter((row: any) => !existingVns.includes(row.vn));

    if (filteredRows.length === 0) {
      console.log(moment().format('HH:mm:ss'), 'send moph alert', 'All VNs already sent.');
      return { statusCode: 200, message: 'All VNs already sent' };
    }

    console.log(moment().format('HH:mm:ss'), 'Sending', filteredRows.length, 'new VNs to MOPH');

    // Add hospcode to rows
    const rowsToSend = filteredRows.map((item: any) => { return { ...item, hospcode }; });

    // Send to MOPH
    const result: any = await sendingToMoph('/save-moph-alert', rowsToSend);
    console.log(moment().format('HH:mm:ss'), 'send moph alert', result.statusCode || '', result.message || '', result);

    // If successful, insert sent VNs into cache
    if (result.statusCode === 200) {
      const sentVns = filteredRows.map((row: any) => row.vn);
      await insertSentVns(sentVns, hospcode);

      // Cleanup old records (older than 2 days)
      await cleanupOldRecords(2);
    }

    return result;
  } else {
    console.log(moment().format('HH:mm:ss'), 'send moph alert', 'No opd visit data');

    // Still run cleanup even if no data to send
    await cleanupOldRecords(2);

    return { statusCode: 200, message: 'No opd visit data' };
  }

}