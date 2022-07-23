import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { Logger } from 'pino';
import * as knex from 'knex'

declare module 'fastify' {
  interface FastifyRequest<HttpRequest> {
    user: any;
  }
  interface FastifyReply<HttpResponse> {
    view: any;
  }
  interface Request extends FastifyRequest<IncomingMessage> { }
  interface Reply extends FastifyReply<ServerResponse> { }
  interface FastifyInstance {
    db: knex;
    dbHIS: knex;
    dbHDC: knex;
    dbRefer: knex;
    dbCannabis: knex;
    dbISOnline: knex;
    startServerTime: string;
    setupSession: any;
    ipAddr: string;
    firstProcessPid: number;
    ws: any;
    mophService: any;
    apiName: string;
    apiVersion: string;
    apiSubVersion: string;
  }
}

