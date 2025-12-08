"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.erpAdminRequest = exports.updateAlive = exports.sendBedNo = exports.sendWardName = exports.mophErpProcessTask = exports.sendBedOccupancy = void 0;
const moment = require("moment");
const moph_refer_1 = require("../middleware/moph-refer");
const hismodel_1 = require("./../routes/his/hismodel");
const utils_1 = require("../middleware/utils");
const packageJson = require('../../package.json');
const dbConnection = require('../plugins/db');
let db = dbConnection('HIS');
const hisProvider = process.env.HIS_PROVIDER || '';
const hisVersion = process.env.HIS_VERSION || '';
const hospcode = process.env.HOSPCODE || '';
const sendBedOccupancy = async (dateProcess = null) => {
    let whatUTC = Intl?.DateTimeFormat().resolvedOptions().timeZone || '';
    let currDate;
    if (whatUTC == 'UTC' || whatUTC == 'Etc/UTC') {
        currDate = moment().locale('TH').add(7, 'hours').subtract(1, 'hours').startOf('hour').format('YYYY-MM-DD HH:mm:ss');
    }
    else {
        currDate = moment().locale('TH').subtract(1, 'hours').startOf('hour').format('YYYY-MM-DD HH:mm:ss');
    }
    let date = dateProcess || currDate;
    let dateOpd = date;
    let clinicResult = null, wardResult = null, opdResult = null;
    do {
        [clinicResult, wardResult] = await Promise.all([
            sendBedOccupancyByClinic(date),
            sendBedOccupancyByWard(date),
        ]);
        date = moment(date).add(1, 'day').format('YYYY-MM-DD');
    } while (date <= currDate);
    do {
        [opdResult] = await Promise.all([
            sendOpdVisitByClinic(dateOpd)
        ]);
        dateOpd = moment(dateOpd).add(1, 'day').format('YYYY-MM-DD');
    } while (dateOpd <= currDate);
    return { clinicResult, wardResult, opdResult };
};
exports.sendBedOccupancy = sendBedOccupancy;
const sendBedOccupancyByWard = async (date) => {
    try {
        const occupancy_date = moment(date).locale('TH').endOf('hour').format('YYYY-MM-DD HH:mm:ss');
        let rows = await hismodel_1.default.concurrentIPDByWard(db, date);
        if (rows && rows.length) {
            rows = rows.map((v) => {
                return { ...v, occupancy_date, date, hospcode, his: hisProvider || '' };
            });
            const result = await (0, moph_refer_1.sendingToMoph)('/save-occupancy-rate-by-ward', rows);
            console.log(moment().format('HH:mm:ss'), 'send Occ Rate by ward', date, result.status || '', result.message || '', rows.length, 'rows', rows[0]);
        }
        return rows;
    }
    catch (error) {
        console.error(moment().format('HH:mm:ss'), 'sendBedOccupancy error by ward', date, error.message);
        return false;
    }
};
const sendBedOccupancyByClinic = async (date) => {
    try {
        let rows = await hismodel_1.default.concurrentIPDByClinic(db, date);
        if (rows && rows.length) {
            rows = rows.map(v => {
                return { ...v, date, hospcode, his: hisProvider || '' };
            });
            const result = await (0, moph_refer_1.sendingToMoph)('/save-occupancy-rate-by-clinic', rows);
            console.log(moment().format('HH:mm:ss'), 'send Occ rate by clinic', date, result.status || '', result.message || '', rows.length, 'rows');
        }
        return rows;
    }
    catch (error) {
        console.error(moment().format('HH:mm:ss'), 'sendBedOccupancy by clinic error', date, error.message);
        return false;
    }
};
const sendOpdVisitByClinic = async (date) => {
    try {
        let rows = await hismodel_1.default.sumOpdVisitByClinic(db, date);
        if (rows && rows.length) {
            rows = rows.map((v) => {
                return {
                    ...v, hospcode, his: hisProvider || ''
                };
            });
            const result = await (0, moph_refer_1.sendingToMoph)('/save-sum-opd-visit-by-clinic', rows);
            console.log(moment().format('HH:mm:ss'), 'send Sum OPD visit by clinic', date, result.status || '', result.message || '', rows.length, 'rows');
        }
        return rows;
    }
    catch (error) {
        console.error(moment().format('HH:mm:ss'), 'sendSumOpdVisit by clinic error', date, error.message);
        return false;
    }
};
const mophErpProcessTask = async () => {
    let result = await (0, moph_refer_1.taskFunction)('MOPH-ERP');
    result = await (0, moph_refer_1.taskFunction)('sql', {
        function_name: 'getWard',
        his_name: hisProvider, his_version: hisVersion || ''
    });
    console.log('taskFunction', result);
    if (result?.statusCode == 200 && result?.row?.sql_string) {
        const sqlString = result.row.sql_string?.trim();
        console.log('get ward sql:', sqlString);
        if (sqlString) {
            try {
                let rows;
                const whereVariables = normalizeSqlWhereVariable(result.row?.sql_where_variable);
                if (/^db\s*\(/.test(sqlString)) {
                    let queryBuilder = new Function('db', '"use strict"; return (' + sqlString + ');')(db);
                    queryBuilder = applyWhereToBuilder(queryBuilder, whereVariables);
                    console.log('queryBuilder 1:', queryBuilder.toSQL().toNative());
                    rows = await queryBuilder;
                }
                else {
                    const { sql, bindings } = appendWhereClause(sqlString, whereVariables);
                    console.log('queryBuilder 2:', db.raw(sql, bindings).toSQL().toNative());
                    rows = bindings.length ? await db.raw(sql, bindings) : await db.raw(sqlString);
                }
                console.log(Array.isArray(rows) ? rows.length : rows);
            }
            catch (error) {
                console.error('execute sql_string error', error.message);
            }
        }
    }
};
exports.mophErpProcessTask = mophErpProcessTask;
const sendWardName = async () => {
    try {
        let rows = await hismodel_1.default.getWard(db);
        if (rows && rows.length) {
            rows = rows.map(v => {
                return { ...v, hospcode: process.env.HOSPCODE || '' };
            });
            const result = await (0, moph_refer_1.sendingToMoph)('/save-ward', rows);
            console.log(moment().format('HH:mm:ss'), 'sendWardName', result.status || '', result.message || '', rows.length);
            return result;
        }
        else {
            console.log(moment().format('HH:mm:ss'), 'sendWardName', 'No ward data');
            return { statusCode: 200, message: 'No ward data' };
        }
    }
    catch (error) {
        console.log(moment().format('HH:mm:ss'), 'getWard error', error.message);
        return [];
    }
};
exports.sendWardName = sendWardName;
const sendBedNo = async () => {
    let result;
    let countBed = 0;
    try {
        if (typeof hismodel_1.default.countBedNo === 'function') {
            result = await hismodel_1.default.countBedNo(db);
            countBed = result?.total_bed || 0;
        }
        let error = '';
        let times = 0;
        let startRow = countBed < 500 ? -1 : 0;
        const limitRow = 500;
        let sentResult = [];
        do {
            let rows = await hismodel_1.default.getBedNo(db, null, startRow, limitRow);
            if (rows && rows.length) {
                rows = rows
                    .filter((row) => row.wardcode != null && row.wardcode != '')
                    .map((v) => {
                    return {
                        ...v, hospcode: hospcode,
                        hcode5: hospcode.length == 5 ? hospcode : null,
                        hcode9: hospcode.length == 9 ? hospcode : null
                    };
                });
                result = await (0, moph_refer_1.sendingToMoph)('/save-bed-no', rows);
                if (result?.status != 200 && result?.statusCode != 200) {
                    error = result?.message || result?.status || result?.statusCode || null;
                }
                sentResult.push({ startRow, limitRow, rows: rows.length, result });
            }
            startRow += limitRow;
            times++;
        } while (startRow < countBed && countBed != 0);
        console.log(moment().format('HH:mm:ss'), `sendBedNo ${countBed} rows (${times})`, error);
        return { statusCode: 200, sentResult };
    }
    catch (error) {
        console.log(moment().format('HH:mm:ss'), 'getBedNo error', error.message);
        return { statusCode: error.status || 500, message: error.message || error };
    }
};
exports.sendBedNo = sendBedNo;
const updateAlive = async () => {
    const ipServer = (0, utils_1.getIP)();
    try {
        let data = {
            api_date: global.apiStartTime,
            server_date: moment().format('YYYY-MM-DD HH:mm:ss'),
            hospcode,
            version: packageJson.version || '',
            subversion: packageJson.subVersion || '',
            port: process.env.PORT || 0,
            ip: ipServer.ip,
            his: hisProvider, ssl: process.env?.SSL_ENABLE || null,
        };
        const result = await (0, moph_refer_1.updateHISAlive)(data);
        const status = result.status == 200 || result.statusCode == 200 ? true : false;
        if (status) {
            console.log(moment().format('HH:mm:ss'), '✅ Sent API Alive status result', result.status || '', result.statusCode || '', result?.message || '');
        }
        else {
            console.log(moment().format('HH:mm:ss'), '❌ Sent API Alive status result', result.status || '', result.statusCode || '', result?.message || '');
        }
        return result;
    }
    catch (error) {
        console.log(moment().format('HH:mm:ss'), '❌ Sent API Alive status error:', error?.status || error?.statusCode || '', error?.message || error || '');
        return [];
    }
};
exports.updateAlive = updateAlive;
const erpAdminRequest = async () => {
    try {
        const result = await (0, moph_refer_1.checkAdminRequest)();
        const rows = result?.rows || result?.data || [];
        if (rows && rows.length > 0) {
            let requestResult;
            for (let req of rows) {
                if (req.request_type == 'bed') {
                    requestResult = await (0, exports.sendBedNo)();
                    console.log(moment().format('HH:mm:ss'), 'ERP admin request get bed no.', requestResult?.statusCode || requestResult?.status || '', requestResult?.message || '');
                    await (0, moph_refer_1.updateAdminRequest)({
                        request_id: req.request_id,
                        status: requestResult?.statusCode == 200 || requestResult?.status == 200 ? 'success' : `failed ${requestResult?.status || requestResult?.statusCode || ''}`,
                        isactive: 0
                    });
                }
                else if (req.request_type == 'ward') {
                    requestResult = await (0, exports.sendWardName)();
                    console.log(moment().format('HH:mm:ss'), 'ERP admin request get ward name.', requestResult?.statusCode || requestResult?.status || '', requestResult?.message || '');
                    await (0, moph_refer_1.updateAdminRequest)({
                        request_id: req.request_id,
                        status: requestResult?.statusCode == 200 || requestResult?.status == 200 ? 'success' : `failed ${requestResult?.status || requestResult?.statusCode || ''}`,
                        isactive: 0
                    });
                }
                else if (req.request_type == 'alive') {
                    requestResult = await (0, exports.updateAlive)();
                    console.log(moment().format('HH:mm:ss'), 'ERP admin request send alive status.', requestResult?.statusCode || requestResult?.status || '', requestResult?.message || '');
                }
                else if (req.request_type == 'occupancy') {
                    requestResult = await (0, exports.sendBedOccupancy)();
                    console.log(moment().format('HH:mm:ss'), 'erpAdminRequest occupancy', requestResult?.statusCode || requestResult?.status || '', requestResult?.message || '');
                    await (0, moph_refer_1.updateAdminRequest)({
                        request_id: req.request_id,
                        status: requestResult?.statusCode == 200 || requestResult?.status == 200 ? 'success' : `failed ${requestResult?.status || requestResult?.statusCode || ''}`,
                        isactive: 0
                    });
                }
            }
        }
        else {
            console.log(moment().format('HH:mm:ss'), 'No admin request', result.status || result?.statusCode || '', result?.data?.message || result?.message || '');
        }
        return result;
    }
    catch (error) {
        console.log(moment().format('HH:mm:ss'), 'Admin Request error', error.message);
        return [];
    }
};
exports.erpAdminRequest = erpAdminRequest;
function getCode9(hcode = hospcode) {
}
function normalizeSqlWhereVariable(input) {
    if (!input) {
        return {};
    }
    if (typeof input === 'string') {
        try {
            const parsed = JSON.parse(input);
            return typeof parsed === 'object' && parsed ? parsed : {};
        }
        catch (_error) {
            return {};
        }
    }
    if (typeof input === 'object') {
        return input;
    }
    return {};
}
function applyWhereToBuilder(queryBuilder, whereVariables) {
    if (!queryBuilder || typeof queryBuilder.where !== 'function') {
        return queryBuilder;
    }
    Object.entries(whereVariables).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
            return;
        }
        const column = toSnakeCase(key);
        queryBuilder.where(column, value);
    });
    return queryBuilder;
}
function appendWhereClause(sqlString, whereVariables) {
    const activeFilters = Object.entries(whereVariables).filter(([_, value]) => value !== undefined && value !== null && value !== '');
    if (!activeFilters.length) {
        return { sql: sqlString, bindings: [] };
    }
    const hasWhere = /\bwhere\b/i.test(sqlString);
    const bindings = [];
    const conditions = activeFilters.map(([key, value]) => {
        bindings.push(value);
        return `${toSnakeCase(key)} = ?`;
    });
    const clause = conditions.join(' AND ');
    const separator = hasWhere ? ' AND ' : ' WHERE ';
    return { sql: sqlString + separator + clause, bindings };
}
function toSnakeCase(value) {
    if (!value) {
        return value;
    }
    return value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}
