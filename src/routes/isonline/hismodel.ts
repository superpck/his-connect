// ห้ามแก้ไข file นี้ //
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { HisModel } from './../../models/isonline/his.model';
import { HisEzhospModel } from './../../models/isonline/his_ezhosp.model';
import { HisHosxpv3Model } from './../../models/isonline/his_hosxpv3.model';
import { HisHosxpv4Model } from './../../models/isonline/his_hosxpv4.model';
import { HisSsbModel } from './../../models/isonline/his_ssb.model';
import { HisInfodModel } from './../../models/isonline/his_infod.model';
import { HisHimproModel } from './../../models/isonline/his_himpro.model';
import { HisHiModel } from './../../models/isonline/his_hi.model';
import { HisHosxppcuModel } from './../../models/isonline/his_hosxppcu.model';
import { HisJhcisModel } from './../../models/isonline/his_jhcis.model';
import { HisHospitalOsModel } from './../../models/isonline/his_hospitalos.model';
import { HisSpdcModel } from './../../models/isonline/his_spdc.model';
import { HisMdModel } from './../../models/isonline/his_md.model';
import { HisPmkModel } from './../../models/isonline/his_pmk.model';
import { HisJhosModel } from './../../models/isonline/his_jhos.model';
import { HisMedical2020Model } from '../../models/isonline/his_medical2020.model';
import { HisEmrSoftModel } from '../../models/isonline/his_emrsoft.model';
import { HisKpstatModel } from '../../models/his/his_kpstat';
import { HisMkhospitalModel } from '../../models/isonline/his_mkhospital.model';
import { HisHaosModel } from '../../models/isonline/his_haos.model';

const hisProvider = (process.env.HIS_PROVIDER || 'unknown-his').toLowerCase();

let hisModel: any;
switch (hisProvider) {
  case 'ezhosp':
  case 'ihospital':
    hisModel = new HisEzhospModel();
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
    hisModel = new HisHosxppcuModel();
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
