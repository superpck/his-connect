import { StatusCodes } from 'http-status-codes';
import dayjs from 'dayjs';
import hisModel from '../../routes/his/hismodel';
import { getIoTDevice } from '../../middleware/moph-refer';
import { Jwt } from '../../plugins/jwt';
const db = global.dbHIS;
const jwt = new Jwt();

export const signIn = async (_req: any, reply: any): Promise<void> => {
  const hospcode = _req?.body?.hospcode || null;
  const device_no = _req?.body?.device_no || null;
  const allow_code = _req?.body?.allow_code || null;
  const expire_minute = _req?.body?.expire_minute || 24 * 60;

  if (!hospcode || (hospcode != process.env.HOSPCODE && hospcode != 'TEST00001')) {
    return reply.status(StatusCodes.UNAUTHORIZED).send({
      status: StatusCodes.UNAUTHORIZED,
      message: 'Invalid hospcode'
    });
  }
  if (!device_no || !allow_code) {
    return reply.status(StatusCodes.BAD_REQUEST).send({
      status: StatusCodes.BAD_REQUEST,
      message: 'Missing device_no or allow_code'
    });
  }

  const getDevice = await getIoTDevice({ device_no, hospcode, allow_code });
  if (!getDevice || getDevice.status !== 200) {
    return reply.send({
      status: StatusCodes.UNAUTHORIZED,
      message: 'Missing refer token',
      ...getDevice
    });
  }
  if (!getDevice?.ref) {
    return reply.send({
      status: StatusCodes.NOT_FOUND,
      message: 'Device not found'
    });
  }

  const token = jwt.sign({ device: getDevice.ref, hospcode, device_no, allow_code }, `${expire_minute}m`, 'KIOSK');

  return reply.status(StatusCodes.OK).send({
    status: StatusCodes.OK,
    token,
    data: {
      device: getDevice.ref,
      create_hn: getDevice?.create_hn,
      create_visitno: getDevice?.create_visitno
    }
  });
}

export const person = async (_req: any, reply: any): Promise<void> => {
  const type = _req?.body?.type;
  const id = _req?.body?.id;
  if (!type || !id) {
    return reply.status(StatusCodes.BAD_REQUEST).send({
      status: StatusCodes.BAD_REQUEST,
      message: 'Invalid parameter'
    });
  }

  let result: any = await hisModel.getPerson(db, type, id);
  if (!result || result.length === 0) {
    return reply.send({
      status: StatusCodes.NOT_FOUND,
      message: `Not found ${type}: ${id}`
    });
  }

  result = await toLowerColumnName(result);
  let row = result[0];
  let data: any = {
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

  data.birth_date = data.birth_date ? dayjs(data.birth_date).format('YYYY-MM-DD') : null;
  // data.his_person = row;
  data.address = {};

  result = await hisModel.getAddress(db, 'hn', data.hn);
  result = Array.isArray(result) ? result : [result];
  let address: Record<string, any> = result && result.length > 0 ? (await toLowerColumnName(result)) : null;
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

  return reply.status(StatusCodes.OK).send({
    status: StatusCodes.OK,
    data
  });
};

export const saveIoTData = async (_req: any, reply: any): Promise<void> => {
  const hospcode = _req?.body?.hospcode;
  const data = _req?.body?.data || {};
  if (!hospcode || !data || Object.keys(data)) {
    return reply.status(StatusCodes.BAD_REQUEST).send({
      status: StatusCodes.BAD_REQUEST,
      message: 'Invalid parameter'
    });
  }
};

async function toLowerColumnName(payload: any) {
  const rows = Array.isArray(payload) ? payload : [payload];

  const normalized = rows.map((row: Record<string, any>) => {
    const lowered: Record<string, any> = {};
    for (const key in row) {
      lowered[key.toLowerCase()] = row[key];
    }
    return lowered;
  });

  return Array.isArray(payload) ? normalized : normalized[0];
}
