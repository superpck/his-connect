"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const router = (fastify, {}, next) => {
    fastify.get('/', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        reply.send(http_status_codes_1.StatusCodes.OK);
    });
    next();
};
module.exports = router;
