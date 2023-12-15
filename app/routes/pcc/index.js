"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const HttpStatus = require("http-status-codes");
var crypto = require('crypto');
const hismodel_1 = require("./../his/hismodel");
const router = (fastify, {}, next) => {
    fastify.post('/check-requestkey', async (req, reply) => {
        let requestKey = req.body.requestKey || '??';
        const isEncode = req.body.md5;
        if (isEncode == 0) {
            requestKey = crypto.createHash('md5').update(requestKey).digest('hex');
        }
        const defaultKey = crypto.createHash('md5').update(process.env.REQUEST_KEY).digest('hex');
        if (requestKey !== defaultKey) {
            console.log('invalid key', requestKey);
            reply.send({
                statusCode: HttpStatus.UNAUTHORIZED,
                message: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED) + ' or invalid key'
            });
        }
        reply.status(HttpStatus.OK).send({
            statusCode: HttpStatus.OK,
            skey: requestKey
        });
    });
    fastify.post('/person', { preHandler: [fastify.checkRequestKey] }, async (req, reply) => {
        const hospcode = req.body.hospcode;
        const searchType = req.body.searchType;
        const searchValue = req.body.searchValue;
        if (searchType && searchValue) {
            try {
                const result = await hismodel_1.default.getPerson(global.dbHIS, searchType, searchValue);
                reply.status(HttpStatus.OK).send({
                    statusCode: HttpStatus.OK,
                    rows: result
                });
            }
            catch (error) {
                console.log('person', searchValue, error.message);
                reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.status(HttpStatus.BAD_REQUEST).send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    });
    fastify.post('/person-by-name', { preHandler: [fastify.checkRequestKey] }, async (req, reply) => {
        const hospcode = req.body.hospcode;
        const fname = req.body.fname;
        const lname = req.body.lname;
        if (fname + lname) {
            try {
                const result = await hismodel_1.default.getPersonByName(global.dbHIS, fname, lname);
                reply.status(HttpStatus.OK).send({
                    statusCode: HttpStatus.OK,
                    rows: result
                });
            }
            catch (error) {
                console.log('person', fname, lname, error.message);
                reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.status(HttpStatus.BAD_REQUEST).send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    });
    fastify.post('/person-chronic', { preHandler: [fastify.checkRequestKey] }, async (req, reply) => {
        const hospcode = req.body.hospcode;
        const cid = req.body.cid;
        const pid = req.body.pid;
        if (cid || pid) {
            try {
                const result = await hismodel_1.default.getChronic(global.dbHIS, pid, cid);
                if (result) {
                    reply.status(HttpStatus.OK).send({
                        statusCode: HttpStatus.OK,
                        rows: result
                    });
                }
                else {
                    reply.send({
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: 'record not found'
                    });
                }
            }
            catch (error) {
                console.log('person-chronic', cid, pid, error.message);
                reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.status(HttpStatus.BAD_REQUEST).send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    });
    fastify.post('/drug-allergy', { preHandler: [fastify.checkRequestKey] }, async (req, reply) => {
        const hospcode = req.body.hospcode;
        const pid = req.body.pid;
        const cid = req.body.cid;
        if (pid || cid) {
            try {
                const result = await hismodel_1.default.getDrugAllergy(global.dbHIS, pid, cid);
                if (result) {
                    reply.status(HttpStatus.OK).send({
                        statusCode: HttpStatus.OK,
                        rows: result
                    });
                }
                else {
                    reply.status(HttpStatus.BAD_REQUEST).send({
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
                    });
                }
            }
            catch (error) {
                console.log('drug-allergy', cid, pid, error.message);
                reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.status(HttpStatus.BAD_REQUEST).send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    });
    fastify.post('/visit', { preHandler: [fastify.checkRequestKey] }, async (req, reply) => {
        const hospcode = req.body.hospcode;
        const hn = req.body.hn;
        const cid = req.body.cid;
        const visitNo = req.body.visitNo;
        const date = req.body.date;
        if (hn + cid) {
            try {
                const rows = await hismodel_1.default.getServiceByHn(global.dbHIS, hn, cid, date, visitNo);
                reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows });
            }
            catch (error) {
                console.log(error.message);
                reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.status(HttpStatus.BAD_REQUEST).send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    });
    fastify.post('/diagnosis', { preHandler: [fastify.checkRequestKey] }, async (req, reply) => {
        const visitNo = req.body.visitNo;
        if (visitNo) {
            try {
                const result = await hismodel_1.default.getDiagnosis(global.dbHIS, visitNo);
                if (result) {
                    reply.status(HttpStatus.OK).send({
                        statusCode: HttpStatus.OK,
                        rows: result
                    });
                }
                else {
                    reply.status(HttpStatus.BAD_REQUEST).send({
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: 'record not found'
                    });
                }
            }
            catch (error) {
                console.log('opd-diagnosis', error.message);
                reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.status(HttpStatus.BAD_REQUEST).send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    });
    fastify.post('/diagnosis-by-hn', { preHandler: [fastify.checkRequestKey] }, async (req, reply) => {
        const hn = req.body.hn;
        if (hn) {
            try {
                const result = await hismodel_1.default.getDiagnosisByHn(global.dbHIS, hn);
                if (result) {
                    reply.status(HttpStatus.OK).send({
                        statusCode: HttpStatus.OK,
                        rows: result
                    });
                }
                else {
                    reply.send({
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: 'record not found'
                    });
                }
            }
            catch (error) {
                console.log('opd-diagnosis-by-hn', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    });
    fastify.post('/drug', { preHandler: [fastify.checkRequestKey] }, async (req, reply) => {
        const visitNo = req.body.visitNo;
        if (visitNo) {
            try {
                const result = await hismodel_1.default.getDrug(global.dbHIS, visitNo);
                if (result) {
                    reply.status(HttpStatus.OK).send({
                        statusCode: HttpStatus.OK,
                        rows: result
                    });
                }
                else {
                    reply.status(HttpStatus.BAD_REQUEST).send({
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: 'record not found'
                    });
                }
            }
            catch (error) {
                console.log('drug', error.message);
                reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.status(HttpStatus.BAD_REQUEST).send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    });
    fastify.post('/drug-by-hn', { preHandler: [fastify.checkRequestKey] }, async (req, reply) => {
        const hn = req.body.hn;
        if (hn) {
            try {
                const result = await hismodel_1.default.getDrugByHn(global.dbHIS, hn);
                if (result) {
                    reply.status(HttpStatus.OK).send({
                        statusCode: HttpStatus.OK,
                        rows: result
                    });
                }
                else {
                    reply.send({
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: 'record not found'
                    });
                }
            }
            catch (error) {
                console.log('drug-by-hn', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    });
    fastify.post('/anc', { preHandler: [fastify.checkRequestKey] }, async (req, reply) => {
        const visitNo = req.body.visitNo;
        if (visitNo) {
            try {
                const result = await hismodel_1.default.getAnc(global.dbHIS, visitNo);
                if (result) {
                    reply.status(HttpStatus.OK).send({
                        statusCode: HttpStatus.OK,
                        rows: result
                    });
                }
                else {
                    reply.status(HttpStatus.BAD_REQUEST).send({
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: 'record not found'
                    });
                }
            }
            catch (error) {
                console.log('anc', error.message);
                reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.status(HttpStatus.BAD_REQUEST).send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    });
    fastify.post('/anc-by-hn', { preHandler: [fastify.checkRequestKey] }, async (req, reply) => {
        const hn = req.body.hn;
        if (hn) {
            try {
                const result = await hismodel_1.default.getAncByHn(global.dbHIS, hn);
                if (result) {
                    reply.status(HttpStatus.OK).send({
                        statusCode: HttpStatus.OK,
                        rows: result
                    });
                }
                else {
                    reply.send({
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: 'record not found'
                    });
                }
            }
            catch (error) {
                console.log('anc-by-hn', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    });
    fastify.post('/epi', { preHandler: [fastify.checkRequestKey] }, async (req, reply) => {
        const visitNo = req.body.visitNo;
        if (visitNo) {
            try {
                const result = await hismodel_1.default.getEpi(global.dbHIS, visitNo);
                if (result) {
                    reply.status(HttpStatus.OK).send({
                        statusCode: HttpStatus.OK,
                        rows: result
                    });
                }
                else {
                    reply.status(HttpStatus.BAD_REQUEST).send({
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: 'record not found'
                    });
                }
            }
            catch (error) {
                console.log('epi', error.message);
                reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.status(HttpStatus.BAD_REQUEST).send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    });
    fastify.post('/epi-by-hn', { preHandler: [fastify.checkRequestKey] }, async (req, reply) => {
        const hn = req.body.hn;
        if (hn) {
            try {
                const result = await hismodel_1.default.getEpiByHn(global.dbHIS, hn);
                if (result) {
                    reply.status(HttpStatus.OK).send({
                        statusCode: HttpStatus.OK,
                        rows: result
                    });
                }
                else {
                    reply.send({
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: 'record not found'
                    });
                }
            }
            catch (error) {
                console.log(process.env.HOSPCODE, 'epi-by-hn', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    });
    fastify.post('/fp', { preHandler: [fastify.checkRequestKey] }, async (req, reply) => {
        const visitNo = req.body.visitNo;
        if (visitNo) {
            try {
                const result = await hismodel_1.default.getFp(global.dbHIS, visitNo);
                if (result) {
                    reply.status(HttpStatus.OK).send({
                        statusCode: HttpStatus.OK,
                        rows: result
                    });
                }
                else {
                    reply.status(HttpStatus.BAD_REQUEST).send({
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: 'record not found'
                    });
                }
            }
            catch (error) {
                console.log('fp', error.message);
                reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.status(HttpStatus.BAD_REQUEST).send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    });
    fastify.post('/fp-by-hn', { preHandler: [fastify.checkRequestKey] }, async (req, reply) => {
        const hn = req.body.hn;
        if (hn) {
            try {
                const result = await hismodel_1.default.getFpByHn(global.dbHIS, hn);
                if (result) {
                    reply.status(HttpStatus.OK).send({
                        statusCode: HttpStatus.OK,
                        rows: result
                    });
                }
                else {
                    reply.send({
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: 'record not found'
                    });
                }
            }
            catch (error) {
                console.log('fp-by-hn', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    });
    fastify.post('/nutrition', { preHandler: [fastify.checkRequestKey] }, async (req, reply) => {
        const visitNo = req.body.visitNo;
        if (visitNo) {
            try {
                const result = await hismodel_1.default.getNutrition(global.dbHIS, visitNo);
                if (result) {
                    reply.status(HttpStatus.OK).send({
                        statusCode: HttpStatus.OK,
                        rows: result
                    });
                }
                else {
                    reply.status(HttpStatus.BAD_REQUEST).send({
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: 'record not found'
                    });
                }
            }
            catch (error) {
                console.log('nutrition', error.message);
                reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.status(HttpStatus.BAD_REQUEST).send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    });
    fastify.post('/nutrition-by-hn', { preHandler: [fastify.checkRequestKey] }, async (req, reply) => {
        const hn = req.body.hn;
        if (hn) {
            try {
                const result = await hismodel_1.default.getNutritionByHn(global.dbHIS, hn);
                if (result) {
                    reply.status(HttpStatus.OK).send({
                        statusCode: HttpStatus.OK,
                        rows: result
                    });
                }
                else {
                    reply.send({
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: 'record not found'
                    });
                }
            }
            catch (error) {
                console.log('nutrition-by-hn', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    });
    fastify.post('/lab-result', { preHandler: [fastify.checkRequestKey] }, async (req, reply) => {
        const searchType = req.body.searchType || 'visitno';
        const searchValue = req.body.searchValue;
        if (searchType && searchValue) {
            try {
                const result = await hismodel_1.default.getLabResult(global.dbHIS, searchType, searchValue);
                if (result) {
                    reply.status(HttpStatus.OK).send({
                        statusCode: HttpStatus.OK,
                        rows: result
                    });
                }
                else {
                    reply.send({
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: 'record not found'
                    });
                }
            }
            catch (error) {
                console.log('lab-result', error.message);
                reply.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'Invalid parameter'
            });
        }
    });
    fastify.post('/lib-drug', { preHandler: [fastify.checkRequestKey] }, async (req, reply) => {
        const searchType = req.body.searchType;
        const searchValue = req.body.searchValue;
        if (searchType && searchValue) {
            try {
                const result = await hismodel_1.default.libDrug(global.dbHIS, searchType, searchValue);
                if (result) {
                    reply.status(HttpStatus.OK).send({
                        statusCode: HttpStatus.OK,
                        rows: result
                    });
                }
                else {
                    reply.status(HttpStatus.BAD_REQUEST).send({
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: 'record not found'
                    });
                }
            }
            catch (error) {
                console.log('drug', error.message);
                reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            reply.status(HttpStatus.BAD_REQUEST).send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    });
    next();
};
module.exports = router;
