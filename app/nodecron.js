"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
var shell = require("shelljs");
var cron = require('node-cron');
function cronjob(fastify) {
    return __awaiter(this, void 0, void 0, function* () {
        const secondNow = +moment().get('second');
        const timingSch = `${secondNow} */1 * * * *`;
        let timingSchedule = [];
        timingSchedule['isonline'] = { version: fastify.appVersion.version, apiSubVersion: fastify.appVersion.subVersion };
        timingSchedule['nrefer'] = { version: fastify.appVersion.version, apiSubVersion: fastify.appVersion.subVersion };
        timingSchedule['cupDataCenter'] = { version: fastify.appVersion.version, apiSubVersion: fastify.appVersion.subVersion };
        timingSchedule['isonline'].autosend = +process.env.IS_AUTO_SEND === 1 || false;
        timingSchedule['isonline'].minute = process.env.IS_AUTO_SEND_EVERY_MINUTE ? parseInt(process.env.IS_AUTO_SEND_EVERY_MINUTE) : 0;
        timingSchedule['isonline'].hour = process.env.IS_AUTO_SEND_EVERY_HOUR ? parseInt(process.env.IS_AUTO_SEND_EVERY_HOUR) : 0;
        timingSchedule['isonline'].hour = timingSchedule['isonline'].hour > 23 ? (timingSchedule['isonline'].hour % 23) : timingSchedule['isonline'].hour;
        timingSchedule['isonline'].minute = timingSchedule['isonline'].minute + timingSchedule['isonline'].hour * 60;
        timingSchedule['isonline'].minute = timingSchedule['isonline'].minute < 20 ? 20 : timingSchedule['isonline'].minute;
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
        console.log("Hospcode", process.env.HOSPCODE);
        console.log('crontab start: ', timingSch, 'minuteSinceLastNight', minuteSinceLastNight);
        if (timingSchedule['nrefer'].autosend) {
            console.log('crontab nRefer start every', timingSchedule['nrefer'].minute, ' (minute) from midnight.');
        }
        if (timingSchedule['isonline'].autosend) {
            console.log('crontab ISOnline start every', timingSchedule['isonline'].minute, ' (minute) from midnight.');
        }
        if (timingSchedule['cupDataCenter'].autosend) {
            console.log('crontab Data Center start every', timingSchedule['cupDataCenter'].minute, ' (minute) from midnight.');
        }
        cron.schedule(timingSch, (req, res) => __awaiter(this, void 0, void 0, function* () {
            const minuteSinceLastNight = (+moment().get('hour')) * 60 + (+moment().get('minute'));
            const minuteNow = +moment().get('minute') == 0 ? 60 : +moment().get('minute');
            const hourNow = +moment().get('hour');
            if (timingSchedule['nrefer']['autosend'] &&
                minuteSinceLastNight % timingSchedule['nrefer'].minute == 0) {
                doAutoSend(req, res, 'nrefer', './routes/refer/crontab');
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
        }));
        function doAutoSend(req, res, serviceName, functionName) {
            return __awaiter(this, void 0, void 0, function* () {
                let firstProcessPid = { pid: -1 };
                if (process.env.START_TOOL === 'nodemon') {
                    firstProcessPid = process.pid;
                }
                else {
                    if (!fastify.firstProcessPid) {
                        yield getFirstProcessPid();
                    }
                    firstProcessPid = fastify.firstProcessPid ? fastify.firstProcessPid : -1;
                }
                if (firstProcessPid === process.pid) {
                    const now = moment().locale('th').format('HH:mm:ss');
                    const db = serviceName == 'isonline' ? fastify.dbISOnline : fastify.dbHIS;
                    console.log(`${now} start cronjob '${serviceName}' on PID ${process.pid}`);
                    yield require(functionName)(req, res, db, timingSchedule[serviceName]);
                }
            });
        }
        function getFirstProcessPid() {
            return __awaiter(this, void 0, void 0, function* () {
                var jlist = yield shell.exec('pm2 jlist');
                let pm2Process = jlist && jlist !== '' ? JSON.parse(jlist) : [];
                let processList = [];
                for (let p of pm2Process) {
                    if (p.name == process.env.PM2_NAME) {
                        yield processList.push(p);
                    }
                }
                if (processList.length) {
                    fastify.firstProcessPid = processList[0].pid;
                }
            });
        }
        function getmophUrl() {
            return __awaiter(this, void 0, void 0, function* () {
                fastify.mophService = yield require('./routes/main/crontab')(fastify.mophService, {});
            });
        }
    });
}
exports.default = cronjob;
