"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const his_1 = require("./../../models/his_merged/his");
const his_hosxpv3_1 = require("./../../models/his_merged/his_hosxpv3");
const his_hosxpv4_1 = require("./../../models/his_merged/his_hosxpv4");
const his_ssb_model_1 = require("./../../models/his_merged/his_ssb_model");
const his_infod_1 = require("./../../models/his_merged/his_infod");
const his_himpro_1 = require("./../../models/his_merged/his_himpro");
const his_hi_1 = require("./../../models/his_merged/his_hi");
const his_hosxppcu_1 = require("./../../models/his_merged/his_hosxppcu");
const his_jhcis_1 = require("./../../models/his_merged/his_jhcis");
const his_hospitalos_1 = require("./../../models/his_merged/his_hospitalos");
const his_spdc_1 = require("./../../models/his_merged/his_spdc");
const his_md_1 = require("./../../models/his_merged/his_md");
const his_pmk_1 = require("./../../models/his_merged/his_pmk");
const his_jhos_1 = require("./../../models/his_merged/his_jhos");
const his_medical2020_1 = require("../../models/his_merged/his_medical2020");
const his_emrsoft_1 = require("../../models/his_merged/his_emrsoft");
const his_kpstat_1 = require("../../models/his_merged/his_kpstat");
const his_mkhospital_1 = require("../../models/his_merged/his_mkhospital");
const his_haos_1 = require("../../models/his_merged/his_haos");
const hisProvider = (process.env.HIS_PROVIDER || 'unknown-his').toLowerCase();
let hisModel;
switch (hisProvider) {
    case 'ezhosp':
    case 'ihospital':
        hisModel = new his_1.HisModel();
        break;
    case 'hosxpv3':
        hisModel = new his_hosxpv3_1.HisHosxpv3Model();
        break;
    case 'hosxpv4':
        hisModel = new his_hosxpv4_1.HisHosxpv4Model();
        break;
    case 'ssb':
        hisModel = new his_ssb_model_1.HisSsbModel();
        break;
    case 'infod':
    case 'homc':
        hisModel = new his_infod_1.HisInfodModel();
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
    case 'hosxppcu':
        hisModel = new his_hosxppcu_1.HisHosxpPcuModel();
        break;
    case 'hospitalos':
        hisModel = new his_hospitalos_1.HisHospitalOsModel();
        break;
    case 'emrsoft':
        hisModel = new his_emrsoft_1.HisEmrSoftModel();
        break;
    case 'jhos':
        hisModel = new his_jhos_1.HisJhosModel();
        break;
    case 'pmk':
        hisModel = new his_pmk_1.HisPmkModel();
        break;
    case 'meedee':
        hisModel = new his_md_1.HisMdModel();
        break;
    case 'kpstat':
        hisModel = new his_kpstat_1.HisKpstatModel();
        break;
    case 'spdc':
        hisModel = new his_spdc_1.HisSpdcModel();
        break;
    case 'mkhospital':
        hisModel = new his_mkhospital_1.HisMkhospitalModel();
        break;
    case 'medical2020':
        hisModel = new his_medical2020_1.HisMedical2020Model();
        break;
    case 'haos':
        hisModel = new his_haos_1.HisHaosModel();
        break;
    default:
        hisModel = new his_1.HisModel();
}
exports.default = hisModel;
