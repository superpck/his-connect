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
const loginModel = new login_1.IsLoginModel();
const hisModels = {
    ezhosp: new his_ezhosp_model_1.HisEzhospModel(),
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
    fastify.get('/alive', { preHandler: [fastify.serviceMonitoring] }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield hisModel.testConnect(fastify.dbHIS);
            fastify.dbHIS.destroy;
            if (result && result.length) {
                res.send({
                    statusCode: HttpStatus.OK,
                    ok: true,
                    startServerTime: fastify.startServerTime,
                    hisProvider: process.env.HIS_PROVIDER,
                    version: fastify.appVersion.version,
                    subversion: fastify.appVersion.subVersion,
                    connection: true
                });
            }
            else {
                res.send({
                    statusCode: HttpStatus.NO_CONTENT,
                    ok: true, startServerTime: fastify.startServerTime,
                    hisProvider: process.env.HIS_PROVIDER,
                    version: fastify.appVersion.version,
                    subversion: fastify.appVersion.subVersion,
                    connection: false,
                    message: result
                });
            }
        }
        catch (error) {
            console.log('alive fail', error.message);
            res.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                status: 500,
                ok: false,
                hisProvider: provider,
                connection: false,
                message: error.message
            });
        }
    }));
    fastify.post('/alive', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield hisModel.getTableName(fastify.dbHIS);
            if (result && result.length) {
                res.send({
                    statusCode: HttpStatus.OK,
                    ok: true,
                    version: fastify.appVersion.version,
                    subversion: fastify.appVersion.subVersion,
                    hisProvider: process.env.HIS_PROVIDER,
                    connection: true
                });
            }
            else {
                res.send({
                    statusCode: HttpStatus.NO_CONTENT,
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
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                status: 500,
                ok: false,
                hisProvider: provider,
                connection: false,
                message: error.message
            });
        }
    }));
    fastify.post('/showTbl', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield hisModel.getTableName(fastify.dbHIS);
            res.send({
                statusCode: HttpStatus.OK,
                rows: result
            });
        }
        catch (error) {
            console.log('showTbl', error.message);
            res.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message
            });
        }
    }));
    fastify.post('/person', { preHandler: [fastify.serviceMonitoring] }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        let columnName = req.body.columnName;
        let searchText = req.body.searchText;
        if (columnName && searchText) {
            try {
                const result = yield hisModel.getPerson(fastify.dbHIS, columnName, searchText);
                fastify.dbHIS.destroy;
                res.send({
                    statusCode: HttpStatus.OK,
                    version: fastify.appVersion.version,
                    subversion: fastify.appVersion.subVersion,
                    hisProvider: process.env.HIS_PROVIDER,
                    reccount: result.length,
                    rows: result
                });
            }
            catch (error) {
                console.log('person', error.message);
                res.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            res.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    }));
    fastify.post('/opd-service', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        let hn = req.body.hn;
        let date = req.body.date;
        let visitNo = req.body.visitNo || '';
        if (visitNo + hn) {
            try {
                const result = yield hisModel.getOpdService(fastify.dbHIS, hn, date, 'vn', visitNo);
                fastify.dbHIS.destroy;
                res.send({
                    statusCode: HttpStatus.OK,
                    version: fastify.appVersion.version,
                    subversion: fastify.appVersion.subVersion,
                    hisProvider: process.env.HIS_PROVIDER,
                    reccount: result.length,
                    rows: result
                });
            }
            catch (error) {
                console.log('opd-service', error.message);
                res.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            res.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    }));
    fastify.post('/opd-diagnosis', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        let visitNo = req.body.visitNo || req.body.vn;
        if (visitNo) {
            try {
                const result = yield hisModel.getDiagnosisOpd(fastify.dbHIS, visitNo);
                fastify.dbHIS.destroy;
                res.send({
                    statusCode: HttpStatus.OK,
                    version: fastify.appVersion.version,
                    subversion: fastify.appVersion.subVersion,
                    hisProvider: process.env.HIS_PROVIDER,
                    reccount: result.length,
                    rows: result
                });
            }
            catch (error) {
                console.log('opd-diagnosis', error.message);
                res.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
        else {
            res.send({
                statusCode: HttpStatus.BAD_REQUEST,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
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
