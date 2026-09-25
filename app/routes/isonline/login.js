"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const moment_1 = __importDefault(require("moment"));
const crypto = require('crypto');
const login_1 = require("../../models/isonline/login");
const moph_refer_1 = require("../../middleware/moph-refer");
const loginModel = new login_1.IsLoginModel();
const router = (fastify, {}, next) => {
    fastify.post('/login-by-code', async (req, res) => {
        let body = req.body;
        let loginCode = body.loginCode;
        if (loginCode) {
            try {
                const validCode = await (0, moph_refer_1.checkSignInCode)(loginCode);
                if (!validCode) {
                    return res.send({
                        statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                        message: 'Invalid or expired code'
                    });
                }
                const data = await (0, moph_refer_1.checkLoginCode)(loginCode);
                if (data && data.statusCode === 200) {
                    let today = (0, moment_1.default)().format('YYYY-MM-DD HH:mm:ss');
                    let expire = (0, moment_1.default)().add(3, 'hours').format('YYYY-MM-DD HH:mm:ss');
                    const tokenKey = crypto.createHash('md5').update(today + expire).digest('hex');
                    const payload = {
                        hcode: process.env.HOSPCODE,
                        tokenKey: tokenKey,
                        create: today,
                        expire: expire
                    };
                    const token = fastify.jwt.sign(payload, { expiresIn: '8h' });
                    return res.send({
                        statusCode: http_status_codes_1.StatusCodes.OK,
                        token: token, data
                    });
                }
                else {
                    return res.send({
                        statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                        message: 'Invalid login code'
                    });
                }
            }
            catch (error) {
                console.error('login-by-code error:', error.message);
                return res.send({
                    statusCode: error?.status || 500,
                    message: error.message
                });
            }
        }
        else {
            return res.send({
                statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.UNAUTHORIZED)
            });
        }
    });
    fastify.post('/token-status/:tokenKey', { preHandler: [fastify.authenticate] }, async (req, res) => {
        let tokenKey = req.params.tokenKey;
        if (tokenKey) {
            try {
                const result = await loginModel.checkToken(global.dbISOnline, tokenKey);
                if (result.length) {
                    res.send({
                        statusCode: http_status_codes_1.StatusCodes.OK,
                        status: http_status_codes_1.StatusCodes.OK,
                        ok: true,
                        rows: result
                    });
                }
                else {
                    res.send({
                        statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                        status: http_status_codes_1.StatusCodes.BAD_REQUEST,
                        ok: false,
                        message: 'Invalid token'
                    });
                }
            }
            catch (error) {
                res.send({
                    statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                    status: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                    ok: false,
                    message: error.message
                });
            }
        }
        else {
            res.send({
                statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                status: http_status_codes_1.StatusCodes.BAD_REQUEST,
                ok: false,
                message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST)
            });
        }
    });
    fastify.post('/token-status__/:tokenKey', { preHandler: [fastify.authenticate] }, async (req, res) => {
        verifyToken(req, res);
        let tokenKey = req.params.tokenKey;
        if (tokenKey) {
            loginModel.checkToken(global.dbISOnline, tokenKey)
                .then((results) => {
                if (results.length) {
                    res.send({
                        statusCode: http_status_codes_1.StatusCodes.OK,
                        status: 200,
                        ok: true,
                        rows: results
                    });
                }
                else {
                    res.send({
                        statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                        status: 400,
                        ok: false,
                        message: 'Invalid token'
                    });
                }
            })
                .catch(err => {
                console.log('token-status', err.message);
                res.send({
                    statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                    status: 500,
                    ok: false,
                    message: err.message
                });
            });
        }
        else {
            res.send({
                statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                status: 400,
                ok: false,
                message: 'Token not found'
            });
        }
    });
    async function verifyToken(req, res) {
        let token = null;
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            token = req.headers.authorization.split(' ')[1];
        }
        else if (req.query && req.query.token) {
            token = req.query.token;
        }
        else if (req.body && req.body.token) {
            token = req.body.token;
        }
        try {
            await fastify.jwt.verify(token);
            return true;
        }
        catch (error) {
            console.log('authen fail!', error.message);
            res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).send({
                statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                message: error.message
            });
        }
    }
    next();
};
exports.default = router;
