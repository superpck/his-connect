"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const router = (fastify, {}, next) => {
    var db = fastify.knex;
    fastify.get('/', async (req, reply) => {
        reply.send({ api: 'hdc' });
    });
    next();
};
module.exports = router;
