// Check config file ====================================
const fs = require('node:fs');
checkConfigFile();

import path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '../config'),
  quiet: true
});

import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import fastify, { FastifyRequest } from 'fastify';
import * as moment from 'moment';
// import cronjob from './nodecron';
import cronjob from './nodecron.optimized';

const serveStatic = require('serve-static');
var crypto = require('crypto');

import helmet = require('@fastify/helmet');

var serverOption = {}
if (process.env.SSL_ENABLE && process.env.SSL_ENABLE == '1' && process.env.SSL_KEY) {
  serverOption = {
    logger: {
      level: 'error',
    },
    bodyLimit: 20 * 1024 * 1024,    // 20 MB
    http2: true,
    https: {
      key: fs.readFileSync(process.env.SSL_KEY),
      cert: fs.readFileSync(process.env.SSL_CRT)
    }
  }
} else {
  serverOption = {
    logger: {
      level: 'error',
    },
    bodyLimit: 20 * 1024 * 1024,    // 20 MB
    connectionTimeout: 10000
  }
}
const app = fastify(serverOption);

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
})

app.register(require('@fastify/jwt'), {
  secret: process.env.SECRET_KEY
});

// set MOPH Url =========================================
global.apiStartTime = moment().format('YYYY-MM-DD HH:mm:ss');
global.mophService = require('./routes/main/crontab')(global.mophService, {});
global.firstProcessPid = 0;
global.mophService = null;

// DB connection =========================================
connectDB();

// check token ===========================================================
app.decorate("authenticate", async (request: any, reply: any) => {
  request.authenDecoded = null;
  request.user = null;
  if (request.body && request.body.token) {
    request.headers.authorization = 'Bearer ' + request.body.token;
  }

  try {
    request.user = await request.jwtVerify();
    request.authenDecoded = request.user;
  } catch (err) {
    let ipAddr: any = request.headers["x-real-ip"] || request.headers["x-forwarded-for"] || request.ip;
    console.log(moment().format('HH:mm:ss.SSS'), ipAddr, 'error:' + StatusCodes.UNAUTHORIZED, err.message);
    reply.send({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: getReasonPhrase(StatusCodes.UNAUTHORIZED)
    });
  }
});
// end: check token ===========================================================

app.decorate("checkRequestKey", async (request: FastifyRequest, reply) => {
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

// addHook pre-process ================================
var geoip = require('geoip-lite');
app.addHook('onRequest', async (req: any, reply) => {
  const unBlockIP = process.env.UNBLOCK_IP || '??';
  let ipAddr: any = req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || req.ip;
  ipAddr = ipAddr ? ipAddr.split(',') : [''];
  req.ipAddr = ipAddr[0].trim();

  var geo = geoip.lookup(req.ipAddr);
  if (geo && geo.country && geo.country != 'TH' && req.ipAddr != process.env.HOST && !unBlockIP.includes(req.ipAddr)) {
    console.log(req.ipAddr, `Unacceptable country: ${geo.country}`);
    return reply.send({ status: StatusCodes.NOT_ACCEPTABLE, ip: req.ipAddr, message: getReasonPhrase(StatusCodes.NOT_ACCEPTABLE) });
  }
  console.log(moment().format('HH:mm:ss'), geo ? geo.country : 'unk', req.ipAddr, req.url);

  // const encoding = req.headers['content-encoding']; // ตรวจสอบ Content-Encoding
  // console.log('encoding', req.url, req.headers);
  // console.log('encoding', req.url, encoding, req.headers['accept-encoding']);
  // ถ้า Request Body ถูกบีบอัดด้วย Gzip
  // if (encoding === 'gzip') {
  //   req.raw = req.raw.pipe(zlib.createGunzip()); // คลาย Gzip
  // } else if (encoding === 'br') {
  //   req.raw = req.raw.pipe(zlib.createBrotliDecompress()); // คลาย Brotli
  // } else if (encoding === 'deflate') {
  //   req.raw = req.raw.pipe(zlib.createInflate()); // คลาย Deflate
  // }
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

// Add route path ======================================
app.register(require('./route'));

// Add crontab job ======================================
app.register(cronjob);

// start app ============================================
var options: any = {
  port: process.env.PORT || 3004,
  host: process.env.HOST || '0.0.0.0'
}
app.listen(options, (err) => {
  if (err) throw err;
  const instanceId = process.env.NODE_APP_INSTANCE || '0';
  console.info(`${moment().format('HH:mm:ss')} HIS-Connect API ${global.appDetail.version}-${global.appDetail.subVersion} started on port ${options.port}, PID: ${process.pid}`);
});

// DB connection =========================================
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
      // PostgreSQL returns { rows: [...] }
      date = result.rows?.[0]?.date;
    } else if (dbClient === 'mssql') {
      // MSSQL returns { recordset: [...] }
      date = result.recordset?.[0]?.date;
    } else if (dbClient === 'oracledb') {
      // Oracle returns [[row], metadata]
      date = result[0]?.[0]?.date;
    } else {
      // MySQL returns [rows, fields]
      date = result[0]?.[0]?.date;
    }

    console.info(`   🔗 PID:${process.pid} >> HIS DB server '${dbClient}' connected, date on DB server: `, moment(date).format('YYYY-MM-DD HH:mm:ss'));
  } catch (error) {
    console.error(`   ❌ PID:${process.pid} >> HIS DB server '${dbClient}' connect error: `, error.message);
  }
}

async function checkConfigFile() {
  if (fs.existsSync('./config')) {
    console.info(`✅ Check 'config' file exist: Successfully`);
  } else {
    console.error(`❌ Check 'config' file exist: Not found, please create file 'config' and try again.`);
    process.exit(1);
  }
}