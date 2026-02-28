import { StatusCodes } from 'http-status-codes';
import hisModel from '../../routes/his/hismodel';
const db = global.dbHIS;

export const ipdData = async (_req: any, reply: any): Promise<void> => {
  const an = _req?.params?.an;
  if (!an) {
    return reply.status(StatusCodes.BAD_REQUEST).send({
      status: StatusCodes.BAD_REQUEST,
      message: 'Invalid parameter'
    });
  }

  const admission = await hisModel.getAdmission(db, 'an', an);
  const ipdSource = Array.isArray(admission) && admission.length > 0 ? admission[0] : null;
  if (!ipdSource) {
    return reply.status(StatusCodes.NOT_FOUND).send({
      status: StatusCodes.NOT_FOUND,
      message: `Not found AN: ${an}`
    });
  }

  const baseIpd: any = { ...toLowerColumnName(ipdSource), dr_note: null, nurse_note: null };
  const visitNo = baseIpd.vn || baseIpd.seq;

  const [labResult, drugResult, diagnosisResult, procedureResult] = await Promise.all([
    visitNo ? hisModel.getLabResult(db, 'visitNo', visitNo) : [],
    hisModel.getDrugIpd(db, an),
    hisModel.getDiagnosisIpd(db, 'an', an),
    hisModel.getProcedureIpd(db, an)
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

  return reply.status(StatusCodes.OK).send({ status: StatusCodes.OK, data: baseIpd });
};

function toLowerColumnName(payload: any) {
  const rows = Array.isArray(payload) ? payload : [payload];

  const normalized = rows.map((row: Record<string, any>) => {
    const lowered: Record<string, any> = {};
    for (const key in row) {
      lowered[key.toLowerCase()] = row[key];
    }
    return lowered;
  });

  return Array.isArray(payload) ? normalized : normalized[0];
}
