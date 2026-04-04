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
const zlib_1 = __importDefault(require("zlib"));
const util_1 = require("util");
const utils_1 = require("./utils");
const os = __importStar(require("os"));
const packageJson = require('../../package.json');
const referAPIUrl = process.env?.MOPH_ERP_API_URL || 'https://refer.moph.go.th/api/erp';
const adminAPIUrl = process.env.ADMIN_API_URL || 'https://referlink.moph.go.th/api/admin';
const erpAPIUrl = process.env.ERP_API_URL || 'https://referlink.moph.go.th/api/moph-erp';
const hcode = process.env.HOSPCODE;
const apiKey = process.env?.MOPH_ERP_APIKEY || process.env.NREFER_APIKEY || 'api-key';
const secretKey = process.env?.MOPH_ERP_SECRETKEY || process.env.NREFER_SECRETKEY || 'secret-key';
const httpTimeoutMs = Math.max(1000, +(process.env.MOPH_HTTP_TIMEOUT_MS || 15000));
let crontabConfig = {
    client_ip: '', version: global.appDetail?.version || '',
    subVersion: global.appDetail?.subVersion || ''
};
let nReferToken = null;
let hospitalConfig = null;
let referTokenPromise = null;
let hospitalConfigPromise = null;
const gzip = (0, util_1.promisify)(zlib_1.default.gzip);
function getRequestTimeoutMs(timeoutMs) {
    return Math.max(1000, +(timeoutMs || httpTimeoutMs));
}
function getElapsedMs(startTime) {
    return Date.now() - startTime;
}
function getErrorMessage(error) {
    if (axios_1.default.isAxiosError(error)) {
        const status = error.response?.status ? `status=${error.response.status}` : 'status=unknown';
        const code = error.code ? ` code=${error.code}` : '';
        return `${status}${code} message=${error.message}`;
    }
    return error?.message || String(error);
}
function logRequestStart(label, purpose, timeoutMs) {
    console.info(`${moment().format('HH:mm:ss')} ${label} start${purpose ? ` (${purpose})` : ''}, timeout=${timeoutMs}ms`);
}
function logRequestResult(label, purpose, startTime, error) {
    const elapsedMs = getElapsedMs(startTime);
    if (error) {
        console.error(`${moment().format('HH:mm:ss')} ${label} fail${purpose ? ` (${purpose})` : ''} after ${elapsedMs}ms: ${getErrorMessage(error)}`);
        return;
    }
    console.info(`${moment().format('HH:mm:ss')} ${label} success${purpose ? ` (${purpose})` : ''} in ${elapsedMs}ms`);
}
const getReferToken = async (options = {}) => {
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
    if (referTokenPromise) {
        return referTokenPromise;
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
    const timeoutMs = getRequestTimeoutMs(options.timeoutMs);
    const purpose = options.purpose || '';
    referTokenPromise = (async () => {
        const startedAt = Date.now();
        logRequestStart('MOPH token request', purpose, timeoutMs);
        try {
            const { data } = await axios_1.default.post(url, bodyData, { headers, timeout: timeoutMs });
            nReferToken = data?.token || nReferToken;
            logRequestResult('MOPH token request', purpose, startedAt);
            return data;
        }
        catch (error) {
            logRequestResult('MOPH token request', purpose, startedAt, error);
            return error;
        }
        finally {
            referTokenPromise = null;
        }
    })();
    return referTokenPromise;
};
exports.getReferToken = getReferToken;
const getHospitalConfig = async (options = {}) => {
    const now = moment();
    if (hospitalConfig) {
        const configTime = moment(hospitalConfig.fetchTime || null);
        const diff = now.diff(configTime, 'minutes');
        if (diff < 12) {
            return hospitalConfig;
        }
    }
    if (hospitalConfigPromise) {
        return hospitalConfigPromise;
    }
    const timeoutMs = getRequestTimeoutMs(options.timeoutMs);
    const purpose = options.purpose || '';
    hospitalConfigPromise = (async () => {
        const startedAt = Date.now();
        logRequestStart('MOPH hospital config request', purpose, timeoutMs);
        await (0, exports.getReferToken)(options);
        if (!nReferToken) {
            const noTokenError = { status: 500, message: 'No nRefer token' };
            logRequestResult('MOPH hospital config request', purpose, startedAt, noTokenError);
            return noTokenError;
        }
        const url = referAPIUrl + '/nrefer/api-config/' + hcode;
        const headers = createHeaders(nReferToken);
        try {
            const { data } = await axios_1.default.get(url, { headers, timeout: timeoutMs });
            hospitalConfig = { ...(data?.row || data?.data || data), fetchTime: now.format('YYYY-MM-DD HH:mm:ss') };
            logRequestResult('MOPH hospital config request', purpose, startedAt);
            return hospitalConfig;
        }
        catch (error) {
            logRequestResult('MOPH hospital config request', purpose, startedAt, error);
            return error;
        }
        finally {
            hospitalConfigPromise = null;
        }
    })();
    return hospitalConfigPromise;
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
    const jsonString = JSON.stringify(bodyData);
    const compressedBody = await gzip(jsonString);
    const url = referAPIUrl + '/nrefer' + uri;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + nReferToken,
        'content-encoding': 'gzip',
        'source-agent': 'HISConnect-' + (crontabConfig.version || packageJson?.version || 'x') + '-' + (crontabConfig.subVersion || packageJson?.subVersion || 'x') + '-' + (process.env.HOSPCODE || 'hosp') + '-' + moment().format('x') + '-' + Math.random().toString(36).substring(2, 10),
    };
    try {
        const { status, data } = await axios_1.default.post(url, compressedBody, { headers });
        return { statusCode: status, ...data };
    }
    catch (error) {
        console.error('sendingToMoph error:', getErrorMessage(error));
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
    await (0, exports.getReferToken)({ purpose: 'sending-error' });
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
    const jsonString = JSON.stringify({ hospcode, data: dataArray });
    const compressedBody = await gzip(jsonString);
    const url = referAPIUrl + '/his-connect/save-error';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + nReferToken,
        'content-encoding': 'gzip',
        'Source-Agent': 'HISConnect-' + (crontabConfig.version || packageJson?.version || 'x') + '-' + (crontabConfig.subVersion || packageJson?.subVersion || 'x') + '-' + (process.env.HOSPCODE || 'hosp') + '-' + moment().format('x') + '-' + Math.random().toString(36).substring(2, 10),
    };
    try {
        const { status, data } = await axios_1.default.post(url, compressedBody, {
            headers,
            timeout: getRequestTimeoutMs()
        });
        console.log('sendingError to MOPH:', status || data.status || data?.statusCode || 'success');
        return { statusCode: status, ...data };
    }
    catch (error) {
        console.error('sendingError to MOPH fail:', getErrorMessage(error));
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
