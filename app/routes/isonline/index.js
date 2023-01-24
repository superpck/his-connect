"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const HttpStatus = require("http-status-codes");
const iswin_1 = require("../../models/isonline/iswin");
const isModel = new iswin_1.IswinModel();
const router = (fastify, {}, next) => {
    fastify.get('/', async (req, res) => {
        res.send({
            apiCode: 'ISOnline@MOPH',
            version: global.appDetail.version,
            subVersion: global.appDetail.subVersion
        });
    });
    fastify.get('/alive', async (req, res) => {
        try {
            const result = await isModel.getVersion(global.dbISOnline);
            res.send({
                statusCode: HttpStatus.OK,
                version: global.appDetail.version,
                subVersion: global.appDetail.subVersion,
                startServerTime: fastify.startServerTime,
                idDb: process.env.IS_DB_NAME,
                connnection: true
            });
        }
        catch (error) {
            res.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                version: global.appDetail.version,
                subVersion: global.appDetail.subVersion,
                startServerTime: fastify.startServerTime,
                connnection: false,
                message: error.message
            });
        }
    });
    fastify.post('/getbyref', { preHandler: [fastify.authenticate] }, async (req, res) => {
        let refSeach = req.body.refSeach;
        let hospCode = req.body.hospCode;
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            res.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            const result = await isModel.getByRef(global.dbISOnline, refSeach, hospCode);
            global.dbISOnline.destroy;
            res.send({
                statusCode: HttpStatus.OK,
                version: global.appDetail.version,
                subVersion: global.appDetail.subVersion,
                ok: true, rows: result[0]
            });
        }
        catch (error) {
            res.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    });
    fastify.post('/get-libs', { preHandler: [fastify.authenticate] }, async (req, res) => {
        let groupCode = req.body.groupCode;
        let hospCode = req.body.hospCode;
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            res.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            const result = await isModel.getLibs(global.dbISOnline, hospCode, groupCode);
            global.dbISOnline.destroy;
            console.log("lib code: " + groupCode + ' result: ' + result[0].length + ' record<s>');
            res.send({
                statusCode: HttpStatus.OK,
                version: global.appDetail.version,
                subVersion: global.appDetail.subVersion,
                ok: true, rows: result[0]
            });
        }
        catch (error) {
            res.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    });
    fastify.post('/get-lib', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        let columnsName = req.body.columnsName;
        let textSearch = req.body.textSearch;
        let hospCode = req.body.hospCode;
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            reply.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            const result = await isModel.getLib(global.dbISOnline, hospCode, 'lib_code', columnsName, textSearch);
            global.dbISOnline.destroy;
            reply.send({
                statusCode: HttpStatus.OK,
                version: global.appDetail.version,
                subVersion: global.appDetail.subVersion,
                ok: true, rows: result[0]
            });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    });
    fastify.post('/get-office', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        let textSearch = req.body.textSearch;
        let hospCode = req.body.hospCode;
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            reply.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            const result = await isModel.getOffices(global.dbISOnline, hospCode, textSearch);
            global.dbISOnline.destroy;
            reply.send({
                statusCode: HttpStatus.OK,
                version: global.appDetail.version,
                subVersion: global.appDetail.subVersion,
                ok: true, rows: result[0]
            });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    });
    fastify.post('/getbydate', { preHandler: [fastify.authenticate] }, async (req, res) => {
        let dDate = req.body.date;
        let dDate1 = req.body.date1 || req.body.date;
        let dDate2 = req.body.date2 || req.body.date;
        let typeDate = req.body.typeDate;
        let hospCode = req.body.hospCode;
        try {
            typeDate = (typeDate || typeDate != "") ? typeDate : 'adate';
            const results = await isModel.getByDate(global.dbISOnline, typeDate, dDate1, dDate2, hospCode);
            global.dbISOnline.destroy;
            if (results) {
                res.send({
                    statusCode: HttpStatus.OK,
                    status: HttpStatus.OK,
                    ok: true,
                    version: global.appDetail.version,
                    subVersion: global.appDetail.subVersion,
                    hisProvider: process.env.HIS_PROVIDER,
                    rows: results
                });
            }
            else {
                res.send({
                    statusCode: HttpStatus.NO_CONTENT,
                    status: HttpStatus.NO_CONTENT,
                    ok: false,
                    rows: []
                });
            }
        }
        catch (error) {
            res.send({
                statusCode: HttpStatus.BAD_REQUEST,
                status: 400,
                ok: false,
                message: error.message
            });
        }
    });
    fastify.post('/reportByDate', { preHandler: [fastify.authenticate] }, async (req, res) => {
        let date1 = req.body.date1;
        let date2 = req.body.date2;
        let typeDate = req.body.typeDate;
        let hospCode = req.body.hospCode;
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            res.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            typeDate = (typeDate || typeDate != "") ? typeDate : 'adate';
            const results = await isModel.reportByDate(global.dbISOnline, typeDate, date1, date2, hospCode);
            global.dbISOnline.destroy;
            if (results) {
                console.log("reportByDate: " + typeDate + ': ' + date1 + ' - ' + date2 + " hcode: " + hospCode + ' result: ' + results[0].length + ' record<s>');
                res.send({
                    statusCode: HttpStatus.OK,
                    status: HttpStatus.OK,
                    ok: true,
                    version: global.appDetail.version,
                    subVersion: global.appDetail.subVersion,
                    rows: results[0]
                });
            }
            else {
                res.send({
                    statusCode: HttpStatus.NO_CONTENT,
                    status: HttpStatus.NO_CONTENT,
                    ok: false,
                    rows: []
                });
            }
        }
        catch (error) {
            res.send({
                statusCode: HttpStatus.BAD_REQUEST,
                status: 400,
                ok: false,
                message: error.message
            });
        }
    });
    fastify.post('/getbyid', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        let id = req.body.idSeach;
        let hospCode = req.body.hospCode;
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            reply.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            const result = await isModel.getByID(global.dbISOnline, id, hospCode);
            global.dbISOnline.destroy;
            reply.send({
                statusCode: HttpStatus.OK,
                version: global.appDetail.version,
                subVersion: global.appDetail.subVersion,
                ok: true, rows: result[0]
            });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    });
    fastify.post('/getbyname', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        let id = req.body.idSeach;
        let typeSearch = req.body.typeSearch;
        let valSearch = req.body.valSearch;
        let hospCode = req.body.hospCode;
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            reply.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            const result = await isModel.getByName(global.dbISOnline, typeSearch, valSearch, hospCode);
            global.dbISOnline.destroy;
            reply.send({
                statusCode: HttpStatus.OK,
                version: global.appDetail.version,
                subVersion: global.appDetail.subVersion,
                ok: true, rows: result[0]
            });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    });
    fastify.post('/selectData', { preHandler: [fastify.authenticate] }, async (req, res) => {
        let tableName = req.body.tableName;
        let selectText = req.body.selectText;
        let whereText = req.body.whereText;
        let groupBy = req.body.groupBy;
        let orderText = req.body.orderText;
        let limit = req.body.limit || '';
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            res.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            const results = await isModel.selectSql(global.dbISOnline, tableName, selectText, whereText, groupBy, orderText, limit);
            global.dbISOnline.destroy;
            if (results) {
                console.log("get: " + tableName + ' = ' + results[0].length + ' record<s> founded.');
                res.send({
                    statusCode: HttpStatus.OK,
                    status: HttpStatus.OK,
                    ok: true,
                    version: global.appDetail.version,
                    subVersion: global.appDetail.subVersion,
                    rows: results[0]
                });
            }
            else {
                res.send({
                    statusCode: HttpStatus.NO_CONTENT,
                    status: HttpStatus.NO_CONTENT,
                    ok: false,
                    rows: []
                });
            }
        }
        catch (error) {
            res.send({
                statusCode: HttpStatus.BAD_REQUEST,
                status: 400,
                ok: false,
                message: error.message
            });
        }
    });
    fastify.post('/saveis', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        let ref = req.body.ref;
        let data = req.body.data;
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            reply.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            const result = await isModel.saveIs(global.dbISOnline, ref, data);
            global.dbISOnline.destroy;
            reply.send({ statusCode: HttpStatus.OK, ok: true, rows: result[0] });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    });
    fastify.post('/save-map-point', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        let ref = req.body.ref;
        let formInput = req.body.formInput;
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            reply.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            const result = await isModel.saveMapPoint(global.dbISOnline, ref, formInput);
            console.log("save map point: " + ref);
            isModel.saveMapPointIs(global.dbISOnline, formInput);
            global.dbISOnline.destroy;
            reply.send({
                statusCode: HttpStatus.OK, ok: true,
                version: global.appDetail.version,
                subVersion: global.appDetail.subVersion,
                rows: result[0]
            });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    });
    fastify.post('/save-lib', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        let saveType = req.body.saveType;
        let formInput = req.body.formInput;
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            reply.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            const result = await isModel.saveLib(global.dbISOnline, saveType, formInput);
            global.dbISOnline.destroy;
            reply.send({
                statusCode: HttpStatus.OK, ok: true,
                version: global.appDetail.version,
                subVersion: global.appDetail.subVersion,
                rows: result[0]
            });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    });
    fastify.post('/save-lib-hosp', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        let saveType = req.body.saveType;
        let formInput = req.body.formInput;
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            reply.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            const result = await isModel.saveLibHosp(global.dbISOnline, saveType, formInput);
            global.dbISOnline.destroy;
            reply.send({
                statusCode: HttpStatus.OK, ok: true,
                version: global.appDetail.version,
                subVersion: global.appDetail.subVersion,
                rows: result[0]
            });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    });
    fastify.post('/report-agegroup', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        let reportType = req.body.reportType;
        let date1 = req.body.date1;
        let date2 = req.body.date2;
        let hospCode = req.body.hospCode;
        try {
            const result = await isModel.reportAgeGroup1(global.dbISOnline, date1, date2, hospCode);
            global.dbISOnline.destroy;
            reply.send({
                statusCode: HttpStatus.OK,
                ok: true,
                version: global.appDetail.version,
                subVersion: global.appDetail.subVersion,
                rows: result[0]
            });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    });
    fastify.post('/save-to-csv', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            reply.send({ ok: false, error: 'token error' });
            return false;
        }
        let arrData = req.body.arrData;
        let headerFile = 'recno';
        let contentFile = '';
        let recno = 0;
        let csvFile = '';
        let htmlHeader = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <title>iswin</title>
      <meta charset="utf-8">
      <meta http-equiv="content-type" content="application/csv">
      <meta http-equiv="content-disposition" content="attachment; filename='isdata.csv'">
      <meta http-equiv="content-description" content="File Transfer">
      <meta http-equiv="pragma" content="no-cache">
      <meta http-equiv="expires" content="0">
  </head>
  <body>`;
        let htmlFooter = `</body></html>`;
        return new Promise((resolve, reject) => {
            arrData.forEach((rowData, rowno) => {
                contentFile = '' + (rowno + 1);
                let columnData = '';
                for (const index in rowData) {
                    columnData = rowData[index] ? rowData[index] : '';
                    if (rowno === 0) {
                        headerFile = headerFile + ',' + index;
                    }
                    contentFile = contentFile + ',"' + columnData + '"';
                }
                ;
                if (rowno === 0) {
                    csvFile = headerFile;
                }
                csvFile = csvFile + '\r\n' + contentFile;
                recno = recno + 1;
            });
            reply.send(htmlHeader + csvFile + htmlFooter);
        });
    });
    fastify.post('/remove', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        let id = req.body.id;
        let ref = req.body.ref;
        let hospCode = req.body.hospCode;
        try {
            const result = await isModel.remove(global.dbISOnline, ref);
            global.dbISOnline.destroy;
            reply.send({ statusCode: HttpStatus.OK, result });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message
            });
        }
    });
    async function verifyToken(req, res) {
        let token = null;
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            token = req.headers.authorization.split(' ')[1];
        }
        else if (req.query && req.query.token) {
            token = req.query.token;
        }
        else if (req.body && req.body.token) {
            token = req.body.token;
        }
        try {
            await fastify.jwt.verify(token);
            return true;
        }
        catch (error) {
            console.log('authen fail!', error.message);
            res.status(HttpStatus.UNAUTHORIZED).send({
                statusCode: HttpStatus.UNAUTHORIZED,
                message: error.message
            });
        }
    }
    next();
};
module.exports = router;
