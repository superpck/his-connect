import * as moment from 'moment';
import path = require('path');
// import { localStorage, sessionStorage } from "webstorage-node";

var fs = require('fs');
const crypto = require('crypto');
const configFileName = 'config';
let shell = require("shelljs");
let setupSession: any = '';

const router = (fastify, { }, next) => {
  fastify.get('/', (req: any, reply: any) => {
    reply.view('/templates/pages/index.ejs', {
      token: getSession(), req: req.ip, env: process.env
    });
  });

  fastify.get('/about', (req: any, reply: any) => {
    reply.view('/templates/pages/about.ejs', {
      token: getSession(), req: req.ip, env: process.env
    });
  });

  fastify.get('/login', (req: any, reply: any) => {
    removeSession();
    reply.view('/templates/pages/login.ejs', { token: '' });
  });

  fastify.get('/form', (req: any, reply: any) => {
    const now = moment().format('YYYYMMDDHHmmss');
    let setupSess = getSession();
    let isLogin = setupSess > now;
    if (!isLogin) {
      const requestKey = req.query && req.query.RequestKey ? req.query.RequestKey : null;
      const secretKey = req.query && req.query.SecretKey ? req.query.SecretKey : null;
      if (requestKey && secretKey &&
        requestKey === process.env.REQUEST_KEY && secretKey === process.env.SECRET_KEY) {
        setSession();
        isLogin = true;
      }
    }

    if (isLogin) {
      // const configs: any = configVar();
      configVar()
        .then((configs) => {
          reply.view('/templates/pages/setup.ejs', { token: getSession(), req: req.ip, env: process.env, configs, error: '' });
        })
        .catch((error) => {
          reply.view('/templates/pages/login.ejs', { token: '', req: req.ip, env: process.env });
        });
    } else {
      reply.view('/templates/pages/login.ejs', { token: '', req: req.ip, env: process.env });
    }

  });

  fastify.post('/save', async (req: any, reply: any) => {
    const dataInput = req.body;
    const configs = await resetVar();

    for (let config in configs) {
      for (let item in configs[config]) {
        if (dataInput && dataInput[item]) {
          configs[config][item] = await dataInput[item];
        }
      }

    }

    // console.log('save configs', configs);
    let isValid = true;
    let errorText = '';
    if (configs.JWT.REQUEST_KEY.length < 10 || configs.JWT.SECRET_KEY.length < 16) {
      isValid = false;
      errorText = "Error: \r\nRequest Key or Secret key too short!";
      alert('Error: Request Key or Secret key too short!');
    }

    if (isValid) {
      saveConfig(req, configs);
    }

    reply.view('/templates/pages/setup.ejs', { token: getSession(), req: req.ip, env: process.env, configs, error: errorText });
  })

  async function saveConfig(req, configs) {
    const comments = {
      HISDB: `// ส่วนการเชื่อมโยงกับ HIS\r\n` +
        `// valid db client type: mysql, pg, mssql, oracledb\r\n` +
        `// valid HIS provider name: ezhosp, hosxpv3, hosxpv4, infod, ssb, hospitalos, pmk\r\n` +
        `// , kpstat, md, mkhospital, thiades, nemo, other`,
      NRRFER: `// สำหรับการรับข้อความจาก nRefer แบบ Auto\r\n` +
        `// กรุณาแก้ไข NOTIFY_CHANNEL ตามที่ต้องการ`,
      NREFER_AUTO_SEND: '// สั่งให้ Auto Send ทำงาน 0=ไม่ส่ง Auto 1=ส่ง Auto',
      NREFER_AUTO_SEND_EVERY_MINUTE: '// เวลาที่ส่ง Auto ระบุนาที (5-59) หรือ ชม. (0-23) เท่านั้น',
      REFERLOCAL: '// ส่วนการเชื่อมโยงกับ local refer db\r\n' +
        '// refer provider: his, thai_refer, refer_link, irefer, erefer',
      NOTIFY: '// สำหรับการรับข้อความจาก nRefer แบบ Auto\r\n' +
        '// กรุณาแก้ไข NOTIFY_CHANNEL ตามที่ต้องการ',
      JWT: '// สำหรับ JWT Authentication\r\n' +
        '// REQUEST_KEY <ตั้งเอง 8-32 อักษร>\r\n' +
        '// SECRET_KEY <ตั้งเอง 16-128 อักษร>',
    }
    const configFileNameBak = configFileName + '_' +
      moment().locale('th').format('YYYYMMDD_HHmmss') + '.old';
    const resultRename = renameFile(configFileName, configFileNameBak);

    let content = "// FIle: " + configFileName + "\r\n";
    content += "// Date: " + moment().locale('th').format('YYYY-MM-DD HH:mm:ss') + "\r\n";
    // content += "// ผู้แก้ไข " + userInfo.fullname + ' ' +
    //   userInfo.position + userInfo.position_level + "\r\n";
    content += "// IP: " + req.ip + "\r\n";

    for (let config in configs) {
      content += await `\r\n[${config}]\r\n`;
      if (comments[config]) {
        content += comments[config] + '\r\n';
      }
      for (let item in configs[config]) {
        if (comments[item]) {
          content += comments[item] + '\r\n';
        }
        const v = configs[config][item];
        content += await `${item}=${v}\r\n`;
      }
    }

    content += '\r\n';
    content += 'CHECKSUM=' + crypto.createHash('md5').update(content).digest('hex');

    fs.appendFile(configFileName, content, async function (err) {
      if (err) {
        // กรณีบันทึกไม่สำเร็จ
        await renameFile(configFileNameBak, configFileName);
        return { message: true, error: err };
      } else {
        let fileDesc: any;
        await fs.stat(configFileName, (err, stat) => {
          if (err) {
            return { statusCode: 500, message: false, result: err };
          } else {
            fileDesc = stat;
            alert('บันทึกเรียบร้อย');
            return { statusCode: 200, message: true };
          }
        });
      }
    });
  }

  async function configVar() {
    const configs = await resetVar();
    // const cnfFile = path.join(__dirname, `../../config`);
    const cnfFile = path.join(__dirname, `./../../${configFileName}`);
    const gotConfigs = await require('dotenv').config({ path: cnfFile }).parsed;

    for (let config in configs) {
      for (let item in configs[config]) {
        if (gotConfigs && gotConfigs[item]) {
          configs[config][item] = await gotConfigs[item];
        }
      }

    }

    return configs;
  }

  async function resetVar() {
    const today = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let config: any = await {
      HOSPITAL: {
        API_LEVEL: 'hospital',
        HOSPCODE: '00000'
      },
      API: {
        HTTPS: 0,
        PORT: 3004,
        START_TOOL: 'pm2',
        PM2_NAME: 'his-connect',
        PM2_INSTANCE: 3,
        AUTO_RESTART: 1,
        MAX_CONNECTION_PER_MINUTE: 100000
      },
      HISDB: {
        HIS_PROVIDER: 'hosxpv3',
        HIS_DB_HOST: '192.168.0.1',
        HIS_DB_PORT: 3306,
        HIS_DB_CLIENT: 'mysql',
        HIS_DB_SCHEMA: 'public',
        HIS_DB_NAME: 'hosxp',
        HIS_DB_USER: 'sa',
        HIS_DB_PASSWORD: 'password',
        HIS_DB_CHARSET: 'utf8',
        HIS_DB_ENCRYPT: true
      },
      NRRFER: {
        NREFER_API_URL: 'https://nrefer.moph.go.th/apis',
        NREFER_APIKEY: 'xxxxxxx',
        NREFER_SECRETKEY: 'xxxxxxxx',
        NREFER_AUTO_SEND: 1,
        NREFER_AUTO_SEND_EVERY_MINUTE: 14,
        NREFER_AUTO_SEND_EVERY_HOUR: 0,
      },
      NREFERLOCAL: {
        REFER_PROVIDER: 'thairefer',
        REFER_DB_HOST: 'localhost',
        REFER_DB_PORT: 3306,
        REFER_DB_CLIENT: 'mssql',
        REFER_DB_SCHEMA: 'public',
        REFER_DB_NAME: 'nrefer',
        REFER_DB_USER: 'user',
        REFER_DB_PASSWORD: 'password',
        REFER_DB_CHARSET: 'utf8',
        REFER_DB_ENCRYPT: true,
      },
      ISONLINE: {
        IS_DB_HOST: '192.168.0.1',
        IS_DB_PORT: 3306,
        IS_DB_CLIENT: 'mysql',
        IS_DB_SCHEMA: 'public',
        IS_DB_NAME: 'isdb',
        IS_DB_USER: 'sa',
        IS_DB_PASSWORD: 'password',
        IS_DB_CHARSET: 'utf8',
        IS_DB_ENCRYPT: true,
        IS_AUTO_SEND: 1,
        IS_AUTO_SEND_EVERY_MINUTE: 6,
        IS_AUTO_SEND_EVERY_HOUR: 0,
        IS_URL: 'http://ae.moph.go.th:3006',
        IS_MOPH_USER: '<from IS>',
        IS_MOPH_PASSWORD: '<from IS>'
      },
      NOTIFY: {
        NOTIFY_URL: 'http://203.157.103.33:8080/nrefer/message',
        NOTIFY_TOKEN: '$nRefer@MoPH$',
        NOTIFY_CHANNEL: 'HIS@xxxxx'
      },
      JWT: {
        REQUEST_KEY_MD5: false,
        REQUEST_KEY: crypto.createHash('md5').update(today).digest('hex').substr(4, 10),
        SECRET_KEY: crypto.createHash('sha1').update(today).digest('hex')
      }
    };
    return config;
  }

  function renameFile(srcFile: string, destFile: string) {
    if (!fs.existsSync(srcFile)) {
      return false;
    }

    return new Promise(async (resolve, reject) => {
      fs.rename(srcFile, destFile,
        function (err) {
          if (err) {
            reject(false);
          } else {
            resolve(true);
          }
        });
    });
  }

  function setSession() {
    setupSession = moment().add(15 * 4 * 4, 'minute').format('YYYYMMDDHHmmss');
    fastify.setupSession = setupSession;
    return setupSession
  }

  function getSession() {
    return setupSession;
  }

  function removeSession() {
    setupSession = '';
    fastify.setupSession = null;
    return setupSession;
  }

  async function reloadPM2(api) {
    return new Promise(async (resolve, reject) => {
      const pm2Name = api.PM2_NAME === '' ? '' : api.PM2_NAME;
      const pm2Instance = +api.PM2_INSTANCE > 0 ? +api.PM2_INSTANCE : 1;

      console.log(' ====> restart PM2:', pm2Name, moment().locale('th').format('HH:mm:ss.SS'));
      await shell.exec('tsc');
      await shell.exec("find ./app -name '*.map' -type f -delete");
      await shell.exec('pm2 flush');

      // const deleteCommand = `pm2 delete ${pm2Name}`;
      // const shellExecute2 = `pm2 start app/app.js -i ${pm2Instance} --name "${pm2Name}" `;
      // const reloadCommand = `pm2 reload ${pm2Name}`;
      // const shellCode: any = await shell.exec(`${deleteCommand} & ${shellExecute}`).code;
      // await shell.exec(shellExecute1).code;

      const shellExecute1 = `pm2 scale ${pm2Name} ${pm2Instance}`;
      await shell.exec(shellExecute1, (err: any, r: any) => {
        console.log(' ====> shellScaling', shellExecute1, r, moment().locale('th').format('HH:mm:ss.SS'));
      });

      const shellExecute2 = `pm2 restart ${pm2Name}`;
      shell.exec(shellExecute2, (err: any, shellCode: any) => {
        console.log(' ====> shellCode', shellExecute2, shellCode, err, moment().locale('th').format('HH:mm:ss.SS'));
        resolve(true);
      });
    });
  }

  next();

}

module.exports = router;
