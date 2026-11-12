import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import moment from 'moment';
import axios from 'axios';
import { version, subVersion } from '../../package.json';
import { getIP } from '../utils/utils';

let nReferToken: string | null = null;
const apiKey = process.env.NREFER_APIKEY || process.env.MOPH_ERP_APIKEY || '';
const secretKey = process.env.NREFER_SECRETKEY || process.env.MOPH_ERP_SECRETKEY || '';
const hospcode = process.env.HOSPCODE || '';


export async function authenticateRequest(request: any, reply: any) {
  request.user = null;
  if (request.body && request.body.token) {
    request.headers.authorization = 'Bearer ' + request.body.token;
  }

  try {
    request.user = await request.jwtVerify();
  } catch (err) {
    console.error(moment().format('HH:mm:ss.SSS'), request.ipAddr, 'Error client try to access API ' + StatusCodes.UNAUTHORIZED, `message: '${err.message}'`);
    return reply.code(StatusCodes.UNAUTHORIZED).send({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: getReasonPhrase(StatusCodes.UNAUTHORIZED)
    });
  }
}

export const getNReferToken = async (ip: string = null) => {
  if (nReferToken && nReferToken.split('.').length === 3) {
    // ตรวจสอบว่า token ยังไม่หมดอายุ ถ้าไม่หมดอายุให้ return token เลย
    const tokenArray = nReferToken.split('.');
    if (tokenArray.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenArray[1], 'base64').toString());

      // ตรวจสอบว่า token จะหมดอายุก่อน 4 นาทีหรือไม่
      if (payload?.exp && moment(payload?.exp).format('X') > moment().add(4, 'minutes').format('X')) {
        // console.log('✅ Token is still valid, returning existing nReferToken');
        return nReferToken;
      }
    }
  }

  if (!ip || ip === '127.0.0.1'){
    ip = getIP()?.ip || '127.0.0.1';
  }
  const fixedUrl = process.env.NREFER_API_URL || 'https://nrefer.moph.go.th/api/his';
  const url = fixedUrl + '/login/api-key';
  const bodyData = {
    ip,
    apiKey, secretKey, hospcode,
    processPid: process.pid, dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
    sourceApiName: 'HIS-connect', apiVersion: version, subVersion: subVersion,
    hisProvider: process.env.HIS_PROVIDER
  };
  const headers = {
    'Content-Type': 'application/json',
    'Source-Agent': 'HISConnect-' + version + '-' + subVersion + '-' + (hospcode || 'hosp') + '-' + moment().format('x') + '-' + Math.random().toString(36).substring(2, 10),
  };

  try {
    const { status, data } = await axios.post(url, bodyData, { headers });
    nReferToken = data?.token || null;
    // console.log('✅ New nReferToken obtained:', nReferToken.split('.').length === 3 ? 'valid JWT' : 'invalid JWT');
    return nReferToken;
  } catch (error) {
    console.error('❗getNReferToken', error.status || '', error.message);
    return null;
  }
}

