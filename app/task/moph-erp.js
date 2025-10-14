"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWardName = exports.sendBedOccupancy = void 0;
const moment = require("moment");
const moph_refer_1 = require("../middleware/moph-refer");
const hismodel_1 = require("./../routes/his/hismodel");
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
    let clinicResult = null, wardResult = null;
    let opdResult = null;
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
