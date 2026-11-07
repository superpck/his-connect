import { StatusCodes } from 'http-status-codes';
import hisModel from '../../routes/his/hismodel';
import { toLowerColumnName } from '../../utils/utils';
const db = global.dbHIS;

export const ipdData = async (_req: any, reply: any): Promise<void> => {
  const an = _req?.params?.an || _req?.query?.an;
  if (!an) {
    return reply.status(StatusCodes.BAD_REQUEST).send({
      status: StatusCodes.BAD_REQUEST,
      message: 'Invalid parameter'
    });
  }

  const admission = await hisModel.getAdmission(db, 'an', an, null, false);
  if (!admission || admission.length === 0) {
    return reply.status(StatusCodes.NOT_FOUND).send({
      status: StatusCodes.NOT_FOUND,
      message: `Not found AN: ${an}`
    });
  }

  let ipdSource = await toLowerColumnName(admission);
  ipdSource = ipdSource[0];

  const baseIpd: any = { ...ipdSource, dr_note: null, nurse_note: null };
  const visitNo = baseIpd.vn || baseIpd.seq;

  const [labResult, ipdDrug, ipdDiagnosis, ipdProcedure] = await Promise.all([
    visitNo ? hisModel.getLabResult(db, 'visitNo', visitNo) : [],
    hisModel.getDrugIpd(db, an),
    hisModel.getDiagnosisIpd(db, 'an', an),
    hisModel.getProcedureIpd(db, an)
  ]);

  if (Array.isArray(labResult) && labResult.length > 0) {
    baseIpd.lab_result = await toLowerColumnName(labResult);
  }
  if (Array.isArray(ipdDrug) && ipdDrug.length > 0) {
    baseIpd.drug = await toLowerColumnName(ipdDrug);
  }
  if (Array.isArray(ipdDiagnosis) && ipdDiagnosis.length > 0) {
    baseIpd.diagnosis = await toLowerColumnName(ipdDiagnosis);
  }
  if (Array.isArray(ipdProcedure) && ipdProcedure.length > 0) {
    baseIpd.procedure = await toLowerColumnName(ipdProcedure);
  }

  return reply.status(StatusCodes.OK).send({ status: StatusCodes.OK, data: baseIpd });
};
