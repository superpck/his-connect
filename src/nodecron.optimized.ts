import { FastifyInstance } from "fastify";
import * as moment from 'moment';
import { execSync } from 'child_process';
import { sendWardName, sendBedNo, sendBedOccupancy, updateAlive, erpAdminRequest, mophErpProcessTask } from "./task/moph-erp";
import { mophAlertSurvey } from "./task/moph-alert";

// Type definitions for better type safety
interface ServiceSchedule {
  version: string;
  apiSubVersion: string;
  autosend: boolean;
  minute: number;
  hour?: number;
  service?: string;
}

interface TimingSchedules {
  [key: string]: ServiceSchedule;
}

interface PM2Process {
  pid: number;
  name: string;
  pm2_env: {
    status: string;
  };
}

interface ProcessState {
  firstProcessPid: number;
  pm2Name: string;
  pm2List: number[];
  isFirstProcess: boolean;
}

interface JobState {
  isRunning: boolean;
  lastRun?: moment.Moment;
}

interface JobQueue {
  [key: string]: JobState;
}

// Set up services, modules, and initial state
const shell = require("shelljs");
const cron = require('node-cron');
const referCrontab = require('./routes/refer/crontab');
const instanceId = process.env.NODE_APP_INSTANCE ? +process.env.NODE_APP_INSTANCE + 1 : null;

// Process state management
const processState: ProcessState = {
  firstProcessPid: 0,
  pm2Name: 'unknown',
  pm2List: [],
  isFirstProcess: false
};

// PM2 Cache to reduce shell executions
const pm2Cache = {
  processes: [] as PM2Process[],
  lastUpdate: 0,
  ttl: 30000 // 30 seconds cache validity
};

// Job state management
const jobQueue: JobQueue = {
  sendNRefer: { isRunning: false },
  sendNReferIPD: { isRunning: false },
  sendISOnline: { isRunning: false },
};

// Helper function to get timestamp
function getTimestamp(): string {
  return moment().format('HH:mm:ss');
}

// Helper function to get minutes since midnight
function getMinutesSinceMidnight(): number {
  return moment().hours() * 60 + moment().minutes();
}

// Helper function to get current minute with special handling for 0
function getCurrentMinute(): number {
  return moment().minutes() === 0 ? 60 : moment().minutes();
}

/**
 * Get PM2 processes with caching to reduce shell executions
 */
function getPM2Processes(): PM2Process[] {
  const now = Date.now();
  if (now - pm2Cache.lastUpdate < pm2Cache.ttl && pm2Cache.processes.length > 0) {
    return pm2Cache.processes;
  }

  try {
    const output = execSync('pm2 jlist', { encoding: 'utf8' });
    pm2Cache.processes = JSON.parse(output);
    pm2Cache.lastUpdate = now;
    return pm2Cache.processes;
  } catch (error) {
    console.error(`${getTimestamp()} ❌ Failed to get PM2 list:`, error.message);
    return [];
  }
}

/**
 * Get the PM2 name for a specific PID
 */
function getMyPM2Name(processes: PM2Process[], myPid: number): string {
  const me = processes.find(p => p.pid === myPid);
  return me?.name || process.env.PM2_NAME || 'unknown';
}

/**
 * Get the first PID for a specific PM2 process name (lowest PID)
 */
function getFirstPidOfName(processes: PM2Process[], name: string): number {
  const matches = processes
    .filter(p => p.name === name && p.pm2_env.status === 'online');
  // const matches = processes
  //   .filter(p => p.name === name && p.pm2_env.status === 'online')
  //   .sort((a, b) => a.pid - b.pid);
  return matches[0]?.pid || process.pid;
}

/**
 * Update the process state information
 */
function updateProcessState(): void {
  const processes = getPM2Processes();
  const myPid = process.pid;

  // Set process name
  processState.pm2Name = getMyPM2Name(processes, myPid);

  // Get all processes with the same name
  const sameNameProcesses = processes.filter(p =>
    p.name === processState.pm2Name && p.pm2_env.status === 'online'
  );

  // Update process list and first PID
  processState.pm2List = sameNameProcesses.map(p => p.pid);
  processState.firstProcessPid = getFirstPidOfName(processes, processState.pm2Name);
  // Check if this is the first process
  processState.isFirstProcess = processState.firstProcessPid === myPid;

  // console.log(moment().format('HH:mm:ss'), instanceId, process.pid, 'nodecron.optimized PM2 process list: ====> ', sameNameProcesses.map(p => p.pid), processState.pm2Name);
  console.log(`   ⬜ Instance: ${instanceId}.${processState.pm2Name} (PID: ${myPid}), First PID: ${processState.firstProcessPid}`);
}

/**
 * Configure service schedules based on environment variables
 */
function configureTimingSchedules(): TimingSchedules {
  const timingSchedule: TimingSchedules = {};

  // Initialize all services with version info
  ['isonline', 'nrefer'].forEach(service => {
    timingSchedule[service] = {
      version: global.appDetail.version,
      apiSubVersion: global.appDetail.subVersion,
      autosend: false,
      minute: 0
    };
  });

  // Configure IS-Online
  configureService(
    timingSchedule,
    'isonline',
    'IS_AUTO_SEND',
    'IS_AUTO_SEND_EVERY_MINUTE',
    10,
    true
  );

  // Configure nRefer
  configureService(
    timingSchedule,
    'nrefer',
    'NREFER_AUTO_SEND',
    'NREFER_AUTO_SEND_EVERY_MINUTE',
    5,
    false
  );

  return timingSchedule;
}

/**
 * Configure a service schedule based on environment variables
 */
function configureService(
  timingSchedule: TimingSchedules,
  serviceName: string,
  autoSendEnvVar: string,
  minuteEnvVar: string,
  minMinutes: number,
  normalizeHour: boolean
): void {
  // Set autosend flag
  timingSchedule[serviceName].autosend = +process.env[autoSendEnvVar] === 1 || false;

  // Get minutes and hours from environment
  timingSchedule[serviceName].minute = process.env[minuteEnvVar] ?
    parseInt(process.env[minuteEnvVar]) : 0;

  // Normalize hour if needed (0-23)
  if (normalizeHour && timingSchedule[serviceName].hour > 23) {
    timingSchedule[serviceName].hour = timingSchedule[serviceName].hour % 23;
  }

  // Convert to total minutes
  timingSchedule[serviceName].minute += (timingSchedule[serviceName].hour || 0) * 60;

  // Set minimum minutes
  timingSchedule[serviceName].minute =
    timingSchedule[serviceName].minute < minMinutes ? minMinutes : timingSchedule[serviceName].minute;

  // Disable if invalid
  if (timingSchedule[serviceName].minute <= 0) {
    timingSchedule[serviceName].autosend = false;
  }
}

/**
 * Log enabled services and their schedules
 */
function logScheduledServices(timingSchedule: TimingSchedules): void {
  Object.entries(timingSchedule).forEach(([service, config]) => {
    if (config.autosend) {
      console.log(`${getTimestamp()} crontab ${service} start every ${config.minute} (minute) from midnight.`);
    }
  });
}

/**
 * Run a job if it's not already running
 */
async function runJob(jobName: string, jobFn: Function, ...args: any[]): Promise<void> {
  if (jobQueue[jobName]?.isRunning) {
    return; // Skip if already running
  }

  try {
    jobQueue[jobName] = { isRunning: true };
    await jobFn(...args);
    jobQueue[jobName] = { isRunning: false, lastRun: moment() };
  } catch (error) {
    console.error(`${getTimestamp()} Error in job ${jobName}:`, error);
    jobQueue[jobName] = { isRunning: false };
  }
}

/**
 * Log status of all jobs
 */
function logJobStatus(): void {
  Object.entries(jobQueue).forEach(([jobName, state]) => {
    if (state.lastRun) {
      console.log(`${getTimestamp()} Last process time '${jobName}' ${state.lastRun.format('HH:mm:ss')}`);
    }
  });
}

/**
 * Run the auto-send process for a service
 */
async function doAutoSend(
  req: any,
  res: any,
  serviceName: string,
  functionName: string,
  timingSchedule: TimingSchedules
): Promise<void> {
  if (!processState.isFirstProcess) return;

  const now = moment().locale('th').format('HH:mm:ss');
  const db = serviceName === 'isonline' ? global.dbISOnline : global.dbHIS;

  console.log(`${now} start cronjob '${serviceName}' on PID ${process.pid}`);

  if (serviceName !== 'nrefer') {
    await require(functionName)(req, res, db, timingSchedule[serviceName]);
  }
}

/**
 * Update MOPH URL
 */
async function getmophUrl(): Promise<void> {
  global.mophService = await require('./routes/main/crontab')(global.mophService, {});
}

/**
 * Main cron job function
 */
export default async function cronjob(fastify: FastifyInstance): Promise<void> {
  // Initialize process state
  updateProcessState();

  // Create cron schedule (run every minute)
  const secondNow = moment().seconds();
  const timingSch = `${secondNow} * * * * *`;
  let timeRandom = 10 + (Math.ceil(Math.random() * 10) || 1);
  let hourRandom = Math.ceil(Math.random() * 22) || 1;

  // Configure timing schedules
  const timingSchedule = configureTimingSchedules();

  // Log startup information if this is the first process
  if (processState.isFirstProcess) {
    console.log(`${getTimestamp()} Start API for Hospcode ${process.env.HOSPCODE}`);
    console.log(`   ⬜ Random time for alive: every ${timeRandom} minutes, Occupancy: xx:${timeRandom}, ward/bed update: ${hourRandom}:${timeRandom}`);
    logScheduledServices(timingSchedule);
  }

  // Initial tasks on first process
  if (processState.isFirstProcess) {
    updateAlive();
    sendWardName();
    sendBedNo();
  }

  // Schedule cron job
  let minuteCount = 0;
  cron.schedule(timingSch, async (req: any, res: any) => {
    minuteCount++;

    // Get current time info
    const minuteSinceLastNight = getMinutesSinceMidnight();
    const minuteNow = moment().get('minute');

    // Only run on the first process
    if (processState.isFirstProcess) {
      if (minuteSinceLastNight % 2 === 1) {
        logJobStatus();
      }
      if (minuteNow % timeRandom == 0) {
        updateAlive();
        mophAlertSurvey();
      }

      if (minuteSinceLastNight % 2 == 0) {
        erpAdminRequest();
      }

      if (minuteNow == timeRandom) {
        sendBedOccupancy();
      }

      if (moment().hour() == hourRandom && minuteNow == timeRandom) {
        sendWardName();
        sendBedNo();
      }

      // Run nRefer jobs if scheduled
      if (timingSchedule['nrefer'].autosend &&
        minuteSinceLastNight % timingSchedule['nrefer'].minute === 0) {

        // Run IPD checking at specific times
        if (moment().hour() % 2 === 0 && moment().minute() === 56) {
          runJob('sendNReferIPD', async () => {
            await referCrontab.processSend(req, res, global.dbHIS, {
              ...timingSchedule['nrefer'],
              service: 'ipdChecking'
            });
          });
        }

        // Run regular nRefer job
        runJob('sendNRefer', async () => {
          await referCrontab.processSend(req, res, global.dbHIS, timingSchedule['nrefer']);
        });
      }

      // Run IS-Online job if scheduled
      if (timingSchedule['isonline'].autosend &&
        minuteSinceLastNight % timingSchedule['isonline'].minute === 0) {
        runJob('sendISOnline', async () => {
          await doAutoSend(req, res, 'isonline', './routes/isonline/crontab', timingSchedule);
        });
      }

      // Update MOPH URL at the top of each hour
      if (minuteNow === 60) {
        runJob('getmophUrl', getmophUrl);
      }
    }
  });
}