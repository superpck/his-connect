"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ipd_controller_1 = require("../../controllers/his/ipd.controller");
const aiRouter = (fastify, {}, next) => {
    fastify.get('/', (req, reply) => {
        return reply.status(200).send({ status: 200, message: 'HIS AI' });
    });
    fastify.get('/ipd-visit-data/:an', { preHandler: [fastify.authenticate] }, (req, reply) => {
        if (!req.use || !req.user.uid) {
            return reply.status(401).send({ status: 401, message: 'Forbidden' });
        }
        return (0, ipd_controller_1.ipdData)(req, reply);
    });
    next();
};
exports.default = aiRouter;
