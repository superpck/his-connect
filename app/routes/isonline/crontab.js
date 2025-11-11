"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fastify = require('fastify');
const axios_1 = require("axios");
const moment = require("moment");
const iswin_1 = require("../../models/isonline/iswin");
var iswin = new iswin_1.IswinModel();
let crontabConfig = global.appDetail;
let ip = fastify.ipAddr || '127.0.0.1';
async function sendMoph(req, reply, db) {
    try {
        let token = null;
        let result = await getIsToken();
        if (!result || result.statusCode != 200) {
            console.log(moment().format('HH:mm:ss'), `IS autosend 'fail'. ${result.message}`);
        }
        else {
            token = result.token;
        }
        let dateStart;
        if (moment().get('hour') == 4) {
            dateStart = moment().subtract(29, 'hours').format('YYYY-MM-DD HH:mm:ss');
        }
        else {
            dateStart = moment().subtract(6, 'hours').format('YYYY-MM-DD HH:mm:ss');
        }
        const dateEnd = moment().format('YYYY-MM-DD HH:mm:ss');
        const isData = await iswin.getByDate(db, 'lastupdate', dateStart, dateEnd, process.env.HOSPCODE);
        if (isData && isData.length) {
            for (let row of isData) {
                const ref = row.ref;
                delete row.ref;
                delete row.lastupdate;
                row.his = row.his ? row.his : process.env.HIS_PROVIDER;
                const sentResult = await sendData(req, row, token);
                if (sentResult && sentResult.statusCode != 200) {
                    console.log('Sent error:', sentResult);
                }
            }
            console.log(process.env.HOSPCODE, ' ISOnline: ', isData.length, ' cases');
        }
        else {
            console.log('ISOnline not found any record updated.');
        }
        return '';
    }
    catch (error) {
        return error;
    }
}
async function sendData(req, row, tokenKey) {
    const bodyContent = {
        ip, data: row,
        token: tokenKey,
        name: crontabConfig.name,
        version: crontabConfig.version,
        subVersion: crontabConfig.subVersion,
        his: process.env.HIS_PROVIDER
    };
    const url = process.env.IS_URL + '/isonline/put-is';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenKey}`,
    };
    try {
        const { status, data } = await axios_1.default.post(url, bodyContent, { headers });
        return data;
    }
    catch (error) {
        return error;
    }
}
async function getIsToken() {
    const url = process.env.IS_URL + '/isonline/token';
    const bodyData = {
        ip, username: process.env.IS_MOPH_USER,
        password: process.env.IS_MOPH_PASSWORD,
        name: crontabConfig.name,
        version: crontabConfig.version,
        subVersion: crontabConfig.subVersion,
        his: process.env.HIS_PROVIDER
    };
    try {
        const { status, data } = await axios_1.default.post(url, bodyData);
        return data;
    }
    catch (error) {
        return error;
    }
}
const router = (request, reply, dbConn, config = {}) => {
    return sendMoph(request, reply, dbConn);
};
module.exports = router;
