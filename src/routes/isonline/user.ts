import * as HttpStatus from 'http-status-codes';

import { IsUserModel } from '../../models/isonline/users';
const userModel = new IsUserModel;

const router = (fastify, { }, next) => {

  fastify.post('/',  async (req: any, res: any) => {
    verifyToken(req, res);
    let id: number = req.body.idSeach;

    try {
      const result: any = await userModel.list(global.dbISOnline, id);
      if (id > 0) {
        console.log("is_user id: " + id);
        res.send({
          statusCode: HttpStatus.OK,
          ok: true, rows: result[0]
        });
      } else {
        console.log("is_user. " + result.length + ' record<s> founded.');
        res.send({
          statusCode: HttpStatus.OK,
          ok: true, rows: result
        });
      }
    } catch (error) {
      res.send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        ok: false, error: error, message: error.message
      });
    }
  })

  fastify.post('/getbyid',  async (req: any, res: any) => {
    verifyToken(req, res);
    let id: number = req.body.idSeach;

    try {
      const result: any = await userModel.getByID(global.dbISOnline, id);
      console.log("user id: " + id + ', ' + result.length + ' record<s> founded.');
      res.send({
        statusCode: HttpStatus.OK,
        ok: true, rows: result[0]
      });
    } catch (error) {
      res.send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        ok: false, error: error, message: error.message
      });
    }
  })

  fastify.post('/getbyusername',  async (req: any, res: any) => {
    verifyToken(req, res);
    let userName: string = req.body.userName;

    try {
      const result = await userModel.getByUserName(global.dbISOnline, userName)
      res.send({
        statusCode: HttpStatus.OK,
        ok: true, rows: result[0]
      });
    } catch (error) {
      res.send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        ok: false, error: error, message: error.message
      });
    }
  })

  fastify.post('/selectData',  async (req: any, res: any) => {
    verifyToken(req, res);
    let tableName = req.body.tableName;
    let selectText = req.body.selectText;
    let whereText = req.body.whereText;
    let groupBy = req.body.groupBy;
    let orderText = req.body.orderText;

    try {
      const result = await userModel.selectSql(global.dbISOnline, tableName, selectText, whereText, groupBy, orderText)
      console.log("\nget: " + tableName + ' = ' + result[0].length + ' record<s> founded.');
      res.send({
        statusCode: HttpStatus.OK,
        ok: true, rows: result[0]
      });
    } catch (error) {
      res.send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        ok: false, error: error, message: error.message
      });
    }
  })

  fastify.post('/save',  async (req: any, res: any) => {
    verifyToken(req, res);
    let id = req.body.id;
    let data = req.body.data;

    try {
      const result: any = await userModel.saveUser(global.dbISOnline, id, data);
      console.log("\save: user id: " + id);
      res.send({ statusCode: HttpStatus.OK, ok: true, rows: result[0] });
    } catch (error) {
      res.send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        ok: false, error: error,
        message: error.message
      });
    }
  })

  fastify.post('/remove',  async (req: any, res: any) => {
    verifyToken(req, res);
    let id = req.body.id;

    try {
      const result: any = await userModel.remove(global.dbISOnline, id);
      console.log("\delete: user id: " + id);
      res.send({
        statusCode: HttpStatus.OK,
        ok: true, id: id
      });
    } catch (error) {
      res.send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        ok: false, error: error, message: error.message
      });
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
      res.status(HttpStatus.UNAUTHORIZED).send({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: error.message
      })
    }
  }

  next();
}

module.exports = router;
