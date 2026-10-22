import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
  }
  interface FastifyRequest {
    user: any;      // from JWT.verify token
  }
}