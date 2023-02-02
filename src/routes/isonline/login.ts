import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import * as moment from 'moment';
const crypto = require('crypto');

import { IsLoginModel } from '../../models/isonline/login';
const loginModel = new IsLoginModel()
var http = require('http');

const router = (fastify, { }, next) => {
  fastify.post('/', async (req: any, res: any) => {
    let username = req.body.username;
    let password = req.body.password;

    if (username && password) {
      try {
        let encPassword = await crypto.createHash('sha256').update(password).digest('hex');
        const results: any = await loginModel.doLogin(global.dbISOnline, username, encPassword);
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

          await loginModel.saveToken(global.dbISOnline, tokenInfo)
            .then((saveToken: any) => {
              console.log('save token: ', saveToken);
            }).catch(errort => {
              console.log('save token: error = ', errort);
            });

          res.status(StatusCodes.OK).send({
            statusCode: StatusCodes.OK,
            status: 200,
            ok: true,
            user: payload, token: token,
            tokenKey: tokenKey,
            tokenExpire: expire
          });
        } else {
          console.log('Login error:', username);
          res.send({
            statusCode: StatusCodes.BAD_REQUEST,
            status: 400, ok: false,
            message: 'ชื่อผู้ใช้งานหรือรหัสผ่าน ไม่ถูกต้อง'
          });
        }
      } catch (error) {
        console.log('login', error.message);
        res.send({
          statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
          status: 500,
          ok: false,
          message: error.message
        });
      }
    } else {
      res.send({
        statusCode: StatusCodes.BAD_REQUEST,
        status: 400, ok: false,
        message: 'Invalid parameter'
      });
    }
  })

  fastify.post('/api-login', async (req: any, res: any) => {
    let body: any = req.body;
    let username = body.username;
    let password = body.password;
    let ipAddr = body.ip;

    const ip = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.ip;
    console.log('api-login', ip, ipAddr);
    if (['203.157.103.55', '::1', '127.0.0.1'].indexOf(ip) >= 0 && username.length == 5 && password) {
      let today = moment().format('YYYY-MM-DD HH:mm:ss');
      let expire = moment().add(3, 'hours').format('YYYY-MM-DD HH:mm:ss');
      const tokenKey = crypto.createHash('md5').update(today + expire).digest('hex');
      const payload = {
        hcode: username,
        tokenKey: tokenKey,
        create: today,
        expire: expire
      };
      const token = fastify.jwt.sign(payload, { expiresIn: '8h' });
      res.send({
        statusCode: StatusCodes.OK,
        token: token
      });
    } else {
      res.send({
        statusCode: StatusCodes.UNAUTHORIZED,
        message: getReasonPhrase(StatusCodes.UNAUTHORIZED)
      })
    }
  })

  fastify.post('/login-by-code', async (req: any, res: any) => {
    let body: any = req.body;
    let loginCode = body.loginCode;
    if (loginCode) {
      checkLoginCode(loginCode)
      .then((data) => {
        let today = moment().format('YYYY-MM-DD HH:mm:ss');
        let expire = moment().add(3, 'hours').format('YYYY-MM-DD HH:mm:ss');
        const tokenKey = crypto.createHash('md5').update(today + expire).digest('hex');
        const payload = {
          hcode: process.env.HOSPCODE,
          tokenKey: tokenKey,
          create: today,
          expire: expire
        };
        const token = fastify.jwt.sign(payload, { expiresIn: '8h' });
        res.send({
          statusCode: StatusCodes.OK,
          token: token, data
        });
      }).catch((error) => {
        res.send({
          statusCode: StatusCodes.UNAUTHORIZED,
          message: error.message
        });
      });
    } else {
      res.send({
        statusCode: StatusCodes.UNAUTHORIZED,
        message: getReasonPhrase(StatusCodes.UNAUTHORIZED)
      })
    }
  })

  fastify.post('/token-status/:tokenKey', { preHandler: [fastify.authenticate] }, async (req: any, res: any) => {
    let tokenKey = req.params.tokenKey;
    if (tokenKey) {
      try {
        const result = await loginModel.checkToken(global.dbISOnline, tokenKey);
        if (result.length) {

          res.send({
            statusCode: StatusCodes.OK,
            status: StatusCodes.OK,
            ok: true,
            rows: result
          });
        } else {
          res.send({
            statusCode: StatusCodes.BAD_REQUEST,
            status: StatusCodes.BAD_REQUEST,
            ok: false,
            message: 'Invalid token'
          });
        }
      } catch (error) {
        res.send({
          statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          ok: false,
          message: error.message
        });
      }
    } else {
      res.send({
        statusCode: StatusCodes.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST,
        ok: false,
        message: getReasonPhrase(StatusCodes.BAD_REQUEST)
      });
    }
  })

  fastify.post('/token-status__/:tokenKey', { preHandler: [fastify.authenticate] }, async (req: any, res: any) => {
    verifyToken(req, res);

    let tokenKey = req.params.tokenKey;
    if (tokenKey) {
      loginModel.checkToken(global.dbISOnline, tokenKey)
        .then((results: any) => {
          if (results.length) {
            res.send({
              statusCode: StatusCodes.OK,
              status: 200,
              ok: true,
              rows: results
            })
          } else {
            res.send({
              statusCode: StatusCodes.BAD_REQUEST,
              status: 400,
              ok: false,
              message: 'Invalid token'
            })
          }
        })
        .catch(err => {
          console.log('token-status', err.message);
          res.send({
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            status: 500,
            ok: false,
            message: err.message
          });
        })

    } else {
      res.send({
        statusCode: StatusCodes.BAD_REQUEST,
        status: 400,
        ok: false,
        message: 'Token not found'
      })
    }
  })

  async function verifyToken(req, res) {
    let token: string = null;

    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    } else if (req.body && req.body.token) {
      token = req.body.token;
    }

    try {
      await fastify.jwt.verify(token);
      return true;
    } catch (error) {
      console.log('authen fail!', error.message);
      res.status(StatusCodes.UNAUTHORIZED).send({
        statusCode: StatusCodes.UNAUTHORIZED,
        message: error.message
      })
    }
  }

  async function checkLoginCode(loginCode: string) {
    var options = {
      host: 'connect.moph.go.th',
      port: 443,
      path: `/is-api/login/check-his-login-code/` + process.env.HOSPCODE + `/${loginCode}`
    };

    http.get(options, function (res: any) {
      res.on("data", function (chunk) {
        return chunk;
      });
    }).on('error', function (e) {
      return null;
    });
  }

  next();
}

export default router;
