"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mophAlertSurvey = void 0;
const moment = require("moment");
const moph_refer_1 = require("../middleware/moph-refer");
const hismodel_1 = require("./../routes/his/hismodel");
const cache_db_1 = require("../plugins/cache-db");
const dbConnection = require('../plugins/db');
let db = dbConnection('HIS');
const hospcode = process.env.HOSPCODE || '';
let cacheInitialized = false;
const mophAlertSurvey = async (date = null) => {
    try {
        if (!cacheInitialized) {
            await (0, cache_db_1.initializeCacheDb)();
            cacheInitialized = true;
        }
        date = date ? moment(date).format('YYYY-MM-DD') : moment().subtract(2, 'hours').format('YYYY-MM-DD');
        await opdVisit(date);
        if (moment().format('HH:mm') < '02:00') {
            date = moment().subtract(1, 'hours').format('YYYY-MM-DD');
            await opdVisit(date);
        }
    }
    catch (error) {
        console.log(moment().format('HH:mm:ss'), 'getVisitForMophAlert error', error.message);
        return [];
    }
};
exports.mophAlertSurvey = mophAlertSurvey;
async function opdVisit(date = null) {
    let result = await hismodel_1.default.getVisitForMophAlert(db, date, true);
    const totalRows = result?.row_count || 0;
    if (totalRows === 0) {
        console.log(moment().format('HH:mm:ss'), 'MOPH Alert survey: No opd visit data', date);
        return { statusCode: 200, date, message: 'No opd visit data' };
    }
    console.log(moment().format('HH:mm:ss'), 'MOPH Alert survey: Total rows to process for date', date, ':', totalRows);
    let times = 0;
    let startRow = 0;
    const limitRow = 100;
    let sentResult = [];
    do {
        const result = await getAndSend(date, startRow, limitRow);
        sentResult.push(result);
        times++;
        startRow += limitRow;
    } while (startRow < totalRows - 1);
    return sentResult;
}
async function getAndSend(date, startRow = -1, limitRow = 1000) {
    let rows = await hismodel_1.default.getVisitForMophAlert(db, date, false, startRow, limitRow);
    if (rows && rows.length > 0) {
        const allVns = rows.map((row) => row.vn).filter((vn) => vn);
        const existingVns = await (0, cache_db_1.getExistingVns)(allVns, hospcode);
        console.log(moment().format('HH:mm:ss'), 'Found', existingVns.length, '/', allVns.length, 'VNs already sent in cache');
        const filteredRows = rows.filter((row) => !existingVns.includes(row.vn));
        if (filteredRows.length === 0) {
            console.log(moment().format('HH:mm:ss'), 'send moph alert', 'All VNs already sent.');
            return { statusCode: 200, message: 'All VNs already sent' };
        }
        console.log(moment().format('HH:mm:ss'), 'Sending', filteredRows.length, 'new VNs to MOPH');
        const rowsToSend = filteredRows.map((item) => { return { ...item, date_service: moment(item.date_service).format('YYYY-MM-DD'), hospcode }; });
        const result = await (0, moph_refer_1.sendingToMoph)('/save-moph-alert', rowsToSend);
        console.log(moment().format('HH:mm:ss'), 'send moph alert', result.statusCode || '', result.message || '', result);
        if (result.statusCode === 200) {
            const sentVns = filteredRows.map((row) => row.vn);
            await (0, cache_db_1.insertSentVns)(sentVns, hospcode);
            await (0, cache_db_1.cleanupOldRecords)(2);
        }
        return result;
    }
    else {
        console.log(moment().format('HH:mm:ss'), 'send moph alert', 'No opd visit data');
        await (0, cache_db_1.cleanupOldRecords)(2);
        return { statusCode: 200, message: 'No opd visit data' };
    }
}
