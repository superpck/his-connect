var jwt = require('jsonwebtoken');

export class Jwt {
  sign(payload: any, expire='2h') {
    let token = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: expire
    });
    return token;
  }

  verify(token: string) {
    try {
      const result = jwt.verify(token, process.env.SECRET_KEY);
      return result;
    } catch (error) {
      return null;
    }
  }

  verify_(token: string) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
          reject(err)
        } else {
          resolve(decoded)
        }
      });
    });
  }

}
