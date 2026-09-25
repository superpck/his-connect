import * as fastify from 'fastify';
import * as HttpStatus from 'http-status-codes';

import { buildReportQuery, IsReportModel } from '../../models/isonline/report';
const reportModel = new IsReportModel;

const router = (fastify, { }, next) => {

  fastify.post('/', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    let reportID: number = req.body.reportID;
    let hospCode: string = req.body.hospCode;
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
              query = buildReportQuery(row.sql, row.report_sql, row.columns_group, {
                hospCode,
                date1,
                date2,
                region,
                changwat
              });
            } catch (error) {
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
  })

  fastify.post('/report1', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    let tokenKey = req.body.tokenKey;
    let reportID: number = req.body.reportID;
    let hospCode: string = req.body.hospCode;
    let reportCond = {
      reportType: req.body.reportType,
      hospCode: req.body.hospCode,
      date1: req.body.date1,
      date2: req.body.date2,
      region: req.body.region,
      prov: req.body.prov,
    };
    reportModel.getReport1(global.dbISOnline, reportCond)
      .then((results: any) => {
        console.log("token: " + tokenKey + " report ID: " + reportID + " hcode: " + hospCode + ' result: ' + results[0].length + ' record<s>');
        reply.send({ ok: true, rows: results[0] });
      })
      .catch(error => {
        reply.send({ ok: false, error: error })
      });
  })

  next();
}

module.exports = router;
