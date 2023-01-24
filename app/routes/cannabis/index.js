"use strict";
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
    fastify.get('/', async (req, reply) => {
        reply.send({
            api: 'Cannabis API Serivce',
            version: global.appDetail.version,
            subVersion: global.appDetail.subVersion,
            hisProvider
        });
    });
    fastify.get('/test/db', async (req, reply) => {
        try {
            const result = await cannabisModel.testConnection(fastify.dbCannabis);
            reply.send(result[0]);
        }
        catch (error) {
            reply.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
                error
            });
        }
    });
    fastify.post('/test-connection', async (req, reply) => {
        try {
            const result = await cannabisModel.testConnection(fastify.dbCannabis);
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
    });
    fastify.post('/api/search/person/cid', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const cid = req.body.cid;
        if (cid) {
            try {
                const rows = await cannabisModel.searchPatient(fastify.dbCannabis, cid);
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
    });
    fastify.post('/patient', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const cid = req.body.cid;
        if (cid) {
            try {
                const result = await cannabisModel.searchPatient(fastify.dbCannabis, cid);
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
    });
    fastify.post('/api/search/visit', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        const startDate = req.body.startDate;
        const endDate = req.body.endDate;
        if (hn) {
            try {
                const result = await cannabisModel.searchVisit(fastify.dbCannabis, hn, startDate, endDate);
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
    });
    fastify.post('/visit', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        const startDate = req.body.startDate;
        const endDate = req.body.endDate;
        if (hn) {
            try {
                const result = await cannabisModel.searchVisit(fastify.dbCannabis, hn, startDate, endDate);
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
    });
    fastify.post('/api/patient/info', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        if (hn) {
            try {
                const rows = await cannabisModel.patientInfo(fastify.dbCannabis, hn);
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
    });
    fastify.post('/patient-info', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        if (hn) {
            try {
                const result = await cannabisModel.patientInfo(fastify.dbCannabis, hn);
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
    });
    fastify.post('/api/visit/lab', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const data = await cannabisModel.getVisitLab(fastify.dbCannabis, hn, vn);
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
    });
    fastify.post('/lab', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const result = await cannabisModel.getVisitLab(fastify.dbCannabis, hn, vn);
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
    });
    fastify.post('/api/visit/drug', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const data = await cannabisModel.getVisitDrug(fastify.dbCannabis, hn, vn);
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
    });
    fastify.post('/drug', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const result = await cannabisModel.getVisitDrug(fastify.dbCannabis, hn, vn);
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
    });
    fastify.post('/api/visit/appointment', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const data = await cannabisModel.getVisitAppointment(fastify.dbCannabis, hn, vn);
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
    });
    fastify.post('/appointment', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const result = await cannabisModel.getVisitAppointment(fastify.dbCannabis, hn, vn);
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
    });
    fastify.post('/api/visit/diag-text', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const data = await cannabisModel.getVisitDiagText(fastify.dbCannabis, hn, vn);
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
    });
    fastify.post('/diag-text', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const result = await cannabisModel.getVisitDiagText(fastify.dbCannabis, hn, vn);
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
    });
    fastify.post('/api/visit/diagnosis', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const data = await cannabisModel.getVisitDiagnosis(fastify.dbCannabis, hn, vn);
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
    });
    fastify.post('/diagnosis', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const result = await cannabisModel.getVisitDiagnosis(fastify.dbCannabis, hn, vn);
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
    });
    fastify.post('/api/visit/procedures', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const data = await cannabisModel.getVisitProcedure(fastify.dbCannabis, hn, vn);
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
    });
    fastify.post('/procedure', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const result = await cannabisModel.getVisitProcedure(fastify.dbCannabis, hn, vn);
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
    });
    fastify.post('/api/visit/screening', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const result = await cannabisModel.getVisitScreening(fastify.dbCannabis, hn, vn);
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
    });
    fastify.post('/screening', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        const vn = req.body.vn || '';
        if (hn && vn) {
            try {
                const result = await cannabisModel.getVisitScreening(fastify.dbCannabis, hn, vn);
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
    });
    next();
};
module.exports = router;
