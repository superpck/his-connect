"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = cronjob;
const moment = require("moment");
var shell = require("shelljs");
var cron = require('node-cron');
let firstProcessPid = 0;
let pm2Name = 'unknown';
async function cronjob(fastify) {
    firstProcessPid = await firstPM2InstancePID();
    console.log(`First process ID of '${pm2Name}' is ${firstProcessPid}`);
    const secondNow = +moment().get('second');
    const timingSch = `${secondNow} * * * * *`;
    let timingSchedule = [];
    timingSchedule['isonline'] = { version: global.appDetail.version, apiSubVersion: global.appDetail.subVersion };
    timingSchedule['nrefer'] = { version: global.appDetail.version, apiSubVersion: global.appDetail.subVersion };
    timingSchedule['cupDataCenter'] = { version: global.appDetail.version, apiSubVersion: global.appDetail.subVersion };
    timingSchedule['isonline'].autosend = +process.env.IS_AUTO_SEND === 1 || false;
    timingSchedule['isonline'].minute = process.env.IS_AUTO_SEND_EVERY_MINUTE ? parseInt(process.env.IS_AUTO_SEND_EVERY_MINUTE) : 0;
    timingSchedule['isonline'].hour = process.env.IS_AUTO_SEND_EVERY_HOUR ? parseInt(process.env.IS_AUTO_SEND_EVERY_HOUR) : 0;
    timingSchedule['isonline'].hour = timingSchedule['isonline'].hour > 23 ? (timingSchedule['isonline'].hour % 23) : timingSchedule['isonline'].hour;
    timingSchedule['isonline'].minute = timingSchedule['isonline'].minute + timingSchedule['isonline'].hour * 60;
    timingSchedule['isonline'].minute = timingSchedule['isonline'].minute < 10 ? 10 : timingSchedule['isonline'].minute;
    if (timingSchedule['isonline'].minute <= 0) {
        timingSchedule['isonline'].autosend = false;
    }
    timingSchedule['nrefer'].autosend = +process.env.NREFER_AUTO_SEND === 1 || false;
    timingSchedule['nrefer'].minute = process.env.NREFER_AUTO_SEND_EVERY_MINUTE ? parseInt(process.env.NREFER_AUTO_SEND_EVERY_MINUTE) : 0;
    timingSchedule['nrefer'].hour = process.env.NREFER_AUTO_SEND_EVERY_HOUR ? parseInt(process.env.NREFER_AUTO_SEND_EVERY_HOUR) : 0;
    timingSchedule['nrefer'].minute = timingSchedule['nrefer'].minute + timingSchedule['nrefer'].hour * 60;
    timingSchedule['nrefer'].minute = timingSchedule['nrefer'].minute < 5 ? 5 : timingSchedule['nrefer'].minute;
    if (timingSchedule['nrefer'].minute <= 0) {
        timingSchedule['nrefer'].autosend = false;
    }
    timingSchedule['cupDataCenter'].autosend = +process.env.HIS_DATACENTER_ENABLE === 1 || false;
    timingSchedule['cupDataCenter'].minute =
        (process.env.HIS_DATACENTER_SEND_EVERY_MINUTE ? +process.env.HIS_DATACENTER_SEND_EVERY_MINUTE : 0) +
            (process.env.HIS_DATACENTER_SEND_EVERY_HOUR ? +process.env.HIS_DATACENTER_SEND_EVERY_HOUR : 2) * 60;
    timingSchedule['cupDataCenter'].minute = timingSchedule['cupDataCenter'].minute < 20 ? 20 : timingSchedule['cupDataCenter'].minute;
    const minuteSinceLastNight = (+moment().get('hour')) * 60 + (+moment().get('minute'));
    if (firstProcessPid === process.pid) {
        console.log(moment().format('HH:mm:ss'), " Start API for Hospcode", process.env.HOSPCODE);
        console.log('crontab start: ', timingSch, 'minuteSinceLastNight', minuteSinceLastNight, `on process ID ${process.pid} of '${pm2Name}'`);
        if (timingSchedule['nrefer'].autosend) {
            console.log('crontab nRefer start every', timingSchedule['nrefer'].minute, ' (minute) from midnight.');
        }
        if (timingSchedule['isonline'].autosend) {
            console.log('crontab ISOnline start every', timingSchedule['isonline'].minute, ' (minute) from midnight.');
        }
        if (timingSchedule['cupDataCenter'].autosend) {
            console.log('crontab Data Center start every', timingSchedule['cupDataCenter'].minute, ' (minute) from midnight.');
        }
    }
    let sendingRefer = false;
    cron.schedule(timingSch, async (req, res) => {
        console.log(moment().format('HH:mm:ss'), firstProcessPid, process.pid);
        firstProcessPid = await firstPM2InstancePID();
        const minuteSinceLastNight = (+moment().get('hour')) * 60 + (+moment().get('minute'));
        const minuteNow = +moment().get('minute') == 0 ? 60 : +moment().get('minute');
        const hourNow = +moment().get('hour');
        if (firstProcessPid === process.pid) {
            if (!sendingRefer) {
                sendingRefer = true;
                doAutoSend(req, res, 'nrefer', './routes/refer/crontab');
                sendingRefer = false;
            }
            if (timingSchedule['nrefer']['autosend'] &&
                minuteSinceLastNight % timingSchedule['nrefer'].minute == 0) {
            }
            if (timingSchedule['isonline']['autosend'] &&
                minuteSinceLastNight % timingSchedule['isonline'].minute == 0) {
                doAutoSend(req, res, 'isonline', './routes/isonline/crontab');
            }
            if (timingSchedule['cupDataCenter'].autosend &&
                minuteSinceLastNight % timingSchedule['cupDataCenter'].minute == 0) {
                doAutoSend(req, res, 'cupDataCenter', './routes/pcc/crontab');
            }
            if (minuteNow == 0) {
                getmophUrl();
            }
        }
    });
    async function doAutoSend(req, res, serviceName, functionName) {
        if (firstProcessPid === process.pid) {
            const now = moment().locale('th').format('HH:mm:ss');
            const db = serviceName == 'isonline' ? global.dbISOnline : global.dbHIS;
            console.log(`${now} start cronjob '${serviceName}' on PID ${process.pid}`);
            await require(functionName)(req, res, db, timingSchedule[serviceName]);
        }
    }
    async function getmophUrl() {
        global.mophService = await require('./routes/main/crontab')(global.mophService, {});
    }
    async function firstPM2InstancePID() {
        try {
            var jlist = await shell.exec('pm2 jlist', { silent: true });
            if (jlist.substr(0, 1) != '[') {
                jlist = jlist.substring(jlist.indexOf('['));
            }
            let pm2Process = jlist && jlist !== '' && jlist.length > 32 ? JSON.parse(jlist) : [];
            pm2Name = 'unknown';
            if (pm2Process && pm2Process.length) {
                const prc = pm2Process.filter((o) => process.pid == o.pid && o.pm2_env.status == 'online');
                pm2Name = prc && prc.length ? prc[0].name : 'unknown';
            }
            for (let procss of pm2Process) {
                if (procss.name == pm2Name) {
                    firstProcessPid = firstProcessPid > 0 ? firstProcessPid : procss.pid;
                }
            }
            firstProcessPid = firstProcessPid || process.pid;
            if (firstProcessPid == process.pid) {
                global.firstProcessPid = firstProcessPid;
            }
        }
        catch (error) {
            console.log('get firstPM2InstancePID Error: ', error.message || error);
            firstProcessPid = process.pid;
            global.firstProcessPid = firstProcessPid;
        }
        return firstProcessPid;
    }
}
