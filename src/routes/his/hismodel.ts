// ห้ามแก้ไข file นี้ //
console.log('HIS Provider:', process.env.HIS_PROVIDER);
const hisProvider = (process.env.HIS_PROVIDER || 'unknown-his').toLowerCase();
const modelPath = '../../models/his';

let hisModel: any;
switch (hisProvider) {
  case 'ihospital':
  case 'ezhosp':
    hisModel = new (require(modelPath + '/his_ihospital').HisIHospitalModel)();
    break;
  case 'thiades':
    hisModel = new (require(modelPath + '/his_thiades').HisThiadesModel)();
    break;
  case 'hosxpv3':
    hisModel = new (require(modelPath + '/his_hosxpv3').HisHosxpv3Model)();
    break;
  case 'hosxpv4':
    hisModel = new (require(modelPath + '/his_hosxpv4').HisHosxpv4Model)();
    break;
  case 'hosxppcu':
    hisModel = new (require(modelPath + '/his_hosxppcu').HisHosxpPcuModel)();
    break;
  case 'mkhospital':
    hisModel = new (require(modelPath + '/his_mkhospital').HisMkhospitalModel)();
    break;
  case 'nemo':
  case 'nemo_refer':
    hisModel = new (require(modelPath + '/his_nemo').HisNemoModel)();
    break;
  case 'ssb':
    hisModel = new (require(modelPath + '/his_ssb_srih').HisSsbSriHModel)();
    break;
  case 'infod':
  case 'homc':
    hisModel = new (require(modelPath + '/his_homc').HisHomCHModel)();
    break;
  case 'hi':
    hisModel = new (require(modelPath + '/his_hi').HisHiModel)();
    break;
  case 'himpro':
    hisModel = new (require(modelPath + '/his_himpro').HisHimproModel)();
    break;
  case 'jhcis':
    hisModel = new (require(modelPath + '/his_jhcis').HisJhcisModel)();
    break;
  case 'mypcu':
    hisModel = new (require(modelPath + '/his_mypcu').HisMyPcuModel)();
    break;
  case 'hospitalos':
    hisModel = new (require(modelPath + '/his_hospitalos').HisHospitalOsModel)();
    break;
  case 'hospitalosv4':
    hisModel = new (require(modelPath + '/his_hospitalos.v4').HisHospitalOsV4Model)();
    break;
  case 'vpm':
    hisModel = new (require(modelPath + '/his_vpm').HisVpmHModel)();
    break;
  case 'pmk':
    hisModel = new (require(modelPath + '/his_pmk').HisPmkModel)();
    break;
  case 'md':
    hisModel = new (require(modelPath + '/his_md').HisMdModel)();
    break;
  case 'emrsoft':
    hisModel = new (require(modelPath + '/his_emrsoft').HisEmrSoftModel)();
    break;
  case 'haos':
    hisModel = new (require(modelPath + '/his_haos').HisHaosModel)();
    break;
  case 'mitnet':
    hisModel = new (require(modelPath + '/his_mitnet').HisMitnetModel)();
    break;
  case 'epis':
  case 'ephis':
    hisModel = new (require(modelPath + '/his_epis').HisEPisModel)();
    break;
  case 'mbase':
    hisModel = new (require(modelPath + '/his_mbase').HisMBaseModel)();
    break;
  case 'medical2020':
    hisModel = new (require(modelPath + '/his_medical2020').HisMedical2020Model)();
    break;
  default:
    hisModel = new (require(modelPath + '/his').HisModel)();
}

export default hisModel;
