"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let rootPrefix = process.env.ROUTE_PREFIX || '';
rootPrefix = rootPrefix ? ('/' + rootPrefix) : '';
const hisProvider = process.env.HIS_PROVIDER;
async function router(fastify) {
    fastify.register(require('./routes/index'), { prefix: "/" });
    fastify.register(require('./routes/his/index'), { prefix: `${rootPrefix}/${hisProvider}` });
    fastify.register(require('./routes/refer/v3'), { prefix: `${rootPrefix}/refer` });
    fastify.register(require('./routes/refer/v3'), { prefix: `${rootPrefix}/refer/his` });
    fastify.register(require('./routes/refer/local'), { prefix: `${rootPrefix}/refer/local` });
    fastify.register(require('./routes/isonline/index'), { prefix: `${rootPrefix}/isonline`, logger: true });
    fastify.register(require('./routes/isonline/login'), { prefix: `${rootPrefix}/isonline/login`, logger: true });
    fastify.register(require('./routes/isonline/login'), { prefix: `${rootPrefix}/login`, logger: true });
    fastify.register(require('./routes/isonline/index'), { prefix: `${rootPrefix}/iswin`, logger: true });
    fastify.register(require('./routes/isonline/index'), { prefix: `${rootPrefix}/is`, logger: true });
    fastify.register(require('./routes/isonline/his'), { prefix: `${rootPrefix}/his`, logger: true });
    fastify.register(require('./routes/isonline/his'), { prefix: `${rootPrefix}/isonline/his`, logger: true });
    fastify.register(require('./routes/isonline/user'), { prefix: `${rootPrefix}/user`, logger: true });
    fastify.register(require('./routes/isonline/user'), { prefix: `${rootPrefix}/isonline/user`, logger: true });
    fastify.register(require('./routes/isonline/report'), { prefix: `${rootPrefix}/report`, logger: true });
    fastify.register(require('./routes/isonline/report'), { prefix: `${rootPrefix}/isonline/report`, logger: true });
    fastify.register(require('./routes/isonline/moph'), { prefix: `${rootPrefix}/moph`, logger: true });
    fastify.register(require('./routes/isonline/ops'), { prefix: `${rootPrefix}/ops`, logger: true });
    fastify.register(require('./routes/pcc/index'), { prefix: `${rootPrefix}/pcc`, logger: true });
    fastify.register(require('./routes/qdrugstore/index'), { prefix: `${rootPrefix}/qdrugstore`, logger: true });
}
exports.default = router;
