"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const HttpStatus = __importStar(require("http-status-codes"));
const report_1 = require("../../models/isonline/report");
const reportModel = new report_1.IsReportModel;
const router = (fastify, {}, next) => {
    fastify.post('/', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        let reportID = req.body.reportID;
        let hospCode = req.body.hospCode;
        let date1 = req.body.date1;
        let date2 = req.body.date2;
        let region = req.body.region;
        let changwat = req.body.changwat;
        if (reportID) {
            try {
                const results = await reportModel.getReport(global.dbISOnline, reportID);
                if (results && results.length) {
                    console.log("\nreport id:" + reportID);
                    const row = results[0];
                    if (row.sql) {
                        let query;
                        try {
                            query = (0, report_1.buildReportQuery)(row.sql, row.report_sql, row.columns_group, {
                                hospCode,
                                date1,
                                date2,
                                region,
                                changwat
                            });
                        }
                        catch (error) {
                            return reply.status(HttpStatus.BAD_REQUEST).send({
                                statusCode: HttpStatus.BAD_REQUEST,
                                ok: false,
                                error: error.message
                            });
                        }
                        console.log("\r\n SQL: \r\n ");
                        console.log(query.sql);
                        console.log("\r\n");
                        const result = await reportModel.getData(global.dbISOnline, query.sql, query.bindings);
                        if (result.length) {
                            console.log("\nreport id:" + reportID + ' result = ' + result[0].length);
                            reply.send({ ok: true, rows: result[0] });
                        }
                        else {
                            reply.send({ ok: false, error: HttpStatus.BAD_REQUEST });
                        }
                    }
                    else {
                        reply.send({ ok: false, error: HttpStatus.BAD_REQUEST });
                    }
                }
                else {
                    reply.send({
                        statusCode: HttpStatus.NO_CONTENT,
                        ok: false,
                    });
                }
            }
            catch (error) {
                console.log(error);
                reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    ok: false,
                    error: error.message
                });
            }
        }
        else {
            reply.send({ ok: false, error: 'report id not found' });
        }
    });
    fastify.post('/report1', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        let tokenKey = req.body.tokenKey;
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
    next();
};
module.exports = router;
