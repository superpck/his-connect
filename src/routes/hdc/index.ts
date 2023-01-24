

import { Knex } from 'knex';
import * as fastify from 'fastify';

const router = (fastify, { }, next) => {
  var db: Knex = fastify.knex;

  fastify.get('/', async (req: any, reply: any) => {
    reply.send({ api: 'hdc' });
  })

  next();
}


module.exports = router;
