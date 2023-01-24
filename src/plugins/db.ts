import knex from 'knex';

var timezone = 'Asia/Bangkok';
var options = {
  ISONLINE: {
    client: process.env.IS_DB_CLIENT || process.env.HIS_DB_CLIENT || 'mysql',
    connection: {
      host: process.env.IS_DB_HOST || process.env.HIS_DB_HOST,
      user: process.env.IS_DB_USER || process.env.HIS_DB_USER,
      password: process.env.IS_DB_PASSWORD || process.env.HIS_DB_PASSWORD,
      database: process.env.IS_DB_NAME || 'isdb',
      port: +process.env.IS_DB_PORT || +process.env.HIS_DB_PORT || 3306,
      charSet: process.env.IS_DB_CHARSET || process.env.HIS_DB_CHARSET || 'utf8',
      schema: process.env.IS_DB_SCHEMA || process.env.HIS_DB_SCHEMA,
      encrypt: process.env.IS_DB_ENCRYPT || process.env.HIS_DB_ENCRYPT || true,
      timezone
    }
  },
  HIS: {
    client: process.env.HIS_DB_CLIENT || 'mysql',
    connection: {
      host: process.env.HIS_DB_HOST,
      user: process.env.HIS_DB_USER,
      password: process.env.HIS_DB_PASSWORD,
      database: process.env.HIS_DB_NAME,
      port: +process.env.HIS_DB_PORT || 3306,
      charSet: process.env.HIS_DB_CHARSET || 'utf8',
      schema: process.env.HIS_DB_SCHEMA || 'public',
      encrypt: process.env.HIS_DB_ENCRYPT || true,
      timezone
    }
  },
  REFER: {
    client: process.env.REFER_DB_CLIENT || process.env.REFER_DB_CLIENT || 'mysql',
    connection: {
      host: process.env.REFER_DB_HOST || process.env.HIS_DB_HOST,
      user: process.env.REFER_DB_USER || process.env.HIS_DB_USER,
      password: process.env.REFER_DB_PASSWORD || process.env.HIS_DB_PASSWORD,
      database: process.env.REFER_DB_NAME || process.env.HIS_DB_NAME,
      port: +process.env.REFER_DB_PORT || +process.env.HIS_DB_PORT || 3306,
      charSet: process.env.REFER_DB_CHARSET || process.env.HIS_DB_CHARSET || 'utf8',
      schema: process.env.REFER_DB_SCHEMA || process.env.HIS_DB_SCHEMA || 'public',
      encrypt: process.env.REFER_DB_ENCRYPT || process.env.HIS_DB_ENCRYPT || true,
      timezone
    }
  },
  CANNABIS: {
    client: process.env.CANNABIS_DB_CLIENT || process.env.HIS_DB_CLIENT || 'mysql',
    connection: {
      host: process.env.CANNABIS_DB_HOST || process.env.HIS_DB_HOST,
      user: process.env.CANNABIS_DB_USER || process.env.HIS_DB_USER,
      password: process.env.CANNABIS_DB_PASSWORD || process.env.HIS_DB_PASSWORD,
      database: process.env.CANNABIS_DB_NAME || process.env.HIS_DB_NAME,
      port: +process.env.CANNABIS_DB_PORT || +process.env.HIS_DB_PORT || 3306,
      charSet: process.env.CANNABIS_DB_CHARSET || process.env.HIS_DB_CHARSET || 'utf8',
      schema: process.env.CANNABIS_DB_SCHEMA || process.env.HIS_DB_SCHEMA || 'public',
      encrypt: process.env.CANNABIS_DB_ENCRYPT || process.env.HIS_DB_ENCRYPT || true,
      timezone
    }
  },
};

const dbConnection = (type = 'HIS') => {
  let option = options[type.toUpperCase()];
  option['pool'] = { min: 0, max: 10 };
  return knex(option);
};

module.exports = dbConnection;