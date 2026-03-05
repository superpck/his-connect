import moment from "moment";
import { cpuUsage, diskUsage, memoryUsage, serverInformation } from "../middleware/server-resource";
import { thaiDateAbbr } from "../middleware/utils";
import { sendTelegramMessage } from "./../middleware/telegram";

export const process = async () => {
  return sendResourceMonitor();
}

const sendResourceMonitor = async () => {
  const svr: any = serverInformation();
  // console.log('serverInformation', svr);
  try {
    const [cpu, memory, disk]: any = await Promise.all([
      cpuUsage(),
      memoryUsage(),
      diskUsage(),
    ]);
    // const diskRoot = disk.find((d: any) => d.mountPoint === '/');
    // console.log('diskRoot', diskRoot.length, diskRoot);
    
    const cpuPercent = Number(+cpu.cpuUsage.split(' ')[0]);
    const memoryPercent = Number(+memory.usagePercent.split(' ')[0]);
    const diskPercent = Number(+disk[0].usagePercent.split(' ')[0]);
    const loadPercent = Number(+svr.loadAverage[0]);

    const message = '<b>❝ข้อมูลการใช้ทรัพยากร❞</b>\n\n'+
        `${cpuPercent>80? '❌':'✅'} CPU (${svr.totalCores} core): <code>${cpu.cpuUsage}</code>\n`+
        `${memoryPercent>80? '❌':'✅'} RAM: <code>${memory.usagePercent} (${memory.usedMemory}/${memory.totalMemory})</code>\n`+
        `${diskPercent>80? '❌':'✅'} Disk: <code>${disk[0].usagePercent} (${disk[0].used}/${disk[0].total})</code>\n`+
        `${loadPercent>2? '❌':'✅'} Load: <code>${svr.loadAverage[0].toFixed(2)} ${svr.loadAverage[1].toFixed(2)} ${svr.loadAverage[2].toFixed(2)}</code>\n`+
        `\n⏰ ข้อมูลวันที่ `+thaiDateAbbr()+' เวลา ' +moment().format('HH:mm:ss');
        // '<a href="https://nrefer.moph.go.th">📊 ดูสถานะเซิร์ฟเวอร์</a>';
    await sendTelegramMessage("ICT@KKH Monitoring Notify", message, 'HTML');
  } catch (error) {
    console.log('sendResourceMonitor error', error);
  }
}

process();
