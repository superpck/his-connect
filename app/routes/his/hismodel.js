"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const his_ihospital_1 = require("../../models/his/his_ihospital");
const his_thiades_1 = require("../../models/his/his_thiades");
const his_hosxpv3_1 = require("../../models/his/his_hosxpv3");
const his_hosxpv4_1 = require("../../models/his/his_hosxpv4");
const his_hosxppcu_1 = require("../../models/his/his_hosxppcu");
const his_jhcis_1 = require("../../models/his/his_jhcis");
const his_md_1 = require("../../models/his/his_md");
const his_kpstat_1 = require("../../models/his/his_kpstat");
const his_mkhospital_1 = require("../../models/his/his_mkhospital");
const his_nemo_1 = require("../../models/his/his_nemo");
const his_pmk_1 = require("../../models/his/his_pmk");
const his_mypcu_1 = require("../../models/his/his_mypcu");
const his_emrsoft_1 = require("../../models/his/his_emrsoft");
const his_haos_1 = require("../../models/his/his_haos");
const his_ssb_srih_1 = require("../../models/his/his_ssb_srih");
const his_homc_1 = require("../../models/his/his_homc");
const his_hospitalos_1 = require("../../models/his/his_hospitalos");
const his_mitnet_1 = require("../../models/his/his_mitnet");
const his_1 = require("../../models/his/his");
const his_hi_1 = require("../../models/his/his_hi");
const his_himpro_1 = require("../../models/his/his_himpro");
const his_epis_1 = require("../../models/his/his_epis");
const his_mbase_1 = require("../../models/his/his_mbase");
const his_vpm_1 = require("../../models/his/his_vpm");
const his_medical2020_1 = require("../../models/his/his_medical2020");
console.log('HIS Provider:', process.env.HIS_PROVIDER);
const hisProvider = (process.env.HIS_PROVIDER || 'unknown-his').toLowerCase();
let hisModel;
switch (hisProvider) {
    case 'ihospital':
    case 'ezhosp':
        hisModel = new his_ihospital_1.HisIHospitalModel();
        break;
    case 'thiades':
        hisModel = new his_thiades_1.HisThiadesModel();
        break;
    case 'hosxpv3':
        hisModel = new his_hosxpv3_1.HisHosxpv3Model();
        break;
    case 'hosxpv4':
        hisModel = new his_hosxpv4_1.HisHosxpv4Model();
        break;
    case 'hosxppcu':
        hisModel = new his_hosxppcu_1.HisHosxpPcuModel();
        break;
    case 'mkhospital':
        hisModel = new his_mkhospital_1.HisMkhospitalModel();
        break;
    case 'nemo':
    case 'nemo_refer':
        hisModel = new his_nemo_1.HisNemoModel();
        break;
    case 'ssb':
        hisModel = new his_ssb_srih_1.HisSsbSriHModel();
        break;
    case 'infod':
    case 'homc':
        hisModel = new his_homc_1.HisHomCHModel();
        break;
    case 'hi':
        hisModel = new his_hi_1.HisHiModel();
        break;
    case 'himpro':
        hisModel = new his_himpro_1.HisHimproModel();
        break;
    case 'jhcis':
        hisModel = new his_jhcis_1.HisJhcisModel();
        break;
    case 'mypcu':
        hisModel = new his_mypcu_1.HisMyPcuModel();
        break;
    case 'hospitalos':
        hisModel = new his_hospitalos_1.HisHospitalOsModel();
        break;
    case 'vpm':
        hisModel = new his_vpm_1.HisVpmHModel();
        break;
    case 'pmk':
        hisModel = new his_pmk_1.HisPmkModel();
        break;
    case 'md':
        hisModel = new his_md_1.HisMdModel();
        break;
    case 'emrsoft':
        hisModel = new his_emrsoft_1.HisEmrSoftModel();
        break;
    case 'haos':
        hisModel = new his_haos_1.HisHaosModel();
        break;
    case 'spdc':
    case 'kpstat':
        hisModel = new his_kpstat_1.HisKpstatModel();
        break;
    case 'mitnet':
        hisModel = new his_mitnet_1.HisMitnetModel();
        break;
    case 'epis':
    case 'ephis':
        hisModel = new his_epis_1.HisEPisModel();
        break;
    case 'mbase':
        hisModel = new his_mbase_1.HisMBaseModel();
        break;
    case 'medical2020':
        hisModel = new his_medical2020_1.HisMedical2020Model();
        break;
    default:
        hisModel = new his_1.HisModel();
}
exports.default = hisModel;
