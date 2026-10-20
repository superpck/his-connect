var jwt = require('jsonwebtoken');

const defaultSecretKey = process.env.SECRET_KEY || process.env.SECRET_KEY_DEFAULT;
const secretKeyLis = {
  DEFAULT: defaultSecretKey,
  KIOSK: process.env.SECRET_KEY_KIOSK || defaultSecretKey,
  CMI: process.env.SECRET_KEY_CMI || defaultSecretKey,
  HDC: process.env.SECRET_KEY_HDC || defaultSecretKey,
};

type SecretKeyType = 'DEFAULT' | 'KIOSK' | 'CMI' | 'HDC';

export class Jwt {
  sign(payload: any, expire='2h', type: SecretKeyType = 'DEFAULT') {
    let token = jwt.sign(payload, secretKeyLis[type], {
      expiresIn: expire
    });
    return token;
  }

  verify(token: string, type: SecretKeyType = 'DEFAULT') {
    try {
      const result = jwt.verify(token, secretKeyLis[type]);
      return result;
    } catch (error) {
      return null;
    }
  }

  verify_(token: string, type: SecretKeyType = 'DEFAULT') {
    return new Promise((resolve, reject) => {
      jwt.verify(token, secretKeyLis[type], (err, decoded) => {
        if (err) {
          reject(err)
        } else {
          resolve(decoded)
        }
      });
    });
  }

}
