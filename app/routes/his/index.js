"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const moment = require("moment");
const hismodel_1 = require("./hismodel");
const hisProvider = process.env.HIS_PROVIDER.toLowerCase();
const jwt_1 = require("./../../plugins/jwt");
var jwt = new jwt_1.Jwt();
const hisProviderList = ['ihospital', 'hosxpv3', 'hosxpv4', 'hosxppcu', 'infod', 'homc', 'ssb',
    'hospitalos', 'jhcis', 'kpstat', 'md', 'mkhospital', 'thiades',
    'himpro', 'nemo', 'mypcu', 'emrsoft', 'haos', 'other'];
const router = (fastify, {}, next) => {
    fastify.get('/', async (req, reply) => {
        const decode = await decodeToken(req);
        const loggedIn = decode && decode.api;
        let returnValue = {
            apiCode: global.appDetail.name,
            version: global.appDetail.version,
            subVersion: global.appDetail.subVersion
        };
        if (loggedIn) {
            returnValue.his = hisProvider;
        }
        reply.send(returnValue);
    });
    fastify.get('/alive', async (req, res) => {
        const decode = await decodeToken(req);
        const loggedIn = decode && decode.api;
        try {
            const result = await hismodel_1.default.testConnect(global.dbHIS);
            const connection = result && result.length ? true : false;
            global.dbHIS.destroy;
            res.send({
                statusCode: connection ? http_status_codes_1.StatusCodes.OK : http_status_codes_1.StatusCodes.NO_CONTENT,
                ok: connection,
                apiCode: global.appDetail.name,
                version: global.appDetail.version,
                subVersion: global.appDetail.subVersion,
                his: loggedIn ? hisProvider : undefined,
                hisProvider: hisProviderList.indexOf(process.env.HIS_PROVIDER.toLowerCase()) >= 0,
                connection: connection,
                message: connection ? 'Success' : ('Fail:' + result)
            });
        }
        catch (error) {
            console.log('alive fail', error.message);
            res.send({
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                apiCode: global.appDetail.name,
                version: global.appDetail.version,
                subVersion: global.appDetail.subVersion,
                hisProvider,
                connection: false,
                message: error.message
            });
        }
    });
    fastify.post('/visit-detail', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const body = req.body || {};
        const visitNo = body.visitNo;
        try {
            const rows = await hismodel_1.default.getService(global.dbHIS, 'visitNo', visitNo);
            let visit = {};
            if (rows && rows.length > 0) {
                let row = rows[0];
                let hn = row.hn || row.HN;
                const referOut = await hismodel_1.default.getReferHistory(global.dbHIS, 'visitNo', visitNo, process.env.HOSPCODE);
                if (referOut && referOut.length > 0) {
                    let refer_out = referOut;
                    visit.refer_history = refer_out;
                    const person = await hismodel_1.default.getPerson(global.dbHIS, 'hn', hn);
                    if (person && person.length > 0) {
                        visit.person = person[0];
                        const addr = await hismodel_1.default.getAddress(global.dbHIS, 'hn', hn);
                        visit.address = addr;
                        visit.service = row;
                        const opdDx = await hismodel_1.default.getDiagnosisOpd(global.dbHIS, visitNo);
                        visit.diagnosis_opd = opdDx && opdDx.length > 0 ? opdDx : [];
                        const opdOp = await hismodel_1.default.getProcedureOpd(global.dbHIS, visitNo);
                        if (opdOp && opdOp.length > 0) {
                            visit.proced_opd = opdOp;
                        }
                        const opdDrug = await hismodel_1.default.getDrugOpd(global.dbHIS, visitNo);
                        if (opdDrug && opdDrug.length > 0) {
                            visit.drug_opd = opdDrug;
                        }
                        const admission = await hismodel_1.default.getAdmission(global.dbHIS, 'visitNo', visitNo);
                        if (admission && admission.length > 0) {
                            let ipd = admission[0];
                            const an = ipd.an || ipd.AN;
                            visit.admission = ipd;
                            const ipdDx = await hismodel_1.default.getDiagnosisIpd(global.dbHIS, 'an', an);
                            visit.diagnosis_ipd = ipdDx;
                            const ipdOp = await hismodel_1.default.getProcedureIpd(global.dbHIS, 'an', an);
                            if (ipdOp && ipdOp.length > 0) {
                                visit.proced_ipd = ipdOp;
                            }
                            const ipdDrug = await hismodel_1.default.getDrugIpd(global.dbHIS, 'an', an);
                            if (ipdDrug && ipdDrug.length > 0) {
                                visit.drug_ipd = ipdDrug;
                            }
                        }
                        const investigation = await hismodel_1.default.getInvestigation(global.dbHIS, 'visitNo', visitNo);
                        visit.investigation = investigation && investigation.length > 0 ? investigation : [];
                    }
                }
            }
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, data: visit });
        }
        catch (error) {
            console.log('referout', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/referout', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const now = moment().locale('th').format('YYYY-MM-DD');
        const body = req.body || {};
        const date = body.date || now;
        const hospcode = body.hospcode || process.env.HOSPCODE;
        try {
            const rows = await hismodel_1.default.getReferOut(global.dbHIS, date, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rowCount: rows.length, rows });
        }
        catch (error) {
            console.log('referout', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/referout-compress', { preHandler: [fastify.authenticate], compress: false }, async (req, reply) => {
        const now = moment().locale('th').format('YYYY-MM-DD');
        const body = req.body || {};
        const date = body.date || now;
        const hospcode = body.hospcode || process.env.HOSPCODE;
        try {
            const rows = await hismodel_1.default.getReferOut(global.dbHIS, date, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rowCount: rows.length, rows });
        }
        catch (error) {
            console.log('referout', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/person', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const body = req.body;
        if (!body || (!body.hn && !body.cid)) {
            reply.send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        const hn = body.hn;
        const cid = body.cid;
        const hospcode = body.hospcode || process.env.HOSPCODE;
        try {
            const now = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
            let typeSearch = 'hn';
            let textSearch = hn;
            if (cid) {
                typeSearch = 'cid';
                textSearch = cid;
            }
            const result = await hismodel_1.default.getPerson(global.dbHIS, typeSearch, textSearch, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows: result });
        }
        catch (error) {
            console.log('person', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR) });
        }
    });
    fastify.post('/address', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const body = req.body || {};
        const hn = body.hn || '';
        const hospcode = body.hospcode || process.env.HOSPCODE;
        if (!hn) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            let typeSearch = 'hn';
            let textSearch = hn;
            const rows = await hismodel_1.default.getAddress(global.dbHIS, typeSearch, textSearch, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rowCount: rows.length, rows });
        }
        catch (error) {
            console.log('address', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR) });
        }
    });
    fastify.post('/drugallergy', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const body = req.body;
        if (!body || (!body.hn && !body.cid)) {
            reply.send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        const hn = body.hn || '';
        const hospcode = body.hospcode || process.env.HOSPCODE;
        if (!hn) {
            reply.send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const result = await hismodel_1.default.getDrugAllergy(global.dbHIS, hn, hospcode);
            reply.send({ statusCode: http_status_codes_1.StatusCodes.OK, rows: result });
        }
        catch (error) {
            console.log('drug allergy', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR) });
        }
    });
    fastify.post('/service', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const body = req.body;
        if (!body || (!body.hn && !body.visitNo)) {
            reply.send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        const hn = body.hn;
        const visitNo = body.visitNo;
        const hospcode = body.hospcode || process.env.HOSPCODE;
        if (!hn && !visitNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            let typeSearch = 'hn';
            let textSearch = hn;
            if (visitNo) {
                typeSearch = 'visitNo';
                textSearch = visitNo;
            }
            const result = await hismodel_1.default.getService(global.dbHIS, typeSearch, textSearch, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows: result });
        }
        catch (error) {
            console.log('service', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/admission', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const body = req.body || {};
        if (!body || !body.typeSearch || !body.textSearch) {
            reply.send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        let typeSearch = body.typeSearch;
        let textSearch = body.textSearch;
        if (body.an) {
            typeSearch = 'an';
            textSearch = body.an;
        }
        else if (body.visitNo) {
            typeSearch = 'visitNo';
            textSearch = body.visitNo;
        }
        else if (body.hn) {
            typeSearch = 'hn';
            textSearch = body.hn;
        }
        const hospcode = body.hospcode || process.env.HOSPCODE;
        try {
            const result = await hismodel_1.default.getAdmission(global.dbHIS, typeSearch, textSearch, hospcode);
            reply.send({ statusCode: http_status_codes_1.StatusCodes.OK, rows: result });
        }
        catch (error) {
            console.log('admission', error.message);
            reply.send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/diagnosis-opd', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const body = req.body || {};
        const visitNo = body.visitNo;
        const hospcode = body.hospcode || process.env.HOSPCODE;
        if (!visitNo) {
            return reply.send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
        }
        try {
            const result = await hismodel_1.default.getDiagnosisOpd(global.dbHIS, visitNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows: result });
        }
        catch (error) {
            console.log('diagnosis_opd', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/diagnosis-opd-accident', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const body = req.body || {};
        const dateStart = body.dateStart;
        const dateEnd = body.dateEnd || dateStart;
        if (!dateStart || !dateEnd) {
            return reply.send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
        }
        try {
            const result = await hismodel_1.default.getDiagnosisOpdAccident(global.dbHIS, dateStart, dateEnd);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows: result });
        }
        catch (error) {
            console.log('diagnosis_opd_accident', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/diagnosis-sepsis', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const body = req.body || {};
        const dateStart = body.dateStart;
        const dateEnd = body.dateEnd || dateStart;
        if (!dateStart || !dateEnd) {
            return reply.send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
        }
        try {
            const opd = await hismodel_1.default.getDiagnosisSepsisOpd(global.dbHIS, dateStart, dateEnd);
            const ipd = await hismodel_1.default.getDiagnosisSepsisIpd(global.dbHIS, dateStart, dateEnd);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, opd, ipd });
        }
        catch (error) {
            console.log('diagnosis_opd_accident', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/diagnosis-ipd', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const body = req.body || {};
        const an = body.an;
        const hospcode = body.hospcode || process.env.HOSPCODE;
        if (!an) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: 'not found AN ' });
            return;
        }
        else {
            try {
                const result = await hismodel_1.default.getDiagnosisIpd(global.dbHIS, 'an', an, hospcode);
                reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows: result });
            }
            catch (error) {
                console.log('diagnosis_ipd', error.message);
                reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR) });
            }
        }
    });
    fastify.post('/diagnosis-ipd-accident', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const body = req.body || {};
        const dateStart = body.dateStart;
        const dateEnd = body.dateEnd || dateStart;
        if (!dateStart || !dateEnd) {
            return reply.send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
        }
        try {
            const result = await hismodel_1.default.getDiagnosisIpdAccident(global.dbHIS, dateStart, dateEnd);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows: result });
        }
        catch (error) {
            console.log('diagnosis_ipd_accident', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/procedure-opd', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const body = req.body || {};
        const visitNo = body.visitNo;
        const hospcode = body.hospcode || process.env.HOSPCODE;
        if (!visitNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hismodel_1.default.getProcedureOpd(global.dbHIS, visitNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('procudure_opd', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/procedure-ipd', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const body = req.body || {};
        const an = body.an;
        const hospcode = body.hospcode || process.env.HOSPCODE;
        if (!an) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hismodel_1.default.getProcedureIpd(global.dbHIS, an, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('procudure_opd', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/drug-opd', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const body = req.body || {};
        const visitNo = body.visitNo;
        const hospcode = body.hospcode || process.env.HOSPCODE;
        if (!visitNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hismodel_1.default.getDrugOpd(global.dbHIS, visitNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('drug_opd', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/drug-ipd', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const body = req.body || {};
        const an = body.an;
        const hospcode = body.hospcode || process.env.HOSPCODE;
        if (!an) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hismodel_1.default.getDrugIpd(global.dbHIS, an, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('drug_ipd', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/charge-opd', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        if (!req.body || !req.body.visitNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        const visitNo = req.body.visitNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        try {
            const rows = await hismodel_1.default.getChargeOpd(global.dbHIS, visitNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('charge_opd', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/charge-ipd', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        if (!req.body || !req.body.an) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        const an = req.body.an;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        try {
            const rows = await hismodel_1.default.getChargeIpd(global.dbHIS, an, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('charge_ipd', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/accident', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        if (!req.body || !req.body.visitNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        const visitNo = req.body.visitNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        try {
            const rows = await hismodel_1.default.getAccident(global.dbHIS, visitNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('accident', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/appointment', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        if (!req.body || !req.body.visitNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        const visitNo = req.body.visitNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        try {
            const rows = await hismodel_1.default.getAppointment(global.dbHIS, visitNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('appointment', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/refer-history', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        if (!req.body && (!req.body.visitNo)) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        const visitNo = req.body.visitNo;
        const referNo = req.body.referNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        try {
            let typeSearch = 'referNo';
            let textSearch = referNo;
            if (visitNo) {
                typeSearch = 'visitNo';
                textSearch = visitNo;
            }
            const rows = await hismodel_1.default.getReferHistory(global.dbHIS, typeSearch, textSearch, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('refer_history', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/clinical-refer', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const referNo = req.body.referNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!referNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hismodel_1.default.getClinicalRefer(global.dbHIS, referNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('clinical_refer', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/investigation-refer', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const referNo = req.body.referNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!referNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hismodel_1.default.getInvestigationRefer(global.dbHIS, referNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('investigation_refer', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/care-refer', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const referNo = req.body.referNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!referNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hismodel_1.default.getCareRefer(global.dbHIS, referNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('care_refer', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/refer-result', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hospDestination = req.body.hospDestination;
        const referNo = req.body.referNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!referNo && !hospDestination) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hismodel_1.default.getReferResult(global.dbHIS, hospDestination, referNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('refer_result', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/provider', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const licenseNo = req.body.licenseNo;
        const cid = req.body.cid;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!licenseNo && !cid) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        let typeSearch = 'cid';
        let textSearch = cid;
        if (licenseNo) {
            typeSearch = 'licenseNo';
            textSearch = licenseNo;
        }
        try {
            const rows = await hismodel_1.default.getProvider(global.dbHIS, typeSearch, textSearch, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('provider', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/department', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const depCode = req.body.depCode;
        const depName = req.body.depName;
        try {
            const rows = await hismodel_1.default.getDepartment(global.dbHIS, depCode, depName);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/ward', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const wardCode = req.body.wardCode;
        const wardName = req.body.wardName;
        try {
            const rows = await hismodel_1.default.getWard(global.dbHIS, wardCode, wardName);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/doctor', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        if (!req.body || (!req.body.drCode && !req.body.drLicense)) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hismodel_1.default.getDr(global.dbHIS, req.body.drCode, req.body.drLicense);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
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
            const ret = await jwt.verify(token);
            return ret;
        }
        catch (error) {
            return null;
        }
    }
    next();
};
module.exports = router;
