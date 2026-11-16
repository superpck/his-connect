"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.diskUsage = exports.memoryUsage = exports.cpuUsage = exports.secondToTime = exports.serverInformation = void 0;
const si = __importStar(require("systeminformation"));
const os = __importStar(require("os"));
const moment_1 = __importDefault(require("moment"));
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
        dateUtc: (0, moment_1.default)().subtract(seconds, 'seconds').utc().format('YYYY-MM-DDTHH:mm:ssZ'),
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
