"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diskUsage = exports.memoryUsage = exports.cpuUsage = exports.secondToTime = exports.serverInformation = void 0;
const si = require("systeminformation");
const os = require("os");
const moment = require("moment");
const serverInformation = () => {
    let ip = [];
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        for (const iface of networkInterfaces[interfaceName]) {
            if (!iface.internal && iface.family === "IPv4") {
                ip.push(iface.address);
            }
        }
    }
    let cpu = os.cpus();
    for (let i = 0; i < cpu.length; i++) {
        cpu[i].times.usage = cpu[i].times.user + cpu[i].times.nice + cpu[i].times.sys + cpu[i].times.irq;
        cpu[i].times.usagePercent = cpu[i].times.usage * 100 / (cpu[i].times.usage + cpu[i].times.idle);
    }
    return {
        platform: os.platform(),
        type: os.type(),
        arch: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        cpu,
        cpus: os.cpus(),
        totalCores: os.cpus().length,
        uptimeSeconds: os.uptime(),
        uptime: (0, exports.secondToTime)(os.uptime()),
        loadAverage: os.loadavg(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        memoryUsage: (1 - os.freemem() / os.totalmem()) * 100,
        homedir: os.homedir(),
        tmpdir: os.tmpdir(),
        userInfo: os.userInfo(),
        ip,
        networkInterfaces: os.networkInterfaces(),
    };
};
exports.serverInformation = serverInformation;
const secondToTime = (seconds) => {
    let second = seconds;
    const days = Math.floor(second / (24 * 3600));
    second %= 24 * 3600;
    const hours = Math.floor(second / 3600);
    second %= 3600;
    const minutes = Math.floor(second / 60);
    second %= 60;
    return {
        dateUtc: moment().subtract(seconds, 'seconds').utc().format('YYYY-MM-DDTHH:mm:ssZ'),
        days, hours, minutes, seconds: second
    };
};
exports.secondToTime = secondToTime;
const cpuUsage = async () => {
    const load = await si.currentLoad();
    return {
        cpuUsage: load.currentLoad.toFixed(2) + " %",
        cores: load.cpus.map((cpu, index) => ({
            core: index + 1,
            load: cpu.load.toFixed(2) + " %",
        })),
    };
};
exports.cpuUsage = cpuUsage;
const memoryUsage = async () => {
    const mem = await si.mem();
    return {
        totalMemory: (mem.total / 1073741824).toFixed(2) + " GB",
        usedMemory: (mem.used / 1073741824).toFixed(2) + " GB",
        freeMemory: (mem.free / 1073741824).toFixed(2) + " GB",
        usagePercent: ((mem.used / mem.total) * 100).toFixed(2) + " %",
    };
};
exports.memoryUsage = memoryUsage;
const diskUsage = async () => {
    const disks = await si.fsSize();
    const mounts = await si.blockDevices();
    return disks.map((disk, index) => ({
        mountPoint: disk.mount,
        filesystem: mounts || "Unknown",
        type: mounts[index]?.type || "Unknown",
        total: (disk.size / 1073741824).toFixed(2) + " GB",
        used: (disk.used / 1073741824).toFixed(2) + " GB",
        free: (disk.available / 1073741824).toFixed(2) + " GB",
        usagePercent: disk.use + " %",
    }));
};
exports.diskUsage = diskUsage;
