/// <reference path="./../../../typings.d.ts" />

var fastify = require('fastify');
var http = require('http');
var querystring = require('querystring');
// var ip = require("ip");

async function getServiceUrl(config) {
  return {
    "current": {
      "nRefer": "http://203.157.103.33:8080/nrefer",
      "isOnline": "http://ae.moph.go.th:3006",
      "dataCenter": "http://connect.moph.go.th/dc-api",
      "notify": "http://203.157.103.33:8080/nrefer/message"
    },
    "referServer": {
      "nRefer": "http://203.157.103.176/nrefer-api/nrefer",
      "isOnline": "http://connect.moph.go.th:3003",
      "dataCenter": "http://203.157.103.176/dc-api",
      "his": "http://connect.moph.go.th/his-api",
      "mailer": "http://connect.moph.go.th/mailer",
      "notify": "http://203.157.103.33:8080/nrefer/message"
    },
    "connectServer": {
      "nRefer": "http://connect.moph.go.th/nrefer-api/nrefer",
      "isOnline": "http://connect.moph.go.th:3003",
      "dataCenter": "http://connect.moph.go.th/dc-api",
      "his": "http://connect.moph.go.th/his-api",
      "mailer": "http://connect.moph.go.th/mailer",
      "notify": "http://203.157.103.33:8080/nrefer/message"
    }
  };

  // const url = process.env.MOPH_URL1 || 'http://203.157.103.176/moph-api';
  // const mophUrl = url.split('/');

  // const dataSending = querystring.stringify({
  //   hospcode: process.env.HOSPCODE, ip: ip.address()
  // });

  // const options = {
  //   hostname: mophUrl[2],
  //   path: '/' + mophUrl[3] + '/service',
  //   method: 'GET',
  //   headers: {
  //     'Content-Type': 'application/x-www-form-urlencoded',
  //     'Content-Length': Buffer.byteLength(dataSending)
  //   }
  // };

  // let ret = '';
  // return new Promise((resolve, reject) => {
  //   const req = http.request(options, (res) => {
  //     res.setEncoding('utf8');
  //     res.on('data', (chunk: string) => {
  //       ret += chunk;
  //     });
  //     res.on('end', () => {
  //       if (ret) {
  //         const data = JSON.parse(ret);
  //         resolve(data);
  //       } else {
  //         resolve(null);
  //       }
  //     });
  //   });

  //   req.on('error', (e: any) => {
  //     reject(e);
  //   });

  //   req.write(dataSending);
  //   req.end();
  // });

}

const router = async (mophService: any, config = {}) => {
  const ret: any = await getServiceUrl(config);
  if (ret) {
    fastify.mophService = ret.referServer;
    return ret.referServer;
  } else {
    return false;
  }
};
module.exports = router;
