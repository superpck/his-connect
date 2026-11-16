"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipdData = void 0;
const http_status_codes_1 = require("http-status-codes");
const hismodel_1 = __importDefault(require("../../routes/his/hismodel"));
const utils_1 = require("../../utils/utils");
const db = global.dbHIS;
const ipdData = async (_req, reply) => {
    const an = _req?.params?.an || _req?.query?.an;
    if (!an) {
        return reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({
            status: http_status_codes_1.StatusCodes.BAD_REQUEST,
            message: 'Invalid parameter'
        });
    }
    const admission = await hismodel_1.default.getAdmission(db, 'an', an, null, false);
    if (!admission || admission.length === 0) {
        return reply.status(http_status_codes_1.StatusCodes.NOT_FOUND).send({
            status: http_status_codes_1.StatusCodes.NOT_FOUND,
            message: `Not found AN: ${an}`
        });
    }
    let ipdSource = await (0, utils_1.toLowerColumnName)(admission);
    ipdSource = ipdSource[0];
    const baseIpd = { ...ipdSource, dr_note: null, nurse_note: null };
    const visitNo = baseIpd.vn || baseIpd.seq;
    const [labResult, ipdDrug, ipdDiagnosis, ipdProcedure] = await Promise.all([
        visitNo ? hismodel_1.default.getLabResult(db, 'visitNo', visitNo) : [],
        hismodel_1.default.getDrugIpd(db, an),
        hismodel_1.default.getDiagnosisIpd(db, 'an', an),
        hismodel_1.default.getProcedureIpd(db, an)
    ]);
    if (Array.isArray(labResult) && labResult.length > 0) {
        baseIpd.lab_result = await (0, utils_1.toLowerColumnName)(labResult);
    }
    if (Array.isArray(ipdDrug) && ipdDrug.length > 0) {
        baseIpd.drug = await (0, utils_1.toLowerColumnName)(ipdDrug);
    }
    if (Array.isArray(ipdDiagnosis) && ipdDiagnosis.length > 0) {
        baseIpd.diagnosis = await (0, utils_1.toLowerColumnName)(ipdDiagnosis);
    }
    if (Array.isArray(ipdProcedure) && ipdProcedure.length > 0) {
        baseIpd.procedure = await (0, utils_1.toLowerColumnName)(ipdProcedure);
    }
    return reply.status(http_status_codes_1.StatusCodes.OK).send({ status: http_status_codes_1.StatusCodes.OK, data: baseIpd });
};
exports.ipdData = ipdData;
