"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const moment = require("moment");
var http = require('http');
var querystring = require('querystring');
const request = require('request');
let apiVersion = global.appDetail.version;
let subVersion = global.appDetail.subVersion;
const router = (fastify, {}, next) => {
    fastify.get('/sending-process/:?date', async (req, reply) => {
        const now = moment().locale('th').format('YYYY-MM-DD');
        const trust = req.headers.host.search('localhost|127.0.0.1') > -1;
        const apiKey = process.env.NREFER_APIKEY || process.env.APIKEY;
        const secretKey = process.env.NREFER_SECRETKEY || process.env.SECRETKEY;
        if (!trust || !apiKey || !secretKey) {
            reply.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).send({ statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.UNAUTHORIZED) });
        }
        let tokenLocal = '';
        let tokenNRefer = '';
        let token = '';
        try {
            const resultLocalToken = await getLocalToken();
            if (resultLocalToken.token) {
                tokenLocal = resultLocalToken.token;
            }
        }
        catch (error) {
            reply.status(http_status_codes_1.StatusCodes.OK).send({
                statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                message: error.message
            });
        }
        try {
            const result = await getToken(apiKey, secretKey);
            if (result.statusCode && result.statusCode === 200 && result.token) {
                token = result.token;
            }
            else {
                reply.status(http_status_codes_1.StatusCodes.OK).send({
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                    message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST),
                    error: result.message
                });
                return false;
            }
        }
        catch (error) {
            reply.status(http_status_codes_1.StatusCodes.OK).send({
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                message: error.message,
                error: error
            });
            return false;
        }
        ;
        try {
            const result = await expireToken(tokenNRefer);
        }
        catch (error) {
            reply.status(http_status_codes_1.StatusCodes.OK).send({
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                message: error.message
            });
        }
    });
    next();
};
async function getLocalToken() {
    const apiHttpProtocol = (process.env.HTTPS && +process.env.HTTPS === 1) ? 'https' : 'http';
    const apiPort = process.env.PORT;
    const url = `${apiHttpProtocol}://127.0.0.1:${apiPort}/get-token`;
    const options = {
        url: url,
        method: 'GET'
    };
    return new Promise((resolve, reject) => {
        request(options, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                resolve(JSON.parse(body));
            }
            else {
                reject(error);
            }
        });
    });
}
async function getToken(apiKey, secretKey) {
    let url = process.env.NREFER_API_URL;
    url += url.substr(-1, 1) === '/' ? '' : '/';
    const postData = querystring.stringify({
        apiKey: apiKey, secretKey: secretKey
    });
    const options = {
        hostname: process.env.NREFER_URL,
        port: process.env.NREFER_PORT,
        path: process.env.NREFER_PATH + '/login/api-key',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Source-Agent': 'HISConnect-' + apiVersion + '-' + subVersion + '-' + (process.env.HOSPCODE || 'hosp') + '-' + moment().format('x') + '-' + Math.random().toString(36).substring(2, 10),
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    let ret = '';
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                ret += chunk;
            });
            res.on('end', () => {
                const data = JSON.parse(ret);
                resolve(data);
            });
        });
        req.on('error', (e) => {
            reject(e);
        });
        req.write(postData);
        req.end();
    });
}
async function getNReferToken(apiKey, secretKey) {
    let url = process.env.NREFER_API_URL;
    url += url.substring(url.length - 1) === '/' ? '' : '/';
    const postData = querystring.stringify({
        apiKey: apiKey, secretKey: secretKey
    });
    const options = {
        hostname: process.env.NREFER_URL,
        port: process.env.NREFER_PORT,
        path: process.env.NREFER_PATH + '/login/get-token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    let ret = '';
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                ret += chunk;
            });
            res.on('end', () => {
                const data = JSON.parse(ret);
                resolve(data);
            });
        });
        req.on('error', (e) => {
            reject(e);
        });
        req.write(postData);
        req.end();
    });
}
async function expireToken(token) {
    let url = process.env.NREFER_API_URL;
    url += url.substring(url.length - 1) === '/' ? '' : '/';
    const postData = querystring.stringify({
        token: token
    });
    const options = {
        hostname: process.env.NREFER_URL,
        port: process.env.NREFER_PORT,
        path: process.env.NREFER_PATH + '/login/expire-token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${token}`,
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    let ret = '';
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                ret += chunk;
            });
            res.on('end', () => {
                const data = JSON.parse(ret);
                resolve(data);
            });
        });
        req.on('error', (e) => {
            reject(e);
        });
        req.write(postData);
        req.end();
    });
}
async function getReferOut(tokenLocal, date) {
    const apiHttpProtocol = (process.env.HTTPS && +process.env.HTTPS === 1) ? 'https' : 'http';
    const apiPort = process.env.PORT;
    const url = `${apiHttpProtocol}://127.0.0.1:${apiPort}/refer/referout`;
    const postData = querystring.stringify({
        date: date, hospcode: process.env.HOSPCODE
    });
    const options = {
        url: url,
        method: 'POST',
        headers: {
            'User-Agent': 'Super Agent/0.0.1',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${tokenLocal}`,
            'Content-Length': Buffer.byteLength(postData)
        },
        form: { date: date, hospcode: process.env.HOSPCODE }
    };
    return new Promise((resolve, reject) => {
        request(options, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                resolve(JSON.parse(body));
            }
            else {
                reject(error);
            }
        });
    });
}
async function getData(routeName, tokenLocal, postData) {
    const apiHttpProtocol = (process.env.HTTPS && +process.env.HTTPS === 1) ? 'https' : 'http';
    const apiPort = process.env.PORT;
    const url = `${apiHttpProtocol}://127.0.0.1:${apiPort}/refer/${routeName}`;
    const formData = querystring.stringify(postData);
    const options = {
        url: url,
        method: 'POST',
        headers: {
            'User-Agent': 'Super Agent/0.0.1',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${tokenLocal}`,
            'Content-Length': Buffer.byteLength(formData)
        },
        form: postData
    };
    return new Promise((resolve, reject) => {
        request(options, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                resolve(JSON.parse(body));
            }
            else {
                reject(error);
            }
        });
    });
}
async function sendPerson(tableName, tokenNRefer, data) {
    let url = process.env.NREFER_API_URL;
    url += url.substring(url.length - 1) === '/' ? '' : '/';
    url += 'ws/save-person';
    const formData = { token: tokenNRefer, tableName: tableName, data: JSON.stringify(data) };
    const postData = querystring.stringify(formData);
    const options = {
        url: url,
        method: 'POST',
        headers: {
            'User-Agent': 'Super Agent/0.0.1',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${tokenNRefer}`,
            'Content-Length': Buffer.byteLength(postData)
        },
        form: formData
    };
    return new Promise((resolve, reject) => {
        request(options, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                resolve(JSON.parse(body));
            }
            else {
                reject(error);
            }
        });
    });
}
module.exports = router;
