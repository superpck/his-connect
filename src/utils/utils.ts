import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import * as os from 'os';

import zlib from 'zlib';
import { promisify } from 'util';
import crypto from 'crypto';

dayjs.extend(duration);

const encryptAlgorithm = ['aes-256-cbc', 'aes-192-cbc', 'aes-128-cbc'];

export const randomString = async (length: number, format = 'AlphaNumeric') => {
  if (!length) throw new Error('Length cannot be empty');
  if (!format) throw new Error('Format cannot be empty');

  // format AlphaNumeric=String+number, Special=AlphaNumeric+Special characters
  length = Math.max(1, Math.min(1024, length));
  let result = '';
  const characters1 = '@ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const characters2 = '@ABCDEFGHIJKLMNOPQRSTUVWXYZ-*^abcdefghijklmnopqrstuvwxyz0123456789!$_';
  const characters = format?.substring(0, 1).toUpperCase() == 'S' ? characters2 : characters1;
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export const isNumeric = (value: any): boolean => {
  if (value === undefined || value === null) throw new Error('Value cannot be empty');
  return !isNaN(parseFloat(value)) && isFinite(value);
}

export const dateLen = async (date1: any, date2: any = dayjs()) => {
  if (date1 === undefined || date1 === null || date1 === '0000-00-00' || date1 === '0000-00-00 00:00:00' || date1 === 'Invalid Date' ||
    date2 === undefined || date2 === null || date2 === '0000-00-00' || date2 === '0000-00-00 00:00:00' || date2 === 'Invalid Date') {
    return false;
  }
  if (!date1 || !date2) {
    return null;
  }

  date1 = dayjs(date1);
  date2 = dayjs(date2);
  const dateDuration = dayjs.duration(date2.diff(date1));
  return {
    days: Math.floor(dateDuration.asDays()),
    seconds: dateDuration.asSeconds(),
    millisecond: dateDuration.milliseconds(),
    year: dateDuration.years(),
    month: dateDuration.months(),
    day: dateDuration.days(),
    hour: dateDuration.hours(),
    minute: dateDuration.minutes(),
    second: dateDuration.seconds()
  }
}

export const thaiDate = (date: any = dayjs()) => {
  if (!date) throw new Error('Date cannot be empty');
  return dayjs(date).date() + '/' + (dayjs(date).month() + 1) + '/' + (dayjs(date).year() + 543);
};

export const thaiDateAbbr = (date: any = dayjs(), withYear = true) => {
  if (!date) throw new Error('Date cannot be empty');
  const thaiMonthAbbr = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const nMonth = dayjs(date).month();
  return dayjs(date).date() + ' ' + thaiMonthAbbr[nMonth] +
    (withYear ? (' ' + (dayjs(date).year() + 543)) : '');
};

export const thaiDateFull = (date: any = dayjs(), withYear = true): string => {
  if (!date) throw new Error('Date cannot be empty');
  const txtMonth = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม', 'กรุณาเลือกเดือน'];
  const thDow = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  const nMonth = dayjs(date).month();
  return 'วัน' + thDow[+dayjs(date).format('d') - 1] + ' ที่ ' + dayjs(date).date() + ' ' + txtMonth[nMonth] +
    (withYear ? (' พ.ศ.' + (dayjs(date).year() + 543)) : '');
};

export const timeMinute = (date: any = dayjs()) => {
  if (!date) throw new Error('Date cannot be empty');
  return dayjs(date).format('HH:mm');
};

export const timeSecond = (date: any = dayjs()) => {
  if (!date) throw new Error('Date cannot be empty');
  return dayjs(date).format('HH:mm:ss');
};

export const getIP = () => {
  const interfaces = os.networkInterfaces();
  for (const ifaces of Object.values(interfaces)) {
    const iface = ifaces.find(i => i.family === 'IPv4' && !i.internal);
    if (iface) return { ip: iface.address, interfaces };
  }
  return { ip: null, interfaces };
};

export const getClientIp = (req: any) => {
  if (!req) throw new Error('Request object cannot be empty');
  const xForwardedFor = req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For'] || req.headers['X-Real-IP'] || req.headers['x-real-ip'];
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }
  return req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

export const gzip = async (data: any) => {
  if (!data) throw new Error('Data to compress cannot be empty');
  const gzip = promisify(zlib.gzip);
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  const compressedString = await gzip(dataString);

  return compressedString;
};

export const unGzip = async (compressedString: string) => {
  if (!compressedString) throw new Error('Data to decompress cannot be empty');
  const unzip = promisify(zlib.unzip);
  const decompressedString = await unzip(compressedString);
  return decompressedString.toString();
};

export const replyGzip = async (reply: any, data: any) => {
  if (!data) throw new Error('Data to compress cannot be empty');
  const compressedData = await gzip(data);
  reply.header('content-encoding', 'gzip');
  return compressedData;
};

export const md5 = (data: string) => {
  if (!data) throw new Error('Data to hash cannot be empty');
  return crypto.createHash('md5').update(data).digest('hex');
};
export const sha256 = (data: string) => {
  if (!data) throw new Error('Data to hash cannot be empty');
  return crypto.createHash('sha256').update(data).digest('hex');
};
export const sha512 = (data: string) => {
  if (!data) throw new Error('Data to hash cannot be empty');
  return crypto.createHash('sha512').update(data).digest('hex');
};
export const sha1 = (data: string) => {
  if (!data) throw new Error('Data to hash cannot be empty');
  return crypto.createHash('sha1').update(data).digest('hex');
};
export const encryptString = (data: string, algorithm: string = 'aes-256-cbc', key: string, iv: string) => {
  if (!data) throw new Error('Data to encrypt cannot be empty');
  if (!key) throw new Error('Encryption key cannot be empty');
  if (!iv) throw new Error('Initialization vector (IV) cannot be empty');
  if (encryptAlgorithm.includes(algorithm) === false) throw new Error(`Unsupported encryption algorithm: ${algorithm}`);

  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};
export const decryptString = (encryptedData: string, algorithm: string = 'aes-256-cbc', key: string, iv: string) => {
  if (!encryptedData) throw new Error('Data to decrypt cannot be empty');
  if (!key) throw new Error('Decryption key cannot be empty');
  if (!iv) throw new Error('Initialization vector (IV) cannot be empty');
  if (encryptAlgorithm.includes(algorithm) === false) throw new Error(`Unsupported encryption algorithm: ${algorithm}`);

  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
export const base64Encode = (data: string) => {
  if (!data) throw new Error('Data to encode cannot be empty');
  return Buffer.from(data, 'utf8').toString('base64');
};
export const base64Decode = (data: string) => {
  if (!data) throw new Error('Data to decode cannot be empty');
  return Buffer.from(data, 'base64').toString('utf8');
};
