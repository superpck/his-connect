"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const knex_1 = require("knex");
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
            charset: process.env.HIS_DB_CHARSET || null,
            schema: process.env.HIS_DB_SCHEMA || 'public',
            encrypt: process.env.HIS_DB_ENCRYPT || null,
            timezone
        }
    },
    ISONLINE: {
        client: process.env.IS_DB_CLIENT || 'mysql',
        connection: {
            host: process.env.IS_DB_HOST,
            user: process.env.IS_DB_USER,
            password: process.env.IS_DB_PASSWORD,
            database: process.env.IS_DB_NAME || 'isdb',
            port: +process.env.IS_DB_PORT || 3306,
            charset: process.env.IS_DB_CHARSET || null,
            schema: process.env.IS_DB_SCHEMA,
            encrypt: process.env.IS_DB_ENCRYPT || true,
            timezone
        }
    }
};
const dbConnection = (type = 'HIS') => {
    var _a;
    type = type.toUpperCase();
    const config = options[type];
    const connection = config.connection;
    config.client = config.client ? config.client.toLowerCase() : 'mysql2';
    let opt = {};
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
    }
    else if (config.client == 'oracledb') {
        (_a = process.env).NODE_ORACLEDB_DRIVER_MODE || (_a.NODE_ORACLEDB_DRIVER_MODE = process.env.DB_ORACLEDB_DRIVER_MODE || 'thin');
        opt = {
            client: 'oracledb',
            connection: {
                connectString: `${connection.host}:${connection.port | 1521}/${connection.database}`,
                user: connection.user,
                password: connection.password
            },
            pool: { min: 0, max: 10 },
        };
    }
    else if (config.client == 'pg') {
        opt = {
            client: config.client,
            connection: {
                host: connection.host,
                port: +connection.port,
                user: connection.user,
                password: connection.password,
                searchPath: [connection.schema || 'public'],
                database: connection.database
            },
            pool: {
                min: 0,
                max: 100,
            }
        };
    }
    else {
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
                max: 7
            },
            debug: false,
        };
        if (config.client.includes('mysql') && connection?.charset?.trim()) {
            opt.connection.charset = connection.charset.trim();
        }
    }
    return (0, knex_1.default)(opt);
};
module.exports = dbConnection;
