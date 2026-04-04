"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipdData = void 0;
const http_status_codes_1 = require("http-status-codes");
const hismodel_1 = __importDefault(require("../../routes/his/hismodel"));
const db = global.dbHIS;
const ipdData = async (_req, reply) => {
    const an = _req?.params?.an;
    if (!an) {
        return reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({
            status: http_status_codes_1.StatusCodes.BAD_REQUEST,
            message: 'Invalid parameter'
        });
    }
    const admission = await hismodel_1.default.getAdmission(db, 'an', an);
    const ipdSource = Array.isArray(admission) && admission.length > 0 ? admission[0] : null;
    if (!ipdSource) {
        return reply.status(http_status_codes_1.StatusCodes.NOT_FOUND).send({
            status: http_status_codes_1.StatusCodes.NOT_FOUND,
            message: `Not found AN: ${an}`
        });
    }
    const baseIpd = { ...toLowerColumnName(ipdSource), dr_note: null, nurse_note: null };
    const visitNo = baseIpd.vn || baseIpd.seq;
    const [labResult, drugResult, diagnosisResult, procedureResult] = await Promise.all([
        visitNo ? hismodel_1.default.getLabResult(db, 'visitNo', visitNo) : [],
        hismodel_1.default.getDrugIpd(db, an),
        hismodel_1.default.getDiagnosisIpd(db, 'an', an),
        hismodel_1.default.getProcedureIpd(db, an)
    ]);
    if (Array.isArray(labResult) && labResult.length > 0) {
        baseIpd.lab_result = toLowerColumnName(labResult);
    }
    if (Array.isArray(drugResult) && drugResult.length > 0) {
        baseIpd.drug = toLowerColumnName(drugResult);
    }
    if (Array.isArray(diagnosisResult) && diagnosisResult.length > 0) {
        baseIpd.diagnosis = toLowerColumnName(diagnosisResult);
    }
    if (Array.isArray(procedureResult) && procedureResult.length > 0) {
        baseIpd.procedure = toLowerColumnName(procedureResult);
    }
    return reply.status(http_status_codes_1.StatusCodes.OK).send({ status: http_status_codes_1.StatusCodes.OK, data: baseIpd });
};
exports.ipdData = ipdData;
function toLowerColumnName(payload) {
    const rows = Array.isArray(payload) ? payload : [payload];
    const normalized = rows.map((row) => {
        const lowered = {};
        for (const key in row) {
            lowered[key.toLowerCase()] = row[key];
        }
        return lowered;
    });
    return Array.isArray(payload) ? normalized : normalized[0];
}
