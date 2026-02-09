"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
console.log(moment().format('HH:mm:ss'), process.pid, 'Start MOPH IoT Task');
const moph_refer_1 = require("../middleware/moph-refer");
const hismodel_1 = require("./../routes/his/hismodel");
const dbConnection = require('../plugins/db');
let db = dbConnection('HIS');
let hospitalConfig = null;
const Database = require("better-sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, '../../data/iot_service.db');
const sqlite = new Database(dbPath);
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS iot_service (
    seq TEXT PRIMARY KEY,
    cid TEXT,
    date_serv TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
sqlite.exec(`
  CREATE INDEX IF NOT EXISTS idx_sent_at ON iot_service(sent_at)
`);
const processIoT = async (date = null) => {
    hospitalConfig = await (0, moph_refer_1.getHospitalConfig)();
    if (!hospitalConfig || !hospitalConfig.configure || !hospitalConfig.configure?.iot_service || hospitalConfig.configure?.iot_service?.enable != 1) {
        console.error(moment().format('HH:mm:ss'), 'MOPH IoT Process Stop: IoT Service Disabled');
        return false;
    }
    cleanupOldRecords();
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
                    if (isSeqAlreadySent(row.seq)) {
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
                        saveSeqToDb(row.seq, row.cid, row.date_serv);
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
function isSeqAlreadySent(seq) {
    try {
        const stmt = sqlite.prepare('SELECT seq FROM iot_service WHERE seq = ?');
        const result = stmt.get(seq);
        return !!result;
    }
    catch (error) {
        console.error(moment().format('HH:mm:ss'), 'Error checking seq:', error.message);
        return false;
    }
}
function saveSeqToDb(seq, cid, date_serv) {
    try {
        const stmt = sqlite.prepare('INSERT OR IGNORE INTO iot_service (seq, cid, date_serv) VALUES (?, ?, ?)');
        stmt.run(seq, cid, date_serv);
    }
    catch (error) {
        console.error(moment().format('HH:mm:ss'), 'Error saving seq to db:', error.message);
    }
}
function cleanupOldRecords() {
    try {
        const cutoffTime = moment().subtract(48, 'hours').format('YYYY-MM-DD HH:mm:ss');
        const stmt = sqlite.prepare('DELETE FROM iot_service WHERE sent_at < ?');
        const result = stmt.run(cutoffTime);
        if (result.changes > 0) {
            console.log(moment().format('HH:mm:ss'), `Cleaned up ${result.changes} old IoT records (> 48 hours)`);
        }
    }
    catch (error) {
        console.error(moment().format('HH:mm:ss'), 'Error cleaning up old records:', error.message);
    }
}
exports.default = { processIoT };
