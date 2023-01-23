
import * as fastify from 'fastify';

const router = (fastify, { }, next) => {
  fastify.get('/', async (req: any, reply: any) => {
    reply.send({
      ok: true,
      apiCode: 'RP506',
      apiName: 'Report 506',
      apiDesc: 'Report 506 ระบาดวิทยา',
      version: global.appDetail.version,
      subVersion: global.appDetail.subVersion,
      hospcode: process.env.HOSPCODE
    });
  })

  next();

}

module.exports = router;
