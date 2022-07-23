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
var http = require('http');
const cannabis_1 = require("../../models/cannabis/cannabis");
const pmk_1 = require("../../models/cannabis/pmk");
const hisProvider = process.env.HIS_PROVIDER;
let cannabisModel;
switch (hisProvider) {
    case 'pmk':
        cannabisModel = new pmk_1.PmkModel();
        break;
    default:
        cannabisModel = new cannabis_1.CannabisModel();
}
const router = (fastify, {}, next) => {
    fastify.get('/', { preHandler: [fastify.serviceMonitoring] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        reply.send({
            api: 'Cannabis API Serivce',
            version: fastify.apiVersion,
            subVersion: fastify.apiSubVersion,
            hisProvider
        });
    }));
    fastify.get('/test/db', { preHandler: [fastify.serviceMonitoring] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield cannabisModel.testConnection(fastify.dbCannabis);
            reply.send(result[0]);
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
                error
            });
        }
    }));
    fastify.post('/test-connection', { preHandler: [fastify.serviceMonitoring] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield cannabisModel.testConnection(fastify.dbCannabis);
            reply.send({
                statusCode: HttpStatus.OK,
                rows: result
            });
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message
            });
        }
    }));
    fastify.post('/api/search/person/cid', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const cid = req.body.cid;
        if (cid) {
            try {
                const rows = yield cannabisModel.searchPatient(fastify.dbCannabis, cid);
                reply.send(rows);
            }
            catch (error) {
                console.log('patient', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'not found parameter.'
            });
        }
    }));
    fastify.post('/patient', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const cid = req.body.cid;
        if (cid) {
            try {
                const result = yield cannabisModel.searchPatient(fastify.dbCannabis, cid);
                reply.send({
                    statusCode: HttpStatus.OK,
                    rows: result
                });
            }
            catch (error) {
                console.log('patient', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'not found parameter.'
            });
        }
    }));
    fastify.post('/api/search/visit', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        const startDate = req.body.startDate;
        const endDate = req.body.endDate;
        if (hn) {
            try {
                const result = yield cannabisModel.searchVisit(fastify.dbCannabis, hn, startDate, endDate);
                reply.send({
                    statusCode: HttpStatus.OK,
                    rows: result
                });
            }
            catch (error) {
                console.log('visit', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'parameter not found.'
            });
        }
    }));
    fastify.post('/visit', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        const startDate = req.body.startDate;
        const endDate = req.body.endDate;
        if (hn) {
            try {
                const result = yield cannabisModel.searchVisit(fastify.dbCannabis, hn, startDate, endDate);
                reply.send({
                    statusCode: HttpStatus.OK,
                    rows: result
                });
            }
            catch (error) {
                console.log('visit', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'parameter not found.'
            });
        }
    }));
    fastify.post('/api/patient/info', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        if (hn) {
            try {
                const rows = yield cannabisModel.patientInfo(fastify.dbCannabis, hn);
                reply.send(rows);
            }
            catch (error) {
                console.log('patient-info', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'parameter not found.'
            });
        }
    }));
    fastify.post('/patient-info', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        if (hn) {
            try {
                const result = yield cannabisModel.patientInfo(fastify.dbCannabis, hn);
                reply.send({
                    statusCode: HttpStatus.OK,
                    rows: result
                });
            }
            catch (error) {
                console.log('patient-info', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'parameter not found.'
            });
        }
    }));
    fastify.post('/api/visit/lab', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const data = yield cannabisModel.getVisitLab(fastify.dbCannabis, hn, vn);
                reply.send({
                    statusCode: HttpStatus.OK,
                    status: HttpStatus.OK,
                    data
                });
            }
            catch (error) {
                console.log('lab', error.message);
                reply.send({
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message,
                    error: error.message
                });
            }
        }
        else {
            reply.send({
                status: HttpStatus.BAD_REQUEST,
                statusCode: HttpStatus.BAD_REQUEST,
                error: 'parameter not found.',
                message: 'parameter not found.'
            });
        }
    }));
    fastify.post('/lab', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const result = yield cannabisModel.getVisitLab(fastify.dbCannabis, hn, vn);
                reply.send({
                    statusCode: HttpStatus.OK,
                    rows: result
                });
            }
            catch (error) {
                console.log('lab', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'parameter not found.'
            });
        }
    }));
    fastify.post('/api/visit/drug', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const data = yield cannabisModel.getVisitDrug(fastify.dbCannabis, hn, vn);
                reply.send({
                    status: HttpStatus.OK,
                    statusCode: HttpStatus.OK,
                    data
                });
            }
            catch (error) {
                console.log('getVisitDrug', error.message);
                reply.send({
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: error.message,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                status: HttpStatus.BAD_REQUEST,
                statusCode: HttpStatus.BAD_REQUEST,
                error: 'parameter not found.',
                message: 'parameter not found.'
            });
        }
    }));
    fastify.post('/drug', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const result = yield cannabisModel.getVisitDrug(fastify.dbCannabis, hn, vn);
                reply.send({
                    statusCode: HttpStatus.OK,
                    rows: result
                });
            }
            catch (error) {
                console.log('getVisitDrug', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'parameter not found.'
            });
        }
    }));
    fastify.post('/api/visit/appointment', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const data = yield cannabisModel.getVisitAppointment(fastify.dbCannabis, hn, vn);
                reply.send({
                    status: HttpStatus.OK,
                    data
                });
            }
            catch (error) {
                console.log('getVisitAppointment', error.message);
                reply.send({
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: error.message,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                status: HttpStatus.BAD_REQUEST,
                message: 'parameter not found.'
            });
        }
    }));
    fastify.post('/appointment', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const result = yield cannabisModel.getVisitAppointment(fastify.dbCannabis, hn, vn);
                reply.send({
                    statusCode: HttpStatus.OK,
                    rows: result
                });
            }
            catch (error) {
                console.log('getVisitAppointment', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'parameter not found.'
            });
        }
    }));
    fastify.post('/api/visit/diag-text', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const data = yield cannabisModel.getVisitDiagText(fastify.dbCannabis, hn, vn);
                reply.send({
                    status: HttpStatus.OK,
                    statusCode: HttpStatus.OK,
                    data
                });
            }
            catch (error) {
                console.log('diag-text', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'parameter not found.'
            });
        }
    }));
    fastify.post('/diag-text', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const result = yield cannabisModel.getVisitDiagText(fastify.dbCannabis, hn, vn);
                reply.send({
                    statusCode: HttpStatus.OK,
                    rows: result
                });
            }
            catch (error) {
                console.log('diag-text', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'parameter not found.'
            });
        }
    }));
    fastify.post('/api/visit/diagnosis', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const data = yield cannabisModel.getVisitDiagnosis(fastify.dbCannabis, hn, vn);
                reply.send({
                    statusCode: HttpStatus.OK,
                    status: HttpStatus.OK,
                    data
                });
            }
            catch (error) {
                console.log('diagnosis', error.message);
                reply.send({
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                status: HttpStatus.BAD_REQUEST,
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'parameter not found.'
            });
        }
    }));
    fastify.post('/diagnosis', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const result = yield cannabisModel.getVisitDiagnosis(fastify.dbCannabis, hn, vn);
                reply.send({
                    statusCode: HttpStatus.OK,
                    rows: result
                });
            }
            catch (error) {
                console.log('diagnosis', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'parameter not found.'
            });
        }
    }));
    fastify.post('/api/visit/procedures', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const data = yield cannabisModel.getVisitProcedure(fastify.dbCannabis, hn, vn);
                reply.send({
                    status: HttpStatus.OK,
                    statusCode: HttpStatus.OK,
                    data
                });
            }
            catch (error) {
                console.log('procedure', error.message);
                reply.send({
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                status: HttpStatus.BAD_REQUEST,
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'parameter not found.'
            });
        }
    }));
    fastify.post('/procedure', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const result = yield cannabisModel.getVisitProcedure(fastify.dbCannabis, hn, vn);
                reply.send({
                    statusCode: HttpStatus.OK,
                    rows: result
                });
            }
            catch (error) {
                console.log('procedure', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'parameter not found.'
            });
        }
    }));
    fastify.post('/api/visit/screening', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const result = yield cannabisModel.getVisitScreening(fastify.dbCannabis, hn, vn);
                reply.send(result);
            }
            catch (error) {
                console.log('screening', error.message);
                reply.send({
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                status: HttpStatus.BAD_REQUEST,
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'parameter not found.'
            });
        }
    }));
    fastify.post('/screening', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const result = yield cannabisModel.getVisitScreening(fastify.dbCannabis, hn, vn);
                reply.send({
                    statusCode: HttpStatus.OK,
                    rows: result
                });
            }
            catch (error) {
                console.log('screening', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'parameter not found.'
            });
        }
    }));
    next();
};
module.exports = router;
