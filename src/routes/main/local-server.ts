

var fastify = require('fastify');
var http = require('http');
var querystring = require('querystring');

async function getLocalEnv() {
  const postData = querystring.stringify({
    hospcode: process.env.HOSPCODE,
    hisProvider: process.env.HIS_PROVIDER
  });

  const options = {
    hostname: 'connect.moph.go.th',
    path: '/client/',
    port: 80,
    method: 'GET',
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
      res.on('end', (error) => {
        if (error || !ret) {
          reject(error);
        } else {
          if (ret.substr(0, 1) == '{') {
            const data = JSON.parse(ret);
            resolve(data);
          } else {
            resolve(null);
          }
        }
      });
    });

    req.on('error', (e: any) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });

}

const r = async () => {
  const ret: any = await getLocalEnv();
  if (ret && typeof ret == 'object') {
    fastify.ipAddr = ret.HTTP_X_FORWARDED_FOR || ret.REMOTE_ADDR || ret.IP;
  } else {
    fastify.ipAddr = '127.0.0.1';
  }
  return fastify.ipAddr;
};
module.exports = r;
