"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
let rootPrefix = process.env.ROUTE_PREFIX || '';
rootPrefix = rootPrefix ? ('/' + rootPrefix) : '';
function router(fastify) {
    return __awaiter(this, void 0, void 0, function* () {
        fastify.register(require('./routes/index'), { prefix: "/" });
        fastify.register(require('./routes/setup'), { prefix: `${rootPrefix}/setup-api` });
        fastify.register(require('./routes/refer/v3'), { prefix: `${rootPrefix}/refer` });
        fastify.register(require('./routes/refer/v3'), { prefix: `${rootPrefix}/refer/his` });
        fastify.register(require('./routes/refer/local'), { prefix: `${rootPrefix}/refer/local` });
        fastify.register(require('./routes/refer/send'), { prefix: `${rootPrefix}/refer/send-moph`, logger: true });
        fastify.register(require('./routes/hdc/index'), { prefix: `${rootPrefix}/hdc`, logger: true });
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
        fastify.register(require('./routes/cannabis/index'), { prefix: `${rootPrefix}/cannabis`, logger: true });
        fastify.register(require('./routes/qdrugstore/index'), { prefix: `${rootPrefix}/qdrugstore`, logger: true });
        fastify.register(require('./routes/rp506/index'), { prefix: `${rootPrefix}/rp506`, logger: true });
    });
}
exports.default = router;
