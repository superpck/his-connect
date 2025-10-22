"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAdminRequest = exports.updateHISAlive = exports.sendingToMoph = exports.getReferToken = void 0;
const axios_1 = require("axios");
const moment = require("moment");
const crypto_1 = require("crypto");
const utils_1 = require("./utils");
const referAPIUrl = 'https://refer.moph.go.th/api/beta';
const adminAPIUrl = process.env.ADMIN_API_URL || 'https://referlink.moph.go.th/api/admin';
const erpAPIUrl = process.env.ERP_API_URL || 'https://referlink.moph.go.th/api/moph-erp';
const hcode = process.env.HOSPCODE;
const apiKey = process.env.NREFER_APIKEY || 'api-key';
const secretKey = process.env.NREFER_SECRETKEY || 'secret-key';
let crontabConfig = {
    client_ip: '', version: global.appDetail?.version || '',
    subVersion: global.appDetail?.subVersion || ''
};
let nReferToken = null;
const getReferToken = async () => {
    if (nReferToken) {
        const toke = nReferToken.split('.');
        if (toke.length == 3) {
            const payload = JSON.parse(Buffer.from(toke[1], 'base64').toString('utf-8'));
            if (payload && payload.exp) {
                const expireTime = moment.unix(payload.exp);
                const now = moment();
                const diff = expireTime.diff(now, 'minutes');
                if (diff > 3) {
                    return { token: nReferToken, status: 200 };
                }
            }
        }
    }
    const url = referAPIUrl + '/login/api-key';
    const bodyData = {
        ip: crontabConfig['client_ip'] || '127.0.0.1',
        apiKey, secretKey, hospcode: hcode,
        processPid: process.pid, dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        sourceApiName: 'HIS-connect', apiVersion: crontabConfig.version, subVersion: crontabConfig.subVersion,
        hisProvider: process.env.HIS_PROVIDER
    };
    const headers = {
        'Content-Type': 'application/json',
        'Source-Agent': 'HISConnect-' + crontabConfig.version + '-' + crontabConfig.subVersion + '-' + (process.env.HOSPCODE || 'hosp') + '-' + moment().format('x') + '-' + Math.random().toString(36).substring(2, 10),
    };
    try {
        const { status, data } = await axios_1.default.post(url, bodyData, { headers });
        nReferToken = data?.token || nReferToken;
        return data;
    }
    catch (error) {
        console.log('getNReferToken', error.status || '', error.message);
        return error;
    }
};
exports.getReferToken = getReferToken;
const sendingToMoph = async (uri, dataArray) => {
    await (0, exports.getReferToken)();
    if (!nReferToken) {
        return { status: 500, message: 'No nRefer token' };
    }
    const bodyData = {
        ip: crontabConfig['client_ip'] || '127.0.0.1',
        hospcode: hcode, data: JSON.stringify(dataArray),
        processPid: process.pid, dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        sourceApiName: 'HIS-connect', apiVersion: crontabConfig.version, subVersion: crontabConfig.subVersion,
        hisProvider: process.env.HIS_PROVIDER
    };
    const url = referAPIUrl + '/nrefer' + uri;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + nReferToken,
        'Source-Agent': 'HISConnect-' + (crontabConfig.version || 'x') + '-' + (crontabConfig.subVersion || 'x') + '-' + (process.env.HOSPCODE || 'hosp') + '-' + moment().format('x') + '-' + Math.random().toString(36).substring(2, 10),
    };
    try {
        const { status, data } = await axios_1.default.post(url, bodyData, { headers });
        return { statusCode: status, ...data };
    }
    catch (error) {
        return error;
    }
};
exports.sendingToMoph = sendingToMoph;
const updateHISAlive = async (dataArray) => {
    await (0, exports.getReferToken)();
    if (!nReferToken) {
        return { status: 500, message: 'No nRefer token' };
    }
    const hashedApiKey = (0, crypto_1.createHash)('sha1')
        .update((process.env.REQUEST_KEY || '') + (dataArray.hospcode || '') + (dataArray.his || '') + moment().format('YYYY-MM-DD HH:mm:ss'))
        .digest('hex');
    dataArray.apikey = hashedApiKey;
    const bodyData = {
        ip: crontabConfig['client_ip'] || '127.0.0.1',
        hospcode: hcode, data: JSON.stringify(dataArray),
        processPid: process.pid, dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        sourceApiName: 'HIS-connect', apiVersion: crontabConfig.version, subVersion: crontabConfig.subVersion,
        hisProvider: process.env.HIS_PROVIDER
    };
    const url = erpAPIUrl + '/his-connect/update';
    const headers = {
        'Content-Type': 'application/json',
        'Source-Agent': 'HISConnect-' +
            (crontabConfig.version || 'x') + '-' +
            (crontabConfig.subVersion || 'x') + '-' +
            (process.env.HOSPCODE || 'hosp') + '-' +
            moment().format('x') +
            '-' + Math.random().toString(36).substring(2, 10),
    };
    console.log('updateHISAlive', url);
    try {
        const { status, data } = await axios_1.default.post(url, bodyData, { headers });
        return { statusCode: status, ...data };
    }
    catch (error) {
        return error;
    }
};
exports.updateHISAlive = updateHISAlive;
const checkAdminRequest = async () => {
    const apiIp = (0, utils_1.getIP)();
    if (!apiIp || !apiIp.ip) {
        return { status: 400, message: 'No API IP' };
    }
    await (0, exports.getReferToken)();
    if (!nReferToken) {
        return { status: 500, message: 'No nRefer token' };
    }
    const url = referAPIUrl + '/moph-erp/check-request/' + hcode;
    const headers = {
        'Content-Type': 'application/json',
        'client-ip': apiIp.ip,
        'provider': process.env.HIS_PROVIDER,
        'Authorization': 'Bearer ' + nReferToken,
        'Source-Agent': 'HISConnect-' + (crontabConfig.version || 'x') + '-' + (crontabConfig.subVersion || 'x') + '-' + (process.env.HOSPCODE || 'hosp') + '-' + moment().format('x') + '-' + Math.random().toString(36).substring(2, 10),
    };
    console.log('get request', url);
    try {
        const { status, data } = await axios_1.default.get(url, { headers });
        return { statusCode: status, ...data };
    }
    catch (error) {
        return error;
    }
};
exports.checkAdminRequest = checkAdminRequest;
