"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const jwt_1 = require("./../../plugins/jwt");
const moment_1 = __importDefault(require("moment"));
var jwt = new jwt_1.Jwt();
const hismodel_1 = __importDefault(require("../his/hismodel"));
const hisConnect = hismodel_1.default;
const provider = process.env.HIS_PROVIDER.toLowerCase();
const hisProviderList = ['ihospital', 'hosxpv3', 'hosxpv4', 'hosxppcu', 'infod', 'homc', 'ssb',
    'hospitalos', 'jhcis', 'kpstat', 'md', 'mkhospital', 'thiades',
    'himpro', 'nemo', 'mypcu', 'emrsoft', 'haos', 'other'];
const router = (fastify, {}, next) => {
    fastify.get('/alive', async (req, res) => {
        let result;
        try {
            result = await hisConnect.testConnect(global.dbHIS);
        }
        catch (error) {
        }
        try {
            if (!result || !result.connection) {
                result = await hisConnect.testConnect(global.dbHIS);
            }
            res.send({
                statusCode: result?.connection ? http_status_codes_1.StatusCodes.OK : http_status_codes_1.StatusCodes.NO_CONTENT,
                ok: result?.connection,
                version: global.appDetail.version,
                subVersion: global.appDetail.subVersion,
                apiStartTime: global.apiStartTime,
                hisProvider: process.env.HIS_PROVIDER,
                client: process.env.HIS_DB_CLIENT,
                connection: result?.connection,
                charset: result?.charset,
                hospname: result?.hospname
            });
        }
        catch (error) {
            console.log('alive fail', error.message);
            res.send({
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                hisProvider: process.env.HIS_PROVIDER,
                connection: false,
                message: error.message
            });
        }
    });
    fastify.post('/alive', { preHandler: [fastify.authenticate] }, async (req, res) => {
        try {
            const result = await hisConnect.getTableName(global.dbHIS);
            if (result && result.length) {
                res.send({
                    statusCode: http_status_codes_1.StatusCodes.OK,
                    ok: true,
                    version: global.appDetail.version,
                    subVersion: global.appDetail.subVersion,
                    hisProvider: process.env.HIS_PROVIDER,
                    connection: true
                });
            }
            else {
                res.send({
                    statusCode: http_status_codes_1.StatusCodes.NO_CONTENT,
                    ok: true,
                    hisProvider: process.env.HIS_PROVIDER,
                    connection: false,
                    message: result
                });
            }
        }
        catch (error) {
            console.log('alive fail', error.message);
            res.send({
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                status: 500,
                ok: false,
                hisProvider: provider,
                connection: false,
                message: error.message
            });
        }
    });
    fastify.post('/showTbl', { preHandler: [fastify.authenticate] }, async (req, res) => {
        try {
            const result = await hisConnect.getTableName(global.dbHIS);
            res.send({
                statusCode: http_status_codes_1.StatusCodes.OK,
                rows: result
            });
        }
        catch (error) {
            console.log('showTbl', error.message);
            res.send({
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                message: error.message
            });
        }
    });
    fastify.post('/person', { preHandler: [fastify.authenticate] }, async (req, res) => {
        let columnName = req.body.columnName;
        let searchText = req.body.searchText;
        if (columnName && searchText && ['hn', 'cid', 'pid', 'name', 'hid'].includes(columnName)) {
            try {
                const rows = await hisConnect.getPerson(global.dbHIS, columnName, searchText);
                res.send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
            }
            catch (error) {
                console.log('person', error.message);
                res.send({
                    statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            res.send({
                statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST)
            });
        }
    });
    fastify.post('/opd-service', { preHandler: [fastify.authenticate] }, async (req, res) => {
        let hn = req.body.hn;
        let date = req.body.date || null;
        let visitNo = req.body.visitNo || '';
        if (visitNo || hn || date) {
            try {
                let columnName = '';
                let searchText = '';
                if (visitNo) {
                    columnName = 'visitNo';
                    searchText = visitNo;
                }
                else if (hn) {
                    columnName = 'hn';
                    searchText = hn;
                }
                else {
                    columnName = 'date_serv';
                    searchText = date;
                }
                let rows = await hisConnect.getService(global.dbHIS, columnName, searchText, date);
                res.send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
            }
            catch (error) {
                console.log('opd-service', error.message);
                res.send({
                    statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            res.send({
                statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST)
            });
        }
    });
    fastify.post('/opd-service-by-vn', { preHandler: [fastify.authenticate] }, async (req, res) => {
        let visitNo = req.body.visitNo;
        let where = req.body.where;
        if (visitNo) {
            try {
                const rows = await hisConnect.getService(global.dbHIS, 'visitNo', visitNo);
                res.send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
            }
            catch (error) {
                console.log('opd-service-by-vn', error.message);
                res.send({
                    statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            res.send({
                statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST)
            });
        }
    });
    fastify.post('/opd-diagnosis', { preHandler: [fastify.authenticate] }, async (req, res) => {
        let visitNo = req.body.visitNo || req.body.vn;
        if (visitNo) {
            try {
                const result = await hisConnect.getDiagnosisOpd(global.dbHIS, visitNo);
                res.send({
                    statusCode: http_status_codes_1.StatusCodes.OK,
                    version: global.appDetail.version,
                    subVersion: global.appDetail.subVersion,
                    hisProvider: process.env.HIS_PROVIDER,
                    reccount: result.length,
                    rows: result
                });
            }
            catch (error) {
                console.log('opd-diagnosis', error.message);
                res.send({
                    statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            res.send({
                statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST)
            });
        }
    });
    fastify.post('/opd-diagnosis-vwxy', { preHandler: [fastify.authenticate] }, async (req, res) => {
        let date = req.body.date || (0, moment_1.default)().format('YYYY-MM-DD');
        try {
            const rows = await hisConnect.getDiagnosisOpdVWXY(global.dbHIS, date);
            res.send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('opd-diagnosis-vwxy', error.message);
            res.send({
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                message: error.message
            });
        }
    });
    fastify.post('/accident', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const visitNo = req.body.visitNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!visitNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hisConnect.getAccident(global.dbHIS, visitNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('accident', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    async function decodeToken(req) {
        let token = null;
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            token = req.headers.authorization.split(' ')[1];
        }
        else if (req.body && req.body.token) {
            token = req.body.token;
        }
        try {
            return await jwt.verify(token);
        }
        catch (error) {
            console.log('jwtVerify', error);
            return null;
        }
    }
    next();
};
module.exports = router;
