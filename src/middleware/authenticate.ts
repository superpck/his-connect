import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import moment from 'moment';

export async function authenticateRequest(request: any, reply: any) {
  request.authenDecoded = null;
  request.user = null;
  if (request.body && request.body.token) {
    request.headers.authorization = 'Bearer ' + request.body.token;
  }

  try {
    request.user = await request.jwtVerify();
    request.authenDecoded = request.user;
  } catch (err) {
    console.error(moment().format('HH:mm:ss.SSS'), request.ipAddr, 'Error client try to access API ' + StatusCodes.UNAUTHORIZED, `message: '${err.message}'`);
    return reply.code(StatusCodes.UNAUTHORIZED).send({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: getReasonPhrase(StatusCodes.UNAUTHORIZED)
    });
  }
}
