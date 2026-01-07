"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
require('dotenv').config({
    path: path.join(__dirname, '../../../config'),
    quiet: true,
    debug: false
});
var fastify = require('fastify');
const moment = require("moment");
const axios_1 = require("axios");
const hismodel_1 = require("./../his/hismodel");
const moph_refer_1 = require("../../middleware/moph-refer");
var fs = require('fs');
const hcode = process.env.HOSPCODE;
const resultText = 'sent_result.txt';
const apiKey = process.env?.MOPH_ERP_APIKEY || process.env.NREFER_APIKEY || 'api-key';
const secretKey = process.env?.MOPH_ERP_SECRETKEY || process.env.NREFER_SECRETKEY || 'secret-key';
const backwardMonth = process.env.NREFER_DATA_BACKWARD_MONTH;
const sendEveryMinute = Number(process.env.NREFER_AUTO_SEND_EVERY_MINUTE) || 5;
let sentContent = '';
let nReferToken = '';
let sentResult = {};
let crontabConfig = {
    client_ip: '', version: global.appDetail?.version || '',
    subVersion: global.appDetail?.subVersion || ''
};
let db;
const processSend = async (request, reply, dbConn, config = {}) => {
    db = dbConn;
    crontabConfig = { ...crontabConfig, ...config };
    crontabConfig['client_ip'] = '127.0.0.1';
    if (request) {
        if (request.headers) {
            crontabConfig['client_ip'] = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.ip || request.raw['ip'] || crontabConfig['client_ip'];
        }
        else {
            crontabConfig['client_ip'] = request.ip || crontabConfig['client_ip'];
        }
    }
    console.log(moment().format('HH:mm:ss'), `Start 'nRefer' task on PID ${process.pid}`);
    let result;
    if (crontabConfig?.service == 'ipdChecking') {
        result = await ipdChecking(request, reply);
    }
    else {
        result = await sendMoph(request, reply, db);
    }
    console.log('-'.repeat(70));
    return result;
};
async function sendMoph(req, reply, db) {
    const dateNow = moment().format('YYYY-MM-DD');
    sentContent = `${global.appDetail.name} v.${global.appDetail.version}-${global.appDetail.subVersion} ` +
        moment().format('YYYY-MM-DD HH:mm:ss') + ' data:' + dateNow + "\r\n";
    const resultToken = await getNReferToken(apiKey, secretKey);
    if (resultToken && resultToken.statusCode == 200 && resultToken.token) {
        nReferToken = resultToken.token;
        sentContent += `token ${nReferToken}\r`;
    }
    else {
        console.error('Get nRefer token error', resultToken.message);
        sentContent += `get token Error:` + JSON.stringify(resultToken) + `\r`;
        writeResult(resultText, sentContent);
        return false;
    }
    const hourNow = +moment().get('hours');
    const minuteNow = +moment().get('minutes');
    if ((hourNow == 1 || hourNow == 8 || hourNow == 12 || hourNow == 18 || hourNow == 22)
        && minuteNow - 1 < sendEveryMinute) {
        const date = moment().subtract(1, 'days').format('YYYY-MM-DD');
        var [referOut, referResult] = await sendRefer(db, date);
    }
    else if (hourNow == 4 && minuteNow > (59 - sendEveryMinute)) {
        let oldDate = moment(dateNow).subtract(1, 'months').format('YYYY-MM-DD');
        while (oldDate < dateNow) {
            var [referOut, referResult] = await sendRefer(db, oldDate);
            oldDate = moment(oldDate).add(1, 'days').format('YYYY-MM-DD');
        }
    }
    else if ([3, 14].indexOf(hourNow) >= 0 && minuteNow - 1 > sendEveryMinute) {
        let oldDate = moment(dateNow).subtract(7, 'days').format('YYYY-MM-DD');
        while (oldDate < dateNow) {
            var [referOut, referResult] = await sendRefer(db, oldDate);
            oldDate = moment(oldDate).add(1, 'days').format('YYYY-MM-DD');
        }
    }
    var [referOut, referResult] = await sendRefer(db, dateNow);
    return { date: dateNow, referOut, referResult };
}
async function sendRefer(db, date) {
    var [referOut, referResult] = await Promise.all([
        getReferOut(db, date),
        getReferIn(db, date)
    ]);
    return [referOut, referResult];
}
async function getReferOut(db, date) {
    try {
        const referout = await hismodel_1.default.getReferOut(db, date, hcode, null);
        console.log('   >> nRefer Out', date, referout.length, ' cases');
        if (!referout || referout.length == 0) {
            return '';
        }
        let drList = [];
        sentContent += `\rsave refer_history ${date} \r`;
        sentContent += `\rsave refer service data ${date} \r`;
        let index = 0;
        sentResult = {
            date,
            pid: process.pid,
            referout: { success: 0, fail: 0, vnFail: [] },
            person: { success: 0, fail: 0 },
            address: { success: 0, fail: 0 },
            service: { success: 0, fail: 0 },
            diagnosisOpd: { success: 0, fail: 0 },
            procedureOpd: { success: 0, fail: 0 },
            drugOpd: { success: 0, fail: 0 },
            drugAllergy: { success: 0, fail: 0 },
            investigationRefer: { success: 0, fail: 0 },
            admission: { success: 0, fail: 0 },
            drugIpd: { success: 0, fail: 0 },
            diagnosisIpd: { success: 0, fail: 0 },
            provider: 0,
        };
        for (let row of referout) {
            const dr = row.dr || row.provider;
            if (dr && drList.indexOf(dr) < 0) {
                drList.push(row.dr || row.provider);
            }
            for (let fld in row) {
                row[fld.toLowerCase()] = row[fld];
            }
            const hn = row.hn || row.pid;
            const seq = row.seq || row.vn;
            sentContent += (index + 1) + '. refer no.' + row.referid + ', hn ' + hn + ', seq ' + seq + '\r';
            await Promise.all([
                sendReferOut(row, sentResult),
                getPerson(db, hn, sentResult),
                getAddress(db, hn, sentResult),
                getService(db, seq, sentResult),
                getDrugAllergy(db, hn, sentResult),
                getLabResult(db, row, sentResult),
            ]);
            let ipd = await getAdmission(db, 'VN', seq);
            const an = ipd && ipd.length ? ipd[0].an : '';
            const procedureIpd = await getProcedureIpd(db, an);
            index += 1;
            if (referout.length <= index) {
                sentContent += moment().format('HH:mm:ss.SSS') + ' crontab finished...\r\r';
                await writeResult(resultText, sentContent);
                console.log(moment().format('HH:mm:ss.SSS'), 'finished...');
            }
        }
        await getProvider(db, drList, sentResult);
        console.log('  nRefer sent ', process.env.HOSPCODE, sentResult.message || sentResult);
        return referout;
    }
    catch (error) {
        console.error('getReferOut, crontab error:', error.message);
        sentContent += moment().format('HH:mm:ss.SSS') + 'crontab error ' + error.message + '\r\r';
        return [];
    }
}
async function getReferIn(db, date) {
    let index = 0;
    let sentResultResult = {
        pid: process.pid,
        referresult: { success: 0, fail: 0, vnFail: [] },
        person: { success: 0, fail: 0 },
        address: { success: 0, fail: 0 },
        service: { success: 0, fail: 0 },
        diagnosisOpd: { success: 0, fail: 0 },
        procedureOpd: { success: 0, fail: 0 },
        drugOpd: { success: 0, fail: 0 },
        drugAllergy: { success: 0, fail: 0 },
        investigationRefer: { success: 0, fail: 0 },
        provider: 0
    };
    try {
        const referResult = await hismodel_1.default.getReferResult(db, date, hcode);
        console.log('   >> nRefer In', date, referResult.length, ' cases');
        if (!referResult || referResult.length == 0) {
            return '';
        }
        let drList = [];
        for (let r of referResult) {
            const dr = r.dr || r.provider;
            if (dr && drList.indexOf(dr) < 0) {
                drList.push(r.dr || r.provider);
            }
        }
        sentContent += `\rsave refer_result ${date} \r`;
        sentContent += `\rsave refer service data ${date} \r`;
        console.log(moment().format('HH:mm:ss'), process.env.HOSPCODE, 'refer result (refer in)=', referResult.length, 'row');
        for (let row of referResult) {
            const hn = row.PID_IN;
            const seq = row.SEQ_IN;
            const referid = row.REFERID_SOURCE;
            sentContent += (index + 1) + '. refer no.' + referid + ', hn ' + hn + ', seq ' + seq + '\r';
            await Promise.all([
                sendReferIn(row, sentResultResult),
                getPerson(db, hn, sentResultResult),
                getAddress(db, hn, sentResultResult),
                getService(db, seq, sentResultResult),
                getDrugAllergy(db, hn, sentResultResult)
            ]);
            let ipd = await getAdmission(db, 'VN', seq);
            const an = ipd && ipd.length ? ipd[0].an : '';
            const procedureIpd = await getProcedureIpd(db, an);
            await getLabResult(db, row, sentResultResult);
            index += 1;
            if (referResult.length <= index) {
                sentContent += moment().format('HH:mm:ss.SSS') + ' crontab finished...\r\r';
                await writeResult(resultText, sentContent);
                console.log(moment().format('HH:mm:ss.SSS'), 'finished...');
            }
        }
        getProvider(db, drList, sentResultResult);
        console.log(moment().format('HH:mm:ss.SSS'), 'sent >> refer result (refer in)', sentResultResult);
        await getReferInIPDByDateDisc(db, sentResultResult);
        return referResult;
    }
    catch (error) {
        console.log('getReferIn, crontab error:', error.message);
        sentContent += moment().format('HH:mm:ss.SSS') + 'crontab error ' + error.message + '\r\r';
        return [];
    }
}
async function getReferInIPDByDateDisc(db, sentResultResult) {
    try {
        let backward = 2;
        let today = moment().format('YYYY-MM-DD');
        let dateEnd = moment().format('YYYY-MM-DD');
        const hour = moment().get('hour');
        if ([2, 12, 17].indexOf(hour) > 0 && moment().get('minute') >= (60 - crontabConfig.minute)) {
            if (hour == 12) {
                backward = 7;
            }
            else {
                backward = hour == 2 ? 21 : 7;
                dateEnd = moment().subtract(7, 'days').format('YYYY-MM-DD');
            }
        }
        let date = moment().subtract(backward, 'days').format('YYYY-MM-DD');
        do {
            await getReferInIPD(db, date, 0, sentResultResult);
            date = moment(date).add(1, 'day').format('YYYY-MM-DD');
        } while (date <= dateEnd && date <= today);
        console.log(process.env.HOSPCODE, ' refer result (refer in)', sentResultResult);
        return true;
    }
    catch (error) {
        console.log('getReferInIPDByDateDisc, crontab error:', error.message);
        return false;
    }
}
async function getReferInIPD(db, dateDisc, resultOnly, sentResultResult) {
    if (!dateDisc || dateDisc > moment().format('YYYY-MM-DD')) {
        return null;
    }
    let ipdData = await hismodel_1.default.getAdmission(db, 'datedisc', dateDisc);
    console.log(moment().format('HH:mm:ss'), process.env.HOSPCODE, `Get refer result from IPD discharge date ${dateDisc} = ${ipdData.length} case`);
    for (let row of ipdData) {
        await sendReferInIPD(db, row, sentResultResult);
    }
}
async function sendReferInIPD(db, row, sentResultResult) {
    const hn = row.PID || row.pid || row.HN || row.hn;
    const an = row.AN || row.an;
    const seq = row.SEQ || row.seq || row.VN || row.vn;
    const referid = row.REFERINHOSP;
    await Promise.all([
        sendAdmission(row),
        getPerson(db, hn, sentResultResult),
        getAddress(db, hn, sentResultResult),
        getService(db, seq, sentResultResult),
        getDrugAllergy(db, hn, sentResultResult),
        getLabResult(db, row, sentResultResult)
    ]);
    const procedureIpd = await getProcedureIpd(db, an);
}
async function sendReferOut(row, sentResult) {
    const d_update = moment().format('YYYY-MM-DD HH:mm:ss');
    if (row) {
        for (let fld in row) {
            row[fld.toLowerCase()] = row[fld];
        }
        const hcode = row.hospcode;
        const referId = row.referid;
        const SEQ = (row.seq || row.vn || '') + '';
        const referProvId = hcode + referId;
        const dServe = row.datetime_serv || row.refer_date;
        const dAdmit = row.datetime_admit || row.datetime_admit || null;
        const dRefer = row.datetime_refer || row.REFER_DATE || row.refer_date || dServe || null;
        const destHosp = row.hosp_destination;
        const data = {
            HOSPCODE: hcode,
            REFERID: referId,
            PID: row.pid || row.hn,
            SEQ,
            AN: row.an || '',
            CID: row.cid,
            DATETIME_SERV: moment(dServe).format('YYYY-MM-DD HH:mm:ss'),
            DATETIME_ADMIT: moment(dAdmit).format('YYYY-MM-DD HH:mm:ss') || null,
            DATETIME_REFER: moment(dRefer).format('YYYY-MM-DD HH:mm:ss'),
            HOSP_DESTINATION: destHosp,
            REFERID_ORIGIN: row.referid_origin || '',
            HOSPCODE_ORIGIN: row.hospcode_origin || '',
            CLINIC_REFER: row.clinic_refer || '',
            CHIEFCOMP: row.chiefcomp || row.cc || '',
            PHYSICALEXAM: row.physicalexam || row.pe || '',
            PH: row.PH || row.ph || '',
            PI: row.PI || row.pi || '',
            FH: row.FH || row.fh || '',
            DIAGFIRST: row.diagfirst || '',
            DIAGLAST: row.diaglast || '',
            PSTATUS: row.ptstatus || '',
            PTYPE: row.ptype || '1',
            EMERGENCY: row.emergency || '5',
            PTYPEDIS: row.ptypedis || '99',
            CAUSEOUT: row.causeout || '',
            REQUEST: row.request || '',
            PROVIDER: row.provider || '',
            detail: row.detail || '',
            REFERID_PROVINCE: referProvId,
            referout_type: row.referout_type || 1,
            D_UPDATE: row.d_update || d_update,
            his: process.env.HIS_PROVIDER,
            typesave: 'autosent'
        };
        const saveResult = await (0, moph_refer_1.sendingToMoph)('/save-refer-history', data);
        if (saveResult.statusCode == 200) {
            sentResult.referout.success += 1;
        }
        else {
            sentResult.referout.fail += 1;
            sentResult.referout.vnFail.push(SEQ);
            console.error('save-refer-history', data.REFERID, saveResult.message);
        }
        sentContent += '  - refer_history ' + data.REFERID + ' ' + (saveResult.result || saveResult.message) + '\r';
        return saveResult;
    }
    else {
        return null;
    }
}
async function sendReferIn(row, sentResult) {
    const d_update = moment().format('YYYY-MM-DD HH:mm:ss');
    if (row) {
        const data = {
            HOSPCODE: row.HOSPCODE,
            REFERID: row.REFERID || null,
            REFERID_SOURCE: row.REFERID_SOURCE,
            REFERID_PROVINCE: row.REFERID_PROVINCE,
            PID_IN: row.PID_IN,
            SEQ_IN: row.SEQ_IN + '',
            AN_IN: row.AN_IN,
            CID_IN: row.CID_IN + '',
            HOSP_SOURCE: row.HOSP_SOURCE,
            REFER_RESULT: row.REFER_RESULT || 1,
            DATETIME_REFER: row.DATETIME_REFER ? moment(row.DATETIME_REFER).format('YYYY-MM-DD HH:mm:ss') : null,
            DATETIME_IN: moment(row.DATETIME_IN).format('YYYY-MM-DD HH:mm:ss'),
            REASON: row.REASON || null,
            D_UPDATE: row.D_UPDATE || d_update,
            detail: row.detail || null,
            reply_date: row.reply_date || null,
            reply_diagnostic: row.reply_diagnostic || null,
            reply_recommend: row.reply_recommend || null,
            his: process.env.HIS_PROVIDER,
            typesave: 'autoreply'
        };
        const saveResult = await (0, moph_refer_1.sendingToMoph)('/save-refer-result', data);
        if (saveResult.statusCode == 200) {
            sentResult.referresult.success += 1;
        }
        else {
            sentResult.referresult.fail += 1;
            sentResult.referresult.vnFail.push(row.SEQ_IN);
            console.log('save-refer-result', data.REFERID_SOURCE, saveResult.message || saveResult);
        }
        sentContent += '  - refer_result ' + data.REFERID_SOURCE + ' ' + (saveResult.result || saveResult.message) + '\r';
        return saveResult;
    }
    else {
        return null;
    }
}
async function getPerson(db, pid, sentResult) {
    try {
        const d_update = moment().format('YYYY-MM-DD HH:mm:ss');
        let rows = await hismodel_1.default.getPerson(db, 'hn', pid, hcode);
        sentContent += '  - person = ' + rows.length + '\r';
        if (rows && rows.length > 0) {
            for (const row of rows) {
                for (let fld in row) {
                    row[fld.toLowerCase()] = row[fld];
                }
                const person = {
                    HOSPCODE: row.hospcode,
                    CID: row.cid,
                    PID: row.hn || row.pid,
                    HID: row.hid || '',
                    HN: row.hn || row.pid,
                    PRENAME: row.prename,
                    NAME: row.name,
                    LNAME: row.lname,
                    SEX: row.sex,
                    BIRTH: row.BIRTH || row.birth,
                    MSTATUS: row.MSTATUS || row.mstatus,
                    OCCUPATION_NEW: row.OCCUPATION_NEW || row.occupation_new,
                    RACE: row.RACE || row.race,
                    NATION: row.NATION || row.nation,
                    RELIGION: row.RELIGION || row.religion,
                    EDUCATION: row.EDUCATION || row.education,
                    ABOGROUP: row.ABOGROUP || row.abogroup,
                    TELEPHONE: row.TELEPHONE || row.telephone,
                    TYPEAREA: row.TYPEAREA || row.typearea,
                    D_UPDATE: row.D_UPDATE || row.d_update || d_update,
                };
                const saveResult = await (0, moph_refer_1.sendingToMoph)('/save-person', person);
                if (saveResult.statusCode === 200) {
                    sentResult.person.success += 1;
                }
                else {
                    sentResult.person.fail += 1;
                    console.log('save-person', person.HN, saveResult.message || saveResult);
                }
                sentContent += '    -- PID ' + person.HN + ' ' + (saveResult.result || saveResult.message) + '\r';
            }
        }
        return rows;
    }
    catch (error) {
        console.log('getPerson error', error.message || error);
    }
}
async function getAddress(db, pid, sentResult) {
    if (pid) {
        const d_update = moment().format('YYYY-MM-DD HH:mm:ss');
        const rows = await hismodel_1.default.getAddress(db, 'hn', pid, hcode);
        sentContent += '  - address = ' + (rows ? rows.length : 0) + '\r';
        if (rows && rows.length) {
            for (const row of rows) {
                const address = await {
                    HOSPCODE: row.HOSPCODE || row.hospcode,
                    PID: row.PID || row.pid || row.HN || row.hn,
                    ADDRESSTYPE: row.ADDRESSTYPE || row.addresstype,
                    ROOMNO: row.ROOMNO || row.roomno,
                    HOUSENO: row.HOUSENO || row.HOUSENO,
                    CONDO: row.CONDO || row.condo || '',
                    SOIMAIN: row.SOIMAIN || row.soimain,
                    ROAD: row.ROAD || row.road,
                    VILLANAME: row.VILLANAME || row.villaname,
                    VILLAGE: row.VILLAGE || row.village,
                    TAMBON: row.TAMBON || row.tambon,
                    AMPUR: row.AMPUR || row.ampur,
                    CHANGWAT: row.CHANGWAT || row.changwat,
                    TELEPHONE: row.TELEPHONE || row.telephone || '',
                    MOBILE: row.MOBILE || row.mobile || '',
                    D_UPDATE: row.D_UPDATE || row.d_update || d_update,
                };
                const saveResult = await (0, moph_refer_1.sendingToMoph)('/save-address', address);
                if (saveResult.statusCode === 200) {
                    sentResult.address.success += 1;
                }
                else {
                    sentResult.address.fail += 1;
                    console.log('save address fail', address.PID, saveResult.message || saveResult);
                }
                sentContent += '    -- PID ' + address.PID + ' ' + (saveResult.result || saveResult.message) + '\r';
            }
        }
        return rows;
    }
    else {
        console.log('Address error: not found HN');
        return [];
    }
}
async function getService(db, visitNo, sentResult) {
    const rows = await hismodel_1.default.getService(db, 'visitNo', visitNo, hcode);
    sentContent += '  - service = ' + rows.length + '\r';
    const d_update = moment().format('YYYY-MM-DD HH:mm:ss');
    if (rows && rows.length) {
        for (const row of rows) {
            for (let r in row) {
                row[r.toLowerCase()] = row[r];
            }
            const data = {
                ...row,
                HOSPCODE: row.hospcode,
                PID: row.pid || row.hn,
                SEQ: row.seq || row.vn || visitNo || '',
                HN: row.pid || row.hn,
                CID: row.cid,
                DATE_SERV: row.date_serv || row.date,
                TIME_SERV: row.time_serv || '',
                LOCATION: row.location || '',
                INTIME: row.intime || '',
                INSTYPE: row.instype || '',
                INSID: row.insid || '',
                TYPEIN: row.typein || '',
                REFERINHOSP: row.referinhosp || '',
                CAUSEIN: row.causein || '',
                FAMILYHISTORY: row.familyhistory || row.fh || '',
                CHIEFCOMP: row.chiefcomp || row.cc || '',
                PRESENTILLNESS: row.presentillness || row.pi || '',
                PASTHISTORY: row.pasthistory || row.ph || '',
                PHYSICALEXAM: row.physicalexam || row.pe || '',
                SERVPLACE: row.servplace || '',
                BTEMP: row.btemp || '',
                SBP: row.sbp || '',
                DBP: row.dbp || '',
                PR: row.pr || '',
                RR: row.rr || '', WEIGHT: row.weight || '', HEIGHT: row.height || '',
                TYPEOUT: row.typeout || '',
                REFEROUTHOSP: row.referouthosp || '',
                CAUSEOUT: row.causeout || '',
                COST: row.cost || '',
                PRICE: row.price || '',
                PAYPRICE: row.PAYPRICE || row.payprice || '',
                ACTUALPAY: row.ACTUALPAY || row.actualpay || '',
                OCCUPATION_NEW: row.OCCUPATION_NEW || row.occupation_new,
                MAIN: row.MAIN || row.main || '',
                HSUB: row.HSUB || row.hsub || row.SUB || row.sub || '',
                SUB: row.SUB || row.sub || '',
                PROVIDER: row.PROVIDER || row.provider || row.dr || row.DR || '',
                D_UPDATE: row.D_UPDATE || row.d_update || d_update,
            };
            const saveResult = await (0, moph_refer_1.sendingToMoph)('/save-service', data);
            sentContent += '    -- SEQ ' + data.SEQ + ' ' + (saveResult.result || saveResult.message) + '\r';
            if (saveResult.statusCode === 200) {
                sentResult.service.success += 1;
            }
            else {
                sentResult.service.fail += 1;
                console.log('save-service', data.SEQ, saveResult.message || saveResult);
            }
            await Promise.all([
                getDiagnosisOpd(db, data.SEQ, sentResult),
                getProcedureOpd(db, data.SEQ, sentResult),
                getDrugOpd(db, data.SEQ, sentResult)
            ]);
        }
    }
    return rows;
}
async function getDiagnosisOpd(db, visitNo, sentResult) {
    const rows = await hismodel_1.default.getDiagnosisOpd(db, visitNo, hcode);
    sentContent += '  - diagnosis_opd = ' + rows.length + '\r';
    if (rows && rows.length) {
        let r = [];
        for (const row of rows) {
            for (let fld in row) {
                row[fld.toLowerCase()] = row[fld];
            }
            r.push({
                HOSPCODE: row.hospcode,
                PID: row.pid || row.hn,
                SEQ: row.seq || row.vn,
                DATE_SERV: row.date_serv,
                DIAGTYPE: row.diagtype,
                DIAGCODE: row.diagcode,
                DIAGNAME: row.diagname || '',
                CLINIC: row.clinic || '',
                PROVIDER: row.provider || '',
                D_UPDATE: row.d_update,
                ID: row.id || '',
                BR: row.br || '',
                AIS: row.ais || '',
                CID: row.cid || ''
            });
        }
        const saveResult = await (0, moph_refer_1.sendingToMoph)('/save-diagnosis-opd', r);
        sentContent += '    -- ' + visitNo + ' ' + JSON.stringify(saveResult) + '\r';
        if (saveResult.statusCode === 200) {
            sentResult.diagnosisOpd.success += 1;
        }
        else {
            sentResult.diagnosisOpd.fail += 1;
            console.log('save-diagnosis-opd', visitNo, saveResult.message || saveResult);
        }
    }
    return rows;
}
async function getProcedureOpd(db, visitNo, sentResult) {
    const d_update = moment().format('YYYY-MM-DD HH:mm:ss');
    const rows = await hismodel_1.default.getProcedureOpd(db, visitNo, hcode);
    sentContent += '  - procedure_opd = ' + rows.length + '\r';
    let rowSave = [];
    if (rows && rows.length) {
        for (const row of rows) {
            for (let fld in row) {
                row[fld.toLowerCase()] = row[fld];
            }
            rowSave.push({
                HOSPCODE: row.hospcode,
                PID: row.pid || row.hn,
                SEQ: row.seq || row.vn || row.visitno || visitNo,
                PROCEDCODE: row.procedcode || row.op_code,
                PROCEDNAME: row.procedname || row.op_name || '',
                DATE_SERV: row.date_serv || row.date || '',
                CLINIC: row.clinic || '',
                SERVICEPRICE: row.serviceprice || 0,
                PROVIDER: row.provider || row.dr || '',
                D_UPDATE: row.d_update || row.date || d_update,
                CID: row.cid || '',
            });
        }
        const saveResult = await (0, moph_refer_1.sendingToMoph)('/save-procedure-opd', rowSave);
        sentContent += '    -- ' + visitNo + ' ' + JSON.stringify(saveResult) + '\r';
        if (saveResult.statusCode === 200) {
            sentResult.procedureOpd.success += 1;
        }
        else {
            sentResult.procedureOpd.fail += 1;
            console.log('save-procedure-opd', visitNo, saveResult.message || saveResult);
        }
    }
    return rowSave;
}
async function getDrugOpd(db, visitNo, sentResult) {
    let opdDrug = [];
    const rows = await hismodel_1.default.getDrugOpd(db, visitNo, hcode);
    sentContent += '  - drug_opd = ' + rows.length + '\r';
    if (rows && rows.length) {
        for (let r of rows) {
            for (let fld in r) {
                r[fld.toLowerCase()] = r[fld];
            }
            opdDrug.push({
                HOSPCODE: r.HOSPCODE || r.hospcode || hcode,
                PID: r.PID || r.pid || r.HN || r.hn,
                SEQ: r.SEQ || r.seq || r.vn,
                DATE_SERV: r.DATE_SERV || r.date_serv,
                CLINIC: r.CLINIC || r.clinic,
                DIDSTD: r.DIDSTD || r.didstd || r.DID || r.did || r.dcode,
                DNAME: r.DNAME || r.dname,
                AMOUNT: r.AMOUNT || r.amount || null,
                UNIT: r.UNIT || r.unit || null,
                UNIT_PACKING: r.UNIT_PACKING || r.unit_packing || null,
                DRUGPRICE: r.DRUGPRICE || r.drugprice || null,
                DRUGCOST: r.DRUGCOST || r.drugcost || null,
                PROVIDER: r.PROVIDER || r.provider || null,
                D_UPDATE: r.D_UPDATE || r.d_update || null,
                DID: r.DIDSTD || r.didstd || r.DID || r.did,
                CID: r.CID || r.cid || null,
                DID_TMT: r.DID_TMT || r.did_tmt || null,
                drug_usage: r.drug_usage || null,
                caution: r.caution
            });
        }
        const saveResult = await (0, moph_refer_1.sendingToMoph)('/save-drug-opd', opdDrug);
        sentContent += '    -- ' + visitNo + ' ' + JSON.stringify(saveResult) + '\r';
        if (saveResult.statusCode == 200) {
            sentResult.drugOpd.success += 1;
        }
        else {
            console.log('drug opd error: vn ', visitNo, saveResult.message || saveResult);
            sentResult.drugOpd.fail += 1;
        }
    }
    return opdDrug;
}
async function getLabResult(db, row, sentResult) {
    const visitNo = row.seq || row.SEQ || row.SEQ_IN || row.vn;
    const referID = row.REFERID || row.referid || row.REFERID_SOURCE;
    let rowsSave = [];
    const d_update = moment().format('YYYY-MM-DD HH:mm:ss');
    const rowsLabResult = await hismodel_1.default.getLabResult(db, 'visitNo', visitNo);
    sentContent += '  - lab result = ' + rowsLabResult.length + '\r';
    if (rowsLabResult && rowsLabResult.length) {
        for (const r of rowsLabResult) {
            for (let fld in r) {
                r[fld.toLowerCase()] = r[fld];
            }
            const cHOSPCODE = r.HOSPCODE || r.hospcode || process.env.HOSPCODE;
            const investvalue = r.INVESTVALUE || r.investvalue || '';
            const investresult = r.INVESTRESULT || r.investresult || '';
            const investname = r.INVESTNAME || r.investname || '';
            if (/hiv|cd4|amphetamine|log10 equivalence/.test(investname.toLowerCase()) == false) {
                rowsSave.push({
                    HOSPCODE: cHOSPCODE,
                    REFERID: referID,
                    REFERID_PROVINCE: cHOSPCODE + referID,
                    PID: r.PID || r.pid || r.HN || r.hn,
                    SEQ: visitNo,
                    AN: r.AN || r.an || '',
                    DATETIME_INVEST: r.DATETIME_INVEST || r.datetime_invest || '',
                    INVESTTYPE: r.INVESTTYPE || r.investtype || 'LAB',
                    INVESTCODE: r.INVESTCODE || r.investcode || r.LOCALCODE || r.localcode || '',
                    LOCALCODE: r.LOCALCODE || r.localcode || '',
                    ICDCM: r.ICDCM || r.icdcm || '',
                    LOINC: r.LOINC || r.loinc || '',
                    GROUPCODE: r?.GROUPCODE || null,
                    GROUPNAME: r?.GROUPNAME || null,
                    INVESTNAME: investname,
                    DATETIME_REPORT: r.DATETIME_REPORT || r.datetime_report || '',
                    INVESTVALUE: investvalue.toString(),
                    LH: r.LH || r.lh || '',
                    UNIT: r.UNIT || r.unit || '',
                    NORMAL_MIN: r.NORMAL_MIN || r.normal_min || '',
                    NORMAL_MAX: r.NORMAL_MAX || r.normal_max || '',
                    INVESTRESULT: investresult.toString(),
                    D_UPDATE: r.D_UPDATE || r.d_update || d_update
                });
            }
        }
        const saveResult = await (0, moph_refer_1.sendingToMoph)('/save-investigation-refer', rowsSave);
        if (saveResult.statusCode === 200) {
            sentResult.investigationRefer.success += rowsSave.length;
        }
        else {
            console.log('investigation-refer error:', saveResult.message || saveResult);
            sentResult.investigationRefer.fail += rowsSave.length;
        }
        sentContent += '    -- SEQ ' + visitNo + ' ' + JSON.stringify(saveResult.result || saveResult.message) + '\r';
    }
    return rowsLabResult;
}
async function ipdChecking(req, res) {
    try {
        const resultToken = await getNReferToken(apiKey, secretKey);
        if (resultToken && resultToken.statusCode == 200 && resultToken.token) {
            nReferToken = resultToken.token;
        }
        else {
            console.log('Get nRefer token error', resultToken.message);
            return false;
        }
        sentResult = {
            admission: { success: 0, fail: 0 },
            drugIpd: { success: 0, fail: 0 },
            diagnosisIpd: { success: 0, fail: 0 },
        };
        let today = moment().format('YYYY-MM-DD');
        let dateStart = moment().subtract(2, 'months').format('YYYY-MM-DD');
        let dateEnd = moment().subtract(1, 'days').format('YYYY-MM-DD');
        let date = dateStart;
        do {
            const result = await getNReferIPD({ date });
            let response = result?.response || result;
            let rows = response.rows || [];
            let anList = [];
            for (let row of rows) {
                const an = row.AN || row.an || '';
                const vn = row.SEQ || row.seq || row.VN || row.vn || '';
                if (an && vn) {
                    anList.push(an);
                    await getAdmission(db, 'vn', vn);
                }
            }
            console.log(moment().format('HH:mm:ss'), `Send IPD backward: ${date} founed: ${rows.length} rows, IPD sent: ${anList.length} rows`);
            date = moment(date).add(1, 'day').format('YYYY-MM-DD');
        } while (date <= dateEnd && date <= today);
        console.log(sentResult);
        return sentResult;
    }
    catch (error) {
        console.log(moment().format('HH:mm:ss'), 'ipdChecking', error.message);
    }
}
async function getAdmission(db, type = 'VN', searchValue) {
    let rows;
    if (type == 'datedisc') {
        rows = await hismodel_1.default.getAdmission(db, 'datedisc', searchValue, hcode);
    }
    else {
        rows = await hismodel_1.default.getAdmission(db, 'visitNo', searchValue, hcode);
    }
    sentContent += '  - admission = ' + rows.length + '\r';
    if (rows && rows.length) {
        for (const row of rows) {
            const an = row.AN || row.an;
            await sendAdmission(row);
            const [resultIpd, resultIpdDx] = await Promise.all([
                drugIPD(db, an),
                getDiagnosisIpd(db, an),
            ]).finally(() => { });
        }
    }
    return rows;
}
async function drugIPD(db, an) {
    try {
        let ipdDrug = [];
        const rows = await hismodel_1.default.getDrugIpd(db, an, hcode);
        sentContent += '  - drug_ipd = ' + rows.length + '\r';
        if (rows && rows.length) {
            for (let r of rows) {
                for (let fld in r) {
                    r[fld.toLowerCase()] = r[fld];
                }
                if (r.dname) {
                    ipdDrug.push({
                        HOSPCODE: r.hospcode || hcode,
                        PID: r.pid || r.hn,
                        AN: r.an,
                        DATETIME_ADMIT: r.datetime_admit || null,
                        WARDSTAY: r.wardstay || '',
                        TYPEDRUG: r.typedrug || '',
                        DIDSTD: r.didstd || '',
                        DNAME: r.dname || '',
                        DATESTART: r.datestart || null,
                        DATEFINISH: r.datefinish || null,
                        AMOUNT: r.amount || null,
                        UNIT: r.unit || null,
                        UNIT_PACKING: r.unit_packing || null,
                        DRUGPRICE: r.drugprice || null,
                        DRUGCOST: r.drugcost || null,
                        PROVIDER: r.provider || r.dr || null,
                        D_UPDATE: r.d_update || null,
                        CID: r.cid || null,
                        DID: r.did || null,
                        DID_TMT: r.did_tmt || null,
                        tmt: r.tmt || null,
                        ID: r.id || null,
                        drug_usage: r.drug_usage || null,
                        caution: r.caution || null
                    });
                }
            }
            if (ipdDrug.length > 0) {
                const saveResult = await (0, moph_refer_1.sendingToMoph)('/save-drug-ipd', ipdDrug);
                sentContent += '    -- ' + an + ' ' + JSON.stringify(saveResult) + '\r';
                if (saveResult.statusCode == 200) {
                    sentResult.drugIpd.success += 1;
                }
                else {
                    console.log('drug ipd error: vn ', an, saveResult.message || saveResult);
                    sentResult.drugIpd.fail += 1;
                }
            }
        }
        return ipdDrug;
    }
    catch (error) {
        return false;
    }
}
async function sendAdmission(row) {
    const d_update = moment().format('YYYY-MM-DD HH:mm:ss');
    for (let r in row) {
        row[r.toLowerCase()] = row[r];
    }
    const data = {
        HOSPCODE: row.hospcode || hcode,
        PID: row.pid || row.hn,
        SEQ: row.seq || row.vn,
        AN: row.an,
        CID: row.cid || '',
        DATETIME_ADMIT: row.datetime_admit,
        WARDADMIT: row.wardadmit || '',
        WARDADMITNAME: row.wardadmitname || '',
        WARDDISCHNAME: row.warddischname || '',
        INSTYPE: row.instype || '',
        TYPEIN: row.typein || '',
        REFERINHOSP: row.referinhosp || '',
        CAUSEIN: row.causein || '',
        ADMITWEIGHT: row.admitweight || 0,
        ADMITHEIGHT: row.admitheight || 0,
        DATETIME_DISCH: row.datetime_disch || '',
        WARDDISCH: row.warddish || '',
        DISCHSTATUS: row.dischstatus || '',
        DISCHTYPE: row.disctype || '',
        REFEROUTHOSP: row.referouthosp || '',
        CAUSEOUT: row.causeout || '',
        COST: row.cost || '',
        PRICE: row.price || '',
        PAYPRICE: row.payprice || '',
        ACTUALPAY: row.actualpay || '',
        PROVIDER: row.provider || row.dr || '',
        DRG: row.drg || '',
        RW: row.rw || 0,
        ADJRW: row.adjrw || 0,
        WTLOS: row.wtlos || 0,
        ERROR: row.error || '',
        WARNING: row.warning || '',
        ACTLOS: row.actlos || 0,
        GROUPER_VERSION: row.grouper_version || '',
        CLINIC: row.clinic || '',
        MAIN: row.main || '',
        SUB: row.hsub || row.sub || '',
        D_UPDATE: row.d_update || d_update,
    };
    const saveResult = await (0, moph_refer_1.sendingToMoph)('/save-admission', data);
    if (saveResult.statusCode == 200) {
        sentResult.admission.success += 1;
    }
    else {
        sentResult.admission.fail += 1;
    }
    sentContent += '    -- AN ' + data.AN + ' ' + (saveResult.result || saveResult.message) + '\r';
}
async function getDiagnosisIpd(db, an) {
    try {
        const rows = await hismodel_1.default.getDiagnosisIpd(db, 'an', an);
        sentContent += '  - diagnosis_ipd = ' + rows.length + '\r';
        if (rows && rows.length) {
            let r = [];
            for (const row of rows) {
                for (let fld in row) {
                    row[fld.toLowerCase()] = row[fld];
                }
                if (row.diagcode && row.an) {
                    r.push({
                        HOSPCODE: row.hospcode,
                        PID: row.pid || row.hn,
                        AN: row.an,
                        DATETIME_ADMIT: row.datetime_admit,
                        WARDDIAG: row.warddiag || '',
                        DIAGTYPE: row.diagtype || '',
                        DIAGCODE: row.diagcode || '',
                        DIAGNAME: row.diagname || '',
                        CLINIC: row.clinic || '',
                        PROVIDER: row.provider || row.dr || '',
                        CODESET: row.codeset || '',
                        D_UPDATE: row.d_update || '',
                        CID: row.cid || '',
                        ID: row.id || null,
                        BR: row.br || null,
                        AIS: row.ais || null,
                        ncd_id: row.ncd_id || null
                    });
                }
            }
            if (r.length > 0) {
                const saveResult = await (0, moph_refer_1.sendingToMoph)('/save-diagnosis-ipd', r);
                sentContent += '    -- ' + an + ' ' + JSON.stringify(saveResult) + '\r';
                if (saveResult.statusCode === 200) {
                    sentResult.diagnosisIpd.success += 1;
                }
                else {
                    sentResult.diagnosisIpd.fail += 1;
                    console.log('save-diagnosis-ipd', an, saveResult.message || saveResult);
                }
            }
        }
        return rows;
    }
    catch (error) {
        return false;
    }
}
async function getProcedureIpd(db, an) {
    if (!an) {
        return [];
    }
    const d_update = moment().format('YYYY-MM-DD HH:mm:ss');
    const rows = await hismodel_1.default.getProcedureIpd(db, an, hcode);
    sentContent += '  - procedure_ipd = ' + rows.length + '\r';
    let rowSave = [];
    if (rows && rows.length) {
        for (const row of rows) {
            await rowSave.push({
                HOSPCODE: row.HOSPCODE || row.hospcode,
                PID: row.PID || row.pid || row.HN || row.hn,
                AN: row.AN || row.an,
                PROCEDCODE: row.PROCEDCODE || row.procedcode || row.OP_CODE || row.op_code,
                PROCEDNAME: row.PROCEDNAME || row.procedname || row.OP_NAME || row.op_name || '',
                DATETIME_ADMIT: row.DATETIME_ADMIT || row.datetime_admit || '',
                TIMESTART: row.TIMESTART || row.timestart || '',
                TIMEFINISH: row.TIMEFINISH || row.timefinish || '',
                WARDSTAY: row.WARDSTAY || row.wardstay || '',
                SERVICEPRICE: row.SERVICEPRICE || row.serviceprice || 0,
                PROVIDER: row.PROVIDER || row.provider || row.dr || '',
                D_UPDATE: row.D_UPDATE || row.d_update || row.date || d_update,
                CID: row.CID || row.cid || '',
            });
        }
        const saveResult = await (0, moph_refer_1.sendingToMoph)('/save-procedure-ipd', rowSave);
        sentContent += '    -- ' + an + ' ' + JSON.stringify(saveResult) + '\r';
    }
    return rowSave;
}
async function getDrugAllergy(db, hn, sentResult) {
    if (!hn) {
        return [];
    }
    const d_update = moment().format('YYYY-MM-DD HH:mm:ss');
    try {
        let rowSave = [];
        const rows = await hismodel_1.default.getDrugAllergy(db, hn, hcode);
        sentResult += '  - drugallergy = ' + rows.length + '\r';
        if (rows && rows.length) {
            for (const row of rows) {
                await rowSave.push({
                    HOSPCODE: hcode,
                    PID: row.PID || row.pid || row.HN || row.hn,
                    DATERECORD: row.DATERECORD || null,
                    DRUGALLERGY: row.DRUGALLERGY || null,
                    DCODE: row.DCODE || null,
                    DNAME: row.DNAME || null,
                    TYPEDX: row.TYPEDX || null,
                    ALEVEL: row.ALEVEL || null,
                    SYMPTOM: row.SYMPTOM || null,
                    INFORMANT: row.INFORMANT || null,
                    INFORMHOSP: row.INFORMHOSP || null,
                    DETAIL: row.DETAIL || null,
                    DID: row.DID || null,
                    DID_TMT: row.DID_TMT || null,
                    D_UPDATE: row.D_UPDATE || row.d_update || row.DATERECORD || d_update,
                    CID: row.CID || row.cid || '',
                    ID: row.ID || '',
                });
            }
        }
        const saveResult = await referSending('/save-drugallergy', rowSave);
        sentResult += '    -- ' + hn + ' ' + JSON.stringify(saveResult) + '\r';
        return rowSave;
    }
    catch (error) {
        return [];
    }
}
async function getProvider(db, drList, sentResult) {
    if (!drList || drList.length === 0) {
        sentResult.provider = -1;
        console.log('No provider in refer out data');
        return null;
    }
    const rows = await hismodel_1.default.getProviderDr(db, drList);
    sentContent += `  - provider = ${drList.length} founded: ${rows.length}\r`;
    sentResult.provider = rows.length;
    let rowSave = [];
    if (rows && rows.length) {
        for (let row of rows) {
            for (let r in row) {
                row[r.toLowerCase()] = row[r];
            }
            rowSave.push({
                HOSPCODE: row.hospcode,
                PROVIDER: row.provider,
                REGISTERNO: row.registerno || '',
                COUNCIL: row.council || '',
                CID: row.cid || '',
                PRENAME: row.prename || '',
                NAME: row.name || '',
                LNAME: row.lname || '',
                SEX: row.sex || '',
                BIRTH: row.birth || '',
                PROVIDERTYPE: row.providertype || 0,
                OFFICETYPE: row.officetype || 0,
                HOSTOFFICE: row.hostoffice || '',
                ID: row.id || '',
                D_UPDATE: row.d_update || moment().format('YYYY-MM-DD HH:mm:ss')
            });
        }
        const saveResult = await (0, moph_refer_1.sendingToMoph)('/save-provider', rowSave);
        sentContent += '    -- save provider ', rowSave.length, JSON.stringify(saveResult) + '\r';
    }
    return rowSave;
}
async function referSending(path, dataArray) {
    const fixedUrl = process.env.NREFER_API_URL || 'https://refer.moph.go.th/api/his';
    const bodyData = {
        ip: crontabConfig['client_ip'] || fastify.ipAddr || '127.0.0.1',
        hospcode: hcode, data: JSON.stringify(dataArray),
        processPid: process.pid, dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        sourceApiName: 'HIS-connect', apiVersion: crontabConfig.version, subVersion: crontabConfig.subVersion,
        hisProvider: process.env.HIS_PROVIDER
    };
    const url = fixedUrl + '/nrefer' + path;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + nReferToken,
        'Source-Agent': 'HISConnect-' + (crontabConfig.version || 'x') + '-' + (crontabConfig.subVersion || 'x') + '-' + (process.env.HOSPCODE || 'hosp') + '-' + moment().format('x') + '-' + Math.random().toString(36).substring(2, 10),
    };
    try {
        const { status, data } = await axios_1.default.post(url, bodyData, { headers });
        return data;
    }
    catch (error) {
        console.log('referSending error ', error.message);
        return error;
    }
}
async function getNReferToken(apiKey, secretKey) {
    const fixedUrl = process.env.NREFER_API_URL || 'https://refer.moph.go.th/api/his';
    const url = fixedUrl + '/login/api-key';
    const bodyData = {
        ip: crontabConfig['client_ip'] || fastify.ipAddr || '127.0.0.1',
        apiKey, secretKey, hospcode: hcode,
        processPid: process.pid, dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        sourceApiName: 'HIS-connect', apiVersion: crontabConfig.version, subVersion: crontabConfig.subVersion,
        hisProvider: process.env.HIS_PROVIDER
    };
    const headers = {
        'Content-Type': 'application/json',
        'Source-Agent': 'HISConnect-' + crontabConfig.version + '-' + crontabConfig.subVersion + '-' + (process.env.HOSPCODE || 'hosp') + '-' + moment().format('x') + '-' + Math.random().toString(36).substring(2, 10),
    };
    try {
        const { status, data } = await axios_1.default.post(url, bodyData, { headers });
        return data;
    }
    catch (error) {
        console.log('getNReferToken', error.status || '', error.message);
        return error;
    }
}
async function getNReferIPD(bodyData = {}) {
    const fixedUrl = 'https://nrefer.moph.go.th/ws';
    const body = {
        ip: crontabConfig['client_ip'] || fastify.ipAddr || '127.0.0.1',
        ...bodyData,
        processPid: process.pid, dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        sourceApiName: 'HIS-connect', apiVersion: crontabConfig.version, subVersion: crontabConfig.subVersion,
        hisProvider: process.env.HIS_PROVIDER
    };
    const url = fixedUrl + '/v3/refer-history';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + nReferToken,
        'Source-Agent': 'HISConnect-' + (crontabConfig.version || 'x') + '-' + (crontabConfig.subVersion || 'x') + '-' + (process.env.HOSPCODE || 'hosp') + '-' + moment().format('x') + '-' + Math.random().toString(36).substring(2, 10),
    };
    try {
        const { status, data } = await axios_1.default.post(url, body, { headers });
        return data;
    }
    catch (error) {
        console.log('referSending error ', error.message);
        return error;
    }
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
module.exports = { processSend, ipdChecking };
