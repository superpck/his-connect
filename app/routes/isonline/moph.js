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
const router = (fastify, {}, next) => {
    fastify.get('/', { preHandler: [fastify.serviceMonitoring] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        reply.send({ api: 'MoPH ISOnline' });
    }));
    fastify.post('/token-create', { preHandler: [fastify.serviceMonitoring] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        let username = req.body.username;
        let password = req.body.password;
        reply.send({ api: 'MoPH ISOnline' });
    }));
    next();
};
module.exports = router;
