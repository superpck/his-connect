"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = cronjob;
const moment = require("moment");
const child_process_1 = require("child_process");
const moph_erp_1 = require("./task/moph-erp");
const shell = require("shelljs");
const cron = require('node-cron');
const referCrontab = require('./routes/refer/crontab');
const instanceId = process.env.NODE_APP_INSTANCE ? +process.env.NODE_APP_INSTANCE + 1 : null;
const processState = {
    firstProcessPid: 0,
    pm2Name: 'unknown',
    pm2List: [],
    isFirstProcess: false
};
const pm2Cache = {
    processes: [],
    lastUpdate: 0,
    ttl: 30000
};
const jobQueue = {
    sendNRefer: { isRunning: false },
    sendNReferIPD: { isRunning: false },
    sendISOnline: { isRunning: false },
};
function getTimestamp() {
    return moment().format('HH:mm:ss');
}
function getMinutesSinceMidnight() {
    return moment().hours() * 60 + moment().minutes();
}
function getCurrentMinute() {
    return moment().minutes() === 0 ? 60 : moment().minutes();
}
function getPM2Processes() {
    const now = Date.now();
    if (now - pm2Cache.lastUpdate < pm2Cache.ttl && pm2Cache.processes.length > 0) {
        return pm2Cache.processes;
    }
    try {
        const output = (0, child_process_1.execSync)('pm2 jlist', { encoding: 'utf8' });
        pm2Cache.processes = JSON.parse(output);
        pm2Cache.lastUpdate = now;
        return pm2Cache.processes;
    }
    catch (error) {
        console.error(`${getTimestamp()} ❌ Failed to get PM2 list:`, error.message);
        return [];
    }
}
function getMyPM2Name(processes, myPid) {
    const me = processes.find(p => p.pid === myPid);
    return me?.name || process.env.PM2_NAME || 'unknown';
}
function getFirstPidOfName(processes, name) {
    const matches = processes
        .filter(p => p.name === name && p.pm2_env.status === 'online');
    return matches[0]?.pid || process.pid;
}
function updateProcessState() {
    const processes = getPM2Processes();
    const myPid = process.pid;
    processState.pm2Name = getMyPM2Name(processes, myPid);
    const sameNameProcesses = processes.filter(p => p.name === processState.pm2Name && p.pm2_env.status === 'online');
    processState.pm2List = sameNameProcesses.map(p => p.pid);
    processState.firstProcessPid = getFirstPidOfName(processes, processState.pm2Name);
    processState.isFirstProcess = processState.firstProcessPid === myPid;
    console.log(`${instanceId}.${processState.pm2Name} (PID: ${myPid}), First PID: ${processState.firstProcessPid}, Is first? ${processState.isFirstProcess ? '✅ YES' : '❌ NO'}`);
}
function configureTimingSchedules() {
    const timingSchedule = {};
    ['isonline', 'nrefer'].forEach(service => {
        timingSchedule[service] = {
            version: global.appDetail.version,
            apiSubVersion: global.appDetail.subVersion,
            autosend: false,
            minute: 0
        };
    });
    configureService(timingSchedule, 'isonline', 'IS_AUTO_SEND', 'IS_AUTO_SEND_EVERY_MINUTE', 10, true);
    configureService(timingSchedule, 'nrefer', 'NREFER_AUTO_SEND', 'NREFER_AUTO_SEND_EVERY_MINUTE', 5, false);
    return timingSchedule;
}
function configureService(timingSchedule, serviceName, autoSendEnvVar, minuteEnvVar, minMinutes, normalizeHour) {
    timingSchedule[serviceName].autosend = +process.env[autoSendEnvVar] === 1 || false;
    timingSchedule[serviceName].minute = process.env[minuteEnvVar] ?
        parseInt(process.env[minuteEnvVar]) : 0;
    if (normalizeHour && timingSchedule[serviceName].hour > 23) {
        timingSchedule[serviceName].hour = timingSchedule[serviceName].hour % 23;
    }
    timingSchedule[serviceName].minute += (timingSchedule[serviceName].hour || 0) * 60;
    timingSchedule[serviceName].minute =
        timingSchedule[serviceName].minute < minMinutes ? minMinutes : timingSchedule[serviceName].minute;
    if (timingSchedule[serviceName].minute <= 0) {
        timingSchedule[serviceName].autosend = false;
    }
}
function logScheduledServices(timingSchedule) {
    Object.entries(timingSchedule).forEach(([service, config]) => {
        if (config.autosend) {
            console.log(`${getTimestamp()} crontab ${service} start every ${config.minute} (minute) from midnight.`);
        }
    });
}
async function runJob(jobName, jobFn, ...args) {
    if (jobQueue[jobName]?.isRunning) {
        return;
    }
    try {
        jobQueue[jobName] = { isRunning: true };
        await jobFn(...args);
        jobQueue[jobName] = { isRunning: false, lastRun: moment() };
    }
    catch (error) {
        console.error(`${getTimestamp()} Error in job ${jobName}:`, error);
        jobQueue[jobName] = { isRunning: false };
    }
}
function logJobStatus() {
    Object.entries(jobQueue).forEach(([jobName, state]) => {
        if (state.lastRun) {
            console.log(`${getTimestamp()} Last process time '${jobName}' ${state.lastRun.format('HH:mm:ss')}`);
        }
    });
}
async function doAutoSend(req, res, serviceName, functionName, timingSchedule) {
    if (!processState.isFirstProcess)
        return;
    const now = moment().locale('th').format('HH:mm:ss');
    const db = serviceName === 'isonline' ? global.dbISOnline : global.dbHIS;
    console.log(`${now} start cronjob '${serviceName}' on PID ${process.pid}`);
    if (serviceName !== 'nrefer') {
        await require(functionName)(req, res, db, timingSchedule[serviceName]);
    }
}
async function getmophUrl() {
    global.mophService = await require('./routes/main/crontab')(global.mophService, {});
}
async function cronjob(fastify) {
    updateProcessState();
    const secondNow = moment().seconds();
    const timingSch = `${secondNow} * * * * *`;
    const timingSchedule = configureTimingSchedules();
    if (processState.isFirstProcess) {
        console.log(`${getTimestamp()} Start API for Hospcode ${process.env.HOSPCODE}`);
        logScheduledServices(timingSchedule);
    }
    (0, moph_erp_1.updateAlive)();
    cron.schedule(timingSch, async (req, res) => {
        const minuteSinceLastNight = getMinutesSinceMidnight();
        const minuteNow = moment().get('minute');
        if (processState.isFirstProcess) {
            if (minuteSinceLastNight % 2 === 1) {
                logJobStatus();
            }
            if (minuteNow == 57) {
                (0, moph_erp_1.sendWardName)();
                (0, moph_erp_1.sendBedOccupancy)();
            }
            if (minuteNow % 17 == 0) {
                (0, moph_erp_1.updateAlive)();
            }
            if (timingSchedule['nrefer'].autosend &&
                minuteSinceLastNight % timingSchedule['nrefer'].minute === 0) {
                if (moment().hour() % 2 === 0 && moment().minute() === 56) {
                    runJob('sendNReferIPD', async () => {
                        await referCrontab.processSend(req, res, global.dbHIS, {
                            ...timingSchedule['nrefer'],
                            service: 'ipdChecking'
                        });
                    });
                }
                runJob('sendNRefer', async () => {
                    await referCrontab.processSend(req, res, global.dbHIS, timingSchedule['nrefer']);
                });
            }
            if (timingSchedule['isonline'].autosend &&
                minuteSinceLastNight % timingSchedule['isonline'].minute === 0) {
                runJob('sendISOnline', async () => {
                    await doAutoSend(req, res, 'isonline', './routes/isonline/crontab', timingSchedule);
                });
            }
            if (minuteNow === 60) {
                runJob('getmophUrl', getmophUrl);
            }
        }
    });
}
