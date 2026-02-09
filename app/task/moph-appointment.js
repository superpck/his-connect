"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
console.log(moment().format('HH:mm:ss'), 'Start MOPH Appointment Task');
const moph_refer_1 = require("../middleware/moph-refer");
const hismodel_1 = require("./../routes/his/hismodel");
const dbConnection = require('../plugins/db');
const cacheDbModule = require('../plugins/cache-db');
const cacheDb = cacheDbModule.default || cacheDbModule;
let db = dbConnection('HIS');
let hospitalConfig = null;
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
    }
    catch (error) {
        console.error('Error creating appointment_sent table:', error);
    }
}
async function cleanOldRecords() {
    try {
        const twoDaysAgo = moment().subtract(2, 'days').format('YYYY-MM-DD');
        const deleted = await cacheDb('appointment_sent')
            .where('date_serv', '<', twoDaysAgo)
            .delete();
        if (deleted > 0) {
            console.log(moment().format('HH:mm:ss'), `Cleaned ${deleted} old records before ${twoDaysAgo}`);
        }
    }
    catch (error) {
        console.error('Error cleaning old records:', error);
    }
}
async function isAlreadySent(vn, clinic) {
    try {
        const record = await cacheDb('appointment_sent')
            .where({ vn, clinic })
            .first();
        return !!record;
    }
    catch (error) {
        console.error('Error checking sent record:', error);
        return false;
    }
}
async function markAsSent(row) {
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
    }
    catch (error) {
        console.error('Error marking as sent:', error);
    }
}
const process = async (date = null) => {
    await createAppointmentTable();
    await cleanOldRecords();
    hospitalConfig = await (0, moph_refer_1.getHospitalConfig)();
    let isAlertAppointment = false;
    if (hospitalConfig && hospitalConfig?.configure && hospitalConfig.configure?.moph_appointment) {
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
};
async function getData(date) {
    try {
        date = moment(date).format('YYYY-MM-DD');
        let opdVisit = await hismodel_1.default.getAppointment(db, 'visit_date', date);
        if (opdVisit.length > 0) {
            console.log(moment().format('HH:mm:ss'), 'MOPH Appointment Process Date:', date, 'Found Records:', opdVisit.length);
            let skippedCount = 0;
            let sentResult = [];
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
                const alreadySent = await isAlreadySent(row.seq, row.clinic);
                if (alreadySent) {
                    skippedCount++;
                    continue;
                }
                const result = await (0, moph_refer_1.sendingToMoph)('/save-appointment', row);
                sentResult.push(result);
                if (result.ok || result.statusCode === 200) {
                    await markAsSent(row);
                }
            }
            ;
            console.log(moment().format('HH:mm:ss'), 'MOPH Appointment Sent:', sentResult.length, 'Skipped:', skippedCount);
            console.log(moment().format('HH:mm:ss'), 'MOPH Appointment Process Date:', date, 'Sent Records:', sentResult.length, '/', opdVisit.length);
        }
        else {
            console.log(moment().format('HH:mm:ss'), 'MOPH Appointment Process Date:', date, 'No Records Found');
        }
    }
    catch (error) {
        console.error(moment().format('HH:mm:ss'), 'MOPH Appointment Process Error:', error.message || error);
        return error;
    }
}
exports.default = { process };
