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
var crypto = require('crypto');
const his_jhcis_model_1 = require("../../models/pcc/his_jhcis.model");
const his_ezhosp_model_1 = require("../../models/pcc/his_ezhosp.model");
const his_thiades_1 = require("../../models/refer/his_thiades");
const his_hosxpv3_1 = require("../../models/refer/his_hosxpv3");
const his_hosxpv4_1 = require("../../models/refer/his_hosxpv4");
const his_md_1 = require("../../models/refer/his_md");
const his_kpstat_1 = require("../../models/refer/his_kpstat");
const his_mkhospital_1 = require("../../models/refer/his_mkhospital");
const his_1 = require("../../models/refer/his");
const his_nemo_1 = require("../../models/refer/his_nemo");
const hisProvider = process.env.HIS_PROVIDER;
var pccHisModel;
var hisModel;
switch (hisProvider) {
    case 'ezhosp':
        pccHisModel = new his_ezhosp_model_1.PccHisEzhospModel();
        break;
    case 'thiades':
        hisModel = new his_thiades_1.HisThiadesModel();
        break;
    case 'hosxpv3':
        hisModel = new his_hosxpv3_1.HisHosxpv3Model();
        break;
    case 'hosxpv4':
        hisModel = new his_hosxpv4_1.HisHosxpv4Model();
        break;
    case 'mkhospital':
        hisModel = new his_mkhospital_1.HisMkhospitalModel();
        break;
    case 'nemo':
    case 'nemo_refer':
        hisModel = new his_nemo_1.HisNemoModel();
        break;
    case 'ssb':
        break;
    case 'infod':
        break;
    case 'hi':
        break;
    case 'himpro':
        break;
    case 'jhcis':
        pccHisModel = new his_jhcis_model_1.PccHisJhcisModel();
        break;
    case 'hosxppcu':
        break;
    case 'hospitalos':
        break;
    case 'jhos':
        break;
    case 'pmk':
        break;
    case 'md':
        hisModel = new his_md_1.HisMdModel();
        break;
    case 'spdc':
    case 'kpstat':
        hisModel = new his_kpstat_1.HisKpstatModel();
        break;
    default:
        hisModel = new his_1.HisModel();
}
const router = (fastify, {}, next) => {
    fastify.post('/check-requestkey', { preHandler: [fastify.serviceMonitoring] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
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
    }));
    fastify.post('/person', { preHandler: [fastify.serviceMonitoring, fastify.checkRequestKey] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hospcode = req.body.hospcode;
        const searchType = req.body.searchType;
        const searchValue = req.body.searchValue;
        if (searchType && searchValue) {
            try {
                const result = yield pccHisModel.getPerson(fastify.dbHIS, searchType, searchValue);
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
    }));
    fastify.post('/person-by-name', { preHandler: [fastify.serviceMonitoring, fastify.checkRequestKey] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hospcode = req.body.hospcode;
        const fname = req.body.fname;
        const lname = req.body.lname;
        if (fname + lname) {
            try {
                const result = yield pccHisModel.getPersonByName(fastify.dbHIS, fname, lname);
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
    }));
    fastify.post('/person-chronic', { preHandler: [fastify.serviceMonitoring, fastify.checkRequestKey] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hospcode = req.body.hospcode;
        const cid = req.body.cid;
        const pid = req.body.pid;
        if (cid || pid) {
            try {
                const result = yield pccHisModel.getChronic(fastify.dbHIS, pid, cid);
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
    }));
    fastify.post('/drug-allergy', { preHandler: [fastify.serviceMonitoring, fastify.checkRequestKey] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hospcode = req.body.hospcode;
        const pid = req.body.pid;
        const cid = req.body.cid;
        if (pid || cid) {
            try {
                const result = yield pccHisModel.getDrugAllergy(fastify.dbHIS, pid, cid);
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
    }));
    fastify.post('/visit', { preHandler: [fastify.serviceMonitoring, fastify.checkRequestKey] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hospcode = req.body.hospcode;
        const hn = req.body.hn;
        const cid = req.body.cid;
        const visitNo = req.body.visitNo;
        const date = req.body.date;
        if (hn + cid) {
            try {
                const rows = yield pccHisModel.getServiceByHn(fastify.dbHIS, hn, cid, date, visitNo);
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
    }));
    fastify.post('/diagnosis', { preHandler: [fastify.serviceMonitoring, fastify.checkRequestKey] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const visitNo = req.body.visitNo;
        if (visitNo) {
            try {
                const result = yield pccHisModel.getDiagnosis(fastify.dbHIS, visitNo);
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
    }));
    fastify.post('/diagnosis-by-hn', { preHandler: [fastify.serviceMonitoring, fastify.checkRequestKey] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn;
        if (hn) {
            try {
                const result = yield pccHisModel.getDiagnosisByHn(fastify.dbHIS, hn);
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
    }));
    fastify.post('/drug', { preHandler: [fastify.serviceMonitoring, fastify.checkRequestKey] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const visitNo = req.body.visitNo;
        if (visitNo) {
            try {
                const result = yield pccHisModel.getDrug(fastify.dbHIS, visitNo);
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
    }));
    fastify.post('/drug-by-hn', { preHandler: [fastify.serviceMonitoring, fastify.checkRequestKey] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn;
        if (hn) {
            try {
                const result = yield pccHisModel.getDrugByHn(fastify.dbHIS, hn);
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
    }));
    fastify.post('/anc', { preHandler: [fastify.serviceMonitoring, fastify.checkRequestKey] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const visitNo = req.body.visitNo;
        if (visitNo) {
            try {
                const result = yield pccHisModel.getAnc(fastify.dbHIS, visitNo);
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
    }));
    fastify.post('/anc-by-hn', { preHandler: [fastify.serviceMonitoring, fastify.checkRequestKey] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn;
        if (hn) {
            try {
                const result = yield pccHisModel.getAncByHn(fastify.dbHIS, hn);
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
    }));
    fastify.post('/epi', { preHandler: [fastify.serviceMonitoring, fastify.checkRequestKey] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const visitNo = req.body.visitNo;
        if (visitNo) {
            try {
                const result = yield pccHisModel.getEpi(fastify.dbHIS, visitNo);
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
    }));
    fastify.post('/epi-by-hn', { preHandler: [fastify.serviceMonitoring, fastify.checkRequestKey] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn;
        if (hn) {
            try {
                const result = yield pccHisModel.getEpiByHn(fastify.dbHIS, hn);
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
    }));
    fastify.post('/fp', { preHandler: [fastify.serviceMonitoring, fastify.checkRequestKey] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const visitNo = req.body.visitNo;
        if (visitNo) {
            try {
                const result = yield pccHisModel.getFp(fastify.dbHIS, visitNo);
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
    }));
    fastify.post('/fp-by-hn', { preHandler: [fastify.serviceMonitoring, fastify.checkRequestKey] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn;
        if (hn) {
            try {
                const result = yield pccHisModel.getFpByHn(fastify.dbHIS, hn);
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
    }));
    fastify.post('/nutrition', { preHandler: [fastify.serviceMonitoring, fastify.checkRequestKey] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const visitNo = req.body.visitNo;
        if (visitNo) {
            try {
                const result = yield pccHisModel.getNutrition(fastify.dbHIS, visitNo);
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
    }));
    fastify.post('/nutrition-by-hn', { preHandler: [fastify.serviceMonitoring, fastify.checkRequestKey] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn;
        if (hn) {
            try {
                const result = yield pccHisModel.getNutritionByHn(fastify.dbHIS, hn);
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
    }));
    fastify.post('/lab-result', { preHandler: [fastify.serviceMonitoring, fastify.checkRequestKey] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const searchType = req.body.searchType || 'visitno';
        const searchValue = req.body.searchValue;
        if (searchType && searchValue) {
            try {
                const result = yield pccHisModel.getLabResult(fastify.dbHIS, searchType, searchValue);
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
    }));
    fastify.post('/lib-drug', { preHandler: [fastify.serviceMonitoring, fastify.checkRequestKey] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const searchType = req.body.searchType;
        const searchValue = req.body.searchValue;
        if (searchType && searchValue) {
            try {
                const result = yield pccHisModel.libDrug(fastify.dbHIS, searchType, searchValue);
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
    }));
    next();
};
module.exports = router;
