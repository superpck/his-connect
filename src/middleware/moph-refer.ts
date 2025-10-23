import axios from 'axios';
import moment = require('moment');
import { createHash } from 'crypto';
import { getIP } from './utils';

const referAPIUrl = 'https://refer.moph.go.th/api/beta';
// const referAPIUrl = process.env.NREFER_API_URL || 'https://refer.moph.go.th/api/his';
const adminAPIUrl = process.env.ADMIN_API_URL || 'https://referlink.moph.go.th/api/admin';
const erpAPIUrl = process.env.ERP_API_URL || 'https://referlink.moph.go.th/api/moph-erp';
const hcode = process.env.HOSPCODE;
const apiKey = process.env.NREFER_APIKEY || 'api-key';
const secretKey = process.env.NREFER_SECRETKEY || 'secret-key';
let crontabConfig: any = {
  client_ip: '', version: global.appDetail?.version || '',
  subVersion: global.appDetail?.subVersion || ''
};
let nReferToken: string = null;

export const getReferToken = async () => {
  if (nReferToken) {
    const toke = nReferToken.split('.');
    if (toke.length == 3) {
      const payload = JSON.parse(Buffer.from(toke[1], 'base64').toString('utf-8'));
      if (payload && payload.exp) {
        const expireTime = moment.unix(payload.exp);
        const now = moment();
        const diff = expireTime.diff(now, 'minutes');
        if (diff > 3) {
          return { token: nReferToken, status: 200 };
        }
      }
    }
  }

  const url = referAPIUrl + '/login/api-key';
  const bodyData = {
    ip: crontabConfig['client_ip'] || '127.0.0.1',
    apiKey, secretKey, hospcode: hcode,
    processPid: process.pid, dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
    sourceApiName: 'HIS-connect', apiVersion: crontabConfig.version, subVersion: crontabConfig.subVersion,
    hisProvider: process.env.HIS_PROVIDER
  };
  const headers = {
    'Content-Type': 'application/json',
    'Source-Agent': 'HISConnect-' + crontabConfig.version + '-' + crontabConfig.subVersion + '-' + (process.env.HOSPCODE || 'hosp') + '-' + moment().format('x') + '-' + Math.random().toString(36).substring(2, 10),
  };

  try {
    const { status, data } = await axios.post(url, bodyData, { headers });
    nReferToken = data?.token || nReferToken;
    return data;
  } catch (error) {
    console.log('getNReferToken', error.status || '', error.message);
    return error;
  }
}

export const sendingToMoph = async (uri: string, dataArray: any) => {
  await getReferToken();
  if (!nReferToken) {
    return { status: 500, message: 'No nRefer token' };
  }

  const bodyData = {
    ip: crontabConfig['client_ip'] || '127.0.0.1',
    hospcode: hcode, data: JSON.stringify(dataArray),
    processPid: process.pid, dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
    sourceApiName: 'HIS-connect', apiVersion: crontabConfig.version, subVersion: crontabConfig.subVersion,
    hisProvider: process.env.HIS_PROVIDER
  };

  const url = referAPIUrl + '/nrefer' + uri;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + nReferToken,
    'Source-Agent': 'HISConnect-' + (crontabConfig.version || 'x') + '-' + (crontabConfig.subVersion || 'x') + '-' + (process.env.HOSPCODE || 'hosp') + '-' + moment().format('x') + '-' + Math.random().toString(36).substring(2, 10),
  };
  try {
    const { status, data } = await axios.post(url, bodyData, { headers });
    return { statusCode: status, ...data };
  } catch (error) {
    return error;
  }
}

export const updateHISAlive = async (dataArray: any) => {
  await getReferToken();
  if (!nReferToken) {
    return { status: 500, message: 'No nRefer token' };
  }

  const hashedApiKey = createHash('sha1')
    .update((process.env.REQUEST_KEY || '') + (dataArray.hospcode || '') + (dataArray.his || '') + moment().format('YYYY-MM-DD HH:mm:ss'))
    .digest('hex');
  dataArray.apikey = hashedApiKey;

  const bodyData = createPostData(dataArray);
  const url = erpAPIUrl + '/his-connect/update';
  const headers = createHeaders();
  try {
    const { status, data } = await axios.post(url, bodyData, { headers });
    return { statusCode: status, ...data };
  } catch (error) {
    return error;
  }
}

export const checkAdminRequest = async () => {
  const apiIp = getIP();
  if (!apiIp || !apiIp.ip) {
    return { status: 400, message: 'No API IP' };
  }

  await getReferToken();
  if (!nReferToken) {
    return { status: 500, message: 'No nRefer token' };
  }

  const url = referAPIUrl + '/moph-erp/check-request/' + hcode;
  const headers = {
    'Content-Type': 'application/json',
    'client-ip': apiIp.ip,
    'provider': process.env.HIS_PROVIDER,
    'Authorization': 'Bearer ' + nReferToken,
    'Source-Agent': 'HISConnect-' + (crontabConfig.version || 'x') + '-' + (crontabConfig.subVersion || 'x') + '-' + (process.env.HOSPCODE || 'hosp') + '-' + moment().format('x') + '-' + Math.random().toString(36).substring(2, 10),
  };
  try {
    const { status, data } = await axios.get(url, { headers });
    return { statusCode: status, ...data };
  } catch (error) {
    return error;
  }
}
export const updateAdminRequest = async (data: any) => {
  const apiIp = getIP();
  if (!apiIp || !apiIp.ip) {
    return { status: 400, message: 'No API IP' };
  }

  await getReferToken();
  if (!nReferToken) {
    return { status: 500, message: 'No nRefer token' };
  }
  const url = referAPIUrl + '/moph-erp/update-admin-request/' + hcode;
  const postData = createPostData(data);
  const headers = createHeaders(nReferToken);
  try {
    const { status, data } = await axios.post(url, postData, { headers });
    return { statusCode: status, ...data };
  } catch (error) {
    return error;
  }
}

function createPostData(dataArray: any) {
  return {
    ip: crontabConfig['client_ip'] || getIP() || '127.0.0.1',
    hospcode: hcode, data: JSON.stringify(dataArray),
    processPid: process.pid, dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
    sourceApiName: 'HIS-connect', apiVersion: crontabConfig.version, subVersion: crontabConfig.subVersion,
    hisProvider: process.env.HIS_PROVIDER
  };
}
function createHeaders(token: string = null) {
  const apiIp = getIP();
  let headers = {
    'client-ip': apiIp.ip,
    'provider': process.env.HIS_PROVIDER,
    'Content-Type': 'application/json',
    'Source-Agent': 'HISConnect-' +
      (crontabConfig.version || 'x') + '-' +
      (crontabConfig.subVersion || 'x') + '-' +
      (process.env.HOSPCODE || 'hosp') + '-' +
      moment().format('x') + '-' +
      Math.random().toString(36).substring(2, 10)
  };
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  return headers;
}