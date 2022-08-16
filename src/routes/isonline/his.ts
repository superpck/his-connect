/// <reference path="../../../typings.d.ts" />

import * as fastify from 'fastify';
import * as HttpStatus from 'http-status-codes';
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

const loginModel = new IsLoginModel();
const hisModels = {
  ezhosp: new HisEzhospModel(),
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

  fastify.get('/alive', { preHandler: [fastify.serviceMonitoring] }, async (req: fastify.Request, res: fastify.Reply) => {
    try {
      const result = await hisModel.testConnect(fastify.dbHIS);
      fastify.dbHIS.destroy;
      if (result && result.length) {
        res.send({
          statusCode: HttpStatus.OK,
          ok: true,
          startServerTime: fastify.startServerTime,
          hisProvider: process.env.HIS_PROVIDER,
          version: fastify.appVersion.version,
          subversion: fastify.appVersion.subVersion,
          connection: true
        });
      } else {
        res.send({
          statusCode: HttpStatus.NO_CONTENT,
          ok: true, startServerTime: fastify.startServerTime,
          hisProvider: process.env.HIS_PROVIDER,
          version: fastify.appVersion.version,
          subversion: fastify.appVersion.subVersion,
          connection: false,
          message: result
        });
      }
    } catch (error) {
      console.log('alive fail', error.message);
      res.send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 500,
        ok: false,
        hisProvider: provider,
        connection: false,
        message: error.message
      })
    }
  })

  fastify.post('/alive', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, async (req: fastify.Request, res: fastify.Reply) => {
    try {
      const result = await hisModel.getTableName(fastify.dbHIS);
      if (result && result.length) {
        res.send({
          statusCode: HttpStatus.OK,
          ok: true,
          version: fastify.appVersion.version,
          subversion: fastify.appVersion.subVersion,
          hisProvider: process.env.HIS_PROVIDER,
          connection: true
        });
      } else {
        res.send({
          statusCode: HttpStatus.NO_CONTENT,
          ok: true,
          hisProvider: process.env.HIS_PROVIDER,
          connection: false,
          message: result
        });
      }
    } catch (error) {
      console.log('alive fail', error.message);
      res.send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 500,
        ok: false,
        hisProvider: provider,
        connection: false,
        message: error.message
      })
    }
  })

  fastify.post('/showTbl', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, async (req: fastify.Request, res: fastify.Reply) => {
    try {
      const result = await hisModel.getTableName(fastify.dbHIS);
      res.send({
        statusCode: HttpStatus.OK,
        rows: result
      });
    } catch (error) {
      console.log('showTbl', error.message);
      res.send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message
      })
    }
  })

  fastify.post('/person', { preHandler: [fastify.serviceMonitoring] }, async (req: fastify.Request, res: fastify.Reply) => {
    let columnName: string = req.body.columnName;
    let searchText: string = req.body.searchText;

    if (columnName && searchText) {
      try {
        const result = await hisModel.getPerson(fastify.dbHIS, columnName, searchText);
        fastify.dbHIS.destroy;
        res.send({
          statusCode: HttpStatus.OK,
          version: fastify.appVersion.version,
          subversion: fastify.appVersion.subVersion,
          hisProvider: process.env.HIS_PROVIDER,
          reccount: result.length,
          rows: result
        });
      } catch (error) {
        console.log('person', error.message);
        res.send({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message
        })
      }
    } else {
      res.send({
        statusCode: HttpStatus.BAD_REQUEST,
        message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
      })

    }
  })

  fastify.post('/opd-service', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, async (req: fastify.Request, res: fastify.Reply) => {
    let hn: string = req.body.hn;
    let date: string = req.body.date;
    let visitNo: string = req.body.visitNo || '';

    if (visitNo + hn) {
      try {
        const result = await hisModel.getOpdService(fastify.dbHIS, hn, date, 'vn', visitNo);
        fastify.dbHIS.destroy;
        res.send({
          statusCode: HttpStatus.OK,
          version: fastify.appVersion.version,
          subversion: fastify.appVersion.subVersion,
          hisProvider: process.env.HIS_PROVIDER,
          reccount: result.length,
          rows: result
        });
      } catch (error) {
        console.log('opd-service', error.message);
        res.send({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message
        })
      }
    } else {
      res.send({
        statusCode: HttpStatus.BAD_REQUEST,
        message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
      })

    }
  })

  fastify.post('/opd-diagnosis', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, async (req: fastify.Request, res: fastify.Reply) => {
    let visitNo: string = req.body.visitNo || req.body.vn;

    if (visitNo) {
      try {
        const result = await hisModel.getDiagnosisOpd(fastify.dbHIS, visitNo);
        fastify.dbHIS.destroy;
        res.send({
          statusCode: HttpStatus.OK,
          version: fastify.appVersion.version,
          subversion: fastify.appVersion.subVersion,
          hisProvider: process.env.HIS_PROVIDER,
          reccount: result.length,
          rows: result
        });
      } catch (error) {
        console.log('opd-diagnosis', error.message);
        res.send({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message
        })
      }
    } else {
      res.send({
        statusCode: HttpStatus.BAD_REQUEST,
        message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
      })

    }
  })

  async function verifyToken(req, res) {
    let token: string = null;

    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    } else if (req.body && req.body.token) {
      token = req.body.token;
    }

    try {
      await fastify.jwt.verify(token);
      return true;
    } catch (error) {
      console.log('authen fail!', error.message);
      res.status(HttpStatus.UNAUTHORIZED).send({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: error.message
      })
    }
  }

  next();
}

module.exports = router;
