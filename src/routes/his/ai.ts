import { ipdData } from '../../controllers/his/ipd.controller';

const aiRouter = (fastify, { }, next) => {
  fastify.get('/', (req: any, reply: any) => {
    return reply.status(200).send({ status: 200, message: 'HIS AI' });
  });
  
  fastify.get('/ipd-visit-data/:an', { preHandler: [fastify.authenticate] }, (req: any, reply: any) => {
    if (!req.use || !req.user.uid) {
      return reply.status(401).send({ status: 401, message: 'Forbidden' });
    }
    return ipdData(req, reply);
  });

  next();
}

export default aiRouter;
