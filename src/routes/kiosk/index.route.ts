import dayjs from 'dayjs';
import { person, saveIoTData, signIn } from '../../controllers/kiosk/kiosk.controller';

const router = (fastify, { }, next) => {
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    reply.send({ 
      status: 200,
      message: 'OK',
      date: dayjs().format('YYYY-MM-DD HH:mm:ss')
    });
  });

  fastify.post('/create-token', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    return signIn(req, reply);
  });

  fastify.post('/person', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    return person(req, reply);
  });

  fastify.post('/save-kiosk-data', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    return saveIoTData(req, reply);
  });

  next();
}
export default router;
