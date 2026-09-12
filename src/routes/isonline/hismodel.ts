// แก้ไขเพื่อใช้ merged models จาก his_merged/ (2026-08-30)
// Imports now point to models/his_merged/ instead of models/isonline/
import { HisModel } from './../../models/his_merged/his';
// import { HisEzhospModel } from './../../models/his_merged/his_ezhosp'; // Not copied - not used
import { HisHosxpv3Model } from './../../models/his_merged/his_hosxpv3';
import { HisHosxpv4Model } from './../../models/his_merged/his_hosxpv4';
import { HisSsbModel } from './../../models/his_merged/his_ssb_model';
import { HisInfodModel } from './../../models/his_merged/his_infod';
import { HisHimproModel } from './../../models/his_merged/his_himpro';
import { HisHiModel } from './../../models/his_merged/his_hi';
import { HisHosxpPcuModel } from './../../models/his_merged/his_hosxppcu';
import { HisJhcisModel } from './../../models/his_merged/his_jhcis';
import { HisHospitalOsModel } from './../../models/his_merged/his_hospitalos';
import { HisSpdcModel } from './../../models/his_merged/his_spdc';
import { HisMdModel } from './../../models/his_merged/his_md';
import { HisPmkModel } from './../../models/his_merged/his_pmk';
import { HisJhosModel } from './../../models/his_merged/his_jhos';
import { HisMedical2020Model } from '../../models/his_merged/his_medical2020';
import { HisEmrSoftModel } from '../../models/his_merged/his_emrsoft';
import { HisKpstatModel } from '../../models/his_merged/his_kpstat';
import { HisMkhospitalModel } from '../../models/his_merged/his_mkhospital';
import { HisHaosModel } from '../../models/his_merged/his_haos';

const hisProvider = (process.env.HIS_PROVIDER || 'unknown-his').toLowerCase();

let hisModel: any;
switch (hisProvider) {
  case 'ezhosp':
  case 'ihospital':
    hisModel = new HisModel(); // HisEzhospModel not copied from isonline
    break;
  case 'hosxpv3':
    hisModel = new HisHosxpv3Model();
    break;
  case 'hosxpv4':
    hisModel = new HisHosxpv4Model();
    break;
  case 'ssb':
    hisModel = new HisSsbModel();
    break;
  case 'infod':
  case 'homc':
    hisModel = new HisInfodModel();
    break;
  case 'hi':
    hisModel = new HisHiModel();
    break;
  case 'himpro':
    hisModel = new HisHimproModel();
    break;
  case 'jhcis':
    hisModel = new HisJhcisModel();
    break;
  case 'hosxppcu':
    hisModel = new HisHosxpPcuModel();
    break;
  case 'hospitalos':
    hisModel = new HisHospitalOsModel();
    break;
  case 'emrsoft':
    hisModel = new HisEmrSoftModel();
    break;
  case 'jhos':
    hisModel = new HisJhosModel();
    break;
  case 'pmk':
    hisModel = new HisPmkModel();
    break;
  case 'meedee':
    hisModel = new HisMdModel();
    break;
  case 'kpstat':
    hisModel = new HisKpstatModel();
    break;
  case 'spdc':
    hisModel = new HisSpdcModel();
    break;
  case 'mkhospital':
    hisModel = new HisMkhospitalModel();
    break;
  case 'medical2020':
    hisModel = new HisMedical2020Model();
    break;
  case 'haos':
    hisModel = new HisHaosModel();
    break;
  default:
    hisModel = new HisModel();
}

export default hisModel;
