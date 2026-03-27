import axios from 'axios';
import moment = require('moment');
import { createHash } from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';
import { getIP } from './utils';
import * as os from 'os';
const packageJson = require('../../package.json');

const referAPIUrl = process.env?.MOPH_ERP_API_URL || 'https://refer.moph.go.th/api/erp';
const adminAPIUrl = process.env.ADMIN_API_URL || 'https://referlink.moph.go.th/api/admin';
const erpAPIUrl = process.env.ERP_API_URL || 'https://referlink.moph.go.th/api/moph-erp';
const hcode = process.env.HOSPCODE;
const apiKey = process.env?.MOPH_ERP_APIKEY || process.env.NREFER_APIKEY || 'api-key';
const secretKey = process.env?.MOPH_ERP_SECRETKEY || process.env.NREFER_SECRETKEY || 'secret-key';
let crontabConfig: any = {
  client_ip: '', version: global.appDetail?.version || '',
  subVersion: global.appDetail?.subVersion || ''
};
let nReferToken: string = null;
let hospitalConfig: any = null;
const gzip = promisify(zlib.gzip);

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
    console.log('getNReferToken Error:', error.status || '', error.message);
    return error;
  }
}

export const getHospitalConfig = async () => {
  const now = moment();
  if (hospitalConfig) {
    const configTime = moment(hospitalConfig.fetchTime || null);
    const diff = now.diff(configTime, 'minutes');
    if (diff < 12) {
      return hospitalConfig;
    }
  }

  await getReferToken();
  if (!nReferToken) {
    return { status: 500, message: 'No nRefer token' };
  }

  const url = referAPIUrl + '/nrefer/api-config/' + hcode;
  const headers = createHeaders(nReferToken);
  try {
    const { status, data } = await axios.get(url, { headers });
    hospitalConfig = { ...(data?.row || data?.data || data), fetchTime: now.format('YYYY-MM-DD HH:mm:ss') };
    return hospitalConfig;
  } catch (error) {
    return error;
  }
}

export const taskFunction = async (type = '', bodyData: any = null) => {
  await getReferToken();
  if (!nReferToken) {
    return { status: 500, message: 'No nRefer token' };
  }
  const headers = createHeaders(nReferToken);
  try {
    let response: any;
    if (type == 'sql') {
      const url = referAPIUrl + '/his-connect/task-function-sql';
      response = await axios.post(url, bodyData, { headers });
    } else {
      const url = referAPIUrl + `/his-connect/task-function/${type}`;
      response = await axios.get(url, { headers });
    }
    return { statusCode: response.status, ...response.data };
  } catch (error) {
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
    sourceApiName: 'HIS-connect', apiVersion: crontabConfig.version || packageJson?.version, subVersion: crontabConfig.subVersion || packageJson?.subVersion,
    hisProvider: process.env.HIS_PROVIDER
  };
  const jsonString = JSON.stringify(bodyData);
  const compressedBody = await gzip(jsonString);
  // const url = referAPIUrl + '/nrefer' + uri;
  const url = 'https://refer.moph.go.th/api/beta/nrefer' + uri;
  console.log(' ===> ', url,`Compressed body size remaining: ${((compressedBody.length || 0)*100/(jsonString.length || 1)).toFixed(2)}%`);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + nReferToken,
    'content-encoding': 'gzip',
    'Source-Agent': 'HISConnect-' + (crontabConfig.version || packageJson?.version || 'x') + '-' + (crontabConfig.subVersion || packageJson?.subVersion || 'x') + '-' + (process.env.HOSPCODE || 'hosp') + '-' + moment().format('x') + '-' + Math.random().toString(36).substring(2, 10),
  };
  try {
    const { status, data } = await axios.post(url, compressedBody, { headers });
    return { statusCode: status, ...data };
  } catch (error) {
    return error;
  }
}

export const updateHISAlive = async (dataArray: any) => {
  // await getReferToken();
  // if (!nReferToken) {
  //   return { status: 500, message: 'No nRefer token' };
  // }

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
    return data;
  } catch (error) {
    return error;
  }
}
export const updateAdminRequest = async (updateData: any) => {
  const apiIp = getIP();
  if (!apiIp || !apiIp.ip) {
    return { status: 400, message: 'No API IP' };
  }

  await getReferToken();
  if (!nReferToken) {
    return { status: 500, message: 'No nRefer token' };
  }
  const url = referAPIUrl + '/moph-erp/update-admin-request/' + hcode;
  const postData = createPostData(updateData);
  const headers = createHeaders(nReferToken);
  try {
    const { status, data } = await axios.post(url, postData, { headers });
    return { statusCode: status, ...data };
  } catch (error) {
    return error;
  }
}

export const sendingError = async (dataArray: any) => {
  await getReferToken();
  if (!nReferToken) {
    return { status: 500, message: 'No nRefer token' };
  }

  const hospcode = process.env.HOSPCODE || hcode || '';
  dataArray = {
    ...dataArray, hospcode,
    client_detail: {
      his: process.env.HIS_PROVIDER || '',
      port: process.env.PORT || '',
      db: process.env.HIS_DB_CLIENT || '',
      os: os.platform() || '',
      os_type: os.type() || ''
    }
  };

  const url = referAPIUrl + '/his-connect/save-error';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + nReferToken,
    'Source-Agent': 'HISConnect-' + (crontabConfig.version || packageJson?.version || 'x') + '-' + (crontabConfig.subVersion || packageJson?.subVersion || 'x') + '-' + (process.env.HOSPCODE || 'hosp') + '-' + moment().format('x') + '-' + Math.random().toString(36).substring(2, 10),
  };
  const option = {
    url, method: 'POST', headers, data: { hospcode, data: dataArray }
  };
  try {
    const { status, data } = await axios(option);
    console.log('sendingError to MOPH:', status || data.status || data?.statusCode || 'success');
    return { statusCode: status, ...data };
  } catch (error: any) {
    console.error('sendingError to MOPH fail:', error.status || '', error.message);
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