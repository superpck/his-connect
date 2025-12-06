// ห้ามแก้ไข file นี้ //
import { HisIHospitalModel } from '../../models/his/his_ihospital';
import { HisThiadesModel } from '../../models/his/his_thiades';
import { HisHosxpv3Model } from '../../models/his/his_hosxpv3';
import { HisHosxpv4Model } from '../../models/his/his_hosxpv4';
import { HisHosxpPcuModel } from '../../models/his/his_hosxppcu';
import { HisJhcisModel } from '../../models/his/his_jhcis';
import { HisMdModel } from '../../models/his/his_md';
import { HisKpstatModel } from '../../models/his/his_kpstat';
import { HisMkhospitalModel } from '../../models/his/his_mkhospital';
import { HisNemoModel } from '../../models/his/his_nemo';
import { HisPmkModel } from '../../models/his/his_pmk';
import { HisMyPcuModel } from '../../models/his/his_mypcu';
import { HisEmrSoftModel } from '../../models/his/his_emrsoft';
import { HisHaosModel } from '../../models/his/his_haos';
import { HisSsbSriHModel } from '../../models/his/his_ssb_srih';
import { HisHomCHModel } from '../../models/his/his_homc';
import { HisHospitalOsModel } from '../../models/his/his_hospitalos';
import { HisMitnetModel } from '../../models/his/his_mitnet';
import { HisModel } from '../../models/his/his';
import { HisHiModel } from '../../models/his/his_hi';
import { HisHimproModel } from '../../models/his/his_himpro';
import { HisEPisModel } from '../../models/his/his_epis';
import { HisMBaseModel } from '../../models/his/his_mbase';
import { HisVpmHModel } from '../../models/his/his_vpm';
import { HisMedical2020Model } from '../../models/his/his_medical2020';

console.log('HIS Provider:', process.env.HIS_PROVIDER);
const hisProvider = (process.env.HIS_PROVIDER || 'unknown-his').toLowerCase();

let hisModel: any;
switch (hisProvider) {
  case 'ihospital':
  case 'ezhosp':
    hisModel = new HisIHospitalModel();
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
    hisModel = new HisHomCHModel();
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
  case 'mypcu':
    hisModel = new HisMyPcuModel();
    break;
  case 'hospitalos':
    hisModel = new HisHospitalOsModel();
    break;
  case 'vpm':
    hisModel = new HisVpmHModel();
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
  case 'mitnet':
    hisModel = new HisMitnetModel();
    break;
  case 'epis':
  case 'ephis':
    hisModel = new HisEPisModel();
    break;
  case 'mbase':
    hisModel = new HisMBaseModel();
    break;
  case 'medical2020':
    hisModel = new HisMedical2020Model();
    break;
  default:
    hisModel = new HisModel();
}

export default hisModel;
