"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.process = void 0;
const moment = require("moment");
const server_resource_1 = require("../middleware/server-resource");
const utils_1 = require("../middleware/utils");
const telegram_1 = require("./../middleware/telegram");
const process = async () => {
    return sendResourceMonitor();
};
exports.process = process;
const sendResourceMonitor = async () => {
    const svr = (0, server_resource_1.serverInformation)();
    try {
        const [cpu, memory, disk] = await Promise.all([
            (0, server_resource_1.cpuUsage)(),
            (0, server_resource_1.memoryUsage)(),
            (0, server_resource_1.diskUsage)(),
        ]);
        const cpuPercent = Number(+cpu.cpuUsage.split(' ')[0]);
        const memoryPercent = Number(+memory.usagePercent.split(' ')[0]);
        const diskPercent = Number(+disk[0].usagePercent.split(' ')[0]);
        const loadPercent = Number(+svr.loadAverage[0]);
        const message = '<b>❝ข้อมูลการใช้ทรัพยากร❞</b>\n\n' +
            `${cpuPercent > 80 ? '❌' : '✅'} CPU (${svr.totalCores} core): <code>${cpu.cpuUsage}</code>\n` +
            `${memoryPercent > 80 ? '❌' : '✅'} RAM: <code>${memory.usagePercent} (${memory.usedMemory}/${memory.totalMemory})</code>\n` +
            `${diskPercent > 80 ? '❌' : '✅'} Disk: <code>${disk[0].usagePercent} (${disk[0].used}/${disk[0].total})</code>\n` +
            `${loadPercent > 2 ? '❌' : '✅'} Load: <code>${svr.loadAverage[0].toFixed(2)} ${svr.loadAverage[1].toFixed(2)} ${svr.loadAverage[2].toFixed(2)}</code>\n` +
            `\n⏰ ข้อมูลวันที่ ` + (0, utils_1.thaiDateAbbr)() + ' เวลา ' + moment().format('HH:mm:ss');
        await (0, telegram_1.sendTelegramMessage)("ICT@KKH Monitoring Notify", message, 'HTML');
    }
    catch (error) {
        console.log('sendResourceMonitor error', error);
    }
};
(0, exports.process)();
