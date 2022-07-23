var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var fastify = require('fastify');
var http = require('http');
var querystring = require('querystring');
function getServiceUrl(config) {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            "current": {
                "nRefer": "http://203.157.103.33:8080/nrefer",
                "isOnline": "http://ae.moph.go.th:3006",
                "dataCenter": "http://connect.moph.go.th/dc-api",
                "notify": "http://203.157.103.33:8080/nrefer/message"
            },
            "referServer": {
                "nRefer": "http://203.157.103.176/nrefer-api/nrefer",
                "isOnline": "http://connect.moph.go.th:3003",
                "dataCenter": "http://203.157.103.176/dc-api",
                "his": "http://connect.moph.go.th/his-api",
                "mailer": "http://connect.moph.go.th/mailer",
                "notify": "http://203.157.103.33:8080/nrefer/message"
            },
            "connectServer": {
                "nRefer": "http://connect.moph.go.th/nrefer-api/nrefer",
                "isOnline": "http://connect.moph.go.th:3003",
                "dataCenter": "http://connect.moph.go.th/dc-api",
                "his": "http://connect.moph.go.th/his-api",
                "mailer": "http://connect.moph.go.th/mailer",
                "notify": "http://203.157.103.33:8080/nrefer/message"
            }
        };
    });
}
const router = (mophService, config = {}) => __awaiter(this, void 0, void 0, function* () {
    const ret = yield getServiceUrl(config);
    if (ret) {
        fastify.mophService = ret.referServer;
        return ret.referServer;
    }
    else {
        return false;
    }
});
module.exports = router;
