// ใช้สำหรับการ Config เมื่อ API Start
import { getHospitalConfig } from '../middleware/moph-refer';

const getMophConfig = async () => {
  return await getHospitalConfig();
}

export default { getMophConfig };