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
const users_1 = require("../../models/isonline/users");
const userModel = new users_1.IsUserModel;
const router = (fastify, {}, next) => {
    fastify.post('/', { preHandler: [fastify.serviceMonitoring] }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        verifyToken(req, res);
        let id = req.body.idSeach;
        try {
            const result = yield userModel.list(fastify.dbISOnline, id);
            if (id > 0) {
                console.log("is_user id: " + id);
                res.send({
                    statusCode: HttpStatus.OK,
                    ok: true, rows: result[0]
                });
            }
            else {
                console.log("is_user. " + result.length + ' record<s> founded.');
                res.send({
                    statusCode: HttpStatus.OK,
                    ok: true, rows: result
                });
            }
        }
        catch (error) {
            res.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    }));
    fastify.post('/getbyid', { preHandler: [fastify.serviceMonitoring] }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        verifyToken(req, res);
        let id = req.body.idSeach;
        try {
            const result = yield userModel.getByID(fastify.dbISOnline, id);
            console.log("user id: " + id + ', ' + result.length + ' record<s> founded.');
            res.send({
                statusCode: HttpStatus.OK,
                ok: true, rows: result[0]
            });
        }
        catch (error) {
            res.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    }));
    fastify.post('/getbyusername', { preHandler: [fastify.serviceMonitoring] }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        verifyToken(req, res);
        let userName = req.body.userName;
        try {
            const result = yield userModel.getByUserName(fastify.dbISOnline, userName);
            res.send({
                statusCode: HttpStatus.OK,
                ok: true, rows: result[0]
            });
        }
        catch (error) {
            res.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    }));
    fastify.post('/selectData', { preHandler: [fastify.serviceMonitoring] }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        verifyToken(req, res);
        let tableName = req.body.tableName;
        let selectText = req.body.selectText;
        let whereText = req.body.whereText;
        let groupBy = req.body.groupBy;
        let orderText = req.body.orderText;
        try {
            const result = yield userModel.selectSql(fastify.dbISOnline, tableName, selectText, whereText, groupBy, orderText);
            console.log("\nget: " + tableName + ' = ' + result[0].length + ' record<s> founded.');
            res.send({
                statusCode: HttpStatus.OK,
                ok: true, rows: result[0]
            });
        }
        catch (error) {
            res.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
            });
        }
    }));
    fastify.post('/save', { preHandler: [fastify.serviceMonitoring] }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        verifyToken(req, res);
        let id = req.body.id;
        let data = req.body.data;
        try {
            const result = yield userModel.saveUser(fastify.dbISOnline, id, data);
            console.log("\save: user id: " + id);
            res.send({ statusCode: HttpStatus.OK, ok: true, rows: result[0] });
        }
        catch (error) {
            res.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error,
                message: error.message
            });
        }
    }));
    fastify.post('/remove', { preHandler: [fastify.serviceMonitoring] }, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        verifyToken(req, res);
        let id = req.body.id;
        try {
            const result = yield userModel.remove(fastify.dbISOnline, id);
            console.log("\delete: user id: " + id);
            res.send({
                statusCode: HttpStatus.OK,
                ok: true, id: id
            });
        }
        catch (error) {
            res.send({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                ok: false, error: error, message: error.message
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
