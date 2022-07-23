"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const HttpStatus = require("http-status-codes");
const refer_1 = require("../../models/refer/refer");
const request = require('request');
var crypto = require('crypto');
const referModel = new refer_1.ReferModel();
const router = (fastify, {}, next) => {
    fastify.get('/', (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        reply.send({
            api: 'nRefer@Hospital'
        });
    }));
    fastify.get('/tbl', (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield referModel.getTableName(fastify.dbRefer);
            reply.status(HttpStatus.OK).send({ statusCode: HttpStatus.OK, tblCount: result.length });
        }
        catch (error) {
            console.log('tbl', error.message);
            reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) });
        }
    }));
    next();
};
module.exports = router;
