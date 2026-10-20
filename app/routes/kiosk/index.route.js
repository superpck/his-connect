"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const kiosk_controller_1 = require("../../controllers/kiosk/kiosk.controller");
const router = (fastify, {}, next) => {
    fastify.get('/', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        reply.send({
            status: 200,
            message: 'OK',
            date: (0, dayjs_1.default)().format('YYYY-MM-DD HH:mm:ss')
        });
    });
    fastify.post('/create-token', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        return (0, kiosk_controller_1.signIn)(req, reply);
    });
    fastify.post('/person', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        return (0, kiosk_controller_1.person)(req, reply);
    });
    fastify.post('/save-kiosk-data', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        return (0, kiosk_controller_1.saveIoTData)(req, reply);
    });
    next();
};
exports.default = router;
