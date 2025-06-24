"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
const child_process_1 = require("child_process");
var shell = require("shelljs");
var cron = require('node-cron');
var referCrontab = require('./routes/refer/crontab');
let firstProcessPid = 0;
let pm2Name = 'unknown';
let pm2List = [];
const instanceId = process.env.NODE_APP_INSTANCE ? +process.env.NODE_APP_INSTANCE + 1 : null;
let onProcess = {
    sendNRefer: false, sendNReferIPD: false, sendISOnline: false
};
let lastProcess = {};
async function cronjob(fastify) {
    if (!firstProcessPid) {
        firstProcessPid = await firstPM2InstancePID();
        console.log(moment().format('HH:mm:ss'), 'instanceId', instanceId, `First process ID of '${pm2Name}' is ${firstProcessPid}`, process.pid == firstProcessPid, pm2List);
    }
    if (!firstProcessPid && instanceId && instanceId == 1 && process.pid) {
        firstProcessPid = process.pid;
    }
    const secondNow = +moment().get('second');
    const timingSch = `${secondNow} * * * * *`;
    let timingSchedule = [];
    timingSchedule['isonline'] = { version: global.appDetail.version, apiSubVersion: global.appDetail.subVersion };
    timingSchedule['nrefer'] = { version: global.appDetail.version, apiSubVersion: global.appDetail.subVersion };
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
    }
    cron.schedule(timingSch, async (req, res) => {
        const minuteSinceLastNight = (+moment().get('hour')) * 60 + (+moment().get('minute'));
        const minuteNow = +moment().get('minute') == 0 ? 60 : +moment().get('minute');
        if (firstProcessPid === process.pid) {
            if (minuteSinceLastNight % 2 == 1) {
                for (let jobName in lastProcess) {
                    console.log(moment().format('HH:mm:ss'), `Last process time '${jobName}' ${moment(lastProcess[jobName]).format('HH:mm:ss')}`);
                }
            }
            if (timingSchedule['nrefer']['autosend'] &&
                minuteSinceLastNight % timingSchedule['nrefer'].minute == 0) {
                if (moment().get('hour') % 2 == 0 && moment().get('minute') == 56 && !onProcess.sendNReferIPD) {
                    onProcess.sendNReferIPD = true;
                    referCrontab.processSend(req, res, global.dbHIS, { ...timingSchedule['nrefer'], service: 'ipdChecking' })
                        .then(() => {
                        onProcess.sendNReferIPD = false;
                        lastProcess.sendNReferIPD = moment();
                    });
                }
                if (!onProcess.sendNRefer) {
                    onProcess.sendNRefer = true;
                    referCrontab.processSend(req, res, global.dbHIS, timingSchedule['nrefer'])
                        .then(() => {
                        onProcess.sendNRefer = false;
                        lastProcess.sendNRefer = moment();
                    });
                }
            }
            if (timingSchedule['isonline']['autosend'] &&
                minuteSinceLastNight % timingSchedule['isonline'].minute == 0) {
                doAutoSend(req, res, 'isonline', './routes/isonline/crontab');
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
            if (serviceName == 'nrefer') {
            }
            else {
                await require(functionName)(req, res, db, timingSchedule[serviceName]);
            }
        }
    }
    async function getmophUrl() {
        global.mophService = await require('./routes/main/crontab')(global.mophService, {});
    }
}
exports.default = cronjob;
async function firstPM2InstancePID() {
    try {
        var jlist = await shell.exec('pm2 jlist', { silent: true });
        let pm2Process = jlist && jlist !== '' && jlist.length > 32 ? JSON.parse(jlist) : [];
        let pm2Name = process.env.PM2_NAME || 'unknown';
        if (pm2Process && pm2Process.length) {
            const prc = pm2Process.filter((o) => process.pid == o.pid && o.pm2_env.status == 'online');
            pm2Name = prc && prc.length ? prc[0].name : pm2Name;
        }
        firstProcessPid = -1;
        pm2List = [];
        for (let procss of pm2Process) {
            if (procss.name == pm2Name) {
                pm2List.push(procss.pid);
                firstProcessPid = firstProcessPid > 0 ? firstProcessPid : procss.pid;
            }
        }
        if (firstProcessPid == process.pid) {
            firstProcessPid = firstProcessPid;
        }
        firstProcessPid = firstProcessPid < 1 ? process.pid : firstProcessPid;
        pm2List = pm2List.length == 0 ? [firstProcessPid] : pm2List;
    }
    catch (error) {
        console.error(moment().format('HH:mm:ss'), 'get PM2 first PID error:', error.message);
        firstProcessPid = process.pid;
        pm2List = [process.pid];
    }
    return firstProcessPid;
}
function getPM2ProcessList() {
    try {
        const output = (0, child_process_1.execSync)('pm2 jlist', { encoding: 'utf8' });
        return JSON.parse(output);
    }
    catch (err) {
        console.error('❌ Failed to get PM2 list:', err);
        return [];
    }
}
function getMyPM2Name(pm2List, myPid) {
    const me = pm2List.find(p => p.pid === myPid);
    return me?.name || null;
}
function getFirstPidOfName(pm2List, name) {
    const matches = pm2List
        .filter(p => p.name === name)
        .sort((a, b) => a.pid - b.pid);
    return matches[0]?.pid || null;
}
const myPid = process.pid;
const PM2List = getPM2ProcessList();
pm2Name = getMyPM2Name(PM2List, myPid) || 'unknown';
firstProcessPid = getFirstPidOfName(PM2List, pm2Name);
console.log(`✅ This process name: ${pm2Name}, PID: ${myPid}, First PID: ${firstProcessPid}. Is first process? ${myPid === firstProcessPid ? '✅ YES' : '❌ NO'}`);
