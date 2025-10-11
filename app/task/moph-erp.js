"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWardName = exports.sendBedOccupancy = void 0;
const moment = require("moment");
const moph_refer_1 = require("../middleware/moph-refer");
const hismodel_1 = require("./../routes/his/hismodel");
const dbConnection = require('../plugins/db');
let db = dbConnection('HIS');
const sendBedOccupancy = async () => {
    try {
        const date = moment().subtract(1, 'hour').format('YYYY-MM-DD');
        let rows = await hismodel_1.default.concurrentIPD(db, date);
        if (rows && rows.length) {
            rows = rows.map(v => {
                return { ...v, hospcode: process.env.HOSPCODE || '' };
            });
            const result = await (0, moph_refer_1.sendingToMoph)('/save-occupancy-rate', rows);
            console.log(moment().format('HH:mm:ss'), 'send Occ Rate', result.status || '', result.message || '', rows.length);
        }
        return rows;
    }
    catch (error) {
        console.error(moment().format('HH:mm:ss'), 'sendBedOccupancy error', error.message);
        return false;
    }
};
exports.sendBedOccupancy = sendBedOccupancy;
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
