"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const HttpStatus = require("http-status-codes");
const iswin_1 = require("../../models/isonline/iswin");
const isModel = new iswin_1.IswinModel();
const router = (fastify, {}, next) => {
    fastify.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        res.send({
            apiCode: 'ISOnline',
            version: fastify.appVersion.version,
            subversion: fastify.appVersion.subVersion
        });
    }));
    fastify.get('/alive', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield isModel.getVersion(fastify.dbISOnline);
            res.send({
                statusCode: HttpStatus.OK,
                version: fastify.appVersion.version,
                subversion: fastify.appVersion.subVersion,
                startServerTime: fastify.startServerTime,
                idDb: process.env.IS_DB_NAME,
                connnection: true
            });
        }
        catch (error) {
            res.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                version: fastify.appVersion.version,
                subversion: fastify.appVersion.subVersion,
                startServerTime: fastify.startServerTime,
                connnection: false,
                message: error.message
            });
        }
    }));
    fastify.post('/getbyref', { preHandler: [fastify.authenticate] }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        let refSeach = req.body.refSeach;
        let hospCode = req.body.hospCode;
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            res.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            const result = yield isModel.getByRef(fastify.dbISOnline, refSeach, hospCode);
            fastify.dbISOnline.destroy;
            res.send({
                statusCode: HttpStatus.OK,
                version: fastify.appVersion.version,
                subversion: fastify.appVersion.subVersion,
                ok: true, rows: result[0]
            });
        }
        catch (error) {
            res.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    }));
    fastify.post('/get-libs', { preHandler: [fastify.authenticate] }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        let groupCode = req.body.groupCode;
        let hospCode = req.body.hospCode;
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            res.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            const result = yield isModel.getLibs(fastify.dbISOnline, hospCode, groupCode);
            fastify.dbISOnline.destroy;
            console.log("lib code: " + groupCode + ' result: ' + result[0].length + ' record<s>');
            res.send({
                statusCode: HttpStatus.OK,
                version: fastify.appVersion.version,
                subversion: fastify.appVersion.subVersion,
                ok: true, rows: result[0]
            });
        }
        catch (error) {
            res.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    }));
    fastify.post('/get-lib', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        let columnsName = req.body.columnsName;
        let textSearch = req.body.textSearch;
        let hospCode = req.body.hospCode;
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            reply.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            const result = yield isModel.getLib(fastify.dbISOnline, hospCode, 'lib_code', columnsName, textSearch);
            fastify.dbISOnline.destroy;
            reply.send({
                statusCode: HttpStatus.OK,
                version: fastify.appVersion.version,
                subversion: fastify.appVersion.subVersion,
                ok: true, rows: result[0]
            });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    }));
    fastify.post('/get-office', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        let textSearch = req.body.textSearch;
        let hospCode = req.body.hospCode;
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            reply.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            const result = yield isModel.getOffices(fastify.dbISOnline, hospCode, textSearch);
            fastify.dbISOnline.destroy;
            reply.send({
                statusCode: HttpStatus.OK,
                version: fastify.appVersion.version,
                subversion: fastify.appVersion.subVersion,
                ok: true, rows: result[0]
            });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    }));
    fastify.post('/getbydate', { preHandler: [fastify.authenticate] }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        let dDate = req.body.date;
        let dDate1 = req.body.date1 || req.body.date;
        let dDate2 = req.body.date2 || req.body.date;
        let typeDate = req.body.typeDate;
        let hospCode = req.body.hospCode;
        try {
            typeDate = (typeDate || typeDate != "") ? typeDate : 'adate';
            const results = yield isModel.getByDate(fastify.dbISOnline, typeDate, dDate1, dDate2, hospCode);
            fastify.dbISOnline.destroy;
            if (results) {
                res.send({
                    statusCode: HttpStatus.OK,
                    status: HttpStatus.OK,
                    ok: true,
                    version: fastify.appVersion.version,
                    subversion: fastify.appVersion.subVersion,
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
    }));
    fastify.post('/reportByDate', { preHandler: [fastify.authenticate] }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            const results = yield isModel.reportByDate(fastify.dbISOnline, typeDate, date1, date2, hospCode);
            fastify.dbISOnline.destroy;
            if (results) {
                console.log("reportByDate: " + typeDate + ': ' + date1 + ' - ' + date2 + " hcode: " + hospCode + ' result: ' + results[0].length + ' record<s>');
                res.send({
                    statusCode: HttpStatus.OK,
                    status: HttpStatus.OK,
                    ok: true,
                    version: fastify.appVersion.version,
                    subversion: fastify.appVersion.subVersion,
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
    }));
    fastify.post('/getbyid', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        let id = req.body.idSeach;
        let hospCode = req.body.hospCode;
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            reply.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            const result = yield isModel.getByID(fastify.dbISOnline, id, hospCode);
            fastify.dbISOnline.destroy;
            reply.send({
                statusCode: HttpStatus.OK,
                version: fastify.appVersion.version,
                subversion: fastify.appVersion.subVersion,
                ok: true, rows: result[0]
            });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    }));
    fastify.post('/getbyname', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
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
            const result = yield isModel.getByName(fastify.dbISOnline, typeSearch, valSearch, hospCode);
            fastify.dbISOnline.destroy;
            reply.send({
                statusCode: HttpStatus.OK,
                version: fastify.appVersion.version,
                subversion: fastify.appVersion.subVersion,
                ok: true, rows: result[0]
            });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    }));
    fastify.post('/selectData', { preHandler: [fastify.authenticate] }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            const results = yield isModel.selectSql(fastify.dbISOnline, tableName, selectText, whereText, groupBy, orderText, limit);
            fastify.dbISOnline.destroy;
            if (results) {
                console.log("get: " + tableName + ' = ' + results[0].length + ' record<s> founded.');
                res.send({
                    statusCode: HttpStatus.OK,
                    status: HttpStatus.OK,
                    ok: true,
                    version: fastify.appVersion.version,
                    subversion: fastify.appVersion.subVersion,
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
    }));
    fastify.post('/saveis', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        let ref = req.body.ref;
        let data = req.body.data;
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            reply.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            const result = yield isModel.saveIs(fastify.dbISOnline, ref, data);
            fastify.dbISOnline.destroy;
            reply.send({ statusCode: HttpStatus.OK, ok: true, rows: result[0] });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    }));
    fastify.post('/save-map-point', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        let ref = req.body.ref;
        let formInput = req.body.formInput;
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            reply.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            const result = yield isModel.saveMapPoint(fastify.dbISOnline, ref, formInput);
            console.log("save map point: " + ref);
            isModel.saveMapPointIs(fastify.dbISOnline, formInput);
            fastify.dbISOnline.destroy;
            reply.send({
                statusCode: HttpStatus.OK, ok: true,
                version: fastify.appVersion.version,
                subversion: fastify.appVersion.subVersion,
                rows: result[0]
            });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    }));
    fastify.post('/save-lib', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        let saveType = req.body.saveType;
        let formInput = req.body.formInput;
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            reply.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            const result = yield isModel.saveLib(fastify.dbISOnline, saveType, formInput);
            fastify.dbISOnline.destroy;
            reply.send({
                statusCode: HttpStatus.OK, ok: true,
                version: fastify.appVersion.version,
                subversion: fastify.appVersion.subVersion,
                rows: result[0]
            });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    }));
    fastify.post('/save-lib-hosp', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        let saveType = req.body.saveType;
        let formInput = req.body.formInput;
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            reply.send({ ok: false, error: 'token error' });
            return false;
        }
        try {
            const result = yield isModel.saveLibHosp(fastify.dbISOnline, saveType, formInput);
            fastify.dbISOnline.destroy;
            reply.send({
                statusCode: HttpStatus.OK, ok: true,
                version: fastify.appVersion.version,
                subversion: fastify.appVersion.subVersion,
                rows: result[0]
            });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    }));
    fastify.post('/report-agegroup', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        let reportType = req.body.reportType;
        let date1 = req.body.date1;
        let date2 = req.body.date2;
        let hospCode = req.body.hospCode;
        try {
            const result = yield isModel.reportAgeGroup1(fastify.dbISOnline, date1, date2, hospCode);
            fastify.dbISOnline.destroy;
            reply.send({
                statusCode: HttpStatus.OK,
                ok: true,
                version: fastify.appVersion.version,
                subversion: fastify.appVersion.subVersion,
                rows: result[0]
            });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    }));
    fastify.post('/save-to-csv', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
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
    }));
    fastify.post('/remove', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        let id = req.body.id;
        let ref = req.body.ref;
        let hospCode = req.body.hospCode;
        try {
            const result = yield isModel.remove(fastify.dbISOnline, ref);
            fastify.dbISOnline.destroy;
            reply.send({ statusCode: HttpStatus.OK, result });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message
            });
        }
    }));
    function verifyToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                yield fastify.jwt.verify(token);
                return true;
            }
            catch (error) {
                console.log('authen fail!', error.message);
                res.status(HttpStatus.UNAUTHORIZED).send({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: error.message
                });
            }
        });
    }
    next();
};
module.exports = router;
