"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
const HttpStatus = require("http-status-codes");
let shell = require("shelljs");
var crypto = require('crypto');
var fs = require('fs');
const hisProvider = process.env.HIS_PROVIDER;
const resultText = './sent_result.txt';
const router = (fastify, {}, next) => {
    var startServer = fastify.startServerTime;
    fastify.register(require('@fastify/cookie'), {
        secret: process.env.SECRET_KEY,
        parseOptions: {}
    });
    fastify.get('/', async (req, reply) => {
        const cookieValue = req.cookies;
        reply.send({
            ok: true,
            apiCode: 'HISCONNECT',
            apiName: fastify.apiName,
            apiDesc: 'API for IS-Online, nRefer, PCC, CMI',
            version: global.appDetail.version,
            subVersion: global.appDetail.subVersion,
            serviceName: "isonline",
            his_provider: process.env.HIS_PROVIDER,
            hospcode: process.env.HOSPCODE,
            timer: (+moment().get('hour')) * 60 + (+moment().get('minute'))
        });
    });
    fastify.get('/get-token/:key', async (req, reply) => {
        const key = req.params.key;
        console.log(req.headers.host);
        const trust = req.headers.host.search('localhost|127.0.0.1|192.168.0.89') > -1;
        if (trust) {
            const now = moment().locale('th').format('YYYYMMDDTHHmmss');
            var appkey = crypto.createHash('sha256').update(now + process.env.REQUEST_KEY).digest('hex');
            var skey = crypto.createHash('md5').update(now + key).digest('hex');
            const token = fastify.jwt.sign({
                uid: 0,
                api: 'his-connect'
            }, { expiresIn: '3h' });
            reply.send({
                statusCode: 200,
                message: 'test generation',
                token: token,
                key: now + appkey,
                secret_key: skey.substr(1, 10)
            });
        }
        else {
            reply.send({ ok: false, message: 'request unreliable.' });
        }
    });
    fastify.get('/sign-token/:requestKey', async (req, reply) => {
        const requestKey = req.params.requestKey || '??';
        var hashRequestKey = crypto.createHash('md5').update(process.env.REQUEST_KEY).digest('hex');
        if (requestKey === hashRequestKey) {
            const token = fastify.jwt.sign({
                api: 'his-connect'
            }, { expiresIn: '3h' });
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, token: token });
        }
        else {
            reply.status(HttpStatus.UNAUTHORIZED).send({ statusCode: HttpStatus.UNAUTHORIZED, message: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED) });
        }
    });
    fastify.get('/env', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        reply.status(HttpStatus.OK).send({
            statusCode: HttpStatus.OK,
            env: {
                hospcode: process.env.HOSPCODE,
                apiPort: process.env.PORT,
                startTool: process.env.START_TOOL,
                pm2Name: process.env.PM2_NAME,
                his: {
                    provider: process.env.HIS_PROVIDER,
                    datacenter: +process.env.HIS_DATACENTER_ENABLE == 1,
                    minute: +process.env.HIS_DATACENTER_SEND_EVERY_MINUTE,
                    hour: +process.env.HIS_DATACENTER_SEND_EVERY_HOUR,
                },
                is: {
                    isDbName: process.env.IS_DB_NAME,
                    autoSend: +process.env.IS_AUTO_SEND == 1,
                    minute: +process.env.IS_AUTO_SEND_EVERY_MINUTE,
                    hour: +process.env.IS_AUTO_SEND_EVERY_HOUR,
                },
                nrefer: {
                    autoSend: +process.env.NREFER_AUTO_SEND == 1,
                    minute: +process.env.NREFER_AUTO_SEND_EVERY_MINUTE,
                    hour: +process.env.NREFER_AUTO_SEND_EVERY_HOUR,
                },
                notifyChanel: process.env.NOTIFY_CHANNEL,
            }
        });
    });
    fastify.post('/get-config/:requestKey', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const requestKey = req.params.requestKey || '??';
        const status = req.body.status || 0;
        const province = req.body.province || 0;
        var hashRequestKey = crypto.createHash('md5').update(process.env.REQUEST_KEY).digest('hex');
        if (req.body.requestKey
            && requestKey === hashRequestKey
            && ((+status === 15 && +province === 0)
                || ((+status === 25 || +status === 35) && +province === 1))) {
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, config: process.env });
        }
        else {
            reply.status(HttpStatus.UNAUTHORIZED).send({ statusCode: HttpStatus.UNAUTHORIZED, message: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED) });
        }
    });
    fastify.post('/save-config/:requestKey', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const requestKey = req.params.requestKey || '??';
        const province = req.body.province || 0;
        const userInfo = req.body.userInfo;
        const body = req.body;
        var hashRequestKey = crypto.createHash('md5').update(process.env.REQUEST_KEY).digest('hex');
        if (userInfo && req.body.requestKey === hashRequestKey && requestKey === hashRequestKey
            && ((+userInfo.status === 15 && +province === 0)
                || ((+userInfo.status === 25 || +userInfo.status === 35) && +province === 1))) {
            const configFileName = 'config';
            const configFileNameBak = configFileName + '_' +
                moment().locale('th').format('YYYYMMDD_HHmmss') + '.bak';
            const resultRename = await renameFile(configFileName, configFileNameBak);
            console.log('====> resultRename', resultRename, moment().locale('th').format('HH:mm:ss.SS'));
            const resultSaveConfig = await saveConfig(req.raw['ip'], body, userInfo, configFileName, configFileNameBak);
            console.log('====> resultSaveConfig', resultSaveConfig, moment().locale('th').format('HH:mm:ss.SS'));
            if (+body.api.AUTO_RESTART === 1 && body.api.START_TOOL === 'pm2') {
                reloadPM2(body.api)
                    .then(resultRestartPm2 => {
                    console.log('====> resultRestartPM2', resultRestartPm2, moment().locale('th').format('HH:mm:ss.SS'));
                    reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, message: resultRestartPm2 });
                })
                    .catch(err => {
                    console.log('====> resultRestartPM2', err, moment().locale('th').format('HH:mm:ss.SS'));
                    reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, message: err });
                });
            }
            else {
                reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK });
            }
        }
        else {
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.UNAUTHORIZED, message: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED) });
        }
    });
    fastify.get('/status', async (req, reply) => {
        var ua = req.headers['user-agent'];
        let browserDevice = 'desktop';
        let mobileType = null;
        let mobileName = null;
        if (/mobile/i.test(ua)) {
            browserDevice = 'mobile';
        }
        if (/ipad/i.test(ua)) {
            browserDevice = 'tablet';
            mobileName = 'iPad';
        }
        else if (/iphone/i.test(ua)) {
            mobileName = 'iPhone';
        }
        else if (/SAMSUNG SM-A9000/i.test(ua)) {
            mobileName = 'Samsung Galaxy A5';
        }
        else if (/SAMSUNG SM-G9301/i.test(ua)) {
            mobileName = 'Samsung Galaxy A7';
        }
        else if (/SAMSUNG SM-A9000/i.test(ua)) {
            mobileName = 'Samsung Galaxy A9';
        }
        else if (/SAMSUNG SM-N900V/i.test(ua)) {
            mobileName = 'Samsung Galaxy Note 3';
        }
        else if (/android/i.test(ua)) {
            mobileName = 'Android';
        }
        var ip = (req.headers['x-forwarded-for'] ||
            req.raw.connection.remoteAddress ||
            req.raw.socket.remoteAddress) + '';
        var remoteAddr = req.raw.connection.remoteAddress;
        if (ip.search(/[:]/g) !== -1 && ip.search(/[.]/g) !== -1) {
            let addr = remoteAddr.split(':');
            ip = addr[3];
        }
        var socketAddr = req.raw.socket.remoteAddress;
        if (socketAddr.search(/[:]/g) !== -1 && socketAddr.search(/[.]/g) !== -1) {
            let addr = socketAddr.split(':');
            socketAddr = addr[3];
        }
        var jlist = await shell.exec('pm2 jlist');
        jlist = jlist ? JSON.parse(jlist) : [];
        var pm2Pid = [];
        jlist.forEach((element, index) => {
            if (element.name === (process.env.PM2_NAME || process.env.name)) {
                pm2Pid.push({
                    id: element.pm2_env.pm_id,
                    pid: element.pid,
                    status: element.pm2_env.status
                });
            }
        });
        reply.send({
            statusCode: 200,
            date_response: moment().locale('th').format('YYYY-MM-DD HH:mm:ss'),
            serviceName: 'HIS Connection API',
            startServer: startServer,
            hospcode: process.env.HOSPCODE,
            hisProvider,
            dbType: process.env.HIS_DB_CLIENT,
            process: {
                nodejs: process.version || 'undefined',
                platform: process.platform + ' ' + process.arch,
                pm2_version: process.env._pm2_version,
                pm2_instance: process.env.PM2_INSTANCE || process.env.instances,
                pm2_name: process.env.PM2_NAME || process.env.name,
                pm2_pid_list: pm2Pid,
                pm2_pid_current: process.pid
            },
            client: {
                userAgent: req.headers['user-agent'],
                clientIp: ip,
                socketremoteAddress: socketAddr,
                device: browserDevice,
                mobileType: mobileType,
                mobileName: mobileName,
            }
        });
    });
    fastify.get('/autosent-result', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        try {
            var contents = fs.readFileSync(resultText);
            reply.status(HttpStatus.OK).send({
                statusCode: HttpStatus.OK,
                is_set: process.env.NREFER_AUTO_SEND,
                time: process.env.NREFER_CRON_SEND,
                message: contents.toString()
            });
        }
        catch (error) {
            reply.status(HttpStatus.NO_CONTENT).send({
                statusCode: HttpStatus.NO_CONTENT,
                message: error.message
            });
        }
    });
    async function saveConfig(ip, body, userInfo, configFileName, configFileNameBak) {
        return new Promise(async (resolve, reject) => {
            let content = "// FIle: " + configFileName + "\r\n";
            content += "// Date: " + moment().locale('th').format('YYYY-MM-DD HH:mm:ss') + "\r\n";
            content += "// ผู้แก้ไข " + userInfo.fullname + ' ' +
                userInfo.position + userInfo.position_level + "\r\n";
            content += "// IP: " + ip + "\r\n";
            content += "\r\n[Hospital]\r\n";
            content += "// level hospital, province, region\r\n";
            for (var property_hosp in body.hosp) {
                content += property_hosp + '=' + body.hosp[property_hosp] + "\r\n";
            }
            content += "\r\n[API]\r\n";
            content += "// กำหนด port สำหรับเรียกใช้ API\r\n";
            for (var property_api in body.api) {
                content += property_api + '=' + body.api[property_api] + "\r\n";
            }
            content += "\r\n[DB]\r\n";
            content += "// ส่วนการเชื่อมโยงกับ HIS\r\n";
            content += "// valid db client type: mysql, pg, mssql\r\n";
            content += "// valid HIS provider name: ezhosp, hosxpv3, hosxpv4, infod, ssb, hospitalos, kpstat, md\r\n";
            content += "//      hospitalos, kpstat, md, mkhospital, thiades, nemo, other\r\n";
            for (var property_db_his in body.db_his) {
                content += property_db_his + '=' + body.db_his[property_db_his] + "\r\n";
            }
            content += "\r\n// ส่วนการเชื่อมโยงกับ local refer db\r\n";
            content += "// refer provider: his, thai_refer, refer_link, irefer, erefer\r\n";
            for (var property_db_refer in body.db_refer) {
                content += property_db_refer + '=' + body.db_refer[property_db_refer] + "\r\n";
            }
            content += "\r\n// ส่วนการเชื่อมโยงกับ local ISDB db\r\n";
            for (var property_db_is in body.db_is) {
                content += property_db_is + '=' + body.db_is[property_db_is] + "\r\n";
            }
            content += "\r\n[nRefer]\r\n";
            content += "// สำหรับการรับข้อความจาก nRefer แบบ Auto\r\n";
            content += "// กรุณาแก้ไข NOTIFY_CHANNEL ตามที่ต้องการ\r\n";
            for (var property_nrefer in body.nrefer) {
                if (property_nrefer === 'NREFER_AUTO_SEND')
                    content += "// สั่งให้ Auto Send ทำงาน 0=ไม่ส่ง Auto 1=ส่ง Auto\r\n";
                if (property_nrefer === 'NREFER_CRON_SEND') {
                    content += "// เวลาที่ส่ง Auto * * * * *\r\n";
                    content += "// วินาที(0-59) นาที(0-59) ชั่วโมง(0-23) วันที่(1-31) เดือน(1-12) อาทิตย์-เสาร์ (0-6)\r\n";
                    content += "// 0 15 * * * * = ทุกนาทีที่ 15 เช่น 00:15:00, 01:15:00 เป็นต้น\r\n";
                    content += "// 0 */15 * * * * = ทุก 15 นาที เช่น 00:00:00, 00:15:00, 00:30:00, 00:45:00 เป็นต้น\r\n";
                    content += "// 7 0 * * * * = ทุกๆ 1 ชั่วโมง เช่น 00:00:07, 01:00:07, 02:00:07 เป็นต้น\r\n";
                    content += "// 7 0 */2 * * * = ทุกๆ 2 ชั่วโมง เช่น 00:00:07, 02:00:07, 04:00:07 เป็นต้น\r\n";
                }
                content += property_nrefer + '=' + body.nrefer[property_nrefer] + "\r\n";
            }
            content += "\r\n[Notify]\r\n";
            content += "// สำหรับการรับข้อความจาก nRefer แบบ Auto\r\n";
            content += "// กรุณาแก้ไข NOTIFY_CHANNEL ตามที่ต้องการ\r\n";
            for (var property_notify in body.notify) {
                content += property_notify + '=' + body.notify[property_notify] + "\r\n";
            }
            content += "\r\n[JWT]\r\n";
            content += "// สำหรับ JWT Authentication\r\n";
            for (var property in body.jwt) {
                content += property + '=' + body.jwt[property] + "\r\n";
            }
            content += "\r\n";
            content += "// MD5:" + crypto.createHash('md5').update(content).digest('hex');
            fs.appendFile(configFileName, content, async function (err) {
                if (err) {
                    await renameFile(configFileNameBak, configFileName);
                    reject({ message: true, error: err });
                }
                else {
                    let fileDesc;
                    await fs.stat(configFileName, (err, stat) => {
                        if (err) {
                            reject({ statusCode: 500, message: false, result: err });
                        }
                        else {
                            fileDesc = stat;
                            resolve({ statusCode: 200, message: true });
                        }
                    });
                }
            });
        });
    }
    async function reloadPM2(api) {
        return new Promise(async (resolve, reject) => {
            const pm2Name = api.PM2_NAME === '' ? '' : api.PM2_NAME;
            const pm2Instance = +api.PM2_INSTANCE > 0 ? +api.PM2_INSTANCE : 1;
            console.log(' ====> restart PM2:', pm2Name, moment().locale('th').format('HH:mm:ss.SS'));
            await shell.exec('tsc');
            await shell.exec("find ./app -name '*.map' -type f -delete");
            await shell.exec('pm2 flush');
            const shellExecute1 = `pm2 scale ${pm2Name} ${pm2Instance}`;
            await shell.exec(shellExecute1, (err, r) => {
                console.log(' ====> shellScaling', shellExecute1, r, moment().locale('th').format('HH:mm:ss.SS'));
            });
            const shellExecute2 = `pm2 restart ${pm2Name}`;
            shell.exec(shellExecute2, (err, shellCode) => {
                console.log(' ====> shellCode', shellExecute2, shellCode, err, moment().locale('th').format('HH:mm:ss.SS'));
                resolve(true);
            });
        });
    }
    async function renameFile(srcFile, destFile) {
        return new Promise(async (resolve, reject) => {
            fs.rename(srcFile, destFile, function (err) {
                if (err) {
                    reject(false);
                }
                else {
                    resolve(true);
                }
            });
        });
    }
    next();
};
module.exports = router;
