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

import { Jwt } from './../../plugins/jwt';
import moment = require('moment');
var jwt = new Jwt();

const provider = process.env.HIS_PROVIDER.toLowerCase();
let hisModel: any;

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

const hisProviderList = ['ihospital', 'hosxpv3', 'hosxpv4', 'hosxppcu', 'infod', 'homc', 'ssb'
  , 'hospitalos', 'jhcis', 'kpstat', 'md', 'mkhospital', 'thiades'
  , 'himpro', 'nemo', 'mypcu', 'emrsoft', 'haos', 'other'];

const router = (fastify, { }, next) => {

  fastify.get('/alive', async (req: any, res: any) => {
    try {
      const result = await hisModel.testConnect(global.dbHIS);
      res.send({
        statusCode: (result && result.length > 0) ? StatusCodes.OK : StatusCodes.NO_CONTENT,
        ok: result && result.length > 0,
        version: global.appDetail.version,
        subVersion: global.appDetail.subVersion,
        hisProvider: process.env.HIS_PROVIDER,
        connection: result && result.length > 0,
        message: result && result.length > 0 ? undefined : (result.message || result)
      });
    } catch (error) {
      console.log('alive fail', error.message);
      res.send({
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        hisProvider: hisProviderList.indexOf(process.env.HIS_PROVIDER) >= 0,
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
  });

  fastify.post('/person', { preHandler: [fastify.authenticate] }, async (req: any, res: any) => {
    let columnName: string = req.body.columnName;
    let searchText: any = req.body.searchText;
    if (columnName && searchText) {
      try {
        const rows = await hisModel.getPerson(global.dbHIS, columnName, searchText);
        res.send({ statusCode: StatusCodes.OK, rows });
      } catch (error) {
        console.log('person', error.message);
        res.send({
          statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
          message: error.message
        })
      }
    }
  });

  fastify.post('/opd-service', { preHandler: [fastify.authenticate] }, async (req: any, res: any) => {
    let hn: string = req.body.hn;
    let date: string = req.body.date;
    let visitNo: string = req.body.visitNo || '';

    if (visitNo + hn) {
      try {
        const rows = await hisModel.getOpdService(global.dbHIS, hn, date, 'vn', visitNo);
        res.send({ statusCode: StatusCodes.OK, rows });
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
  });

  fastify.post('/opd-service-by-vn', { preHandler: [fastify.authenticate] }, async (req: any, res: any) => {
    let visitNo: any = req.body.visitNo;
    let where: any = req.body.where;
    if (visitNo) {
      try {
        const rows = await hisModel.getOpdServiceByVN(global.dbHIS, visitNo, where);
        res.send({ statusCode: StatusCodes.OK, rows });
      } catch (error) {
        console.log('opd-service-by-vn', error.message);
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
  });

  fastify.post('/opd-diagnosis', { preHandler: [fastify.authenticate] }, async (req: any, res: any) => {
    let visitNo: string = req.body.visitNo || req.body.vn;

    if (visitNo) {
      try {
        const result = await hisModel.getDiagnosisOpd(global.dbHIS, visitNo);
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
  });

  fastify.post('/opd-diagnosis-vwxy', { preHandler: [fastify.authenticate] }, async (req: any, res: any) => {
    let date: any = req.body.date || moment().format('YYYY-MM-DD');
    try {
      const rows = await hisModel.getDiagnosisOpdVWXY(global.dbHIS, date);
      res.send({ statusCode: StatusCodes.OK, rows });
    } catch (error) {
      console.log('opd-diagnosis-vwxy', error.message);
      res.send({
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: error.message
      })
    }
  });

  async function decodeToken(req) {
    let token: string = null;
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.body && req.body.token) {
      token = req.body.token;
    }
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
