"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const his_model_1 = require("./../../models/isonline/his.model");
const his_ezhosp_model_1 = require("./../../models/isonline/his_ezhosp.model");
const his_hosxpv3_model_1 = require("./../../models/isonline/his_hosxpv3.model");
const his_hosxpv4_model_1 = require("./../../models/isonline/his_hosxpv4.model");
const his_ssb_model_1 = require("./../../models/isonline/his_ssb.model");
const his_infod_model_1 = require("./../../models/isonline/his_infod.model");
const his_himpro_model_1 = require("./../../models/isonline/his_himpro.model");
const his_hi_model_1 = require("./../../models/isonline/his_hi.model");
const his_hosxppcu_model_1 = require("./../../models/isonline/his_hosxppcu.model");
const his_jhcis_model_1 = require("./../../models/isonline/his_jhcis.model");
const his_hospitalos_model_1 = require("./../../models/isonline/his_hospitalos.model");
const his_spdc_model_1 = require("./../../models/isonline/his_spdc.model");
const his_md_model_1 = require("./../../models/isonline/his_md.model");
const his_pmk_model_1 = require("./../../models/isonline/his_pmk.model");
const his_jhos_model_1 = require("./../../models/isonline/his_jhos.model");
const his_medical2020_model_1 = require("../../models/isonline/his_medical2020.model");
const his_emrsoft_model_1 = require("../../models/isonline/his_emrsoft.model");
const his_kpstat_1 = require("../../models/his/his_kpstat");
const his_mkhospital_model_1 = require("../../models/isonline/his_mkhospital.model");
const his_haos_model_1 = require("../../models/isonline/his_haos.model");
const hisProvider = (process.env.HIS_PROVIDER || 'unknown-his').toLowerCase();
let hisModel;
switch (hisProvider) {
    case 'ezhosp':
    case 'ihospital':
        hisModel = new his_ezhosp_model_1.HisEzhospModel();
        break;
    case 'hosxpv3':
        hisModel = new his_hosxpv3_model_1.HisHosxpv3Model();
        break;
    case 'hosxpv4':
        hisModel = new his_hosxpv4_model_1.HisHosxpv4Model();
        break;
    case 'ssb':
        hisModel = new his_ssb_model_1.HisSsbModel();
        break;
    case 'infod':
    case 'homc':
        hisModel = new his_infod_model_1.HisInfodModel();
        break;
    case 'hi':
        hisModel = new his_hi_model_1.HisHiModel();
        break;
    case 'himpro':
        hisModel = new his_himpro_model_1.HisHimproModel();
        break;
    case 'jhcis':
        hisModel = new his_jhcis_model_1.HisJhcisModel();
        break;
    case 'hosxppcu':
        hisModel = new his_hosxppcu_model_1.HisHosxppcuModel();
        break;
    case 'hospitalos':
        hisModel = new his_hospitalos_model_1.HisHospitalOsModel();
        break;
    case 'emrsoft':
        hisModel = new his_emrsoft_model_1.HisEmrSoftModel();
        break;
    case 'jhos':
        hisModel = new his_jhos_model_1.HisJhosModel();
        break;
    case 'pmk':
        hisModel = new his_pmk_model_1.HisPmkModel();
        break;
    case 'meedee':
        hisModel = new his_md_model_1.HisMdModel();
        break;
    case 'kpstat':
        hisModel = new his_kpstat_1.HisKpstatModel();
        break;
    case 'spdc':
        hisModel = new his_spdc_model_1.HisSpdcModel();
        break;
    case 'mkhospital':
        hisModel = new his_mkhospital_model_1.HisMkhospitalModel();
        break;
    case 'medical2020':
        hisModel = new his_medical2020_model_1.HisMedical2020Model();
        break;
    case 'haos':
        hisModel = new his_haos_model_1.HisHaosModel();
        break;
    default:
        hisModel = new his_model_1.HisModel();
}
exports.default = hisModel;
