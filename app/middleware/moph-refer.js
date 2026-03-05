"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendingError = exports.updateAdminRequest = exports.checkAdminRequest = exports.updateHISAlive = exports.sendingToMoph = exports.taskFunction = exports.getHospitalConfig = exports.getReferToken = void 0;
const axios_1 = __importDefault(require("axios"));
const moment = require("moment");
const crypto_1 = require("crypto");
const utils_1 = require("./utils");
const os = __importStar(require("os"));
const packageJson = require('../../package.json');
const referAPIUrl = process.env?.MOPH_ERP_API_URL || 'https://refer.moph.go.th/api/erp';
const adminAPIUrl = process.env.ADMIN_API_URL || 'https://referlink.moph.go.th/api/admin';
const erpAPIUrl = process.env.ERP_API_URL || 'https://referlink.moph.go.th/api/moph-erp';
const hcode = process.env.HOSPCODE;
const apiKey = process.env?.MOPH_ERP_APIKEY || process.env.NREFER_APIKEY || 'api-key';
const secretKey = process.env?.MOPH_ERP_SECRETKEY || process.env.NREFER_SECRETKEY || 'secret-key';
let crontabConfig = {
    client_ip: '', version: global.appDetail?.version || '',
    subVersion: global.appDetail?.subVersion || ''
};
let nReferToken = null;
let hospitalConfig = null;
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
        console.log('getNReferToken Error:', error.status || '', error.message);
        return error;
    }
};
exports.getReferToken = getReferToken;
const getHospitalConfig = async () => {
    const now = moment();
    if (hospitalConfig) {
        const configTime = moment(hospitalConfig.fetchTime || null);
        const diff = now.diff(configTime, 'minutes');
        if (diff < 12) {
            return hospitalConfig;
        }
    }
    await (0, exports.getReferToken)();
    if (!nReferToken) {
        return { status: 500, message: 'No nRefer token' };
    }
    const url = referAPIUrl + '/nrefer/api-config/' + hcode;
    const headers = createHeaders(nReferToken);
    try {
        const { status, data } = await axios_1.default.get(url, { headers });
        hospitalConfig = { ...(data?.row || data?.data || data), fetchTime: now.format('YYYY-MM-DD HH:mm:ss') };
        return hospitalConfig;
    }
    catch (error) {
        return error;
    }
};
exports.getHospitalConfig = getHospitalConfig;
const taskFunction = async (type = '', bodyData = null) => {
    await (0, exports.getReferToken)();
    if (!nReferToken) {
        return { status: 500, message: 'No nRefer token' };
    }
    const headers = createHeaders(nReferToken);
    try {
        let response;
        if (type == 'sql') {
            const url = referAPIUrl + '/his-connect/task-function-sql';
            response = await axios_1.default.post(url, bodyData, { headers });
        }
        else {
            const url = referAPIUrl + `/his-connect/task-function/${type}`;
            response = await axios_1.default.get(url, { headers });
        }
        return { statusCode: response.status, ...response.data };
    }
    catch (error) {
        return error;
    }
};
exports.taskFunction = taskFunction;
const sendingToMoph = async (uri, dataArray) => {
    await (0, exports.getReferToken)();
    if (!nReferToken) {
        return { status: 500, message: 'No nRefer token' };
    }
    const bodyData = {
        ip: crontabConfig['client_ip'] || '127.0.0.1',
        hospcode: hcode, data: JSON.stringify(dataArray),
        processPid: process.pid, dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        sourceApiName: 'HIS-connect', apiVersion: crontabConfig.version || packageJson?.version, subVersion: crontabConfig.subVersion || packageJson?.subVersion,
        hisProvider: process.env.HIS_PROVIDER
    };
    const url = referAPIUrl + '/nrefer' + uri;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + nReferToken,
        'Source-Agent': 'HISConnect-' + (crontabConfig.version || packageJson?.version || 'x') + '-' + (crontabConfig.subVersion || packageJson?.subVersion || 'x') + '-' + (process.env.HOSPCODE || 'hosp') + '-' + moment().format('x') + '-' + Math.random().toString(36).substring(2, 10),
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
    const hashedApiKey = (0, crypto_1.createHash)('sha1')
        .update((process.env.REQUEST_KEY || '') + (dataArray.hospcode || '') + (dataArray.his || '') + moment().format('YYYY-MM-DD HH:mm:ss'))
        .digest('hex');
    dataArray.apikey = hashedApiKey;
    const bodyData = createPostData(dataArray);
    const url = erpAPIUrl + '/his-connect/update';
    const headers = createHeaders();
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
    try {
        const { status, data } = await axios_1.default.get(url, { headers });
        return data;
    }
    catch (error) {
        return error;
    }
};
exports.checkAdminRequest = checkAdminRequest;
const updateAdminRequest = async (updateData) => {
    const apiIp = (0, utils_1.getIP)();
    if (!apiIp || !apiIp.ip) {
        return { status: 400, message: 'No API IP' };
    }
    await (0, exports.getReferToken)();
    if (!nReferToken) {
        return { status: 500, message: 'No nRefer token' };
    }
    const url = referAPIUrl + '/moph-erp/update-admin-request/' + hcode;
    const postData = createPostData(updateData);
    const headers = createHeaders(nReferToken);
    try {
        const { status, data } = await axios_1.default.post(url, postData, { headers });
        return { statusCode: status, ...data };
    }
    catch (error) {
        return error;
    }
};
exports.updateAdminRequest = updateAdminRequest;
const sendingError = async (dataArray) => {
    await (0, exports.getReferToken)();
    if (!nReferToken) {
        return { status: 500, message: 'No nRefer token' };
    }
    const hospcode = process.env.HOSPCODE || hcode || '';
    dataArray = {
        ...dataArray, hospcode,
        client_detail: {
            his: process.env.HIS_PROVIDER || '',
            port: process.env.PORT || '',
            db: process.env.HIS_DB_CLIENT || '',
            os: os.platform() || '',
            os_type: os.type() || ''
        }
    };
    const url = referAPIUrl + '/his-connect/save-error';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + nReferToken,
        'Source-Agent': 'HISConnect-' + (crontabConfig.version || packageJson?.version || 'x') + '-' + (crontabConfig.subVersion || packageJson?.subVersion || 'x') + '-' + (process.env.HOSPCODE || 'hosp') + '-' + moment().format('x') + '-' + Math.random().toString(36).substring(2, 10),
    };
    const option = {
        url, method: 'POST', headers, data: { hospcode, data: dataArray }
    };
    try {
        const { status, data } = await (0, axios_1.default)(option);
        console.log('sendingError to MOPH:', status || data.status || data?.statusCode || 'success');
        return { statusCode: status, ...data };
    }
    catch (error) {
        console.error('sendingError to MOPH fail:', error.status || '', error.message);
        return error;
    }
};
exports.sendingError = sendingError;
function createPostData(dataArray) {
    return {
        ip: crontabConfig['client_ip'] || (0, utils_1.getIP)() || '127.0.0.1',
        hospcode: hcode, data: JSON.stringify(dataArray),
        processPid: process.pid, dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        sourceApiName: 'HIS-connect', apiVersion: crontabConfig.version, subVersion: crontabConfig.subVersion,
        hisProvider: process.env.HIS_PROVIDER
    };
}
function createHeaders(token = null) {
    const apiIp = (0, utils_1.getIP)();
    let headers = {
        'client-ip': apiIp.ip,
        'provider': process.env.HIS_PROVIDER,
        'Content-Type': 'application/json',
        'Source-Agent': 'HISConnect-' +
            (crontabConfig.version || 'x') + '-' +
            (crontabConfig.subVersion || 'x') + '-' +
            (process.env.HOSPCODE || 'hosp') + '-' +
            moment().format('x') + '-' +
            Math.random().toString(36).substring(2, 10)
    };
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }
    return headers;
}
