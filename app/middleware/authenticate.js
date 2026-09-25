"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateRequest = authenticateRequest;
const http_status_codes_1 = require("http-status-codes");
const moment_1 = __importDefault(require("moment"));
async function authenticateRequest(request, reply) {
    request.authenDecoded = null;
    request.user = null;
    if (request.body && request.body.token) {
        request.headers.authorization = 'Bearer ' + request.body.token;
    }
    try {
        request.user = await request.jwtVerify();
        request.authenDecoded = request.user;
    }
    catch (err) {
        console.error((0, moment_1.default)().format('HH:mm:ss.SSS'), request.ipAddr, 'Error client try to access API ' + http_status_codes_1.StatusCodes.UNAUTHORIZED, `message: '${err.message}'`);
        return reply.code(http_status_codes_1.StatusCodes.UNAUTHORIZED).send({
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.UNAUTHORIZED)
        });
    }
}
