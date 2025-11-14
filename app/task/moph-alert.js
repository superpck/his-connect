"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mophAlertSurvey = void 0;
const moment = require("moment");
const moph_refer_1 = require("../middleware/moph-refer");
const hismodel_1 = require("./../routes/his/hismodel");
const dbConnection = require('../plugins/db');
let db = dbConnection('HIS');
const hospcode = process.env.HOSPCODE || '';
const mophAlertSurvey = async (date = null) => {
    try {
        date = date ? moment(date).format('YYYY-MM-DD') : moment().subtract(3, 'hours').format('YYYY-MM-DD');
        let rows = await hismodel_1.default.getVisitForMophAlert(db, date);
        if (rows && rows.length > 0) {
            rows = rows.map(item => { return { ...item, hospcode }; });
            const result = await (0, moph_refer_1.sendingToMoph)('/save-moph-alert', rows);
            console.log(moment().format('HH:mm:ss'), 'send moph alert', result.status || '', result.message || '', result);
        }
        else {
            console.log(moment().format('HH:mm:ss'), 'send moph alert', 'No opd visit data');
            return { statusCode: 200, message: 'No opd visit data' };
        }
    }
    catch (error) {
        console.log(moment().format('HH:mm:ss'), 'getVisitForMophAlert error', error.message);
        return [];
    }
};
exports.mophAlertSurvey = mophAlertSurvey;
