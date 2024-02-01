// ห้ามแก้ไข file นี้ // 
// import * as fastify from 'fastify';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import * as moment from 'moment';
var http = require('http');
var querystring = require('querystring');
const request = require('request');
let apiVersion: string = global.appDetail.version;
let subVersion: string = global.appDetail.subVersion;

const router = (fastify, { }, next) => {
  fastify.get('/sending-process/:?date', async (req: any, reply: any) => {
    
    const now = moment().locale('th').format('YYYY-MM-DD');
    const trust = req.headers.host.search('localhost|127.0.0.1') > -1;
    const apiKey = process.env.NREFER_APIKEY;
    const secretKey = process.env.NREFER_SECRETKEY;

    if (!trust || !apiKey || !secretKey) {
      reply.status(StatusCodes.UNAUTHORIZED).send({ statusCode: StatusCodes.UNAUTHORIZED, message: getReasonPhrase(StatusCodes.UNAUTHORIZED) })
    }

    let tokenLocal = '';
    let tokenNRefer = '';
    let token = '';

    // get local token ------------------------------
    try {
      const resultLocalToken: any = await getLocalToken();
      if (resultLocalToken.token) {
        tokenLocal = resultLocalToken.token;
        // console.log('tokenLocal', tokenLocal);
      }
    }
    catch (error) {
      reply.status(StatusCodes.OK).send({ 
        statusCode: StatusCodes.BAD_REQUEST, 
        message: error.message
      })
    }

    // get token ------------------------------
    try {
      const result: any = await getToken(apiKey, secretKey);
      if (result.statusCode && result.statusCode === 200 && result.token) {
        token = result.token;
        // console.log('token', token);
      } else {
        reply.status(StatusCodes.OK).send({ 
          statusCode: StatusCodes.BAD_REQUEST, 
          message: getReasonPhrase(StatusCodes.BAD_REQUEST), 
          error: result.message })
        return false;
      }
    } catch (error) {
      reply.status(StatusCodes.OK).send({ 
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR, 
        message: error.message, 
        error: error })
      return false;
    };

    // get token nRefer ------------------------------
    // try {
    //   const result: any = await getNReferToken(apiKey, secretKey);
    //   if (result.statusCode && result.statusCode === 200 && result.token) {
    //     tokenNRefer = result.token;
    //   } else {
    //     reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST), error: result.message })
    //     return false;
    //   }
    // } catch (error) {
    //   reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR), error: error.message })
    //   return false;
    // };

    // data prepare ------------------------------
    // let referOut: any = [];
    // let noCases = 0;
    // if (tokenNRefer) {
    //   try {
    //     const resultReferout: any = await getReferOut(tokenLocal, date);
    //     if (resultReferout.statusCode === 200) {
    //       referOut = resultReferout.rows;
    //     } else {
    //       reply.status(StatusCodes.OK).send({
    //         statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    //         message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
    //         error: resultReferout.message
    //       });
    //       return false;
    //     }
    //   } catch (error) {
    //     console.log('referOut error:', error.message);
    //     reply.status(StatusCodes.OK).send({
    //       statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    //       message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
    //       error: error.message
    //     });
    //     return false;
    //   }

    // } else {
    //   reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR) })
    //   return false;
    // }

    // if (referOut.length) {
    //   noCases = referOut.length;
    //   const person: any = [];
    //   console.log('referout', noCases);
    //   referOut.forEach((row, index) => {
    //     try {
    //       const formData = {
    //         hospcode: row.hospcode,
    //         hn: row.hn
    //       };
    //       getData('person', tokenLocal, formData)
    //         .then((resultGetData: any) => {
    //           if (resultGetData.statusCode === 200) {
    //             sendPerson('person', tokenNRefer, resultGetData.rows)
    //               .then((resultSavePerson: any) => {
    //                 console.log('save person:', resultSavePerson);
    //                 person.push(resultGetData.rows[0]);
    //                 console.log(resultGetData.rows[0].hn, resultGetData.rows[0].fname);
    //               });
    //           }
    //         });
    //     } catch (err) {
    //       //
    //     }
    //   });
    // }


    // expire tokenNRefer ------------------------------
    try {
      const result: any = await expireToken(tokenNRefer);
    } catch (error) {
      reply.status(StatusCodes.OK).send({
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: error.message
      })
    }

    // reply.status(StatusCodes.OK).send({ 
    //   statusCode: StatusCodes.OK, 
    //   message: noCases });
  });


  // =============================================================
  next();
}

async function getLocalToken() {
  const apiHttpProtocol = (process.env.HTTPS && +process.env.HTTPS === 1) ? 'https' : 'http';
  const apiPort = process.env.PORT;
  const url = `${apiHttpProtocol}://127.0.0.1:${apiPort}/get-token`;

  const options = {
    url: url,
    method: 'GET'
  };

  return new Promise((resolve, reject) => {
    request(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        resolve(JSON.parse(body));
      } else {
        reject(error);
      }
    })
  });

}

async function getToken(apiKey, secretKey) {
  let url = process.env.NREFER_API_URL;
  url += url.substr(-1, 1) === '/' ? '' : '/';

  const postData = querystring.stringify({
    apiKey: apiKey, secretKey: secretKey
  });

  const options = {
    hostname: process.env.NREFER_URL,
    port: process.env.NREFER_PORT,
    path: process.env.NREFER_PATH + '/login/api-key',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Source-Agent': 'HISConnect-'+apiVersion+'-'+subVersion+'-'+(process.env.HOSPCODE || 'hosp')+'-'+moment().format('x')+'-'+Math.random().toString(36).substring(2,10),
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  let ret = '';
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => {
        ret += chunk;
      });
      res.on('end', () => {
        const data = JSON.parse(ret);
        // console.log('ret', data);
        resolve(data);
      });
    });

    req.on('error', (e: any) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });

}

async function getNReferToken(apiKey, secretKey) {
  let url = process.env.NREFER_API_URL;
  url += url.substring(url.length-1) === '/' ? '' : '/';

  const postData = querystring.stringify({
    apiKey: apiKey, secretKey: secretKey
  });

  const options = {
    hostname: process.env.NREFER_URL,
    port: process.env.NREFER_PORT,
    path: process.env.NREFER_PATH + '/login/get-token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  let ret = '';
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => {
        ret += chunk;
      });
      res.on('end', () => {
        const data = JSON.parse(ret);
        // console.log('ret', data);
        resolve(data);
      });
    });

    req.on('error', (e: any) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });

}

async function expireToken(token) {
  let url = process.env.NREFER_API_URL;
  url += url.substring(url.length-1) === '/' ? '' : '/';

  const postData = querystring.stringify({
    token: token
  });

  const options = {
    hostname: process.env.NREFER_URL,
    port: process.env.NREFER_PORT,
    path: process.env.NREFER_PATH + '/login/expire-token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${token}`,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  let ret = '';
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => {
        ret += chunk;
      });
      res.on('end', () => {
        const data = JSON.parse(ret);
        // console.log('ret', data);
        resolve(data);
      });
    });

    req.on('error', (e: any) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });

}

async function getReferOut(tokenLocal: string, date: string) {
  const apiHttpProtocol = (process.env.HTTPS && +process.env.HTTPS === 1) ? 'https' : 'http';
  const apiPort = process.env.PORT;
  const url = `${apiHttpProtocol}://127.0.0.1:${apiPort}/refer/referout`;
  const postData = querystring.stringify({
    date: date, hospcode: process.env.HOSPCODE
  });

  const options = {
    url: url,
    // path: '/refer/referout',
    method: 'POST',
    headers: {
      'User-Agent': 'Super Agent/0.0.1',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${tokenLocal}`,
      'Content-Length': Buffer.byteLength(postData)
    },
    form: { date: date, hospcode: process.env.HOSPCODE }
  };

  return new Promise((resolve, reject) => {
    request(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        resolve(JSON.parse(body));
      } else {
        reject(error);
      }
    })
  });
}

async function getData(routeName: string, tokenLocal: string, postData) {
  const apiHttpProtocol = (process.env.HTTPS && +process.env.HTTPS === 1) ? 'https' : 'http';
  const apiPort = process.env.PORT;
  const url = `${apiHttpProtocol}://127.0.0.1:${apiPort}/refer/${routeName}`;
  const formData = querystring.stringify(postData);

  const options = {
    url: url,
    // path: '/refer/referout',
    method: 'POST',
    headers: {
      'User-Agent': 'Super Agent/0.0.1',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${tokenLocal}`,
      'Content-Length': Buffer.byteLength(formData)
    },
    form: postData
  };

  return new Promise((resolve, reject) => {
    request(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        resolve(JSON.parse(body));
      } else {
        reject(error);
      }
    })
  });
}

async function sendPerson(tableName, tokenNRefer: string, data) {
  let url = process.env.NREFER_API_URL;
  url += url.substring(url.length-1) === '/' ? '' : '/';
  url += 'ws/save-person';

  const formData = { token: tokenNRefer, tableName: tableName, data: JSON.stringify(data) };
  const postData = querystring.stringify(formData);

  const options = {
    url: url,
    method: 'POST',
    headers: {
      'User-Agent': 'Super Agent/0.0.1',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${tokenNRefer}`,
      'Content-Length': Buffer.byteLength(postData)
    },
    form: formData
  };

  return new Promise((resolve, reject) => {
    request(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        resolve(JSON.parse(body));
      } else {
        reject(error);
      }
    })
  });
}


module.exports = router;
