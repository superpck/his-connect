"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.opdVisit = void 0;
const moment = require("moment");
const moph_refer_1 = require("../middleware/moph-refer");
const hismodel_1 = require("./../routes/his/hismodel");
const dbConnection = require('../plugins/db');
let db = dbConnection('HIS');
const hospcode = process.env.HOSPCODE || '';
const opdVisit = async (date) => {
    try {
        let rows = await hismodel_1.default.getMophAlertOPDVisit(db, date);
        if (rows && rows.length) {
            for (let row of rows) {
                row.hospcode = hospcode;
                const result = await (0, moph_refer_1.sendingToMoph)('/save-moph-alert', row);
                console.log(moment().format('HH:mm:ss'), 'send moph alert', result.status || '', result.message || '', rows.length);
            }
        }
        else {
            console.log(moment().format('HH:mm:ss'), 'send moph alert', 'No opd visit data');
            return { statusCode: 200, message: 'No opd visit data' };
        }
    }
    catch (error) {
        console.log(moment().format('HH:mm:ss'), 'getMophAlertOPDVisit error', error.message);
        return [];
    }
};
exports.opdVisit = opdVisit;
