"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
var http = require('http');
var fs = require('fs');
const opsUrl1 = 'gishealth.moph.go.th';
const Path1 = '/api/get_gishealth.php';
const opsUrl2 = '203.157.88.8';
const Path2 = '/kkh/ws/moph/ops.php';
const router = (fastify, {}, next) => {
    fastify.post('/general1', async (req, res) => {
        verifyToken(req, res);
        let url = req.body.url;
        let path = req.body.path;
        let hospCode = req.body.hospCode;
        let tokenKey = req.body.tokenKey;
        var opsUrl = 'gishealth.moph.go.th';
        var Path = '/api/get_gishealth.php?type=1&area=1&pcode=5';
        var options = {
            host: opsUrl,
            port: 80,
            path: Path
        };
        http.get(options, function (res) {
            console.log("Got response: " + res.statusCode);
            res.on("data", function (chunk) {
                res.send('BODY:' + chunk);
            });
        }).on('error', function (e) {
            res.send(e);
        });
    });
    fastify.post('/general', async (req, res) => {
        verifyToken(req, res);
        var str = '';
        let type = req.body.type;
        let path = req.body.path;
        let hospCode = req.body.hospCode;
        let tokenKey = req.body.tokenKey;
        if (!tokenKey || tokenKey === '') {
            res.send({ ok: false, data: null });
        }
        var options = {
            host: opsUrl1,
            path: `${Path1}${path}`
        };
        http.request(options, function (response) {
            response.on('data', function (chunk) {
                str += chunk;
            });
            response.on('end', function () {
                res.send({ ok: true, data: str });
            });
        }).end();
    });
    fastify.post('/general2', async (req, res) => {
        verifyToken(req, res);
        var str = '';
        let type = req.body.type;
        let path = req.body.path;
        let hospCode = req.body.hospCode;
        let tokenKey = req.body.tokenKey;
        if (!tokenKey || tokenKey === '') {
            res.send({ ok: false, data: null });
        }
        var options = {
            host: opsUrl2,
            path: `${Path2}${path}`
        };
        http.request(options, function (response) {
            response.on('data', function (chunk) {
                str += chunk;
            });
            response.on('end', function () {
                res.send(str);
            });
        }).end();
    });
    fastify.post('/items', async (req, res) => {
        verifyToken(req, res);
        var str = '';
        let type = req.body.type;
        let date1 = req.body.date1;
        let date2 = req.body.date2;
        let hn = req.body.hn;
        let hospCode = req.body.hospCode;
        let tokenKey = req.body.tokenKey;
        let path = '';
        if (type === 'date') {
            path = `/sl-ems/dist/rest_main_sems_by_period_datetime?user=testaccount01&key=49SI5J2uyVwx5h5bJ5Gn&start=${date1} 00:00:00&end=${date2} 23:59:59 `;
        }
        else {
            path = `/sl-ems/dist/rest_main_sems_by_searchkey?user=testaccount01&key=49SI5J2uyVwx5h5bJ5Gn&searchkey=${hn}`;
        }
        var options = {
            host: '35.185.177.172',
            path: path
        };
        console.log(options);
        if (!tokenKey || tokenKey === '') {
            res.send({ ok: false, data: null });
        }
        http.request(options, function (response) {
            response.on('data', function (chunk) {
                str += chunk;
            });
            response.on('end', function () {
                res.send({ ok: true, data: str });
            });
        }).end();
    });
    fastify.post('/general-data', async (req, res) => {
        verifyToken(req, res);
        let type = req.body.type;
        let area = req.body.area;
        let pcode = req.body.pcode;
        let hospCode = req.body.hospCode;
        let tokenKey = req.body.tokenKey;
        if (!tokenKey || tokenKey === '') {
            res.send({ ok: false, data: null });
        }
        http.request({
            uri: opsUrl1 +
                `${Path1}?type=${type}&area=${area}&pcode=${pcode}`,
            method: "GET",
            timeout: 10000,
            followRedirect: true,
            maxRedirects: 10
        }, function (error, response, body) {
            res.send(body);
        });
    });
    fastify.post('/general-data2', async (req, res) => {
        verifyToken(req, res);
        let type = req.body.type;
        let area = req.body.area;
        let pcode = req.body.pcode;
        let hospCode = req.body.hospCode;
        let tokenKey = req.body.tokenKey;
        if (!tokenKey || tokenKey === '') {
            res.send({ ok: false, data: null });
        }
        http.request({
            uri: opsUrl2 +
                `${Path2}?type=${type}&area=${area}&pcode=${pcode}`,
            method: "GET",
            timeout: 10000,
            followRedirect: true,
            maxRedirects: 10
        }, function (error, response, body) {
            res.send(body);
        });
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
module.exports = router;
