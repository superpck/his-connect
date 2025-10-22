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
const sendBedOccupancy = async (date = null) => {
    let currDate = moment().subtract(5, 'minutes').format('YYYY-MM-DD');
    date = date || currDate;
    let dateOpd = date;
    if (moment().get('hour') == 3) {
        dateOpd = moment().subtract(1, 'month').format('YYYY-MM-DD');
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
        }
        return rows;
    }
    catch (error) {
        console.log(moment().format('HH:mm:ss'), 'getWard error', error.message);
        return [];
    }
};
exports.sendWardName = sendWardName;
const sendBedNo = async () => {
    try {
        let rows = await hismodel_1.default.getBedNo(db);
        if (rows && rows.length) {
            rows = rows.map(v => {
                return {
                    ...v, hospcode: hospcode,
                    hcode5: hospcode.length == 5 ? hospcode : null,
                    hcode9: hospcode.length == 9 ? hospcode : null
                };
            });
            const result = await (0, moph_refer_1.sendingToMoph)('/save-bed-no', rows);
            console.log(moment().format('HH:mm:ss'), 'sendBedNo', result.status || '', result.message || '', rows.length);
        }
        return rows;
    }
    catch (error) {
        console.log(moment().format('HH:mm:ss'), 'getBedNo error', error.message);
        return [];
    }
};
exports.sendBedNo = sendBedNo;
const updateAlive = async () => {
    const ipServer = (0, utils_1.getIP)();
    try {
        let data = {
            api_date: moment().format('YYYY-MM-DD HH:mm:ss'),
            hospcode,
            version: packageJson.version || '',
            subversion: packageJson.subVersion || '',
            port: process.env.PORT || 0,
            ip: ipServer.ip,
            his: hisProvider, ssl: process.env?.SSL_ENABLE || null,
        };
        const result = await (0, moph_refer_1.updateHISAlive)(data);
        console.log(moment().format('HH:mm:ss'), 'API Alive', result.status || '', result.message || '');
        return result;
    }
    catch (error) {
        console.log(moment().format('HH:mm:ss'), 'API Alive error', error.message);
        return [];
    }
};
exports.updateAlive = updateAlive;
const erpAdminRequest = async () => {
    try {
        const result = await (0, moph_refer_1.checkAdminRequest)();
        if (result.status == 200 || result.statusCode == 200) {
            console.log(moment().format('HH:mm:ss'), 'Admin request', result);
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
