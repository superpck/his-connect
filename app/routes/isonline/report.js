"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const HttpStatus = require("http-status-codes");
const moment = require("moment");
const report_1 = require("../../models/isonline/report");
const reportModel = new report_1.IsReportModel;
const router = (fastify, {}, next) => {
    fastify.post('/', async (req, reply) => {
        verifyToken(req, reply);
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            reply.send({ ok: false, error: 'token error' });
            return false;
        }
        let reportID = req.body.reportID;
        let hospCode = req.body.hospCode;
        let date1 = req.body.date1;
        let date2 = req.body.date2;
        let region = req.body.region;
        let changwat = req.body.changwat;
        let Where = req.body.Where;
        if (reportID) {
            try {
                await reportModel.getReport(global.dbISOnline, reportID)
                    .then((results) => {
                    console.log("\nreport id:" + reportID);
                    const row = results[0];
                    let rawSql = row.sql;
                    if (rawSql && rawSql !== '') {
                        const Where = " hosp='" + hospCode + "' and adate between '" +
                            moment(date1).format('YYYY-MM-DD') + " 00:00:00' and '" +
                            moment(date2).format('YYYY-MM-DD') + " 23:59:59' ";
                        if (rawSql.search(/<where>/gi)) {
                            rawSql = rawSql.replace(/<where>/gi, ' where ' + Where);
                        }
                        if (rawSql.search(/<wheredate>/gi)) {
                            rawSql = rawSql.replace(/<wheredate>/gi, Where + ' and  ');
                        }
                        if (row.report_sql !== '') {
                            rawSql = row.report_sql.replace(/<sql>/gi, '(' + rawSql + ') ');
                            if (region !== '' || changwat !== '') {
                                let Where = (region === '' ? '' : ("region='" + region + "' "));
                                Where = Where +
                                    (changwat === '' ? '' : ((Where === '' ? '' : ' and ') +
                                        " changwatcode='" + changwat + "' "));
                                rawSql = rawSql + ' where ' + Where;
                            }
                            if (row.columns_group !== '') {
                                rawSql = rawSql + ' group by ' + row.columns_group;
                            }
                        }
                        console.log("\r\n SQL: \r\n ");
                        console.log(rawSql);
                        console.log("\r\n");
                        reportModel.getData(global.dbISOnline, rawSql)
                            .then((results) => {
                            console.log("\nreport id:" + reportID + ' result = ' + results[0].length);
                            reply.send({ ok: true, rows: results[0] });
                        })
                            .catch(error => {
                            reply.send({ ok: false, error: error });
                        });
                    }
                    ;
                });
            }
            catch (error) {
                console.log(error);
                reply.send({ ok: false, error: error.message });
            }
        }
        else {
            reply.send({ ok: false, error: 'report id not found' });
        }
    });
    fastify.post('/report1', async (req, reply) => {
        verifyToken(req, reply);
        let tokenKey = req.body.tokenKey;
        if (tokenKey === '') {
            reply.send({ ok: false, error: 'token error' });
            return false;
        }
        let reportID = req.body.reportID;
        let hospCode = req.body.hospCode;
        let reportCond = {
            reportType: req.body.reportType,
            hospCode: req.body.hospCode,
            date1: req.body.date1,
            date2: req.body.date2,
            region: req.body.region,
            prov: req.body.prov,
        };
        reportModel.getReport1(global.dbISOnline, reportCond)
            .then((results) => {
            console.log("token: " + tokenKey + " report ID: " + reportID + " hcode: " + hospCode + ' result: ' + results[0].length + ' record<s>');
            reply.send({ ok: true, rows: results[0] });
        })
            .catch(error => {
            reply.send({ ok: false, error: error });
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
            res.status(HttpStatus.UNAUTHORIZED).send({
                statusCode: HttpStatus.UNAUTHORIZED,
                message: error.message
            });
        }
    }
    next();
};
module.exports = router;
