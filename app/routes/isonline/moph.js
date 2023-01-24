"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const router = (fastify, {}, next) => {
    fastify.get('/', async (req, reply) => {
        reply.send({ api: 'MoPH ISOnline' });
    });
    fastify.post('/token-create', async (req, reply) => {
        let username = req.body.username;
        let password = req.body.password;
        reply.send({ api: 'MoPH ISOnline' });
    });
    next();
};
module.exports = router;
