var fastify = require('fastify');
var http = require('http');
var querystring = require('querystring');

async function getServiceUrl(config) {
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
}

const router = async (mophService: any, config = {}) => {
  const ret: any = await getServiceUrl(config);
  if (ret) {
    fastify.mophService = ret.referServer;
    return ret.referServer;
  } else {
    return false;
  }
};
module.exports = router;
