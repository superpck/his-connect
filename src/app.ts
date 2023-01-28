import path = require('path');
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import fastify from 'fastify';
import * as moment from 'moment';
import cronjob from './nodecron';

const serveStatic = require('serve-static');
var crypto = require('crypto');

require('dotenv').config({ path: path.join(__dirname, '../config') });

import helmet = require('@fastify/helmet');
const { name, version, subVersion } = require('./../package.json');

// const fastifySession = require('fastify-session');
// const fastifyCookie = require('@fastify/cookie');
// var cron = require('node-cron');
// var shell = require("shelljs");

const app = fastify({
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
  // skipOnError: true,
  // cache: 10000,
  timeWindow: '1 minute'
});

app.register(serveStatic(path.join(__dirname, '../public')));

app.register(require('@fastify/view'), {
  engine: {
    ejs: require('ejs')
  }
})

// app.register(fastifyCookie);
// app.register(fastifySession, { secret: process.env.SECRET_KEY });

app.register(require('@fastify/jwt'), {
  secret: process.env.SECRET_KEY
});

// app.register(require('@fastify/cookie'), {
//   secret: "hisConnectCookies",
//   hook: 'onRequest',
//   parseOptions: {}
// })
// app.register(require('fastify-ws'), {});
global.ipAddr = require('./routes/main/local-server')(global.ipAddr, {});

// set MOPH Url =========================================
global.mophService = require('./routes/main/crontab')(global.mophService, {});
global.firstProcessPid = 0;
global.mophService = null;

// if (!app.mophService) {
//   getmophUrl();
// }

// DB connection =========================================
const dbConnection = require('./plugins/db');
global.dbHIS = dbConnection('HIS');
global.dbRefer = dbConnection('REFER');
global.dbIs = dbConnection('ISONLINE');
global.dbISOnline = global.dbIs;
global.dbCannabis = dbConnection('CANNABIS');

// check token ===========================================================
app.decorate("authenticate", async (request, reply) => {
  let token: string = null;

  if (request.body && request.body.token) {
    token = await request.body.token;
  } else if (request.headers.authorization && request.headers.authorization.split(' ')[0] === 'Bearer') {
    token = await request.headers.authorization.split(' ')[1];
  }

  try {
    await request.jwtVerify();
  } catch (err) {
    console.log(moment().format('HH:mm:ss.SSS'), 'error:'+StatusCodes.UNAUTHORIZED, err.message);
    reply.send({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: getReasonPhrase(StatusCodes.UNAUTHORIZED)
    });
  }
});
// end: check token ===========================================================

app.decorate("checkRequestKey", async (request, reply) => {
  let skey = null;
  if (request.headers.localkey) {
    skey = request.headers.localkey;
  }
  var requestKey = crypto.createHash('md5').update(process.env.REQUEST_KEY).digest('hex');
  if (!skey || skey !== requestKey) {
    console.log('invalid key', requestKey);
    reply.send({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: getReasonPhrase(StatusCodes.UNAUTHORIZED) + ' or invalid key'
    });
  }

});

// Add Route path ================================
var geoip = require('geoip-lite');
app.addHook('preHandler', async (request, reply) => {
  const ip = request.headers["x-real-ip"] ||
    request.headers["x-forwarded-for"] || request.ip;
  var geo = geoip.lookup(ip);
  if (geo && geo.country && geo.country != 'TH'){
    console.log(`Unacceptable country: ${geo.country}`);
    reply.status(StatusCodes.NOT_ACCEPTABLE).send(StatusCodes.NOT_ACCEPTABLE);
  }
  console.log(moment().format('HH:mm:ss'), geo ? geo.country : 'unk', ip, request.url);
});
app.register(require('./route'));


app.register(cronjob);

var options: any = {
  port: process.env.PORT || 3001,
  host: process.env.HOST || '0.0.0.0'
}

app.listen(options, (err) => {
  if (err) throw err;
  console.log('>>> ', `HIS Connection API (${global.appDetail.version}) start on port`, options.port, 'PID', process.pid);
});