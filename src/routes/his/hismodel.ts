// ห้ามแก้ไข file นี้ //
console.log('HIS Provider:', process.env.HIS_PROVIDER);
const hisProvider = (process.env.HIS_PROVIDER || 'unknown-his').toLowerCase();

let hisModel: any;
switch (hisProvider) {
  case 'ihospital':
  case 'ezhosp':
    hisModel = new (require('../../models/his/his_ihospital').HisIHospitalModel)();
    break;
  case 'thiades':
    hisModel = new (require('../../models/his/his_thiades').HisThiadesModel)();
    break;
  case 'hosxpv3':
    hisModel = new (require('../../models/his/his_hosxpv3').HisHosxpv3Model)();
    break;
  case 'hosxpv4':
    hisModel = new (require('../../models/his/his_hosxpv4').HisHosxpv4Model)();
    break;
  case 'hosxppcu':
    hisModel = new (require('../../models/his/his_hosxppcu').HisHosxpPcuModel)();
    break;
  case 'mkhospital':
    hisModel = new (require('../../models/his/his_mkhospital').HisMkhospitalModel)();
    break;
  case 'nemo':
  case 'nemo_refer':
    hisModel = new (require('../../models/his/his_nemo').HisNemoModel)();
    break;
  case 'ssb':
    hisModel = new (require('../../models/his/his_ssb_srih').HisSsbSriHModel)();
    break;
  case 'infod':
  case 'homc':
    hisModel = new (require('../../models/his/his_homc').HisHomCHModel)();
    break;
  case 'hi':
    hisModel = new (require('../../models/his/his_hi').HisHiModel)();
    break;
  case 'himpro':
    hisModel = new (require('../../models/his/his_himpro').HisHimproModel)();
    break;
  case 'jhcis':
    hisModel = new (require('../../models/his/his_jhcis').HisJhcisModel)();
    break;
  case 'mypcu':
    hisModel = new (require('../../models/his/his_mypcu').HisMyPcuModel)();
    break;
  case 'hospitalos':
    hisModel = new (require('../../models/his/his_hospitalos').HisHospitalOsModel)();
    break;
  case 'hospitalosv4':
    hisModel = new (require('../../models/his/his_hospitalos.v4').HisHospitalOsV4Model)();
    break;
  case 'vpm':
    hisModel = new (require('../../models/his/his_vpm').HisVpmHModel)();
    break;
  case 'pmk':
    hisModel = new (require('../../models/his/his_pmk').HisPmkModel)();
    break;
  case 'md':
    hisModel = new (require('../../models/his/his_md').HisMdModel)();
    break;
  case 'emrsoft':
    hisModel = new (require('../../models/his/his_emrsoft').HisEmrSoftModel)();
    break;
  case 'haos':
    hisModel = new (require('../../models/his/his_haos').HisHaosModel)();
    break;
  case 'spdc':
  case 'kpstat':
    hisModel = new (require('../../models/his/his_kpstat').HisKpstatModel)();
    break;
  case 'mitnet':
    hisModel = new (require('../../models/his/his_mitnet').HisMitnetModel)();
    break;
  case 'epis':
  case 'ephis':
    hisModel = new (require('../../models/his/his_epis').HisEPisModel)();
    break;
  case 'mbase':
    hisModel = new (require('../../models/his/his_mbase').HisMBaseModel)();
    break;
  case 'medical2020':
    hisModel = new (require('../../models/his/his_medical2020').HisMedical2020Model)();
    break;
  default:
    hisModel = new (require('../../models/his/his').HisModel)();
}

export default hisModel;
