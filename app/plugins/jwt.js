"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Jwt = void 0;
var jwt = require('jsonwebtoken');
class Jwt {
    sign(payload, expire = '2h') {
        let token = jwt.sign(payload, process.env.SECRET_KEY, {
            expiresIn: expire
        });
        return token;
    }
    verify(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(decoded);
                }
            });
        });
    }
}
exports.Jwt = Jwt;
