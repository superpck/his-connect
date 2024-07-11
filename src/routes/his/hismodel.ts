// ห้ามแก้ไข file นี้ //
import { HisEzhospModel } from '../../models/his/his_ezhosp';
import { HisThiadesModel } from '../../models/his/his_thiades';
import { HisHosxpv3Model } from '../../models/his/his_hosxpv3';
import { HisHosxpv4Model } from '../../models/his/his_hosxpv4';
import { HisHosxpPcuModel } from '../../models/his/his_hosxppcu';
import { HisJhcisModel } from '../../models/his/his_jhcis';
import { HisMdModel } from '../../models/his/his_md';
import { HisKpstatModel } from '../../models/his/his_kpstat';
import { HisMkhospitalModel } from '../../models/his/his_mkhospital';
import { HisModel } from '../../models/his/his';
import { HisNemoModel } from '../../models/his/his_nemo';
import { HisPmkModel } from '../../models/his/his_pmk';
import { HisMyPcuModel } from '../../models/his/his_mypcu';
import { HisEmrSoftModel } from '../../models/his/his_emrsoft';
import { HisHaosModel } from '../../models/his/his_haos';
import { HisSsbSriHModel } from '../../models/his/his_ssb_srih';

const hisProvider = process.env.HIS_PROVIDER;

let hisModel: any;
switch (hisProvider) {
  case 'ihospital':
  case 'ezhosp':
    hisModel = new HisEzhospModel();
    break;
  case 'thiades':
    hisModel = new HisThiadesModel();
    break;
  case 'hosxpv3':
    hisModel = new HisHosxpv3Model();
    break;
  case 'hosxpv4':
    hisModel = new HisHosxpv4Model();
    break;
  case 'hosxppcu':
    hisModel = new HisHosxpPcuModel();
    break;
  case 'mkhospital':
    hisModel = new HisMkhospitalModel();
    break;
  case 'nemo':
  case 'nemo_refer':
    hisModel = new HisNemoModel();
    break;
  case 'ssb':
    hisModel = new HisSsbSriHModel(); // SSB รพ.สระบุรี
    break;
  case 'infod':
  case 'homc':
    // hisModel = new HisInfodModel();
    break;
  case 'hi':
    // hisModel = new HisHiModel();
    break;
  case 'himpro':
    // hisModel = new HisHimproModel();
    break;
  case 'jhcis':
    hisModel = new HisJhcisModel();
    break;
  case 'mypcu':
    hisModel = new HisMyPcuModel();
    break;
  case 'hospitalos':
    // hisModel = new HisHospitalOsModel();
    break;
  case 'jhos':
    // hisModel = new HisJhosModel();
    break;
  case 'pmk':
    hisModel = new HisPmkModel();
    break;
  case 'md':
    hisModel = new HisMdModel();
    break;
  case 'emrsoft':
    hisModel = new HisEmrSoftModel();
    break;
  case 'haos':
    hisModel = new HisHaosModel();
    break;
  case 'spdc':
  case 'kpstat':
    hisModel = new HisKpstatModel();
    break;
  default:
    hisModel = new HisModel();
}

export default hisModel;
