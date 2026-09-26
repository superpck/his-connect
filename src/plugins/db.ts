import knex from 'knex';

var timezone = 'Asia/Bangkok';

// Client-aware default ports so an unset *_DB_PORT doesn't silently fall back to
// the MySQL port (3306) for engines that use a different default (e.g. Oracle 1521).
function defaultPortFor(client: string): number {
  switch ((client || '').toLowerCase()) {
    case 'oracledb': return 1521;
    case 'mssql': return 1433;
    case 'pg':
    case 'postgres':
    case 'postgresql': return 5432;
    default: return 3306; // mysql / mysql2
  }
}

var options = {
  HIS: {
    client: process.env.HIS_DB_CLIENT || 'mysql2',
    connection: {
      host: process.env.HIS_DB_HOST,
      user: process.env.HIS_DB_USER,
      password: process.env.HIS_DB_PASSWORD,
      database: process.env.HIS_DB_NAME,
      port: +process.env.HIS_DB_PORT || defaultPortFor(process.env.HIS_DB_CLIENT),
      charset: process.env.HIS_DB_CHARSET || null,
      schema: process.env.HIS_DB_SCHEMA || 'public',
      encrypt: process.env.HIS_DB_ENCRYPT || null,
      timezone
    }
  },
  KIOSK: {
    client: process.env.KIOSK_DB_CLIENT || 'mysql2',
    connection: {
      host: process.env.KIOSK_DB_HOST,
      user: process.env.KIOSK_DB_USER,
      password: process.env.KIOSK_DB_PASSWORD,
      database: process.env.KIOSK_DB_NAME || 'kiosk',
      port: +process.env.KIOSK_DB_PORT || defaultPortFor(process.env.KIOSK_DB_CLIENT),
      charset: process.env.KIOSK_DB_CHARSET || null,
      schema: process.env.KIOSK_DB_SCHEMA,
      encrypt: process.env.KIOSK_DB_ENCRYPT || true,
      timezone
    }
  }
};

const dbConnection = (type = 'HIS') => {
  type = type.toUpperCase();

  const config: any = options[type];
  const connection: any = config.connection;
  config.client = config.client ? config.client.toLowerCase() : 'mysql2';

  // Validate required connection fields up front instead of only failing on first query,
  // so a missing/misconfigured env var is caught at startup, not on a random request.
  const envPrefix = type === 'ISONLINE' ? 'IS' : type;
  const requiredFields = ['host', 'user', 'database'];
  const missing = requiredFields.filter((field) => !connection[field]);
  if (missing.length > 0) {
    throw new Error(`[db:${type}] Missing required DB connection field(s): ${missing.join(', ')}. Check ${envPrefix}_DB_HOST/${envPrefix}_DB_USER/${envPrefix}_DB_NAME environment variables.`);
  }

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
          schema: connection.schema,
          trustServerCertificate: connection?.trustServerCertificate !== false
        }
      }
    };
    if (connection?.encrypt) {
      opt.connection.encrypt = connection?.encrypt === false ? false : 'strict';
    }
  } else if (config.client == 'oracledb') {
    process.env.NODE_ORACLEDB_DRIVER_MODE ||= process.env.DB_ORACLEDB_DRIVER_MODE || 'thin';
    opt = {
      client: 'oracledb',
      connection: {
        connectString: `${connection.host}:${connection.port || 1521}/${connection.database}`,
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
        searchPath: [connection.schema || 'public'],
        database: connection.database
        // timezone
      },
      pool: {
        min: 0,
        max: 100,
      }
    };
  } else {
    opt = {
      client: config.client,
      connection: {
        host: connection.host,
        port: +connection.port,
        user: connection.user,
        password: connection.password,
        database: connection.database
      },
      pool: {
        min: 0,
        max: 10
      },
      debug: false,
    };

    if (config.client.includes('mysql') && connection?.charset?.trim()) {
      opt.connection.charset = connection.charset.trim();
    }
  }
  return knex(opt);
};

module.exports = dbConnection;