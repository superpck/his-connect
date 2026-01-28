"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
const hismodel_1 = require("./../routes/his/hismodel");
const utils_1 = require("../middleware/utils");
const dbConnection = require('../plugins/db');
let db = dbConnection('HIS');
let hisHospcode = process.env.HOSPCODE;
let token;
const processCMI = (async (dateStart = null, dateEnd = null) => {
    dateStart = dateStart ? moment(dateStart).format('YYYY-MM-DD') : moment().subtract(35, 'days').format('YYYY-MM-DD');
    dateEnd = dateEnd ? moment(dateEnd).format('YYYY-MM-DD') : moment().subtract(30, 'days').format('YYYY-MM-DD');
    return await getIPD(dateStart, dateEnd);
});
const getIPD = (async (dateStart, dateEnd) => {
    try {
        dateStart = moment(dateStart).format('YYYY-MM-DD');
        dateEnd = moment(dateEnd).format('YYYY-MM-DD');
        let rows = [];
        let date = dateStart;
        do {
            const result = await getIPDDischarge(date);
            if (result && result.length > 0) {
                rows = [...rows, ...result];
            }
            date = moment(date).add(1, 'days').format('YYYY-MM-DD');
        } while (date <= dateEnd);
        if (rows.length > 0) {
            console.log(moment().format('HH:mm:ss'), `DRG/CMI: Discharge founded ${rows.length} IPD discharges on ${dateStart} to ${dateEnd}`);
            let drgRows = [];
            for (let row of rows) {
                let data = {
                    hcode: hisHospcode,
                    an: row.an,
                    hn: row.hn || row.pid,
                    pid: row.hn || row.pid,
                    seq: row?.vn || row.seq || null,
                    sex: row?.sex, dob: row.dob || null,
                    age: row?.age?.year || 0, ageday: row?.age?.year == 0 ? row?.age?.days : 0,
                    dateadm: moment(row?.datetime_admit).format('YYYY-MM-DD'),
                    timeadm: moment(row?.datetime_admit).format('HHmm'),
                    datedsc: moment(row?.datetime_discharge).format('YYYY-MM-DD'),
                    timedsc: moment(row?.datetime_discharge).format('HHmm'),
                    warddsc: row.warddsc || row.warddisch,
                    dischs: row.dischstatus,
                    discht: row.dischtype,
                    los: Number(row?.los || 0), actlos: Number(row?.actlos || 0),
                    referin: row?.referinhosp,
                    admwt: Number(row?.admwt || row?.admitweight || 0),
                    insure: row?.instype || null,
                    total: Number(row?.price || 0),
                    mdc: row.mdc || row.drg.substring(0, 2),
                    drg: row.drg,
                    rw: Number(row.rw || 0),
                    adjrw: Number(row.adjrw || 0),
                    wtlos: Number(row.wtlos || 0),
                    ot: row.ot || null,
                    err: row?.error || 0,
                    warn: row?.warning || 0,
                    tgrp: row.grouper_version,
                    udp: row?.udp || row?.d_update || row?.lastupdate || null
                };
                data.pdx = '';
                data.drpdx = null;
                let i = 0;
                for (const d of row.dx) {
                    if (d.diagtype === '1') {
                        data.pdx = (d.diagcode || '').replace('.', '').toUpperCase();
                        data.drpdx = d.provider || null;
                    }
                    else {
                        if (i++ < 12) {
                            data[`sdx${i}`] = (d.diagcode || '').replace('.', '').toUpperCase();
                            data[`drsdx${i}`] = d.provider || null;
                        }
                    }
                }
                i = 0;
                for (const op of row.op) {
                    if (i++ < 20) {
                        data[`proc${i}`] = op.procedcode.replace(/\/|\-|\*/g, '+').replace('.', '');
                        data[`drop${i}`] = op.provider || op.doctor || null;
                        data[`datein${i}`] = op.timestart ? moment(op.timestart).format('YYYY-MM-DD') : null;
                        data[`timein${i}`] = op.timestart ? moment(op.timestart).format('HHmm') : null;
                        data[`dateout${i}`] = op.timefinish ? moment(op.timefinish).format('YYYY-MM-DD') : null;
                        data[`timeout${i}`] = op.timefinish ? moment(op.timefinish).format('HHmm') : null;
                    }
                }
                drgRows.push(data);
            }
            return await sendingToMoph(drgRows);
        }
        else {
            console.error(moment().format('HH:mm:ss'), `DRG/CMI: No data found for IPD discharge on ${date}`);
            return false;
        }
    }
    catch (error) {
        console.error(moment().format('HH:mm:ss'), 'DRG/CMI: Error in getIPD:', error.message || error);
        return error;
    }
});
async function getIPDDischarge(date) {
    try {
        date = moment(date).format('YYYY-MM-DD');
        let rows = await hismodel_1.default.getAdmission(db, 'datedisc', date, '', false);
        if (!rows || rows.length === 0) {
            return [];
        }
        rows = toLowerColumnName(rows);
        for (let row of rows) {
            row.dob = row?.dob ? moment(row.dob).format('YYYY-MM-DD') : null;
            if (row.dob && row?.datetime_admit) {
                row.age = await (0, utils_1.dateLen)(row.dob, row.datetime_admit);
            }
            else {
                row.age = { year: 0, days: 0 };
            }
            row.dx = [];
            row.op = [];
            row.charge = [];
        }
        rows = rows.filter((r) => r?.drg && r?.grouper_version);
        if (!rows || rows.length === 0) {
            return [];
        }
        let anList = rows.map((r) => r.an);
        let dx = await hismodel_1.default.getDiagnosisIpd(db, 'an', anList);
        dx = toLowerColumnName(dx);
        dx.filter((r) => ['1', '2', '3', '5'].includes(r.diagtype))
            .forEach((d) => {
            const index = rows.findIndex((r) => r.an === d.an);
            rows[index].dx.push(d);
        });
        let op = await hismodel_1.default.getProcedureIpd(db, anList);
        op = toLowerColumnName(op);
        op.forEach((p) => {
            const index = rows.findIndex((r) => r.an === p.an);
            rows[index].op.push(p);
        });
        return rows;
    }
    catch (error) {
        console.error(moment().format('HH:mm:ss'), error.message || error);
        throw error;
    }
}
function toLowerColumnName(data) {
    if (!data) {
        return data;
    }
    const isArray = Array.isArray(data);
    const dataArray = isArray ? data : [data];
    const result = dataArray.map(row => {
        const newRow = {};
        for (const key in row) {
            if (row.hasOwnProperty(key)) {
                newRow[key.toLowerCase()] = row[key];
            }
        }
        return newRow;
    });
    return isArray ? result : result[0];
}
async function sendingToMoph(rows) {
    try {
        await getToken();
        let results = [];
        for (let row of rows) {
            const result = await sendRow(row);
            results.push(result);
        }
        console.table(rows[2]);
        return results;
    }
    catch (error) {
        console.error(moment().format('HH:mm:ss'), 'DRG/CMI: Error in sendingToMoph:', error.message || error);
        throw error;
    }
}
async function getToken() {
    if (token) {
        return token;
    }
    return token;
}
async function sendRow(row) {
    try {
        console.log(row);
        return true;
    }
    catch (error) {
        console.error(moment().format('HH:mm:ss'), 'DRG/CMI: Error in sendRow:', error.message || error);
        throw error;
    }
}
exports.default = { processCMI };
