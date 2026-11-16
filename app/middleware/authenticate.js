"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNReferToken = void 0;
exports.authenticateRequest = authenticateRequest;
const http_status_codes_1 = require("http-status-codes");
const moment_1 = __importDefault(require("moment"));
const axios_1 = __importDefault(require("axios"));
const package_json_1 = require("../../package.json");
const utils_1 = require("../utils/utils");
let nReferToken = null;
const apiKey = process.env.NREFER_APIKEY || process.env.MOPH_ERP_APIKEY || '';
const secretKey = process.env.NREFER_SECRETKEY || process.env.MOPH_ERP_SECRETKEY || '';
const hospcode = process.env.HOSPCODE || '';
async function authenticateRequest(request, reply) {
    request.user = null;
    if (request.body && request.body.token) {
        request.headers.authorization = 'Bearer ' + request.body.token;
    }
    try {
        request.user = await request.jwtVerify();
    }
    catch (err) {
        console.error((0, moment_1.default)().format('HH:mm:ss.SSS'), request.ipAddr, 'Error client try to access API ' + http_status_codes_1.StatusCodes.UNAUTHORIZED, `message: '${err.message}'`);
        return reply.code(http_status_codes_1.StatusCodes.UNAUTHORIZED).send({
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.UNAUTHORIZED)
        });
    }
}
const getNReferToken = async (ip = null) => {
    if (nReferToken && nReferToken.split('.').length === 3) {
        const tokenArray = nReferToken.split('.');
        if (tokenArray.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenArray[1], 'base64').toString());
            if (payload?.exp && (0, moment_1.default)(payload?.exp).format('X') > (0, moment_1.default)().add(4, 'minutes').format('X')) {
                return nReferToken;
            }
        }
    }
    if (!ip || ip === '127.0.0.1') {
        ip = (0, utils_1.getIP)()?.ip || '127.0.0.1';
    }
    const fixedUrl = process.env.NREFER_API_URL || 'https://nrefer.moph.go.th/api/his';
    const url = fixedUrl + '/login/api-key';
    const bodyData = {
        ip,
        apiKey, secretKey, hospcode,
        processPid: process.pid, dateTime: (0, moment_1.default)().format('YYYY-MM-DD HH:mm:ss'),
        sourceApiName: 'HIS-connect', apiVersion: package_json_1.version, subVersion: package_json_1.subVersion,
        hisProvider: process.env.HIS_PROVIDER
    };
    const headers = {
        'Content-Type': 'application/json',
        'Source-Agent': 'HISConnect-' + package_json_1.version + '-' + package_json_1.subVersion + '-' + (hospcode || 'hosp') + '-' + (0, moment_1.default)().format('x') + '-' + Math.random().toString(36).substring(2, 10),
    };
    try {
        const { status, data } = await axios_1.default.post(url, bodyData, { headers });
        nReferToken = data?.token || null;
        return nReferToken;
    }
    catch (error) {
        console.error('❗getNReferToken', error.status || '', error.message);
        return null;
    }
};
exports.getNReferToken = getNReferToken;
