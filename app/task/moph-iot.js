"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
console.log(moment().format('HH:mm:ss'), process.pid, 'Start MOPH IoT Task');
const moph_refer_1 = require("../middleware/moph-refer");
const hismodel_1 = require("./../routes/his/hismodel");
const dbConnection = require('../plugins/db');
const cacheDbModule = require('../plugins/cache-db');
const cacheDb = cacheDbModule.default || cacheDbModule;
let db = dbConnection('HIS');
let hospitalConfig = null;
async function createIotServiceTable() {
    try {
        const hasTable = await cacheDb.schema.hasTable('iot_service');
        if (!hasTable) {
            await cacheDb.schema.createTable('iot_service', (table) => {
                table.increments('id').primary();
                table.string('seq', 50).notNullable().unique();
                table.string('cid', 13);
                table.date('date_serv');
                table.timestamp('sent_at').defaultTo(cacheDb.fn.now());
                table.index(['date_serv']);
                table.index(['sent_at']);
            });
            console.log(moment().format('HH:mm:ss'), 'Created iot_service table');
        }
    }
    catch (error) {
        console.error('Error creating iot_service table:', error);
    }
}
async function cleanOldRecords() {
    try {
        const twoDaysAgo = moment().subtract(48, 'hours').format('YYYY-MM-DD HH:mm:ss');
        const deleted = await cacheDb('iot_service')
            .where('sent_at', '<', twoDaysAgo)
            .delete();
        if (deleted > 0) {
            console.log(moment().format('HH:mm:ss'), `Cleaned ${deleted} old IoT records before ${twoDaysAgo}`);
        }
    }
    catch (error) {
        console.error('Error cleaning old IoT records:', error);
    }
}
async function isAlreadySent(seq) {
    try {
        const record = await cacheDb('iot_service')
            .where({ seq })
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
        await cacheDb('iot_service')
            .insert({
            seq: row.seq,
            cid: row.cid,
            date_serv: row.date_serv
        })
            .onConflict('seq')
            .ignore();
    }
    catch (error) {
        console.error('Error marking as sent:', error);
    }
}
const processIoT = async (date = null) => {
    await createIotServiceTable();
    await cleanOldRecords();
    hospitalConfig = await (0, moph_refer_1.getHospitalConfig)();
    if (!hospitalConfig || !hospitalConfig.configure || !hospitalConfig.configure?.iot_service || hospitalConfig.configure?.iot_service?.enable != 1) {
        console.error(moment().format('HH:mm:ss'), 'MOPH IoT Process Stop: IoT Service Disabled');
        return false;
    }
    date = date || moment();
    const dateStart = moment(date).subtract(6, 'hours').startOf('hour').format('YYYY-MM-DD HH:mm:ss');
    const dateEnd = moment(date).subtract(6, 'hours').endOf('hour').format('YYYY-MM-DD HH:mm:ss');
    console.log(' ');
    const result = await getData(dateStart, dateEnd);
    console.log('-'.repeat(70));
    return result;
};
async function getData(dateStart, dateEnd) {
    try {
        let date = moment(dateStart).format('YYYY-MM-DD');
        do {
            let opdVisit = await hismodel_1.default.getService(db, 'date_serv', date);
            let rows = (opdVisit ? (opdVisit || []) : []).filter((row) => (row?.typeout || row?.TYPEOUT) == '1' &&
                (row.cid || row.CID) &&
                ((row.cid || row.CID).trim().length == 13));
            if (rows.length > 0) {
                let sentResults = [];
                console.log(moment().format('HH:mm:ss'), 'MOPH IoT Process:', date, ' founded:', opdVisit.length, 'rows');
                let recno = 0;
                for (let row of rows) {
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
                    const alreadySent = await isAlreadySent(row.seq);
                    if (alreadySent) {
                        continue;
                    }
                    row.dob = row.dob || row.birth || null;
                    row.dob = moment(row.dob).isValid() ? moment(row.dob).format('YYYY-MM-DD') : null;
                    row.date_serv = moment(row.date_serv).format('YYYY-MM-DD');
                    if (row.time_servlength > 3 && row.time_serv.indexOf(':') === -1) {
                        row.time_serv = row.time_serv ? row.time_serv.replace(/(\d{2})(\d{2})(\d{2})/, '$1:$2:$3') : '';
                    }
                    row.datetime_serv = moment(row.date_serv + ' ' + (row.time_serv || '')).format('YYYY-MM-DD HH:mm:ss');
                    const sentResult = await (0, moph_refer_1.sendingToMoph)('/save-service', row);
                    if (sentResult && sentResult.statusCode === 200) {
                        await markAsSent(row);
                    }
                    sentResults.push({ rowno: ++recno, ...sentResult, vn: row.seq });
                }
                ;
                console.log(moment().format('HH:mm:ss'), 'MOPH IoT Process Date:', date, 'service:', opdVisit.length, 'records, Sent:', sentResults.length, 'records');
            }
            else {
                console.log(moment().format('HH:mm:ss'), 'MOPH IoT Process Date:', date, 'No Records Found');
            }
            date = moment(date).add(1, 'day').format('YYYY-MM-DD');
        } while (date <= moment(dateEnd).format('YYYY-MM-DD'));
    }
    catch (error) {
        throw error;
    }
}
exports.default = { processIoT };
