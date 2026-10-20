"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveIoTData = exports.person = exports.signIn = void 0;
const http_status_codes_1 = require("http-status-codes");
const dayjs_1 = __importDefault(require("dayjs"));
const hismodel_1 = __importDefault(require("../../routes/his/hismodel"));
const moph_refer_1 = require("../../middleware/moph-refer");
const jwt_1 = require("../../plugins/jwt");
const db = global.dbHIS;
const jwt = new jwt_1.Jwt();
const signIn = async (_req, reply) => {
    const hospcode = _req?.body?.hospcode || null;
    const device_no = _req?.body?.device_no || null;
    const allow_code = _req?.body?.allow_code || null;
    const expire_minute = _req?.body?.expire_minute || 24 * 60;
    if (!hospcode || (hospcode != process.env.HOSPCODE && hospcode != 'TEST00001')) {
        return reply.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).send({
            status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            message: 'Invalid hospcode'
        });
    }
    if (!device_no || !allow_code) {
        return reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({
            status: http_status_codes_1.StatusCodes.BAD_REQUEST,
            message: 'Missing device_no or allow_code'
        });
    }
    const getDevice = await (0, moph_refer_1.getIoTDevice)({ device_no, hospcode, allow_code });
    if (!getDevice || getDevice.status !== 200) {
        return reply.send({
            status: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            message: 'Missing refer token',
            ...getDevice
        });
    }
    if (!getDevice?.ref) {
        return reply.send({
            status: http_status_codes_1.StatusCodes.NOT_FOUND,
            message: 'Device not found'
        });
    }
    const token = jwt.sign({ device: getDevice.ref, hospcode, device_no, allow_code }, `${expire_minute}m`, 'KIOSK');
    return reply.status(http_status_codes_1.StatusCodes.OK).send({
        status: http_status_codes_1.StatusCodes.OK,
        token,
        data: {
            device: getDevice.ref,
            create_hn: getDevice?.create_hn,
            create_visitno: getDevice?.create_visitno
        }
    });
};
exports.signIn = signIn;
const person = async (_req, reply) => {
    const type = _req?.body?.type;
    const id = _req?.body?.id;
    if (!type || !id) {
        return reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({
            status: http_status_codes_1.StatusCodes.BAD_REQUEST,
            message: 'Invalid parameter'
        });
    }
    let result = await hismodel_1.default.getPerson(db, type, id);
    if (!result || result.length === 0) {
        return reply.send({
            status: http_status_codes_1.StatusCodes.NOT_FOUND,
            message: `Not found ${type}: ${id}`
        });
    }
    result = await toLowerColumnName(result);
    let row = result[0];
    let data = {
        prename: row.prename || null,
        first_name: row.fname || row.name || null,
        last_name: row.lname || row.surname || row.lname || null,
        id_card: row.cid || row.person_id || row.id_card || null,
        hn: row.hn || null,
        birth_date: row.dob || row.birthdate || row.birth || null,
        sex: row.sex || null,
        gender: row.sex == '1' ? 'M' : row.sex == '2' ? 'F' : 'U',
        phone: row.phone || row.mobile || row.tel || row.telephone || null,
        occupation: row.occupation_new || row.occupation_old || null,
        nationality: row.nation || row.nationality || null,
        ethnicity: row.ethnicity || row.race || null,
        father_name: row.father_name || row.father || null,
        mother_name: row.mother_name || row.mother || null,
    };
    data.birth_date = data.birth_date ? (0, dayjs_1.default)(data.birth_date).format('YYYY-MM-DD') : null;
    data.address = {};
    result = await hismodel_1.default.getAddress(db, 'hn', data.hn);
    result = Array.isArray(result) ? result : [result];
    let address = result && result.length > 0 ? (await toLowerColumnName(result)) : null;
    address = address && address.length > 0 ? address[0] : null;
    if (address) {
        data.address.addresstype = address.addresstype || null;
        data.address.province = address.changwat || null;
        data.address.district = address.ampur || null;
        data.address.sub_district = address.tambon || null;
        data.address.zipcode = address.zip || null;
        data.address.road = address.road || row.road || null;
        data.address.alley = address.soimain || null;
        data.address.village = address.villaname || null;
        data.address.village_no = address.village || null;
        data.address.house_no = address.houseno || null;
    }
    return reply.status(http_status_codes_1.StatusCodes.OK).send({
        status: http_status_codes_1.StatusCodes.OK,
        data
    });
};
exports.person = person;
const saveIoTData = async (_req, reply) => {
    const hospcode = _req?.body?.hospcode;
    const data = _req?.body?.data || {};
    if (!hospcode || !data || Object.keys(data)) {
        return reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({
            status: http_status_codes_1.StatusCodes.BAD_REQUEST,
            message: 'Invalid parameter'
        });
    }
};
exports.saveIoTData = saveIoTData;
async function toLowerColumnName(payload) {
    const rows = Array.isArray(payload) ? payload : [payload];
    const normalized = rows.map((row) => {
        const lowered = {};
        for (const key in row) {
            lowered[key.toLowerCase()] = row[key];
        }
        return lowered;
    });
    return Array.isArray(payload) ? normalized : normalized[0];
}
