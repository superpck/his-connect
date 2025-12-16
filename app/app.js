"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('node:fs');
checkConfigFile();
const path = require("path");
require('dotenv').config({
    path: path.join(__dirname, '../config'),
    quiet: true
});
const http_status_codes_1 = require("http-status-codes");
const fastify_1 = require("fastify");
const moment = require("moment");
const nodecron_optimized_1 = require("./nodecron.optimized");
const serveStatic = require('serve-static');
var crypto = require('crypto');
const utils_1 = require("./middleware/utils");
const helmet = require("@fastify/helmet");
var serverOption = {};
if (process.env.SSL_ENABLE && process.env.SSL_ENABLE == '1' && process.env.SSL_KEY) {
    serverOption = {
        logger: {
            level: 'error',
        },
        bodyLimit: 20 * 1024 * 1024,
        http2: true,
        https: {
            key: fs.readFileSync(process.env.SSL_KEY),
            cert: fs.readFileSync(process.env.SSL_CRT)
        }
    };
}
else {
    serverOption = {
        logger: {
            level: 'error',
        },
        bodyLimit: 20 * 1024 * 1024,
        connectionTimeout: 10000
    };
}
const app = (0, fastify_1.default)(serverOption);
const { name, version, subVersion } = require('./../package.json');
global.appDetail = { name, subVersion, version };
app.register(require('@fastify/formbody'));
app.register(require('@fastify/cors'), {});
app.register(require('fastify-no-icon'));
app.register(helmet, {});
app.register(require('@fastify/rate-limit'), {
    max: +process.env.MAX_CONNECTION_PER_MINUTE || 1000,
    timeWindow: '1 minute'
});
app.register(serveStatic(path.join(__dirname, '../public')));
app.register(require('@fastify/view'), {
    engine: {
        ejs: require('ejs')
    }
});
app.register(require('@fastify/jwt'), {
    secret: process.env.SECRET_KEY
});
global.apiStartTime = moment().format('YYYY-MM-DD HH:mm:ss');
global.mophService = require('./routes/main/crontab')(global.mophService, {});
global.firstProcessPid = 0;
global.mophService = null;
connectDB();
app.decorate("authenticate", async (request, reply) => {
    request.authenDecoded = null;
    request.user = null;
    if (request.body && request.body.token) {
        request.headers.authorization = 'Bearer ' + request.body.token;
    }
    try {
        request.user = await request.jwtVerify();
        request.authenDecoded = request.user;
    }
    catch (err) {
        let ipAddr = request.headers["x-real-ip"] || request.headers["x-forwarded-for"] || request.ip;
        console.log(moment().format('HH:mm:ss.SSS'), ipAddr, 'error:' + http_status_codes_1.StatusCodes.UNAUTHORIZED, err.message);
        reply.send({
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.UNAUTHORIZED)
        });
    }
});
app.decorate("checkRequestKey", async (request, reply) => {
    let skey = null;
    if (request.headers.localkey) {
        skey = request.headers.localkey;
    }
    var requestKey = crypto.createHash('md5').update(process.env.REQUEST_KEY).digest('hex');
    if (!skey || skey !== requestKey) {
        console.log('invalid key', requestKey);
        reply.send({
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.UNAUTHORIZED) + ' or invalid key'
        });
    }
});
var geoip = require('geoip-lite');
app.addHook('onRequest', async (req, reply) => {
    const unBlockIP = process.env.UNBLOCK_IP || '??';
    let ipAddr = req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || req.ip;
    ipAddr = ipAddr ? ipAddr.split(',') : [''];
    req.ipAddr = ipAddr[0].trim();
    let isSubnet = true;
    if (process.env.ALLOW_API_SUBNET || false) {
        isSubnet = await isIPInSubnet(req.ipAddr);
    }
    var geo = geoip.lookup(req.ipAddr);
    if (!isSubnet && geo && geo.country && geo.country != 'TH' && req.ipAddr != process.env.HOST && !unBlockIP.includes(req.ipAddr)) {
        console.log(req.ipAddr, `Unacceptable country: ${geo.country}`);
        return reply.send({ status: http_status_codes_1.StatusCodes.NOT_ACCEPTABLE, ip: req.ipAddr, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.NOT_ACCEPTABLE) });
    }
    console.log(moment().format('HH:mm:ss'), geo ? geo.country : 'unk', req.ipAddr, req.url);
});
app.addHook('preHandler', async (request, reply) => {
});
app.addHook('onSend', async (request, reply, payload) => {
    const headers = {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
    };
    reply.headers(headers);
    return payload;
});
app.register(require('./route'));
app.register(nodecron_optimized_1.default);
var options = {
    port: process.env.PORT || 3004,
    host: process.env.HOST || '0.0.0.0'
};
app.listen(options, (err) => {
    if (err)
        throw err;
    const instanceId = process.env.NODE_APP_INSTANCE || '0';
    console.info(`${moment().format('HH:mm:ss')} HIS-Connect API ${global.appDetail.version}-${global.appDetail.subVersion} started on port ${options.port}, PID: ${process.pid} with NodeJS: ${process.version || ''}, Instance: ${instanceId}`);
});
async function connectDB() {
    const dbClient = process.env.HIS_DB_CLIENT;
    try {
        const dbConnection = require('./plugins/db');
        global.dbHIS = dbConnection('HIS');
        global.dbIs = dbConnection('ISONLINE');
        global.dbISOnline = global.dbIs;
        let sql = '';
        switch (dbClient) {
            case 'oracledb':
                sql = 'SELECT CURRENT_TIMESTAMP AS "date" FROM dual';
                break;
            case 'mssql':
                sql = 'SELECT SYSDATETIME() AS date';
                break;
            default:
                sql = 'SELECT NOW() as date';
        }
        const result = await global.dbHIS.raw(sql);
        let date;
        if (dbClient === 'pg' || dbClient === 'postgres' || dbClient === 'postgresql') {
            date = result.rows?.[0]?.date;
        }
        else if (dbClient === 'mssql') {
            date = result.recordset?.[0]?.date;
        }
        else if (dbClient === 'oracledb') {
            date = result[0]?.[0]?.date;
        }
        else {
            date = result[0]?.[0]?.date;
        }
        console.info(`   🔗 PID:${process.pid} >> HIS DB server '${dbClient}' connected, date/time on DB server:`, moment(date).format('YYYY-MM-DD HH:mm:ss'));
    }
    catch (error) {
        console.error(`   ❌ PID:${process.pid} >> HIS DB server '${dbClient}' connect error: `, error.message);
    }
}
async function checkConfigFile() {
    if (fs.existsSync('./config')) {
        console.info(`✅ PID:${process.pid} >> Check 'config' file exist: Successfully`);
    }
    else {
        console.error(`❌ PID:${process.pid} >> Check 'config' file exist: Not found, please create file 'config' and try again.`);
        process.exit(1);
    }
}
async function isIPInSubnet(ip) {
    if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
        return true;
    }
    let localIP = (0, utils_1.getIP)();
    if (!localIP || !localIP?.ip || !ip) {
        return true;
    }
    localIP = (localIP?.ip || '').split('.');
    ip = (ip || '').split('.');
    const isValidIP = ip[0] === localIP[0] && ip[1] === localIP[1] && ip[2] === localIP[2];
    console.log('localIP', localIP, ip, isValidIP);
    return isValidIP;
}
