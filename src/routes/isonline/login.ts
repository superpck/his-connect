import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import moment from 'moment';
const crypto = require('crypto');

import { IsLoginModel } from '../../models/isonline/login';
import { checkSignInCode, checkLoginCode } from '../../middleware/moph-refer';
const loginModel = new IsLoginModel()

const router = (fastify, { }, next) => {
  fastify.post('/api-login', async (req: any, res: any) => {
    let body: any = req.body;
    let username = body.username;
    let password = body.password;
    let code = body.code;
    const validCode = await checkSignInCode(code);
    if (!validCode) {
      return res.send({
        statusCode: StatusCodes.UNAUTHORIZED,
        message: 'Invalid or expired code'
      });
    }

    if (typeof username !== 'string' || typeof password !== 'string' || username.length === 0 || password.length === 0) {
      return res.status(StatusCodes.UNAUTHORIZED).send({
        statusCode: StatusCodes.UNAUTHORIZED,
        message: getReasonPhrase(StatusCodes.UNAUTHORIZED)
      });
    }

    const encPassword = crypto.createHash('sha256').update(password).digest('hex');
    const results: any = await loginModel.doLogin(global.dbISOnline, username, encPassword);
    if (results.length) {
      let today = moment().format('YYYY-MM-DD HH:mm:ss');
      let expire = moment().add(3, 'hours').format('YYYY-MM-DD HH:mm:ss');
      const tokenKey = crypto.createHash('md5').update(today + expire).digest('hex');
      const payload = {
        hcode: results[0].hcode,
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
      res.status(StatusCodes.UNAUTHORIZED).send({
        statusCode: StatusCodes.UNAUTHORIZED,
        message: getReasonPhrase(StatusCodes.UNAUTHORIZED)
      })
    }
  })

  fastify.post('/login-by-code', async (req: any, res: any) => {
    let body: any = req.body;
    let loginCode = body.loginCode;
    if (loginCode) {
      try {
        const validCode = await checkSignInCode(loginCode);
        if (!validCode) {
          return res.send({
            statusCode: StatusCodes.UNAUTHORIZED,
            message: 'Invalid or expired code'
          });
        }

        const data = await checkLoginCode(loginCode);
        if (data && data.statusCode === 200) {
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
          return res.send({
            statusCode: StatusCodes.OK,
            token: token, data
          });
        } else {
          return res.send({
            statusCode: StatusCodes.BAD_REQUEST,
            message: 'Invalid login code'
          });
        }
      } catch (error: any) {
        console.error('login-by-code error:', error.message);
        return res.send({
          statusCode: error?.status || 500,
          message: error.message
        });
      }
    } else {
      return res.send({
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

  next();
}

export default router;
