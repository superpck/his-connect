/// <reference path="../../../typings.d.ts" />

import * as Knex from 'knex';
import * as fastify from 'fastify';

const router = (fastify, { }, next) => {
  var db: Knex = fastify.knex;

  fastify.get('/', async (req: fastify.Request, reply: fastify.Reply) => {
    reply.send({ api: 'hdc' });
  })

  next();
}


module.exports = router;
