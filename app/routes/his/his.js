"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const his_ezhosp_1 = require("../../models/his/his_ezhosp");
const his_thiades_1 = require("../../models/his/his_thiades");
const his_hosxpv3_1 = require("../../models/his/his_hosxpv3");
const his_hosxpv4_1 = require("../../models/his/his_hosxpv4");
const his_hosxppcu_1 = require("../../models/his/his_hosxppcu");
const his_jhcis_1 = require("../../models/his/his_jhcis");
const his_md_1 = require("../../models/his/his_md");
const his_kpstat_1 = require("../../models/his/his_kpstat");
const his_mkhospital_1 = require("../../models/his/his_mkhospital");
const his_1 = require("../../models/his/his");
const his_nemo_1 = require("../../models/his/his_nemo");
const his_pmk_1 = require("../../models/his/his_pmk");
const his_mypcu_1 = require("../../models/his/his_mypcu");
const his_emrsoft_1 = require("../../models/his/his_emrsoft");
const hisProvider = process.env.HIS_PROVIDER;
let hisModel;
switch (hisProvider) {
    case 'ihospital':
    case 'ezhosp':
        hisModel = new his_ezhosp_1.HisEzhospModel();
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
        break;
    case 'infod':
    case 'homc':
        break;
    case 'hi':
        break;
    case 'himpro':
        break;
    case 'jhcis':
        hisModel = new his_jhcis_1.HisJhcisModel();
        break;
    case 'mypcu':
        hisModel = new his_mypcu_1.HisMyPcuModel();
        break;
    case 'hospitalos':
        break;
    case 'jhos':
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
    case 'spdc':
    case 'kpstat':
        hisModel = new his_kpstat_1.HisKpstatModel();
        break;
    default:
        hisModel = new his_1.HisModel();
}
exports.default = hisModel;
