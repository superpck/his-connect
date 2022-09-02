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
const moment = require("moment");
const request = require('request');
var crypto = require('crypto');
const his_ezhosp_1 = require("../../models/refer/his_ezhosp");
const his_thiades_1 = require("../../models/refer/his_thiades");
const his_hosxpv3_1 = require("../../models/refer/his_hosxpv3");
const his_hosxpv4_1 = require("../../models/refer/his_hosxpv4");
const his_jhcis_1 = require("../../models/refer/his_jhcis");
const his_md_1 = require("../../models/refer/his_md");
const his_kpstat_1 = require("../../models/refer/his_kpstat");
const his_mkhospital_1 = require("../../models/refer/his_mkhospital");
const his_1 = require("../../models/refer/his");
const his_nemo_1 = require("../../models/refer/his_nemo");
const his_pmk_1 = require("../../models/refer/his_pmk");
const his_hosxppcu_model_1 = require("../../models/isonline/his_hosxppcu.model");
const his_mypcu_1 = require("../../models/refer/his_mypcu");
const hisProvider = process.env.HIS_PROVIDER;
let hisModel;
switch (hisProvider) {
    case 'ezhosp':
        hisModel = new his_ezhosp_1.HisEzhospModel();
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
    case 'hosxppcu':
        hisModel = new his_hosxppcu_model_1.HisHosxppcuModel();
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
        hisModel = new his_jhcis_1.HisJhcisModel();
        break;
    case 'mypcu':
        hisModel = new his_mypcu_1.HisMyPcuModel();
        break;
    case 'hospitalos':
        break;
    case 'jhos':
        break;
    case 'pmk':
        hisModel = new his_pmk_1.HisPmkModel();
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
    fastify.get('/', (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        reply.send({
            apiCode: 'nRefer',
            api: 'refer V.3',
            version: fastify.appVersion.version,
            subversion: fastify.appVersion.subVersion
        });
    }));
    fastify.get('/alive/:requestKey', (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const requestKey = req.params.requestKey;
        var hashRequestKey = crypto.createHash('md5').update(process.env.REQUEST_KEY).digest('hex');
        const requestKeyVerified = requestKey === hashRequestKey;
        try {
            const result = yield hisModel.getTableName(fastify.dbHIS);
            if (result && result.length) {
                reply.status(HttpStatus.OK).send({
                    statusCode: HttpStatus.OK,
                    hisProvider: hisProvider, connection: true,
                    RequestKey: requestKeyVerified,
                });
            }
            else {
                reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.SERVICE_UNAVAILABLE, message: HttpStatus.getStatusText(HttpStatus.SERVICE_UNAVAILABLE), RequestKey: requestKeyVerified });
            }
        }
        catch (error) {
            console.log('alive', error.message);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message, RequestKey: requestKeyVerified });
        }
    }));
    fastify.get('/tbl/:requestKey', (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const requestKey = req.params.requestKey;
        var hashRequestKey = crypto.createHash('md5').update(process.env.REQUEST_KEY).digest('hex');
        if (requestKey !== hashRequestKey) {
            reply.status(HttpStatus.UNAUTHORIZED).send({ statusCode: HttpStatus.UNAUTHORIZED, message: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED) });
            return false;
        }
        try {
            const result = yield hisModel.getTableName(fastify.dbHIS);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, tblCount: result.length });
        }
        catch (error) {
            console.log('tbl', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) });
        }
    }));
    fastify.post('/referout', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const now = moment().locale('th').format('YYYY-MM-DD');
        const date = req.body.date || now;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        try {
            const result = yield hisModel.getReferOut(fastify.dbHIS, date, hospcode);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows: result });
        }
        catch (error) {
            console.log('referout', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
        }
    }));
    fastify.post('/person', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        const cid = req.body.cid || '';
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!hn && !cid) {
            reply.status(HttpStatus.BAD_REQUEST).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) });
            return;
        }
        try {
            const now = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
            let typeSearch = 'hn';
            let textSearch = hn;
            if (cid) {
                typeSearch = 'cid';
                textSearch = cid;
            }
            const result = yield hisModel.getPerson(fastify.dbHIS, typeSearch, textSearch, hospcode);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows: result });
        }
        catch (error) {
            console.log('person', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) });
        }
    }));
    fastify.post('/address', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!hn) {
            reply.status(HttpStatus.BAD_REQUEST).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) });
            return;
        }
        try {
            let typeSearch = 'hn';
            let textSearch = hn;
            const result = yield hisModel.getAddress(fastify.dbHIS, typeSearch, textSearch, hospcode);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows: result });
        }
        catch (error) {
            console.log('address', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) });
        }
    }));
    fastify.post('/drugallergy', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!hn) {
            reply.send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) });
            return;
        }
        try {
            const result = yield hisModel.getDrugAllergy(fastify.dbHIS, hn, hospcode);
            reply.send({ statusCode: HttpStatus.OK, rows: result });
        }
        catch (error) {
            console.log('drug allergy', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) });
        }
    }));
    fastify.post('/service', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hn = req.body.hn || '';
        const visitNo = req.body.visitNo || '';
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!hn && !visitNo) {
            reply.status(HttpStatus.BAD_REQUEST).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) });
            return;
        }
        try {
            let typeSearch = 'hn';
            let textSearch = hn;
            if (visitNo) {
                typeSearch = 'visitNo';
                textSearch = visitNo;
            }
            const result = yield hisModel.getService(fastify.dbHIS, typeSearch, textSearch, hospcode);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows: result });
        }
        catch (error) {
            console.log('service', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
        }
    }));
    fastify.post('/admission', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const typeSearch = req.body.typeSearch;
        const textSearch = req.body.textSearch;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!typeSearch && !textSearch) {
            reply.status(HttpStatus.BAD_REQUEST).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) });
            return;
        }
        else {
            try {
                const result = yield hisModel.getAdmission(fastify.dbHIS, typeSearch, textSearch, hospcode);
                reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows: result });
            }
            catch (error) {
                console.log('admission', error.message);
                reply.send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
            }
        }
    }));
    fastify.post('/diagnosis-opd', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const visitNo = req.body.visitNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!visitNo) {
            reply.status(HttpStatus.BAD_REQUEST).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) });
            return;
        }
        try {
            const result = yield hisModel.getDiagnosisOpd(fastify.dbHIS, visitNo, hospcode);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows: result });
        }
        catch (error) {
            console.log('diagnosis_opd', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
        }
    }));
    fastify.post('/diagnosis-ipd', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const an = req.body.an;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!an) {
            reply.status(HttpStatus.BAD_REQUEST).send({ statusCode: HttpStatus.BAD_REQUEST, message: 'not found AN ' });
            return;
        }
        else {
            try {
                const result = yield hisModel.getDiagnosisIpd(fastify.dbHIS, 'an', an, hospcode);
                reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows: result });
            }
            catch (error) {
                console.log('diagnosis_ipd', error.message);
                reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) });
            }
        }
    }));
    fastify.post('/procedure-opd', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const visitNo = req.body.visitNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!visitNo) {
            reply.status(HttpStatus.BAD_REQUEST).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) });
            return;
        }
        try {
            const rows = yield hisModel.getProcedureOpd(fastify.dbHIS, visitNo, hospcode);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows });
        }
        catch (error) {
            console.log('procudure_opd', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
        }
    }));
    fastify.post('/procedure-ipd', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const an = req.body.an;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!an) {
            reply.status(HttpStatus.BAD_REQUEST).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) });
            return;
        }
        try {
            const rows = yield hisModel.getProcedureIpd(fastify.dbHIS, an, hospcode);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows });
        }
        catch (error) {
            console.log('procudure_opd', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
        }
    }));
    fastify.post('/drug-opd', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const visitNo = req.body.visitNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!visitNo) {
            reply.status(HttpStatus.BAD_REQUEST).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) });
            return;
        }
        try {
            const rows = yield hisModel.getDrugOpd(fastify.dbHIS, visitNo, hospcode);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows });
        }
        catch (error) {
            console.log('drug_opd', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
        }
    }));
    fastify.post('/drug-ipd', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const an = req.body.an;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!an) {
            reply.status(HttpStatus.BAD_REQUEST).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) });
            return;
        }
        try {
            const rows = yield hisModel.getDrugIpd(fastify.dbHIS, an, hospcode);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows });
        }
        catch (error) {
            console.log('drug_ipd', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
        }
    }));
    fastify.post('/charge-opd', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const visitNo = req.body.visitNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!visitNo) {
            reply.status(HttpStatus.BAD_REQUEST).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) });
            return;
        }
        try {
            const rows = yield hisModel.getChargeOpd(fastify.dbHIS, visitNo, hospcode);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows });
        }
        catch (error) {
            console.log('charge_opd', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
        }
    }));
    fastify.post('/charge-ipd', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const an = req.body.an;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!an) {
            reply.status(HttpStatus.BAD_REQUEST).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) });
            return;
        }
        try {
            const rows = yield hisModel.getChargeIpd(fastify.dbHIS, an, hospcode);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows });
        }
        catch (error) {
            console.log('charge_ipd', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
        }
    }));
    fastify.post('/accident', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const visitNo = req.body.visitNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!visitNo) {
            reply.status(HttpStatus.BAD_REQUEST).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) });
            return;
        }
        try {
            const rows = yield hisModel.getAccident(fastify.dbHIS, visitNo, hospcode);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows });
        }
        catch (error) {
            console.log('accident', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
        }
    }));
    fastify.post('/appointment', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const visitNo = req.body.visitNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!visitNo) {
            reply.status(HttpStatus.BAD_REQUEST).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) });
            return;
        }
        try {
            const rows = yield hisModel.getAppointment(fastify.dbHIS, visitNo, hospcode);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows });
        }
        catch (error) {
            console.log('appointment', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
        }
    }));
    fastify.post('/refer-history', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const visitNo = req.body.visitNo;
        const referNo = req.body.referNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!visitNo && !referNo) {
            reply.status(HttpStatus.BAD_REQUEST).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) });
            return;
        }
        try {
            let typeSearch = 'referNo';
            let textSearch = referNo;
            if (visitNo) {
                typeSearch = 'visitNo';
                textSearch = visitNo;
            }
            const rows = yield hisModel.getReferHistory(fastify.dbHIS, typeSearch, textSearch, hospcode);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows });
        }
        catch (error) {
            console.log('refer_history', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
        }
    }));
    fastify.post('/clinical-refer', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const referNo = req.body.referNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!referNo) {
            reply.status(HttpStatus.BAD_REQUEST).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) });
            return;
        }
        try {
            const rows = yield hisModel.getClinicalRefer(fastify.dbHIS, referNo, hospcode);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows });
        }
        catch (error) {
            console.log('clinical_refer', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
        }
    }));
    fastify.post('/investigation-refer', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const referNo = req.body.referNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!referNo) {
            reply.status(HttpStatus.BAD_REQUEST).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) });
            return;
        }
        try {
            const rows = yield hisModel.getInvestigationRefer(fastify.dbHIS, referNo, hospcode);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows });
        }
        catch (error) {
            console.log('investigation_refer', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
        }
    }));
    fastify.post('/care-refer', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const referNo = req.body.referNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!referNo) {
            reply.status(HttpStatus.BAD_REQUEST).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) });
            return;
        }
        try {
            const rows = yield hisModel.getCareRefer(fastify.dbHIS, referNo, hospcode);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows });
        }
        catch (error) {
            console.log('care_refer', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
        }
    }));
    fastify.post('/refer-result', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const hospDestination = req.body.hospDestination;
        const referNo = req.body.referNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!referNo && !hospDestination) {
            reply.status(HttpStatus.BAD_REQUEST).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) });
            return;
        }
        try {
            const rows = yield hisModel.getReferResult(fastify.dbHIS, hospDestination, referNo, hospcode);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows });
        }
        catch (error) {
            console.log('refer_result', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
        }
    }));
    fastify.post('/provider', { preHandler: [fastify.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const licenseNo = req.body.licenseNo;
        const cid = req.body.cid;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!licenseNo && !cid) {
            reply.status(HttpStatus.BAD_REQUEST).send({ statusCode: HttpStatus.BAD_REQUEST, message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) });
            return;
        }
        let typeSearch = 'cid';
        let textSearch = cid;
        if (licenseNo) {
            typeSearch = 'licenseNo';
            textSearch = licenseNo;
        }
        try {
            const rows = yield hisModel.getProvider(fastify.dbHIS, typeSearch, textSearch, hospcode);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, rows });
        }
        catch (error) {
            console.log('provider', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
        }
    }));
    next();
};
module.exports = router;
