"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fastify = require('fastify');
const moment = require("moment");
var fs = require('fs');
var http = require('http');
var querystring = require('querystring');
const his_1 = require("./../his/his");
const hcode = process.env.HOSPCODE;
const resultText = 'sent_result.txt';
let sentContent = '';
let dcToken = '';
let reqToken = {};
let crontabConfig;
let apiVersion = '-';
async function sendMoph(req, reply, db) {
    const dateNow = moment().locale('th').format('YYYY-MM-DD');
    sentContent = moment().locale('th').format('YYYY-MM-DD HH:mm:ss') + ' data:' + dateNow + "\r\n";
    reqToken = await getToken();
    if (reqToken && reqToken.statusCode === 200 && reqToken.token) {
        dcToken = reqToken.token;
        sentContent += `token ${reqToken.token}\r`;
    }
    else {
        console.log('get token error', reqToken.message);
        sentContent += `get token Error:` + JSON.stringify(reqToken) + `\r`;
        writeResult(resultText, sentContent);
        return false;
    }
    const hourNow = +moment().locale('th').get('hours');
    const minuteNow = +moment().locale('th').get('minutes');
    if ((hourNow == 1 || hourNow == 8 || hourNow == 12 || hourNow == 18 || hourNow == 22)
        && minuteNow - 1 < +process.env.NREFER_AUTO_SEND_EVERY_MINUTE) {
        const date = moment().locale('th').subtract(1, 'days').format('YYYY-MM-DD');
        await getService(db, date);
    }
    else if (hourNow == 3 && minuteNow - 1 < +process.env.NREFER_AUTO_SEND_EVERY_MINUTE) {
        let oldDate = moment(dateNow).subtract(7, 'days').format('YYYY-MM-DD');
        while (oldDate < dateNow) {
            oldDate = moment(oldDate).add(1, 'days').format('YYYY-MM-DD');
        }
    }
    const sendDataCenter = await getService(db, dateNow);
    await expireToken();
    return { sendDataCenter };
}
async function getService(db, date) {
    let sentResult = {
        person: { success: 0, fail: 0 },
        address: { success: 0, fail: 0 },
        service: { success: 0, fail: 0 },
        diagnosisOpd: { success: 0, fail: 0 },
        drugOpd: { success: 0, fail: 0 },
    };
    const rows = await his_1.default.getService(db, 'date_serv', date, hcode);
    sentContent += '  - service = ' + rows.length + '\r';
    const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
    if (rows && rows.length) {
        sentResult.service.success = rows.length;
        for (const row of rows) {
            await sendToApi('save-service', row);
            await person(db, row.pid || row.PID, sentResult);
            await getAddress(db, row.pid || row.PID, sentResult);
            await getDiagnosisOpd(db, row.SEQ || row.seq, sentResult);
            await getDrugOpd(db, row.SEQ || row.seq, sentResult);
        }
    }
    console.log(moment().format('HH:mm:ss'), ' Data Center sent result ', sentResult);
    return sentResult;
}
async function person(db, pid, sentResult) {
    const rows = await his_1.default.getPerson(db, 'hn', pid, hcode);
    sentContent += '  - person = ' + rows.length + '\r';
    if (rows && rows.length) {
        rows[0]['FNAME'] = rows[0].NAME || rows[0].name;
        const saveResult = await sendToApi('save-person', rows[0]);
        if (saveResult.statusCode == 200) {
            sentResult.person.success += 1;
        }
        else {
            sentResult.person.fail += 1;
            console.log('save-person', rows[0].HN, saveResult.message);
        }
        sentContent += '    -- PID ' + rows[0].HN + ' ' + (saveResult.result || saveResult.message) + '\r';
    }
    return rows[0];
}
async function getAddress(db, pid, sentResult) {
    if (pid) {
        const rows = await his_1.default.getAddress(db, 'hn', pid, hcode);
        sentContent += '  - address = ' + (rows ? rows.length : 0) + '\r';
        if (rows && rows.length) {
            for (const row of rows) {
                row.PID = row.PID || row.pid || row.HN || row.hn;
                const saveResult = await sendToApi('save-address', row);
                if (saveResult.statusCode == 200) {
                    sentResult.address.success += 1;
                }
                else {
                    sentResult.address.fail += 1;
                    console.log('save address fail', row.PID, saveResult.message);
                }
                sentContent += '    -- PID ' + row.PID + ' ' + (saveResult.result || saveResult.message) + '\r';
            }
        }
        return rows;
    }
    else {
        console.log('Address error: not found HN');
        return [];
    }
}
async function getDiagnosisOpd(db, visitNo, sentResult) {
    const rows = await his_1.default.getDiagnosisOpd(db, visitNo, hcode);
    if (rows && rows.length) {
        sentContent += '  - diagnosis_opd = ' + rows.length + '\r';
        const saveResult = await sendToApi('save-diagnosis-opd', rows);
        sentContent += '    -- ' + visitNo + ' ' + JSON.stringify(saveResult) + '\r';
        if (saveResult.statusCode === 200) {
            sentResult.diagnosisOpd.success += rows.length;
        }
        else {
            sentResult.diagnosisOpd.fail += 1;
            console.log('save-diagnosis-opd', visitNo, saveResult.message);
        }
    }
    else {
        sentContent += '  - diagnosis_opd = 0\r';
    }
    return rows;
}
async function getDrugOpd(db, visitNo, sentResult) {
    let opdDrug = [];
    const rows = await his_1.default.getDrugOpd(db, visitNo, hcode);
    if (rows && rows.length) {
        sentContent += '  - drug_opd = ' + rows.length + '\r';
        opdDrug = rows;
        const saveResult = await sendToApi('save-drug-opd', rows);
        sentContent += '    -- ' + visitNo + ' ' + JSON.stringify(saveResult) + '\r';
        if (saveResult.statusCode == 200) {
            sentResult.drugOpd.success += rows.length;
        }
        else {
            console.log('drug opd error: vn ', visitNo, saveResult.message);
            sentResult.drugOpd.fail += 1;
        }
    }
    else {
        sentContent += '  - drug_opd = 0\r';
    }
    return opdDrug;
}
async function sendToApi(path, dataArray) {
    const fixedUrl = fastify.mophService.dataCenter || 'http://connect.moph.go.th/dc-api';
    const mophUrl = fixedUrl.split('/');
    const dataSending = querystring.stringify({
        hospcode: hcode, data: JSON.stringify(dataArray),
        processPid: process.pid, dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        sourceApiName: 'HIS-connect version ' + apiVersion
    });
    const options = {
        hostname: mophUrl[2],
        path: '/' + mophUrl[3] + '/data/' + path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer ' + dcToken,
            'Content-Length': Buffer.byteLength(dataSending)
        },
        body: {
            hospcode: hcode, data: dataArray,
            processPid: process.pid, dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
            sourceApiName: 'HIS connect version',
            sourceApiVersion: apiVersion
        }
    };
    let ret = '';
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                ret += chunk;
            });
            res.on('end', (error) => {
                if (error || !ret) {
                    reject(error);
                }
                else {
                    const data = JSON.parse(ret);
                    resolve(data);
                }
            });
        });
        req.on('error', (e) => {
            reject(e);
        });
        req.write(dataSending);
        req.end();
    });
}
async function getToken() {
    const apiKey = process.env.NREFER_APIKEY || 'api-key';
    const secretKey = process.env.NREFER_SECRETKEY || 'secret-key';
    const fixedUrl = fastify.mophService.dataCenter || 'http://connect.moph.go.th/dc-api';
    const mophUrl = fixedUrl.split('/');
    const postData = querystring.stringify({
        apiKey: apiKey, secretKey: secretKey,
        sourceApiName: 'HIS Connect', apiVersion: apiVersion
    });
    const options = {
        hostname: mophUrl[2],
        path: '/' + mophUrl[3] + '/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    let ret = '';
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                ret += chunk;
            });
            res.on('end', (error) => {
                if (error || !ret) {
                    reject(error);
                }
                else {
                    const data = JSON.parse(ret);
                    resolve(data);
                }
            });
        });
        req.on('error', (e) => {
            reject(e);
        });
        req.write(postData);
        req.end();
    });
}
async function expireToken() {
    const fixedUrl = fastify.mophService.dataCenter || 'http://connect.moph.go.th/dc-api';
    const mophUrl = fixedUrl.split('/');
    const options = {
        hostname: mophUrl[2],
        path: '/' + mophUrl[3] + '/data/token/expire/' + reqToken.sessionID,
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${reqToken.token}`
        }
    };
    let ret = '';
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                ret += chunk;
            });
            res.on('end', (error) => {
                if (error || !ret) {
                    reject(error);
                }
                else {
                    const data = JSON.parse(ret);
                    resolve(data);
                }
            });
        });
        req.on('error', (e) => {
            reject(e);
        });
        req.end();
    });
}
async function writeResult(file, content) {
    fs.writeFile(file, content, async function (err) {
        if (err) {
            console.log(err.message);
        }
        else {
            let fileDesc;
            await fs.stat(resultText, (err, stat) => {
                if (err) {
                    console.log(err.message);
                }
                else {
                    fileDesc = stat;
                }
            });
        }
    });
}
const router = (request, reply, dbConn, config = {}) => {
    crontabConfig = config;
    apiVersion = crontabConfig.version ? crontabConfig.version : '-';
    return sendMoph(request, reply, dbConn);
};
module.exports = router;
