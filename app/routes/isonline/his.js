"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const his_model_1 = require("./../../models/isonline/his.model");
const his_ezhosp_model_1 = require("./../../models/isonline/his_ezhosp.model");
const his_hosxpv3_model_1 = require("./../../models/isonline/his_hosxpv3.model");
const his_hosxpv4_model_1 = require("./../../models/isonline/his_hosxpv4.model");
const his_ssb_model_1 = require("./../../models/isonline/his_ssb.model");
const his_infod_model_1 = require("./../../models/isonline/his_infod.model");
const his_himpro_model_1 = require("./../../models/isonline/his_himpro.model");
const his_hi_model_1 = require("./../../models/isonline/his_hi.model");
const his_hosxppcu_model_1 = require("./../../models/isonline/his_hosxppcu.model");
const his_jhcis_model_1 = require("./../../models/isonline/his_jhcis.model");
const his_hospitalos_model_1 = require("./../../models/isonline/his_hospitalos.model");
const his_spdc_model_1 = require("./../../models/isonline/his_spdc.model");
const his_md_model_1 = require("./../../models/isonline/his_md.model");
const his_pmk_model_1 = require("./../../models/isonline/his_pmk.model");
const his_jhos_model_1 = require("./../../models/isonline/his_jhos.model");
const his_medical2020_model_1 = require("../../models/isonline/his_medical2020.model");
const his_emrsoft_model_1 = require("../../models/isonline/his_emrsoft.model");
const his_kpstat_1 = require("../../models/his/his_kpstat");
const his_mkhospital_model_1 = require("../../models/isonline/his_mkhospital.model");
const his_haos_model_1 = require("../../models/isonline/his_haos.model");
const jwt_1 = require("./../../plugins/jwt");
const moment = require("moment");
var jwt = new jwt_1.Jwt();
const provider = process.env.HIS_PROVIDER;
let hisModel;
switch (provider) {
    case 'ezhosp':
    case 'ihospital':
        hisModel = new his_ezhosp_model_1.HisEzhospModel();
        break;
    case 'hosxpv3':
        hisModel = new his_hosxpv3_model_1.HisHosxpv3Model();
        break;
    case 'hosxpv4':
        hisModel = new his_hosxpv4_model_1.HisHosxpv4Model();
        break;
    case 'ssb':
        hisModel = new his_ssb_model_1.HisSsbModel();
        break;
    case 'infod':
    case 'homc':
        hisModel = new his_infod_model_1.HisInfodModel();
        break;
    case 'hi':
        hisModel = new his_hi_model_1.HisHiModel();
        break;
    case 'himpro':
        hisModel = new his_himpro_model_1.HisHimproModel();
        break;
    case 'jhcis':
        hisModel = new his_jhcis_model_1.HisJhcisModel();
        break;
    case 'hosxppcu':
        hisModel = new his_hosxppcu_model_1.HisHosxppcuModel();
        break;
    case 'hospitalos':
        hisModel = new his_hospitalos_model_1.HisHospitalOsModel();
        break;
    case 'emrsoft':
        hisModel = new his_emrsoft_model_1.HisEmrSoftModel();
        break;
    case 'jhos':
        hisModel = new his_jhos_model_1.HisJhosModel();
        break;
    case 'pmk':
        hisModel = new his_pmk_model_1.HisPmkModel();
        break;
    case 'meedee':
        hisModel = new his_md_model_1.HisMdModel();
        break;
    case 'kpstat':
        hisModel = new his_kpstat_1.HisKpstatModel();
        break;
    case 'spdc':
        hisModel = new his_spdc_model_1.HisSpdcModel();
        break;
    case 'mkhospital':
        hisModel = new his_mkhospital_model_1.HisMkhospitalModel();
        break;
    case 'medical2020':
        hisModel = new his_medical2020_model_1.HisMedical2020Model();
        break;
    case 'haos':
        hisModel = new his_haos_model_1.HisHaosModel();
        break;
    default:
        hisModel = new his_model_1.HisModel();
}
const hisProviderList = ['ihospital', 'hosxpv3', 'hosxpv4', 'hosxppcu', 'infod', 'homc', 'ssb',
    'hospitalos', 'jhcis', 'kpstat', 'md', 'mkhospital', 'thiades',
    'himpro', 'nemo', 'mypcu', 'emrsoft', 'other'];
const router = (fastify, {}, next) => {
    fastify.get('/alive', async (req, res) => {
        try {
            const result = await hisModel.testConnect(global.dbHIS);
            res.send({
                statusCode: (result && result.length > 0) ? http_status_codes_1.StatusCodes.OK : http_status_codes_1.StatusCodes.NO_CONTENT,
                ok: result && result.length > 0,
                version: global.appDetail.version,
                subVersion: global.appDetail.subVersion,
                hisProvider: hisProviderList.indexOf(process.env.HIS_PROVIDER) >= 0,
                connection: result && result.length > 0,
                message: result && result.length > 0 ? undefined : (result.message || result)
            });
        }
        catch (error) {
            console.log('alive fail', error.message);
            res.send({
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                hisProvider: hisProviderList.indexOf(process.env.HIS_PROVIDER) >= 0,
                connection: false,
                message: error.message
            });
        }
    });
    fastify.post('/alive', { preHandler: [fastify.authenticate] }, async (req, res) => {
        try {
            const result = await hisModel.getTableName(global.dbHIS);
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
            const result = await hisModel.getTableName(global.dbHIS);
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
        if (columnName && searchText) {
            try {
                const rows = await hisModel.getPerson(global.dbHIS, columnName, searchText);
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
    });
    fastify.post('/opd-service', { preHandler: [fastify.authenticate] }, async (req, res) => {
        let hn = req.body.hn;
        let date = req.body.date;
        let visitNo = req.body.visitNo || '';
        if (visitNo + hn) {
            try {
                const rows = await hisModel.getOpdService(global.dbHIS, hn, date, 'vn', visitNo);
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
                const rows = await hisModel.getOpdServiceByVN(global.dbHIS, visitNo, where);
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
                const result = await hisModel.getDiagnosisOpd(global.dbHIS, visitNo);
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
        let date = req.body.date || moment().format('YYYY-MM-DD');
        try {
            const rows = await hisModel.getDiagnosisOpdVWXY(global.dbHIS, date);
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
