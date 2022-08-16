/// <reference path="../../../typings.d.ts" />
import * as fastify from 'fastify';

const router = (fastify, { }, next) => {
  fastify.get('/', async (req: fastify.Request, reply: fastify.Reply) => {
    reply.send({
      ok: true,
      apiCode: 'RP506',
      apiName: 'Report 506',
      apiDesc: 'Report 506 ระบาดวิทยา',
      version: fastify.appVersion.version,
      subversion: fastify.appVersion.subVersion,
      hospcode: process.env.HOSPCODE
    });
  })

  next();

}

module.exports = router;
