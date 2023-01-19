var jwt = require('@fastify/jwt');

export class Jwt {
  sign(payload: any, expire='2h') {
    let token = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: expire
    });
    return token;
  }

  verify(token: string) {
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
