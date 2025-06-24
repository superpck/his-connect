import * as si from "systeminformation";
import * as os from 'os';
import * as moment from "moment";

export const serverInformation = () => {
  let ip: any = [];
  const networkInterfaces: any = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    for (const iface of networkInterfaces[interfaceName]) {
      if (!iface.internal && iface.family === "IPv4") {
        ip.push(iface.address);
      }
    }
  }
  let cpu: any = os.cpus();
  for (let i = 0; i < cpu.length; i++) {
    cpu[i].times.usage = cpu[i].times.user + cpu[i].times.nice + cpu[i].times.sys + cpu[i].times.irq;
    cpu[i].times.usagePercent = cpu[i].times.usage*100/(cpu[i].times.usage+cpu[i].times.idle);
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
    uptime: secondToTime(os.uptime()),
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

export const secondToTime = (seconds: number) => {
  let second = seconds;
  const days = Math.floor(second / (24 * 3600));
  second %= 24 * 3600;
  const hours = Math.floor(second / 3600);
  second %= 3600;
  const minutes = Math.floor(second / 60);
  second %= 60;

  return { 
    dateUtc: moment().subtract(seconds, 'seconds').utc().format('YYYY-MM-DDTHH:mm:ssZ'),
    days, hours, minutes, seconds: second };
};

export const cpuUsage = async () => {
  const load = await si.currentLoad();
  return {
    cpuUsage: load.currentLoad.toFixed(2) + " %",
    cores: load.cpus.map((cpu, index) => ({
      core: index + 1,
      load: cpu.load.toFixed(2) + " %",
    })),
  };
};

// ฟังก์ชันดึงข้อมูล Memory
export const memoryUsage = async () => {
  const mem = await si.mem();
  return {
    totalMemory: (mem.total / 1073741824).toFixed(2) + " GB",
    usedMemory: (mem.used / 1073741824).toFixed(2) + " GB",
    freeMemory: (mem.free / 1073741824).toFixed(2) + " GB",
    usagePercent: ((mem.used / mem.total) * 100).toFixed(2) + " %",
  };
};

// ฟังก์ชันดึงข้อมูล HDD
export const diskUsage = async () => {
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