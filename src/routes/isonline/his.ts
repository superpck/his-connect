import { StatusCodes, getReasonPhrase } from 'http-status-codes';
// แก้ไขเพื่อใช้ merged models จาก his_merged/ (2026-08-30)
// Imports now point to models/his_merged/ instead of models/isonline/
import { HisModel } from './../../models/his_merged/his';
// import { HisEzhospModel } from './../../models/his_merged/his_ezhosp'; // Not copied - not used
import { HisHosxpv3Model } from './../../models/his_merged/his_hosxpv3';
import { HisHosxpv4Model } from './../../models/his_merged/his_hosxpv4';
import { HisSsbModel } from './../../models/his_merged/his_ssb_model';
import { HisInfodModel } from './../../models/his_merged/his_infod';
import { HisHimproModel } from './../../models/his_merged/his_himpro';
import { HisHiModel } from './../../models/his_merged/his_hi';
import { HisHosxpPcuModel } from './../../models/his_merged/his_hosxppcu';
import { HisJhcisModel } from './../../models/his_merged/his_jhcis';
import { HisHospitalOsModel } from './../../models/his_merged/his_hospitalos';
import { HisSpdcModel } from './../../models/his_merged/his_spdc';
import { HisMdModel } from './../../models/his_merged/his_md';
import { HisPmkModel } from './../../models/his_merged/his_pmk';
import { HisJhosModel } from './../../models/his_merged/his_jhos';
import { HisMedical2020Model } from '../../models/his_merged/his_medical2020';
import { HisEmrSoftModel } from '../../models/his_merged/his_emrsoft';
import { HisKpstatModel } from '../../models/his_merged/his_kpstat';
import { HisMkhospitalModel } from '../../models/his_merged/his_mkhospital';
import { HisHaosModel } from '../../models/his_merged/his_haos';

import { Jwt } from './../../plugins/jwt';
import moment = require('moment');
var jwt = new Jwt();

const provider = process.env.HIS_PROVIDER.toLowerCase();
let hisModel: any;

switch (provider) {
  case 'ezhosp':
  case 'ihospital':
    hisModel = new HisModel(); // HisEzhospModel not copied from isonline
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
    hisModel = new HisHosxpPcuModel();
    break;
  case 'hospitalos':
  case 'hospitalosv4':
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
  case 'mitnet':
    hisModel = new HisMitnetModel();
    break;
  case 'vpm':
    hisModel = new HisVpmHModel();
    break;
  default:
    hisModel = new HisModel();
}

import hisReferModel from './../his/hismodel';
import { HisMitnetModel } from '../../models/his/his_mitnet';
import { HisVpmHModel } from '../../models/his/his_vpm';

const hisProviderList = ['ihospital', 'hosxpv3', 'hosxpv4', 'hosxppcu', 'infod', 'homc', 'ssb'
  , 'hospitalos', 'jhcis', 'kpstat', 'md', 'mkhospital', 'thiades'
  , 'himpro', 'nemo', 'mypcu', 'emrsoft', 'haos', 'other'];

const router = (fastify, { }, next) => {

  fastify.get('/alive', async (req: any, res: any) => {
    let result: any;
    try {
      result = await hisReferModel.testConnect(global.dbHIS);
    } catch (error) {
    }
    try {
      if (!result || !result.connection) {
        result = await hisModel.testConnect(global.dbHIS);
      }

      res.send({
        statusCode: result?.connection ? StatusCodes.OK : StatusCodes.NO_CONTENT,
        ok: result?.connection,
        version: global.appDetail.version,
        subVersion: global.appDetail.subVersion,
        apiStartTime: global.apiStartTime,
        hisProvider: process.env.HIS_PROVIDER,
        client: process.env.HIS_DB_CLIENT,
        connection: result?.connection,
        charset: result?.charset,
        hospname: result?.hospname
      });
    } catch (error) {
      console.log('alive fail', error.message);
      res.send({
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        hisProvider: process.env.HIS_PROVIDER,
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
