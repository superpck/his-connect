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
const moment = require("moment");
const crypto = require('crypto');
const login_1 = require("../../models/isonline/login");
const loginModel = new login_1.IsLoginModel();
const router = (fastify, {}, next) => {
    fastify.post('/', { preHandler: [fastify.serviceMonitoring] }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        let username = req.body.username;
        let password = req.body.password;
        if (username && password) {
            let encPassword = yield crypto.createHash('sha256').update(password).digest('hex');
            loginModel.doLogin(fastify.dbISOnline, username, encPassword)
                .then((results) => __awaiter(void 0, void 0, void 0, function* () {
                if (results.length) {
                    let today = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
                    let expire = moment().locale('th').add(12, 'hours').format('YYYY-MM-DD HH:mm:ss');
                    const tokenKey = crypto.createHash('md5').update(today + expire).digest('hex');
                    const payload = {
                        fullname: results[0].prename + results[0].fname + ' ' + results[0].lname,
                        uid: results[0].id,
                        hcode: results[0].hcode,
                        username: results[0].username,
                        email: results[0].email,
                        hospprov: results[0].hospprov,
                        hospname: results[0].hospname,
                        level: results[0].user_level,
                        position: results[0].position + results[0].position_level,
                        division: results[0].division,
                        tokenKey: tokenKey,
                        create: today,
                        expire: expire
                    };
                    const token = fastify.jwt.sign(payload, { expiresIn: '8h' });
                    console.log('Login success: ', username);
                    const tokenInfo = {
                        date: today,
                        created_at: today,
                        uid: results[0].id,
                        token: tokenKey,
                        job: 'login',
                        expire: expire,
                        type: 1
                    };
                    yield loginModel.saveToken(fastify.dbISOnline, tokenInfo)
                        .then((saveToken) => {
                        console.log('save token: ', saveToken);
                    }).catch(errort => {
                        console.log('save token: error = ', errort);
                    });
                    res.send({
                        statusCode: HttpStatus.OK,
                        status: 200,
                        ok: true,
                        user: payload, token: token,
                        tokenKey: tokenKey,
                        tokenExpire: expire
                    });
                }
                else {
                    console.log('Login error:', username);
                    res.send({
                        statusCode: HttpStatus.BAD_REQUEST,
                        status: 400, ok: false,
                        message: 'ชื่อผู้ใช้งานหรือรหัสผ่าน ไม่ถูกต้อง'
                    });
                }
            }))
                .catch(err => {
                console.log('login', err.message);
                console.log('Error:', err);
                res.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    status: 500,
                    ok: false,
                    message: err.message
                });
            });
        }
        else {
            res.send({
                statusCode: HttpStatus.BAD_REQUEST,
                status: 400,
                ok: false,
                message: 'กรุณาระบุชื่อผู้ใช้งานและรหัสผ่าน'
            });
        }
    }));
    fastify.post('/token-status/:tokenKey', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        let tokenKey = req.params.tokenKey;
        if (tokenKey) {
            try {
                const result = yield loginModel.checkToken(fastify.dbISOnline, tokenKey);
                if (result.length) {
                    res.send({
                        statusCode: HttpStatus.OK,
                        status: HttpStatus.OK,
                        ok: true,
                        rows: result
                    });
                }
                else {
                    res.send({
                        statusCode: HttpStatus.BAD_REQUEST,
                        status: HttpStatus.BAD_REQUEST,
                        ok: false,
                        message: 'Invalid token'
                    });
                }
            }
            catch (error) {
                res.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    ok: false,
                    message: error.message
                });
            }
        }
        else {
            res.send({
                statusCode: HttpStatus.BAD_REQUEST,
                status: HttpStatus.BAD_REQUEST,
                ok: false,
                message: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST)
            });
        }
    }));
    fastify.post('/token-status__/:tokenKey', { preHandler: [fastify.serviceMonitoring, fastify.authenticate] }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        verifyToken(req, res);
        let tokenKey = req.params.tokenKey;
        if (tokenKey) {
            loginModel.checkToken(fastify.dbISOnline, tokenKey)
                .then((results) => {
                if (results.length) {
                    res.send({
                        statusCode: HttpStatus.OK,
                        status: 200,
                        ok: true,
                        rows: results
                    });
                }
                else {
                    res.send({
                        statusCode: HttpStatus.BAD_REQUEST,
                        status: 400,
                        ok: false,
                        message: 'Invalid token'
                    });
                }
            })
                .catch(err => {
                console.log('token-status', err.message);
                res.send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    status: 500,
                    ok: false,
                    message: err.message
                });
            });
        }
        else {
            res.send({
                statusCode: HttpStatus.BAD_REQUEST,
                status: 400,
                ok: false,
                message: 'Token not found'
            });
        }
    }));
    function verifyToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                yield fastify.jwt.verify(token);
                return true;
            }
            catch (error) {
                console.log('authen fail!', error.message);
                res.status(HttpStatus.UNAUTHORIZED).send({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: error.message
                });
            }
        });
    }
    next();
};
module.exports = router;
