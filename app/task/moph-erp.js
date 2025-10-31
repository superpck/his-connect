"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.erpAdminRequest = exports.updateAlive = exports.sendBedNo = exports.sendWardName = exports.sendBedOccupancy = void 0;
const moment = require("moment");
const moph_refer_1 = require("../middleware/moph-refer");
const hismodel_1 = require("./../routes/his/hismodel");
const utils_1 = require("../middleware/utils");
const packageJson = require('../../package.json');
const dbConnection = require('../plugins/db');
let db = dbConnection('HIS');
const hisProvider = process.env.HIS_PROVIDER || '';
const hospcode = process.env.HOSPCODE || '';
const sendBedOccupancy = async (dateProcess = null) => {
    let whatUTC = Intl?.DateTimeFormat().resolvedOptions().timeZone || '';
    let currDate;
    if (whatUTC == 'UTC' || whatUTC == 'Etc/UTC') {
        currDate = moment().locale('TH').add(7, 'hours').subtract(1, 'minutes').startOf('hour').format('YYYY-MM-DD HH:mm:ss');
    }
    else {
        currDate = moment().locale('TH').subtract(1, 'minutes').startOf('hour').format('YYYY-MM-DD HH:mm:ss');
    }
    let date = dateProcess || currDate;
    let dateOpd = date;
    if (moment().get('hour') == 3) {
        dateOpd = moment().locale('TH').subtract(1, 'month').format('YYYY-MM-DD');
    }
    let clinicResult = null, wardResult = null, opdResult = null;
    do {
        [clinicResult, wardResult] = await Promise.all([
            sendBedOccupancyByClinic(date),
            sendBedOccupancyByWard(date),
        ]);
        date = moment(date).add(1, 'day').format('YYYY-MM-DD');
    } while (date <= currDate);
    do {
        [opdResult] = await Promise.all([
            sendOpdVisitByClinic(dateOpd)
        ]);
        dateOpd = moment(dateOpd).add(1, 'day').format('YYYY-MM-DD');
    } while (dateOpd <= currDate);
    return { clinicResult, wardResult, opdResult };
};
exports.sendBedOccupancy = sendBedOccupancy;
const sendBedOccupancyByWard = async (date) => {
    try {
        let rows = await hismodel_1.default.concurrentIPDByWard(db, date);
        if (rows && rows.length) {
            rows = rows.map(v => {
                return { ...v, date, hospcode, his: hisProvider || '' };
            });
            const result = await (0, moph_refer_1.sendingToMoph)('/save-occupancy-rate-by-ward', rows);
            console.log(moment().format('HH:mm:ss'), 'send Occ Rate by ward', date, result.status || '', result.message || '', rows.length, 'rows');
        }
        return rows;
    }
    catch (error) {
        console.error(moment().format('HH:mm:ss'), 'sendBedOccupancy error by ward', date, error.message);
        return false;
    }
};
const sendBedOccupancyByClinic = async (date) => {
    try {
        let rows = await hismodel_1.default.concurrentIPDByClinic(db, date);
        if (rows && rows.length) {
            rows = rows.map(v => {
                return { ...v, date, hospcode, his: hisProvider || '' };
            });
            const result = await (0, moph_refer_1.sendingToMoph)('/save-occupancy-rate-by-clinic', rows);
            console.log(moment().format('HH:mm:ss'), 'send Occ rate by clinic', date, result.status || '', result.message || '', rows.length, 'rows');
        }
        return rows;
    }
    catch (error) {
        console.error(moment().format('HH:mm:ss'), 'sendBedOccupancy by clinic error', date, error.message);
        return false;
    }
};
const sendOpdVisitByClinic = async (date) => {
    try {
        let rows = await hismodel_1.default.sumOpdVisitByClinic(db, date);
        if (rows && rows.length) {
            rows = rows.map((v) => {
                return {
                    ...v, hospcode, his: hisProvider || ''
                };
            });
            const result = await (0, moph_refer_1.sendingToMoph)('/save-sum-opd-visit-by-clinic', rows);
            console.log(moment().format('HH:mm:ss'), 'send Sum OPD visit by clinic', date, result.status || '', result.message || '', rows.length, 'rows');
        }
        return rows;
    }
    catch (error) {
        console.error(moment().format('HH:mm:ss'), 'sendSumOpdVisit by clinic error', date, error.message);
        return false;
    }
};
const sendWardName = async () => {
    try {
        let rows = await hismodel_1.default.getWard(db);
        if (rows && rows.length) {
            rows = rows.map(v => {
                return { ...v, hospcode: process.env.HOSPCODE || '' };
            });
            const result = await (0, moph_refer_1.sendingToMoph)('/save-ward', rows);
            console.log(moment().format('HH:mm:ss'), 'sendWardName', result.status || '', result.message || '', rows.length);
            return result;
        }
        else {
            console.log(moment().format('HH:mm:ss'), 'sendWardName', 'No ward data');
            return { statusCode: 200, message: 'No ward data' };
        }
    }
    catch (error) {
        console.log(moment().format('HH:mm:ss'), 'getWard error', error.message);
        return [];
    }
};
exports.sendWardName = sendWardName;
const sendBedNo = async () => {
    let result;
    let countBed = 0;
    try {
        if (typeof hismodel_1.default.countBedNo === 'function') {
            result = await hismodel_1.default.countBedNo(db);
            countBed = result?.total_bed || 0;
        }
        let error = '';
        let times = 0;
        let startRow = countBed < 500 ? -1 : 0;
        const limitRow = 500;
        let sentResult = [];
        do {
            let rows = await hismodel_1.default.getBedNo(db, null, startRow, limitRow);
            if (rows && rows.length) {
                rows = rows.map(v => {
                    return {
                        ...v, hospcode: hospcode,
                        hcode5: hospcode.length == 5 ? hospcode : null,
                        hcode9: hospcode.length == 9 ? hospcode : null
                    };
                });
                result = await (0, moph_refer_1.sendingToMoph)('/save-bed-no', rows);
                if (result?.status != 200 && result?.statusCode != 200) {
                    error = result?.message || result?.status || result?.statusCode || null;
                }
                sentResult.push({ startRow, limitRow, rows: rows.length, result });
            }
            startRow += limitRow;
            times++;
        } while (startRow < countBed && countBed != 0);
        console.log(moment().format('HH:mm:ss'), `sendBedNo ${countBed} rows (${times})`, error);
    }
    catch (error) {
        console.log(moment().format('HH:mm:ss'), 'getBedNo error', error.message);
        return { statusCode: error.status || 500, message: error.message || error };
    }
};
exports.sendBedNo = sendBedNo;
const updateAlive = async () => {
    const ipServer = (0, utils_1.getIP)();
    try {
        let data = {
            api_date: global.apiStartTime,
            server_date: moment().format('YYYY-MM-DD HH:mm:ss'),
            hospcode,
            version: packageJson.version || '',
            subversion: packageJson.subVersion || '',
            port: process.env.PORT || 0,
            ip: ipServer.ip,
            his: hisProvider, ssl: process.env?.SSL_ENABLE || null,
        };
        const result = await (0, moph_refer_1.updateHISAlive)(data);
        const status = result.status == 200 || result.statusCode == 200 ? true : false;
        if (status) {
            console.log(moment().format('HH:mm:ss'), '✅ Sent API Alive status result', result.status || '', result.statusCode || '', result?.message || '');
        }
        else {
            console.log(moment().format('HH:mm:ss'), '❌ Sent API Alive status result', result.status || '', result.statusCode || '', result?.message || '');
        }
        return result;
    }
    catch (error) {
        console.log(moment().format('HH:mm:ss'), '❌ Sent API Alive status error:', error?.status || error?.statusCode || '', error?.message || error || '');
        return [];
    }
};
exports.updateAlive = updateAlive;
const erpAdminRequest = async () => {
    try {
        const result = await (0, moph_refer_1.checkAdminRequest)();
        if (result.status == 200 || result.statusCode == 200) {
            const rows = result?.rows || result?.data || [];
            let requestResult;
            for (let req of rows) {
                if (req.request_type == 'bed') {
                    requestResult = await (0, exports.sendBedNo)();
                    console.log('ERP admin request get bed no.', requestResult?.statusCode || requestResult?.status || '', requestResult?.message || '');
                    await (0, moph_refer_1.updateAdminRequest)({
                        request_id: req.request_id,
                        status: requestResult.statusCode == 200 || requestResult.status == 200 ? 'success' : `failed ${requestResult.status || requestResult.statusCode || ''}`,
                        isactive: 0
                    });
                }
                else if (req.request_type == 'ward') {
                    requestResult = await (0, exports.sendWardName)();
                    console.log('ERP admin request get ward name.', requestResult?.statusCode || requestResult?.status || '', requestResult?.message || '');
                    await (0, moph_refer_1.updateAdminRequest)({
                        request_id: req.request_id,
                        status: requestResult.statusCode == 200 || requestResult.status == 200 ? 'success' : `failed ${requestResult.status || requestResult.statusCode || ''}`,
                        isactive: 0
                    });
                }
                else if (req.request_type == 'alive') {
                    requestResult = await (0, exports.updateAlive)();
                    console.log('ERP admin request send alive status.', requestResult?.statusCode || requestResult?.status || '', requestResult?.message || '');
                }
                else if (req.request_type == 'occupancy') {
                }
            }
        }
        else {
            console.log(moment().format('HH:mm:ss'), 'No admin request', result.status || result?.statusCode || '', result?.data?.message || result?.message || '');
        }
        return result;
    }
    catch (error) {
        console.log(moment().format('HH:mm:ss'), 'API Alive error', error.message);
        return [];
    }
};
exports.erpAdminRequest = erpAdminRequest;
function getCode9(hcode = hospcode) {
}
