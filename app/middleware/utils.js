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
exports.getIP = exports.timeSecond = exports.timeMinute = exports.thaiDateFull = exports.thaiDateAbbr = exports.thaiDate = exports.dateLen = exports.isNumeric = exports.randomString = void 0;
const moment_1 = __importDefault(require("moment"));
const os = __importStar(require("os"));
const randomString = async (length, format = 'AlphaNumeric') => {
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
    return !isNaN(parseFloat(value)) && isFinite(value);
};
exports.isNumeric = isNumeric;
const dateLen = async (date1, date2 = (0, moment_1.default)()) => {
    if (date1 === undefined || date1 === null || date1 === '0000-00-00' || date1 === '0000-00-00 00:00:00' || date1 === 'Invalid Date' ||
        date2 === undefined || date2 === null || date2 === '0000-00-00' || date2 === '0000-00-00 00:00:00' || date2 === 'Invalid Date') {
        return false;
    }
    if (!date1 || !date2) {
        return null;
    }
    date1 = (0, moment_1.default)(date1);
    date2 = (0, moment_1.default)(date2);
    const duration = moment_1.default.duration((0, moment_1.default)(date2).diff((0, moment_1.default)(date1)));
    return {
        days: Math.floor(duration['_milliseconds'] / 1000 / 60 / 60 / 24),
        year: duration['_data']['years'],
        month: duration['_data']['months'],
        day: duration['_data']['days'],
        hour: duration['_data']['hours'],
        minute: duration['_data']['minutes'],
        second: duration['_data']['seconds']
    };
};
exports.dateLen = dateLen;
const thaiDate = (date = (0, moment_1.default)()) => {
    return (0, moment_1.default)(date).get('date') + '/' + (+(0, moment_1.default)(date).get('month') + 1) + '/' + (+(0, moment_1.default)(date).get('year') + 543);
};
exports.thaiDate = thaiDate;
const thaiDateAbbr = (date = (0, moment_1.default)(), withYear = true) => {
    const thaiMonthAbbr = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const nMonth = (0, moment_1.default)(date).get('month');
    return (0, moment_1.default)(date).get('date') + ' ' + thaiMonthAbbr[nMonth] +
        (withYear ? (' ' + (+(0, moment_1.default)(date).get('year') + 543)) : '');
};
exports.thaiDateAbbr = thaiDateAbbr;
const thaiDateFull = (date = (0, moment_1.default)(), withYear = true) => {
    const txtMonth = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม', 'กรุณาเลือกเดือน'];
    const thDow = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
    const nMonth = (0, moment_1.default)(date).get('month');
    return 'วัน' + thDow[+(0, moment_1.default)(date).format('d') - 1] + ' ที่ ' + (0, moment_1.default)(date).get('date') + ' ' + txtMonth[nMonth] +
        (withYear ? (' พ.ศ.' + (+(0, moment_1.default)(date).get('year') + 543)) : '');
};
exports.thaiDateFull = thaiDateFull;
const timeMinute = (date = (0, moment_1.default)()) => {
    return (0, moment_1.default)(date).format('HH:mm');
};
exports.timeMinute = timeMinute;
const timeSecond = (date = (0, moment_1.default)()) => {
    return (0, moment_1.default)(date).format('HH:mm:ss');
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
