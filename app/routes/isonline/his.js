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
const login_1 = require("./../../models/isonline/login");
const his_medical2020_model_1 = require("../../models/isonline/his_medical2020.model");
const his_kpstat_1 = require("../../models/refer/his_kpstat");
const jwt_1 = require("./../../plugins/jwt");
var jwt = new jwt_1.Jwt();
const loginModel = new login_1.IsLoginModel();
const hisModels = {
    ezhosp: new his_ezhosp_model_1.HisEzhospModel(),
    ihospital: new his_ezhosp_model_1.HisEzhospModel(),
    hosxpv3: new his_hosxpv3_model_1.HisHosxpv3Model(),
    hosxpv4: new his_hosxpv4_model_1.HisHosxpv4Model(),
    hosxppcu: new his_hosxppcu_model_1.HisHosxppcuModel(),
    hospos: new his_hospitalos_model_1.HisHospitalOsModel(),
    jhosp: new his_jhos_model_1.HisJhosModel(),
    jhcis: new his_jhcis_model_1.HisJhcisModel(),
    ssb: new his_ssb_model_1.HisSsbModel(),
    homc: new his_infod_model_1.HisInfodModel(),
    hi: new his_hi_model_1.HisHiModel(),
    himpro: new his_himpro_model_1.HisHimproModel(),
    pmk: new his_pmk_model_1.HisPmkModel(),
    spdc: new his_spdc_model_1.HisSpdcModel(),
    meedee: new his_md_model_1.HisMdModel(),
    other: new his_model_1.HisModel()
};
const provider = process.env.HIS_PROVIDER;
let hisModel;
let errorRespond = {};
let currentRoutePath = '';
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
    case 'medical2020':
        hisModel = new his_medical2020_model_1.HisMedical2020Model();
        break;
    default:
        hisModel = new his_model_1.HisModel();
}
const dbName = process.env.HIS_DB_NAME;
const allowTableNames = [
    'patient', 'view_opd_visit', 'opd_dx', 'opd_op', 'opd_vs', 'ipd_ipd', 'view_pharmacy_opd_drug_item',
];
const router = (fastify, {}, next) => {
    fastify.get('/alive', async (req, res) => {
        try {
            const result = await hisModel.testConnect(global.dbHIS);
            global.dbHIS.destroy;
            if (result && result.length) {
                res.send({
                    statusCode: http_status_codes_1.StatusCodes.OK,
                    ok: true,
                    startServerTime: fastify.startServerTime,
                    hisProvider: process.env.HIS_PROVIDER,
                    version: global.appDetail.version,
                    subVersion: global.appDetail.subVersion,
                    connection: true
                });
            }
            else {
                res.send({
                    statusCode: http_status_codes_1.StatusCodes.NO_CONTENT,
                    ok: true, startServerTime: fastify.startServerTime,
                    hisProvider: process.env.HIS_PROVIDER,
                    version: global.appDetail.version,
                    subVersion: global.appDetail.subVersion,
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
    fastify.post('/person', async (req, res) => {
        const userInfo = await decodeToken(req);
        console.log(req.url);
        console.log(userInfo);
        if (!userInfo || !userInfo.hcode) {
            res.send({
                statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.UNAUTHORIZED)
            });
        }
        else {
            let columnName = req.body.columnName;
            let searchText = req.body.searchText;
            console.log('search person', userInfo.hcode);
            if (columnName && searchText) {
                try {
                    const result = await hisModel.getPerson(global.dbHIS, columnName, searchText);
                    global.dbHIS.destroy;
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
        }
    });
    fastify.post('/opd-service', async (req, res) => {
        const userInfo = await decodeToken(req);
        if (!userInfo || !userInfo.hcode) {
            res.send({
                statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.UNAUTHORIZED)
            });
        }
        else {
            let hn = req.body.hn;
            let date = req.body.date;
            let visitNo = req.body.visitNo || '';
            if (visitNo + hn) {
                try {
                    const result = await hisModel.getOpdService(global.dbHIS, hn, date, 'vn', visitNo);
                    global.dbHIS.destroy;
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
        }
    });
    fastify.post('/opd-diagnosis', async (req, res) => {
        const userInfo = await decodeToken(req);
        if (!userInfo || !userInfo.hcode) {
            res.send({
                statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.UNAUTHORIZED)
            });
        }
        else {
            let visitNo = req.body.visitNo || req.body.vn;
            if (visitNo) {
                try {
                    const result = await hisModel.getDiagnosisOpd(global.dbHIS, visitNo);
                    global.dbHIS.destroy;
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
        console.log(token);
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
