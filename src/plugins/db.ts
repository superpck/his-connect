import knex from 'knex';
require('dotenv').config('/config');

var timezone = 'Asia/Bangkok';
var options = {
  HIS: {
    client: process.env.HIS_DB_CLIENT || 'mysql2',
    connection: {
      host: process.env.HIS_DB_HOST,
      user: process.env.HIS_DB_USER,
      password: process.env.HIS_DB_PASSWORD,
      database: process.env.HIS_DB_NAME,
      port: +process.env.HIS_DB_PORT || 3306,
      charset: process.env.HIS_DB_CHARSET || 'utf8',
      schema: process.env.HIS_DB_SCHEMA || 'public',
      encrypt: process.env.HIS_DB_ENCRYPT || null,
      timezone
    }
  },
  ISONLINE: {
    client: process.env.IS_DB_CLIENT || process.env.HIS_DB_CLIENT || 'mysql',
    connection: {
      host: process.env.IS_DB_HOST || process.env.HIS_DB_HOST,
      user: process.env.IS_DB_USER || process.env.HIS_DB_USER,
      password: process.env.IS_DB_PASSWORD || process.env.HIS_DB_PASSWORD,
      database: process.env.IS_DB_NAME || 'isdb',
      port: +process.env.IS_DB_PORT || +process.env.HIS_DB_PORT || 3306,
      charset: process.env.IS_DB_CHARSET || process.env.HIS_DB_CHARSET || 'utf8',
      schema: process.env.IS_DB_SCHEMA || process.env.HIS_DB_SCHEMA,
      encrypt: process.env.IS_DB_ENCRYPT || process.env.HIS_DB_ENCRYPT || true,
      timezone
    }
  }
};

const dbConnection = (type = 'HIS') => {
  type = type.toUpperCase();

  const config: any = options[type];
  const connection = config.connection;
  config.client = config.client? config.client.toLowerCase() : 'mysql2';
  
  let opt: any = {};
  if (config.client == 'mssql') {
    opt = {
      client: config.client,
      connection: {
        server: connection.host,
        user: connection.user,
        password: connection.password,
        database: connection.database,
        options: {
          port: +connection.port,
          schema: connection.schema
        }
      }
    };
    if (connection?.encrypt) {
      opt.connection.encrypt = connection.encrypt;
    }
  } else if (config.client == 'oracledb') {
    process.env.NODE_ORACLEDB_DRIVER_MODE ||= process.env.DB_ORACLEDB_DRIVER_MODE || 'thin';
    opt = {
      client: 'oracledb',
      connection: {
        connectString: `${connection.host}:${connection.port | 1521}/${connection.database}`,
        user: connection.user,
        password: connection.password
      },
      pool: { min: 0, max: 10 },
    };
  } else if (config.client == 'pg') {
    opt = {
      client: config.client,
      connection: {
        host: connection.host,
        port: +connection.port,
        user: connection.user,
        password: connection.password,
        database: connection.database
        // timezone
      },
      pool: {
        min: 0,
        max: 100,
      }
    };
  } else {
    // config.client = config.client == 'mysql' ? 'mysql2' : config.client;
    opt = {
      client: config.client,
      connection: {
        host: connection.host,
        port: +connection.port,
        user: connection.user,
        password: connection.password,
        database: connection.database,
        // timezone
      },
      pool: {
        min: 0,
        max: 7,
        // afterCreate: (conn, done) => {
        //   conn.query('SET NAMES ' + connection.charset, (err) => {
        //     done(err, conn);
        //   });
        // }
      },
      debug: false,
    };
  }
  return knex(opt);
};

module.exports = dbConnection;