

import { Knex } from 'knex';
import * as fastify from 'fastify';
import * as HttpStatus from 'http-status-codes';
var http = require('http');

import { CannabisModel } from '../../models/cannabis/cannabis';
import { PmkModel } from '../../models/cannabis/pmk';

const hisProvider = process.env.HIS_PROVIDER;
let cannabisModel: any;
switch (hisProvider) {
  case 'pmk':
    cannabisModel = new PmkModel();
    break;
  default:
    cannabisModel = new CannabisModel();
}

const router = (fastify, { }, next) => {
  fastify.get('/',  async (req: any, reply: any) => {
    reply.send({
      api: 'Cannabis API Serivce',
      version: global.appDetail.version,
      subVersion: global.appDetail.subVersion,
      hisProvider
    });
  })

  fastify.get('/test/db',  async (req: any, reply: any) => {
    try {
      const result: any = await cannabisModel.testConnection(fastify.dbCannabis);
      reply.send(result[0]);
    } catch (error) {
      reply.send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        error
      });
    }
  })

  fastify.post('/test-connection',  async (req: any, reply: any) => {
    try {
      const result: any = await cannabisModel.testConnection(fastify.dbCannabis);
      reply.send({
        statusCode: HttpStatus.OK,
        rows: result
      });
    } catch (error) {
      reply.send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message
      });
    }
  })

  fastify.post('/api/search/person/cid', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const cid = req.body.cid;

    if (cid) {
      try {
        const rows: any = await cannabisModel.searchPatient(fastify.dbCannabis, cid);
        reply.send(rows);
      } catch (error) {
        console.log('patient', error.message);
        reply.send({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message
        });
      }
    } else {
      reply.send({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'not found parameter.'
      });
    }
  })

  fastify.post('/patient', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const cid = req.body.cid;

    if (cid) {
      try {
        const result: any = await cannabisModel.searchPatient(fastify.dbCannabis, cid);
        reply.send({
          statusCode: HttpStatus.OK,
          rows: result
        });
      } catch (error) {
        console.log('patient', error.message);
        reply.send({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message
        });
      }
    } else {
      reply.send({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'not found parameter.'
      });
    }
  })

  fastify.post('/api/search/visit', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const hn = req.body.hn || '';
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;

    if (hn) {
      try {
        const result: any = await cannabisModel.searchVisit(fastify.dbCannabis, hn, startDate, endDate);
        reply.send({
          statusCode: HttpStatus.OK,
          rows: result
        });
      } catch (error) {
        console.log('visit', error.message);
        reply.send({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message
        });
      }
    } else {
      reply.send({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'parameter not found.'
      });
    }
  })

  fastify.post('/visit', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const hn = req.body.hn || '';
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;

    if (hn) {
      try {
        const result: any = await cannabisModel.searchVisit(fastify.dbCannabis, hn, startDate, endDate);
        reply.send({
          statusCode: HttpStatus.OK,
          rows: result
        });
      } catch (error) {
        console.log('visit', error.message);
        reply.send({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message
        });
      }
    } else {
      reply.send({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'parameter not found.'
      });
    }
  })

  fastify.post('/api/patient/info', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const hn = req.body.hn || '';

    if (hn) {
      try {
        const rows: any = await cannabisModel.patientInfo(fastify.dbCannabis, hn);
        reply.send(rows);
      } catch (error) {
        console.log('patient-info', error.message);
        reply.send({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message
        });
      }
    } else {
      reply.send({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'parameter not found.'
      });
    }
  })

  fastify.post('/patient-info', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const hn = req.body.hn || '';

    if (hn) {
      try {
        const result: any = await cannabisModel.patientInfo(fastify.dbCannabis, hn);
        reply.send({
          statusCode: HttpStatus.OK,
          rows: result
        });
      } catch (error) {
        console.log('patient-info', error.message);
        reply.send({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message
        });
      }
    } else {
      reply.send({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'parameter not found.'
      });
    }
  })

  fastify.post('/api/visit/lab', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const hn = req.body.hn || '';
    const vn = req.body.vn || '';

    if (hn && vn) {
      try {
        const data: any = await cannabisModel.getVisitLab(fastify.dbCannabis, hn, vn);
        reply.send({
          statusCode: HttpStatus.OK,
          status: HttpStatus.OK,
          data
        });
      } catch (error) {
        console.log('lab', error.message);
        reply.send({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          error: error.message
        });
      }
    } else {
      reply.send({
        status: HttpStatus.BAD_REQUEST,
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'parameter not found.',
        message: 'parameter not found.'
      });
    }
  })

  fastify.post('/lab', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const hn = req.body.hn || '';
    const vn = req.body.vn || '';

    if (hn && vn) {
      try {
        const result: any = await cannabisModel.getVisitLab(fastify.dbCannabis, hn, vn);
        reply.send({
          statusCode: HttpStatus.OK,
          rows: result
        });
      } catch (error) {
        console.log('lab', error.message);
        reply.send({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message
        });
      }
    } else {
      reply.send({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'parameter not found.'
      });
    }
  })

  fastify.post('/api/visit/drug', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const hn = req.body.hn || '';
    const vn = req.body.vn || '';

    if (hn && vn) {
      try {
        const data: any = await cannabisModel.getVisitDrug(fastify.dbCannabis, hn, vn);
        reply.send({
          status: HttpStatus.OK,
          statusCode: HttpStatus.OK,
          data
        });
      } catch (error) {
        console.log('getVisitDrug', error.message);
        reply.send({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
          message: error.message
        });
      }
    } else {
      reply.send({
        status: HttpStatus.BAD_REQUEST,
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'parameter not found.',
        message: 'parameter not found.'
      });
    }
  })

  fastify.post('/drug', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const hn = req.body.hn || '';
    const vn = req.body.vn || '';

    if (hn && vn) {
      try {
        const result: any = await cannabisModel.getVisitDrug(fastify.dbCannabis, hn, vn);
        reply.send({
          statusCode: HttpStatus.OK,
          rows: result
        });
      } catch (error) {
        console.log('getVisitDrug', error.message);
        reply.send({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message
        });
      }
    } else {
      reply.send({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'parameter not found.'
      });
    }
  })

  fastify.post('/api/visit/appointment', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const hn = req.body.hn || '';
    const vn = req.body.vn || '';

    if (hn && vn) {
      try {
        const data: any = await cannabisModel.getVisitAppointment(fastify.dbCannabis, hn, vn);
        reply.send({
          status: HttpStatus.OK,
          data
        });
      } catch (error) {
        console.log('getVisitAppointment', error.message);
        reply.send({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
          message: error.message
        });
      }
    } else {
      reply.send({
        status: HttpStatus.BAD_REQUEST,
        message: 'parameter not found.'
      });
    }
  })

  fastify.post('/appointment', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const hn = req.body.hn || '';
    const vn = req.body.vn || '';

    if (hn && vn) {
      try {
        const result: any = await cannabisModel.getVisitAppointment(fastify.dbCannabis, hn, vn);
        reply.send({
          statusCode: HttpStatus.OK,
          rows: result
        });
      } catch (error) {
        console.log('getVisitAppointment', error.message);
        reply.send({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message
        });
      }
    } else {
      reply.send({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'parameter not found.'
      });
    }
  })

  fastify.post('/api/visit/diag-text', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const hn = req.body.hn || '';
    const vn = req.body.vn || '';

    if (hn && vn) {
      try {
        const data: any = await cannabisModel.getVisitDiagText(fastify.dbCannabis, hn, vn);
        reply.send({
          status: HttpStatus.OK,
          statusCode: HttpStatus.OK,
          data
        });
      } catch (error) {
        console.log('diag-text', error.message);
        reply.send({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message
        });
      }
    } else {
      reply.send({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'parameter not found.'
      });
    }
  })

  fastify.post('/diag-text', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const hn = req.body.hn || '';
    const vn = req.body.vn || '';

    if (hn && vn) {
      try {
        const result: any = await cannabisModel.getVisitDiagText(fastify.dbCannabis, hn, vn);
        reply.send({
          statusCode: HttpStatus.OK,
          rows: result
        });
      } catch (error) {
        console.log('diag-text', error.message);
        reply.send({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message
        });
      }
    } else {
      reply.send({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'parameter not found.'
      });
    }
  })

  fastify.post('/api/visit/diagnosis', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const hn = req.body.hn || '';
    const vn = req.body.vn || '';

    if (hn && vn) {
      try {
        const data: any = await cannabisModel.getVisitDiagnosis(fastify.dbCannabis, hn, vn);
        reply.send({
          statusCode: HttpStatus.OK,
          status: HttpStatus.OK,
          data
        });
      } catch (error) {
        console.log('diagnosis', error.message);
        reply.send({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message
        });
      }
    } else {
      reply.send({
        status: HttpStatus.BAD_REQUEST,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'parameter not found.'
      });
    }
  })

  fastify.post('/diagnosis', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const hn = req.body.hn || '';
    const vn = req.body.vn || '';

    if (hn && vn) {
      try {
        const result: any = await cannabisModel.getVisitDiagnosis(fastify.dbCannabis, hn, vn);
        reply.send({
          statusCode: HttpStatus.OK,
          rows: result
        });
      } catch (error) {
        console.log('diagnosis', error.message);
        reply.send({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message
        });
      }
    } else {
      reply.send({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'parameter not found.'
      });
    }
  })

  fastify.post('/api/visit/procedures', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const hn = req.body.hn || '';
    const vn = req.body.vn || '';

    if (hn && vn) {
      try {
        const data: any = await cannabisModel.getVisitProcedure(fastify.dbCannabis, hn, vn);
        reply.send({
          status: HttpStatus.OK,
          statusCode: HttpStatus.OK,
          data
        });
      } catch (error) {
        console.log('procedure', error.message);
        reply.send({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message
        });
      }
    } else {
      reply.send({
        status: HttpStatus.BAD_REQUEST,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'parameter not found.'
      });
    }
  })

  fastify.post('/procedure', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const hn = req.body.hn || '';
    const vn = req.body.vn || '';

    if (hn && vn) {
      try {
        const result: any = await cannabisModel.getVisitProcedure(fastify.dbCannabis, hn, vn);
        reply.send({
          statusCode: HttpStatus.OK,
          rows: result
        });
      } catch (error) {
        console.log('procedure', error.message);
        reply.send({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message
        });
      }
    } else {
      reply.send({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'parameter not found.'
      });
    }
  })

  fastify.post('/api/visit/screening', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const hn = req.body.hn || '';
    const vn = req.body.vn || '';

    if (hn && vn) {
      try {
        const result: any = await cannabisModel.getVisitScreening(fastify.dbCannabis, hn, vn);
        reply.send(result);
      } catch (error) {
        console.log('screening', error.message);
        reply.send({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message
        });
      }
    } else {
      reply.send({
        status: HttpStatus.BAD_REQUEST,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'parameter not found.'
      });
    }
  })

  fastify.post('/screening', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const hn = req.body.hn || '';
    const vn = req.body.vn || '';

    if (hn && vn) {
      try {
        const result: any = await cannabisModel.getVisitScreening(fastify.dbCannabis, hn, vn);
        reply.send({
          statusCode: HttpStatus.OK,
          rows: result
        });
      } catch (error) {
        console.log('screening', error.message);
        reply.send({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message
        });
      }
    } else {
      reply.send({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'parameter not found.'
      });
    }
  })

  next();
}


module.exports = router;
