var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var fastifyPlugin = require('fastify-plugin');
var knex = require('knex');
function fastifyKnexJS(fastify, opts, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let connection;
            if (opts.config && opts.config.host && opts.config.client) {
                connection = createConnectionOption(opts.config);
            }
            else {
                connection = opts.connection;
            }
            const handler = yield knex(connection);
            yield fastify.decorate(opts.connectionName, handler);
            next();
        }
        catch (err) {
            next(err);
        }
    });
}
function createConnectionOption(config) {
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
    }
    if (config.client == 'oracledb') {
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
    }
    if (config.client == 'pg') {
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
    }
    else {
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
module.exports = fastifyPlugin(fastifyKnexJS, '>=0.30.0');
