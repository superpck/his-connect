/// <reference path="../../../typings.d.ts" />

import * as fastify from 'fastify';

const router = (fastify, { }, next) => {

  fastify.get('/', { preHandler: [fastify.serviceMonitoring] }, async (req: fastify.Request, reply: fastify.Reply) => {
    reply.send({ api: 'MoPH ISOnline' });
  })

  fastify.post('/token-create', { preHandler: [fastify.serviceMonitoring] }, async (req: fastify.Request, reply: fastify.Reply) => {
    let username = req.body.username;
    let password = req.body.password;
  
    reply.send({ api: 'MoPH ISOnline' });
  })


  next();
}

module.exports = router;
