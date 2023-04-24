"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const http_status_codes_1 = require("http-status-codes");
const fastify_1 = require("fastify");
const moment = require("moment");
const nodecron_1 = require("./nodecron");
const serveStatic = require('serve-static');
var crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../config') });
const helmet = require("@fastify/helmet");
const { name, version, subVersion } = require('./../package.json');
const app = (0, fastify_1.default)({
    logger: {
        level: 'error',
    },
    bodyLimit: 5 * 1048576,
});
global.appDetail = { name, subVersion, version };
app.register(require('@fastify/formbody'));
app.register(require('@fastify/cors'), {});
app.register(require('fastify-no-icon'));
app.register(helmet, {});
app.register(require('@fastify/rate-limit'), {
    max: +process.env.MAX_CONNECTION_PER_MINUTE || 100,
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
global.ipAddr = require('./routes/main/local-server')(global.ipAddr, {});
global.mophService = require('./routes/main/crontab')(global.mophService, {});
global.firstProcessPid = 0;
global.mophService = null;
const dbConnection = require('./plugins/db');
global.dbHIS = dbConnection('HIS');
global.dbRefer = dbConnection('REFER');
global.dbIs = dbConnection('ISONLINE');
global.dbISOnline = global.dbIs;
app.decorate("authenticate", async (request, reply) => {
    let token = null;
    if (request.body && request.body.token) {
        token = await request.body.token;
    }
    else if (request.headers.authorization && request.headers.authorization.split(' ')[0] === 'Bearer') {
        token = await request.headers.authorization.split(' ')[1];
    }
    try {
        await request.jwtVerify();
    }
    catch (err) {
        console.log(moment().format('HH:mm:ss.SSS'), 'error:' + http_status_codes_1.StatusCodes.UNAUTHORIZED, err.message);
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
app.addHook('preHandler', async (request, reply) => {
    const headers = {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
    };
    reply.headers(headers);
    let ipAddr = request.headers["x-forwarded-for"] || request.headers["x-real-ip"] || request.ip;
    ipAddr = ipAddr ? ipAddr.split(',') : [''];
    const ip = ipAddr[0].trim();
    var geo = geoip.lookup(ip);
    if (geo && geo.country && geo.country != 'TH') {
        console.log(`Unacceptable country: ${geo.country}`);
        reply.status(http_status_codes_1.StatusCodes.NOT_ACCEPTABLE).send(http_status_codes_1.StatusCodes.NOT_ACCEPTABLE);
    }
    console.log(moment().format('HH:mm:ss'), geo ? geo.country : 'unk', ip, request.url);
});
app.register(require('./route'));
app.register(nodecron_1.default);
var options = {
    port: process.env.PORT || 3001,
    host: process.env.HOST || '0.0.0.0'
};
app.listen(options, (err) => {
    if (err)
        throw err;
    console.log('>>> ', `HIS Connection API (${global.appDetail.version}) started on`, app.addresses(), 'PID', process.pid);
});
