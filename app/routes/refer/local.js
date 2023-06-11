"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const HttpStatus = require("http-status-codes");
const refer_1 = require("../../models/refer/refer");
const request = require('request');
var crypto = require('crypto');
const referModel = new refer_1.ReferModel();
const router = (fastify, {}, next) => {
    fastify.get('/tbl', async (req, reply) => {
        try {
            const result = await referModel.getTableName(fastify.dbRefer);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, tblCount: result.length });
        }
        catch (error) {
            console.log('tbl', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) });
        }
    });
    next();
};
module.exports = router;
