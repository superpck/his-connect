"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Jwt = void 0;
var jwt = require('jsonwebtoken');
const defaultSecretKey = process.env.SECRET_KEY || process.env.SECRET_KEY_DEFAULT;
const secretKeyLis = {
    DEFAULT: defaultSecretKey,
    KIOSK: process.env.SECRET_KEY_KIOSK || defaultSecretKey,
    CMI: process.env.SECRET_KEY_CMI || defaultSecretKey,
    HDC: process.env.SECRET_KEY_HDC || defaultSecretKey,
};
class Jwt {
    sign(payload, expire = '2h', type = 'DEFAULT') {
        let token = jwt.sign(payload, secretKeyLis[type], {
            expiresIn: expire
        });
        return token;
    }
    verify(token, type = 'DEFAULT') {
        try {
            const result = jwt.verify(token, secretKeyLis[type]);
            return result;
        }
        catch (error) {
            return null;
        }
    }
    verify_(token, type = 'DEFAULT') {
        return new Promise((resolve, reject) => {
            jwt.verify(token, secretKeyLis[type], (err, decoded) => {
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
