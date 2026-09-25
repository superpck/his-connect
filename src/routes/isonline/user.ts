import * as HttpStatus from 'http-status-codes';

import { IsUserModel } from '../../models/isonline/users';
const userModel = new IsUserModel;

const router = (fastify, { }, next) => {

  fastify.post('/', { preHandler: [fastify.authenticate] }, async (req: any, res: any) => {
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

  fastify.post('/getbyid', { preHandler: [fastify.authenticate] }, async (req: any, res: any) => {
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

  fastify.post('/getbyusername', { preHandler: [fastify.authenticate] }, async (req: any, res: any) => {
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

  fastify.post('/save', { preHandler: [fastify.authenticate] }, async (req: any, res: any) => {
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

  fastify.post('/remove', { preHandler: [fastify.authenticate] }, async (req: any, res: any) => {
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

  next();
}

module.exports = router;
