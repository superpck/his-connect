var fastifyPlugin = require('fastify-plugin')
var knex = require('knex')

async function fastifyKnexJS(fastify, opts, next) {
  try {
    let connection: any;
    if (opts.config && opts.config.host && opts.config.client) {
      connection = createConnectionOption(opts.config);
    } else {
      connection = opts.connection;
    }
    const handler = await knex(connection)
    await fastify.decorate(opts.connectionName, handler)
    next()
  } catch (err) {
    next(err)
  }
}

function createConnectionOption(config: any) {
  if (['mssql'].includes(config.client)) {
    return {
      client: config.client,
      connection: {
        server: config.host,
        user: config.user,
        password: config.password,
        database: config.dbName,
        options: {
          port: +config.port,
          schema: config.schema,
          encrypt: config.encrypt
        }
      }
    };
  } if (config.client == 'oracledb') {
    return {
      client: config.client,
      caseSensitive: false,
      connection: {
        connectString: `${config.host}/${config.schema}`,
        user: config.user,
        password: config.password,
        port: +config.port,
        externalAuth: false,
        fetchAsString: ['DATE'],
      }
    };
  } if (config.client == 'pg') {
    return {
      client: config.client,
      connection: {
        host: config.host,
        port: +config.port,
        user: config.user,
        password: config.password,
        database: config.dbName,
      },
      pool: {
        min: 0,
        max: 100,
      }
    };
  } else {
    return {
      client: config.client,
      connection: {
        host: config.host,
        port: +config.port,
        user: config.user,
        password: config.password,
        database: config.dbName,
      },
      pool: {
        min: 0,
        max: 7,
        afterCreate: (conn, done) => {
          conn.query('SET NAMES ' + config.charSet, (err) => {
            done(err, conn);
          });
        }
      },
      debug: false,
    };
  }

}

module.exports = fastifyPlugin(fastifyKnexJS, '>=0.30.0')
