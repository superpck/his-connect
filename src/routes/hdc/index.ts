import { FastifyInstance } from 'fastify';
import { StatusCodes } from 'http-status-codes';

const router = (fastify: FastifyInstance, { }, next) => {
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    reply.send(StatusCodes.OK);
  });

  next();
}

module.exports = router;
