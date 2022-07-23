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
function getLocalEnv() {
    return __awaiter(this, void 0, void 0, function* () {
        const postData = querystring.stringify({
            hospcode: process.env.HOSPCODE,
            hisProvider: process.env.HIS_PROVIDER
        });
        const options = {
            hostname: 'connect.moph.go.th',
            path: '/client/',
            port: 80,
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        let ret = '';
        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    ret += chunk;
                });
                res.on('end', (error) => {
                    if (error || !ret) {
                        reject(error);
                    }
                    else {
                        if (ret.substr(0, 1) == '{') {
                            const data = JSON.parse(ret);
                            resolve(data);
                        }
                        else {
                            resolve(null);
                        }
                    }
                });
            });
            req.on('error', (e) => {
                reject(e);
            });
            req.write(postData);
            req.end();
        });
    });
}
const r = () => __awaiter(this, void 0, void 0, function* () {
    const ret = yield getLocalEnv();
    if (ret && typeof ret == 'object') {
        fastify.ipAddr = ret.HTTP_X_FORWARDED_FOR || ret.REMOTE_ADDR || ret.IP;
    }
    else {
        fastify.ipAddr = '127.0.0.1';
    }
    return fastify.ipAddr;
});
module.exports = r;
