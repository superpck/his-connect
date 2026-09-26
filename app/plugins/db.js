"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const knex_1 = __importDefault(require("knex"));
var timezone = 'Asia/Bangkok';
function defaultPortFor(client) {
    switch ((client || '').toLowerCase()) {
        case 'oracledb': return 1521;
        case 'mssql': return 1433;
        case 'pg':
        case 'postgres':
        case 'postgresql': return 5432;
        default: return 3306;
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
    var _a;
    type = type.toUpperCase();
    const config = options[type];
    const connection = config.connection;
    config.client = config.client ? config.client.toLowerCase() : 'mysql2';
    const envPrefix = type === 'ISONLINE' ? 'IS' : type;
    const requiredFields = ['host', 'user', 'database'];
    const missing = requiredFields.filter((field) => !connection[field]);
    if (missing.length > 0) {
        throw new Error(`[db:${type}] Missing required DB connection field(s): ${missing.join(', ')}. Check ${envPrefix}_DB_HOST/${envPrefix}_DB_USER/${envPrefix}_DB_NAME environment variables.`);
    }
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
                    schema: connection.schema,
                    trustServerCertificate: connection?.trustServerCertificate !== false
                }
            }
        };
        if (connection?.encrypt) {
            opt.connection.encrypt = connection?.encrypt === false ? false : 'strict';
        }
    }
    else if (config.client == 'oracledb') {
        (_a = process.env).NODE_ORACLEDB_DRIVER_MODE || (_a.NODE_ORACLEDB_DRIVER_MODE = process.env.DB_ORACLEDB_DRIVER_MODE || 'thin');
        opt = {
            client: 'oracledb',
            connection: {
                connectString: `${connection.host}:${connection.port || 1521}/${connection.database}`,
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
                max: 10
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
