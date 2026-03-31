// ใช้สำหรับการ Config เมื่อ API Start
import { getHospitalConfig } from '../middleware/moph-refer';

const getMophConfig = async (options: { purpose?: string; timeoutMs?: number } = {}) => {
  return await getHospitalConfig(options);
}

export default { getMophConfig };