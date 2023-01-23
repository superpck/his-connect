import * as fastify from 'fastify';

const router = (fastify, { }, next) => {

  fastify.get('/',  async (req: any, reply: any) => {
    reply.send({ api: 'MoPH ISOnline' });
  })

  fastify.post('/token-create',  async (req: any, reply: any) => {
    let username = req.body.username;
    let password = req.body.password;
  
    reply.send({ api: 'MoPH ISOnline' });
  })


  next();
}

module.exports = router;
