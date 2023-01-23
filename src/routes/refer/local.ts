// ห้ามแก้ไข file นี้ // 
import * as fastify from 'fastify';
import * as HttpStatus from 'http-status-codes';
import { ReferModel } from '../../models/refer/refer';
const request = require('request')
var crypto = require('crypto');

const referModel = new ReferModel();

const router = (fastify, { }, next) => {
  // =============================================================
  fastify.get('/', async (req: any, reply: any) => {
    reply.send({
      api: 'nRefer@Hospital'
    });
  });

  // =============================================================
  fastify.get('/tbl', async (req: any, reply: any) => {
    try {
      const result = await referModel.getTableName(fastify.dbRefer);
      reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, tblCount: result.length });
    } catch (error) {
      console.log('tbl', error.message);
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) })
    }
  });

  // =============================================================
  next();
}

module.exports = router;
