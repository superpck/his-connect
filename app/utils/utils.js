"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.base64Decode = exports.base64Encode = exports.decryptString = exports.encryptString = exports.sha1 = exports.sha512 = exports.sha256 = exports.md5 = exports.replyGzip = exports.unGzip = exports.gzip = exports.getClientIp = exports.getIP = exports.timeSecond = exports.timeMinute = exports.thaiDateFull = exports.thaiDateAbbr = exports.thaiDate = exports.dateLen = exports.isNumeric = exports.randomString = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const duration_1 = __importDefault(require("dayjs/plugin/duration"));
const os = __importStar(require("os"));
const zlib_1 = __importDefault(require("zlib"));
const util_1 = require("util");
const crypto_1 = __importDefault(require("crypto"));
dayjs_1.default.extend(duration_1.default);
const encryptAlgorithm = ['aes-256-cbc', 'aes-192-cbc', 'aes-128-cbc'];
const randomString = async (length, format = 'AlphaNumeric') => {
    if (!length)
        throw new Error('Length cannot be empty');
    if (!format)
        throw new Error('Format cannot be empty');
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
};
exports.randomString = randomString;
const isNumeric = (value) => {
    if (value === undefined || value === null)
        throw new Error('Value cannot be empty');
    return !isNaN(parseFloat(value)) && isFinite(value);
};
exports.isNumeric = isNumeric;
const dateLen = async (date1, date2 = (0, dayjs_1.default)()) => {
    if (date1 === undefined || date1 === null || date1 === '0000-00-00' || date1 === '0000-00-00 00:00:00' || date1 === 'Invalid Date' ||
        date2 === undefined || date2 === null || date2 === '0000-00-00' || date2 === '0000-00-00 00:00:00' || date2 === 'Invalid Date') {
        return false;
    }
    if (!date1 || !date2) {
        return null;
    }
    date1 = (0, dayjs_1.default)(date1);
    date2 = (0, dayjs_1.default)(date2);
    const dateDuration = dayjs_1.default.duration(date2.diff(date1));
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
    };
};
exports.dateLen = dateLen;
const thaiDate = (date = (0, dayjs_1.default)()) => {
    if (!date)
        throw new Error('Date cannot be empty');
    return (0, dayjs_1.default)(date).date() + '/' + ((0, dayjs_1.default)(date).month() + 1) + '/' + ((0, dayjs_1.default)(date).year() + 543);
};
exports.thaiDate = thaiDate;
const thaiDateAbbr = (date = (0, dayjs_1.default)(), withYear = true) => {
    if (!date)
        throw new Error('Date cannot be empty');
    const thaiMonthAbbr = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const nMonth = (0, dayjs_1.default)(date).month();
    return (0, dayjs_1.default)(date).date() + ' ' + thaiMonthAbbr[nMonth] +
        (withYear ? (' ' + ((0, dayjs_1.default)(date).year() + 543)) : '');
};
exports.thaiDateAbbr = thaiDateAbbr;
const thaiDateFull = (date = (0, dayjs_1.default)(), withYear = true) => {
    if (!date)
        throw new Error('Date cannot be empty');
    const txtMonth = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม', 'กรุณาเลือกเดือน'];
    const thDow = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
    const nMonth = (0, dayjs_1.default)(date).month();
    return 'วัน' + thDow[+(0, dayjs_1.default)(date).format('d') - 1] + ' ที่ ' + (0, dayjs_1.default)(date).date() + ' ' + txtMonth[nMonth] +
        (withYear ? (' พ.ศ.' + ((0, dayjs_1.default)(date).year() + 543)) : '');
};
exports.thaiDateFull = thaiDateFull;
const timeMinute = (date = (0, dayjs_1.default)()) => {
    if (!date)
        throw new Error('Date cannot be empty');
    return (0, dayjs_1.default)(date).format('HH:mm');
};
exports.timeMinute = timeMinute;
const timeSecond = (date = (0, dayjs_1.default)()) => {
    if (!date)
        throw new Error('Date cannot be empty');
    return (0, dayjs_1.default)(date).format('HH:mm:ss');
};
exports.timeSecond = timeSecond;
const getIP = () => {
    const interfaces = os.networkInterfaces();
    for (const ifaces of Object.values(interfaces)) {
        const iface = ifaces.find(i => i.family === 'IPv4' && !i.internal);
        if (iface)
            return { ip: iface.address, interfaces };
    }
    return { ip: null, interfaces };
};
exports.getIP = getIP;
const getClientIp = (req) => {
    if (!req)
        throw new Error('Request object cannot be empty');
    const xForwardedFor = req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For'] || req.headers['X-Real-IP'] || req.headers['x-real-ip'];
    if (xForwardedFor) {
        const ips = xForwardedFor.split(',').map(ip => ip.trim());
        return ips[0];
    }
    return req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
};
exports.getClientIp = getClientIp;
const gzip = async (data) => {
    if (!data)
        throw new Error('Data to compress cannot be empty');
    const gzip = (0, util_1.promisify)(zlib_1.default.gzip);
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const compressedString = await gzip(dataString);
    return compressedString;
};
exports.gzip = gzip;
const unGzip = async (compressedString) => {
    if (!compressedString)
        throw new Error('Data to decompress cannot be empty');
    const unzip = (0, util_1.promisify)(zlib_1.default.unzip);
    const decompressedString = await unzip(compressedString);
    return decompressedString.toString();
};
exports.unGzip = unGzip;
const replyGzip = async (reply, data) => {
    if (!data)
        throw new Error('Data to compress cannot be empty');
    const compressedData = await (0, exports.gzip)(data);
    reply.header('content-encoding', 'gzip');
    return compressedData;
};
exports.replyGzip = replyGzip;
const md5 = (data) => {
    if (!data)
        throw new Error('Data to hash cannot be empty');
    return crypto_1.default.createHash('md5').update(data).digest('hex');
};
exports.md5 = md5;
const sha256 = (data) => {
    if (!data)
        throw new Error('Data to hash cannot be empty');
    return crypto_1.default.createHash('sha256').update(data).digest('hex');
};
exports.sha256 = sha256;
const sha512 = (data) => {
    if (!data)
        throw new Error('Data to hash cannot be empty');
    return crypto_1.default.createHash('sha512').update(data).digest('hex');
};
exports.sha512 = sha512;
const sha1 = (data) => {
    if (!data)
        throw new Error('Data to hash cannot be empty');
    return crypto_1.default.createHash('sha1').update(data).digest('hex');
};
exports.sha1 = sha1;
const encryptString = (data, algorithm = 'aes-256-cbc', key, iv) => {
    if (!data)
        throw new Error('Data to encrypt cannot be empty');
    if (!key)
        throw new Error('Encryption key cannot be empty');
    if (!iv)
        throw new Error('Initialization vector (IV) cannot be empty');
    if (encryptAlgorithm.includes(algorithm) === false)
        throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
    const cipher = crypto_1.default.createCipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
};
exports.encryptString = encryptString;
const decryptString = (encryptedData, algorithm = 'aes-256-cbc', key, iv) => {
    if (!encryptedData)
        throw new Error('Data to decrypt cannot be empty');
    if (!key)
        throw new Error('Decryption key cannot be empty');
    if (!iv)
        throw new Error('Initialization vector (IV) cannot be empty');
    if (encryptAlgorithm.includes(algorithm) === false)
        throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
    const decipher = crypto_1.default.createDecipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
exports.decryptString = decryptString;
const base64Encode = (data) => {
    if (!data)
        throw new Error('Data to encode cannot be empty');
    return Buffer.from(data, 'utf8').toString('base64');
};
exports.base64Encode = base64Encode;
const base64Decode = (data) => {
    if (!data)
        throw new Error('Data to decode cannot be empty');
    return Buffer.from(data, 'base64').toString('utf8');
};
exports.base64Decode = base64Decode;
