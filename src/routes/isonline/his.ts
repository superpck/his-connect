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
import { IsLoginModel } from './../../models/isonline/login';
import { HisMedical2020Model } from '../../models/isonline/his_medical2020.model';
import { HisKpstatModel } from '../../models/refer/his_kpstat';

import { Jwt } from './../../plugins/jwt';
var jwt = new Jwt();

const loginModel = new IsLoginModel();
const hisModels = {
  ezhosp: new HisEzhospModel(),
  ihospital: new HisEzhospModel(),
  hosxpv3: new HisHosxpv3Model(),
  hosxpv4: new HisHosxpv4Model(),
  hosxppcu: new HisHosxppcuModel(),
  hospos: new HisHospitalOsModel(),
  jhosp: new HisJhosModel(),
  jhcis: new HisJhcisModel(),
  ssb: new HisSsbModel(),
  homc: new HisInfodModel(),
  hi: new HisHiModel(),
  himpro: new HisHimproModel(),
  pmk: new HisPmkModel(),
  spdc: new HisSpdcModel(),
  meedee: new HisMdModel(),
  other: new HisModel()
};

const provider = process.env.HIS_PROVIDER;
let hisModel: any;
let errorRespond = {};
let currentRoutePath = '';

switch (provider) {
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
  case 'medical2020':
    hisModel = new HisMedical2020Model();
    break;

  default:
    hisModel = new HisModel();
}

const dbName = process.env.HIS_DB_NAME;
const allowTableNames = [
  'patient', 'view_opd_visit', 'opd_dx', 'opd_op', 'opd_vs', 'ipd_ipd', 'view_pharmacy_opd_drug_item',
];

const router = (fastify, { }, next) => {

  fastify.get('/alive', async (req: any, res: any) => {
    try {
      const result = await hisModel.testConnect(global.dbHIS);
      global.dbHIS.destroy;
      if (result && result.length) {
        res.send({
          statusCode: StatusCodes.OK,
          ok: true,
          startServerTime: fastify.startServerTime,
          hisProvider: process.env.HIS_PROVIDER,
          version: global.appDetail.version,
          subVersion: global.appDetail.subVersion,
          connection: true
        });
      } else {
        res.send({
          statusCode: StatusCodes.NO_CONTENT,
          ok: true, startServerTime: fastify.startServerTime,
          hisProvider: process.env.HIS_PROVIDER,
          version: global.appDetail.version,
          subVersion: global.appDetail.subVersion,
          connection: false,
          message: result
        });
      }
    } catch (error) {
      console.log('alive fail', error.message);
      res.send({
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        status: 500,
        ok: false,
        hisProvider: provider,
        connection: false,
        message: error.message
      })
    }
  })

  fastify.post('/alive', { preHandler: [fastify.authenticate] }, async (req: any, res: any) => {
    try {
      const result = await hisModel.getTableName(global.dbHIS);
      if (result && result.length) {
        res.send({
          statusCode: StatusCodes.OK,
          ok: true,
          version: global.appDetail.version,
          subVersion: global.appDetail.subVersion,
          hisProvider: process.env.HIS_PROVIDER,
          connection: true
        });
      } else {
        res.send({
          statusCode: StatusCodes.NO_CONTENT,
          ok: true,
          hisProvider: process.env.HIS_PROVIDER,
          connection: false,
          message: result
        });
      }
    } catch (error) {
      console.log('alive fail', error.message);
      res.send({
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        status: 500,
        ok: false,
        hisProvider: provider,
        connection: false,
        message: error.message
      })
    }
  })

  fastify.post('/showTbl', { preHandler: [fastify.authenticate] }, async (req: any, res: any) => {
    try {
      const result = await hisModel.getTableName(global.dbHIS);
      res.send({
        statusCode: StatusCodes.OK,
        rows: result
      });
    } catch (error) {
      console.log('showTbl', error.message);
      res.send({
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: error.message
      })
    }
  })

  fastify.post('/person', async (req: any, res: any) => {
    const userInfo: any = await decodeToken(req);
    console.log(req.url);
    console.log(userInfo);
    if (!userInfo || !userInfo.hcode) {
      res.send({
        statusCode: StatusCodes.UNAUTHORIZED,
        message: getReasonPhrase(StatusCodes.UNAUTHORIZED)
      });
    } else {
      let columnName: string = req.body.columnName;
      let searchText: string = req.body.searchText;
      console.log('search person', userInfo.hcode);
      if (columnName && searchText) {
        try {
          const result = await hisModel.getPerson(global.dbHIS, columnName, searchText);
          global.dbHIS.destroy;
          res.send({
            statusCode: StatusCodes.OK,
            version: global.appDetail.version,
            subVersion: global.appDetail.subVersion,
            hisProvider: process.env.HIS_PROVIDER,
            reccount: result.length,
            rows: result
          });
        } catch (error) {
          console.log('person', error.message);
          res.send({
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            message: error.message
          })
        }
      } else {
        res.send({
          statusCode: StatusCodes.BAD_REQUEST,
          message: getReasonPhrase(StatusCodes.BAD_REQUEST)
        })

      }

    }
  })

  fastify.post('/opd-service', async (req: any, res: any) => {
    const userInfo: any = await decodeToken(req);
    if (!userInfo || !userInfo.hcode) {
      res.send({
        statusCode: StatusCodes.UNAUTHORIZED,
        message: getReasonPhrase(StatusCodes.UNAUTHORIZED)
      });
    } else {
      let hn: string = req.body.hn;
      let date: string = req.body.date;
      let visitNo: string = req.body.visitNo || '';

      if (visitNo + hn) {
        try {
          const result = await hisModel.getOpdService(global.dbHIS, hn, date, 'vn', visitNo);
          global.dbHIS.destroy;
          res.send({
            statusCode: StatusCodes.OK,
            version: global.appDetail.version,
            subVersion: global.appDetail.subVersion,
            hisProvider: process.env.HIS_PROVIDER,
            reccount: result.length,
            rows: result
          });
        } catch (error) {
          console.log('opd-service', error.message);
          res.send({
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            message: error.message
          })
        }
      } else {
        res.send({
          statusCode: StatusCodes.BAD_REQUEST,
          message: getReasonPhrase(StatusCodes.BAD_REQUEST)
        })
      }
    }
  })

  fastify.post('/opd-diagnosis', async (req: any, res: any) => {
    const userInfo: any = await decodeToken(req);
    if (!userInfo || !userInfo.hcode) {
      res.send({
        statusCode: StatusCodes.UNAUTHORIZED,
        message: getReasonPhrase(StatusCodes.UNAUTHORIZED)
      });
    } else {
      let visitNo: string = req.body.visitNo || req.body.vn;

      if (visitNo) {
        try {
          const result = await hisModel.getDiagnosisOpd(global.dbHIS, visitNo);
          global.dbHIS.destroy;
          res.send({
            statusCode: StatusCodes.OK,
            version: global.appDetail.version,
            subVersion: global.appDetail.subVersion,
            hisProvider: process.env.HIS_PROVIDER,
            reccount: result.length,
            rows: result
          });
        } catch (error) {
          console.log('opd-diagnosis', error.message);
          res.send({
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            message: error.message
          })
        }
      } else {
        res.send({
          statusCode: StatusCodes.BAD_REQUEST,
          message: getReasonPhrase(StatusCodes.BAD_REQUEST)
        })
      }
    }
  })

  async function decodeToken(req) {
    let token: string = null;
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.body && req.body.token) {
      token = req.body.token;
    }
    console.log(token);
    try {
      return await jwt.verify(token);
    } catch (error) {
      console.log('jwtVerify', error);
      return null;
    }
  }

  next();
}

module.exports = router;
