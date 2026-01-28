import { Knex } from 'knex';
import * as moment from 'moment';

const maxLimit = 1000;
let hisHospcode = process.env.HOSPCODE;
const hisVersion = process.env.HIS_PROVIDER.toLowerCase() == 'hosxpv3' ? '3' : '4';
const dbClient = process.env.HIS_DB_CLIENT ? process.env.HIS_DB_CLIENT.toLowerCase() : 'mysql2';
let hospcodeConfig = null;

const getDatetimeExpr = (db: Knex, dateCol: string, timeCol: string): any => {
  const clientType = (db.client?.config?.client || dbClient).toLowerCase();
  switch (clientType) {
    case 'pg':
    case 'postgres':
    case 'postgresql':
      return db.raw(`${dateCol}::text || ' ' || ${timeCol}::text`);
    case 'mssql':
      return db.raw(`CAST(${dateCol} AS VARCHAR) + ' ' + CAST(${timeCol} AS VARCHAR)`);
    case 'oracledb':
      return db.raw(`${dateCol} || ' ' || ${timeCol}`);
    default:
      return db.raw(`CONCAT(${dateCol}, ' ', ${timeCol})`);
  }
};

const getHospcode = async () => {
  try {
    if (typeof global.dbHIS === 'function') {
      let row = await global.dbHIS('opdconfig').select('hospitalcode').first();
      hisHospcode = row ? row.hospitalcode : process.env.HOSPCODE;
      console.log('hisHospcode v.4', hisHospcode);
    } else {
      console.log('Default HOSPCODE:', hisHospcode);
    }
  } catch (error) {
    console.error('Error in getHospcode:', error);
    // Fallback to environment variable
    console.log('Default HOSPCODE:', hisHospcode);
  }
}
export class HisHosxpv4Model {
  constructor() {
    getHospcode();
  }

  check() {
    return true;
  }

  async hospCodeFromTable(db: Knex) {
    if (hospcodeConfig) {
      return hospcodeConfig;
    } else {
      const result = await db('opdconfig').select('hospitalcode').first();
      hospcodeConfig = result ? result.hospitalcode : hisHospcode;
      return hospcodeConfig;
    }
  }

  async testConnect(db: Knex) {
    let result: any;
    result = await global.dbHIS('opdconfig').first();
    const hospname = result?.hospitalname || result?.hospitalcode || null;

    result = await db('patient').select('hn').limit(1);
    const connection = result && (result.patient || result.length > 0) ? true : false;

    let charset: any = '';
    if (process.env.HIS_DB_CLIENT.toLowerCase().includes('mysql')) {
      result = await db('information_schema.SCHEMATA')
        .select('DEFAULT_CHARACTER_SET_NAME')
        .where('SCHEMA_NAME', process.env.HIS_DB_NAME)
        .first();
      charset = result?.DEFAULT_CHARACTER_SET_NAME || '';
    }
    return { hospname, connection, charset };
  }

  getTableName(db: Knex, dbName = process.env.HIS_DB_NAME) {
    return db('information_schema.tables')
      .select('table_name')
      .where('table_schema', '=', dbName);
  }

  // รหัสห้องตรวจ
  getDepartment(db: Knex, depCode: string = '', depName: string = '') {
    let sql = db('clinic');
    if (depCode) {
      sql.where('clinic', depCode);
    } else if (depName) {
      sql.whereLike('name', `%${depName}%`)
    }
    return sql
      .select('clinic as department_code', 'name as department_name',
        `'-' as moph_code`)
      .select(db.raw(`CASE WHEN LOCATE('ฉุกเฉิน', name) > 0 THEN 1 ELSE 0 END as emergency`))
      .orderBy('name')
      .limit(maxLimit);
  }

  // รหัส Ward
  async getWard(db: Knex, wardCode: string = '', wardName: string = '') {
    const subQuery = db('ward')
      .select('*')
      .select(db.raw('SUBSTRING(ward_export_code, 4, 3) as sub_code_3'))
      .select(db.raw('SUBSTRING(ward_export_code, 4, 1) as sub_code_1'))
      .as('w');

    let sql = db.select('*').from(subQuery);

    if (wardCode) {
      sql.where('w.ward', wardCode);
    } else if (wardName) {
      const op = db.client.driverName === 'pg' ? 'ilike' : 'like';
      sql.where('w.name', op, `%${wardName}%`);
    }

    sql = sql.select([
      'w.ward as wardcode',
      'w.name as wardname',
      'w.ward_export_code as std_code',

      // เรียกใช้ sub_code ที่เตรียมไว้ได้เลย โค้ดจะสั้นลง
      db.raw(`CASE 
                WHEN sub_code_3 IN ('602','603','604','606','607','608','609') THEN 0 
                WHEN sub_code_1 IN ('2','3','4','5') THEN 0
                ELSE bedcount 
              END as bed_normal`),

      db.raw("CASE WHEN sub_code_3 = '602' THEN bedcount ELSE 0 END as imc"),
      db.raw("CASE WHEN sub_code_3 = '603' THEN bedcount ELSE 0 END as bed_extra"),
      db.raw("CASE WHEN sub_code_3 = '604' THEN bedcount ELSE 0 END as bed_minithanyaruk"),
      db.raw("CASE WHEN sub_code_3 = '606' THEN bedcount ELSE 0 END as bed_special"),
      db.raw("CASE WHEN sub_code_3 = '607' THEN bedcount ELSE 0 END as homeward"),
      db.raw("CASE WHEN sub_code_3 = '608' THEN bedcount ELSE 0 END as lr"),
      db.raw("CASE WHEN sub_code_3 = '609' THEN bedcount ELSE 0 END as clip"),

      db.raw("CASE WHEN sub_code_1 = '2' THEN bedcount ELSE 0 END as bed_icu"),
      db.raw("CASE WHEN sub_code_1 = '3' THEN bedcount ELSE 0 END as bed_semi"),
      db.raw("CASE WHEN sub_code_1 = '4' THEN bedcount ELSE 0 END as bed_stroke"),
      db.raw("CASE WHEN sub_code_1 = '5' THEN bedcount ELSE 0 END as bed_burn"),

      db.raw("CASE WHEN w.ward_active = 'Y' THEN 1 ELSE 0 END as isactive")
    ])
      .where('w.ward', '<>', '')
      .whereNotNull('w.ward');

    return sql.orderBy('w.ward').limit(maxLimit);
  }

  // รายละเอียดแพทย์
  getDr(db: Knex, drCode: string = '', drName: string = '') {
    let sql = db('doctor');
    if (drCode) {
      sql.where('code', drCode);
    } else if (drName) {
      sql.whereLike('name', `%${drName}%`)
    }
    return sql
      .select('code as dr_code', 'licenseno as dr_license_code',
        'name as dr_name', 'expire as expire_date')
      .whereRaw(`LEFT(licenseno,1) IN ('ว','ท')`)
      .limit(maxLimit);
  }

  // verified for mysql, pg, mssql
  //select รายชื่อเพื่อแสดงทะเบียน refer
  async getReferOut(db: Knex, date: any, hospCode = hisHospcode, visitNo: string = null) {
    try {
      date = moment(date).format('YYYY-MM-DD');
      const limitDate = moment().subtract(1, 'months').format('YYYY-MM-DD');

      hospCode = await this.hospCodeFromTable(db);

      let query = db('referout as r');
      if (visitNo) {
        query.where('r.vn', visitNo);
      } else {
        query.where(builder => {
          builder.where('r.refer_date', date)
            .orWhere(subBuilder => {
              subBuilder.where('r.refer_date', '>', limitDate)
                .andWhereBetween('r.update_datetime', [date + ' 00:00:00', date + ' 23:59:59']);
            });
        })
      }

      const result = await query.select([
        db.raw('? as hospcode', [hospCode]),
        db.raw("CONCAT(r.refer_date, ' ', r.refer_time) as refer_date"),
        'r.refer_number as referid',
        'r.refer_hospcode as hosp_destination',
        'r.hn as pid',
        'r.hn as hn',
        'pt.cid as cid',
        'r.vn',
        'r.vn as seq',
        'an_stat.an as an',
        'pt.pname as prename',
        'pt.fname as fname',
        'r.doctor as dr',
        'doctor.licenseno as provider',
        'pt.lname as lname',
        'pt.birthday as dob',
        'pt.sex as sex',
        'r.referout_emergency_type_id as emergency',
        'r.request_text as request',
        'r.pdx as dx',
        'r.lab_text',
        'other_text',
        db.raw("CASE WHEN r.pmh IS NOT NULL AND r.pmh != '' THEN r.pmh ELSE opdscreen.pmh END as ph"),
        db.raw("CASE WHEN r.hpi IS NOT NULL AND r.hpi != '' THEN r.hpi ELSE opdscreen.hpi END as pi"),
        'r.treatment_text as physicalexam',
        'r.pre_diagnosis as diaglast',
        db.raw("CASE WHEN (SELECT count(an) FROM an_stat WHERE an = r.vn) = 1 THEN r.vn ELSE NULL END as an")
      ])
        .innerJoin('patient as pt', 'pt.hn', 'r.hn')
        .leftJoin('an_stat', 'r.vn', 'an_stat.vn')
        .leftJoin('opdscreen', 'r.vn', 'opdscreen.vn')
        .leftJoin('doctor', 'r.doctor', 'doctor.code')
        .whereNotNull('r.vn')
        .where('r.refer_hospcode', '!=', '')
        .whereNotNull('r.refer_hospcode')
        .where('r.refer_hospcode', '!=', hospCode)
        .orderBy('r.refer_date');

      return result;
    } catch (error) {
      throw error;
    }
  }

  async getPerson(db: Knex, columnName: string, searchText: any, hospCode = hisHospcode) {
    columnName = columnName == 'hn' ? 'p.hn' : columnName;
    columnName = columnName == 'cid' ? 'p.cid' : columnName;
    columnName = columnName == 'name' ? 'p.fname' : columnName;
    columnName = columnName == 'hid' ? 'h.house_id' : columnName;

    const rhGrp = hisVersion == '4' ? 'person.bloodgroup_rh' : 'person.blood_grp_rh';

    // Subquery for VSTATUS
    const vstatusSubquery = db('person_village_duty as pvd')
      .select(db.raw(`CASE 
                WHEN pvd.person_duty_id IN ('1','2','4','5') THEN '1'
                WHEN pvd.person_duty_id IN ('6') THEN '2'
                WHEN pvd.person_duty_id IN ('3') THEN '3'
                WHEN pvd.person_duty_id IN ('10') THEN '4'
                WHEN pvd.person_duty_id IN ('7','8','9') THEN '5'
                ELSE '5' 
            END`))
      .whereRaw('pvd.person_id = person.cid')
      .limit(1);

    let query = db('patient as p')
      .leftJoin('person', 'p.hn', 'person.patient_hn')
      .leftJoin('house as h', 'person.house_id', 'h.house_id')
      .leftJoin('occupation as o', 'o.occupation', 'p.occupation')
      .leftJoin('nationality as nt0', 'nt0.nationality', 'p.citizenship')
      .leftJoin('nationality as nt1', 'nt1.nationality', 'p.nationality')
      .leftJoin('provis_religion as r', 'r.code', 'p.religion')
      .leftJoin('education as e', 'e.education', 'p.educate')
      .leftJoin('person_labor_type as pl', 'person.person_labor_type_id', 'pl.person_labor_type_id');

    if (Array.isArray(searchText)) {
      query.whereIn(columnName, searchText);
    } else {
      query.where(columnName, searchText);
    }
    const result = await query.select(
      db.raw('? as HOSPCODE', [hisHospcode]),
      'h.house_id as HID',
      'p.cid as CID',
      'p.pname as PRENAME',
      'p.fname as NAME',
      'p.lname as LNAME',
      'p.hn as HN',
      'p.hn as PID',
      'p.sex as SEX',
      'p.birthday as BIRTH',
      db.raw("CASE WHEN p.marrystatus IN (1,2,3,4,5,6) THEN p.marrystatus ELSE 9 END as MSTATUS"),
      db.raw("CASE WHEN person.person_house_position_id = 1 THEN '1' ELSE '2' END as FSTATUS"),
      db.raw("CASE WHEN o.occupation IS NULL THEN '000' ELSE o.occupation END AS OCCUPATION_OLD"),
      db.raw("CASE WHEN o.nhso_code IS NULL THEN '9999' ELSE o.nhso_code END AS OCCUPATION_NEW"),
      db.raw("CASE WHEN nt0.nhso_code IS NULL THEN '099' ELSE nt0.nhso_code END AS RACE"),
      db.raw("CASE WHEN nt1.nhso_code IS NULL THEN '099' ELSE nt1.nhso_code END AS NATION"),
      db.raw("CASE WHEN p.religion IS NULL THEN '01' ELSE p.religion END AS RELIGION"),
      db.raw("CASE WHEN e.provis_code IS NULL THEN '9' ELSE e.provis_code END as EDUCATION"),
      'p.father_cid as FATHER',
      'p.mother_cid as MOTHER',
      'p.couple_cid as COUPLE',
      db.raw(`(${vstatusSubquery.toString()}) as VSTATUS`),
      'person.movein_date as MOVEIN',
      db.raw("CASE WHEN person.person_discharge_id IS NULL THEN '9' ELSE person.person_discharge_id END AS DISCHARGE"),
      'person.discharge_date as DDISCHARGE', `person.blood_group as ABOGROUP`,
      `${rhGrp} as RHGROUP`,
      'pl.nhso_code as LABOR',
      'p.passport_no as PASSPORT',
      'p.type_area as TYPEAREA',
      'p.mobile_phone_number as MOBILE',
      'p.deathday as dead',
      db.raw('CASE WHEN p.last_update IS NULL THEN p.last_update ELSE p.last_visit END as D_UPDATE')
    );

    return result;
  }

  async getAddress(db: Knex, columnName, searchText, hospCode = hisHospcode) {
    //columnName => hn
    const result = await db('person as p')
      .leftJoin('patient as pt', 'p.cid', 'pt.cid')
      .leftJoin('house as h', 'h.house_id', 'p.house_id')
      .leftJoin('village as v', 'v.village_id', 'h.village_id')
      .leftJoin('thaiaddress as t', 't.addressid', 'v.address_id')
      .leftJoin('person_address as pa', 'pa.person_id', 'p.person_id')
      .select(
        db.raw('? AS hospcode', [hisHospcode]),
        'pt.cid',
        'pt.hn',
        db.raw('pt.hn as pid'),
        db.raw("CASE WHEN p.house_regist_type_id IN (1, 2) THEN '1' ELSE '2' END as addresstype"),
        db.raw("CASE WHEN h.census_id IS NULL THEN '' ELSE h.census_id END AS house_id"),
        db.raw("CASE WHEN p.house_regist_type_id IN (4) THEN '9' ELSE h.house_type_id END as housetype"),
        db.raw('h.house_condo_roomno as roomno'),
        db.raw('h.house_condo_name as condo'),
        db.raw("CASE WHEN p.house_regist_type_id IN (4) THEN pt.addrpart ELSE h.address END as houseno"),
        db.raw("'' as soisub"),
        db.raw("'' as soimain"),
        db.raw("CASE WHEN p.house_regist_type_id IN (4) THEN pt.road ELSE h.road END as road"),
        db.raw("CASE WHEN p.house_regist_type_id IN (4) THEN '' ELSE v.village_name END as villaname"),
        db.raw("CASE WHEN p.house_regist_type_id IN (4) THEN pt.moopart ELSE v.village_moo END as village"),
        db.raw("CASE WHEN p.house_regist_type_id IN (4) THEN pt.tmbpart ELSE t.tmbpart END as tambon"),
        db.raw("CASE WHEN p.house_regist_type_id IN (4) THEN pt.amppart ELSE t.amppart END as ampur"),
        db.raw("CASE WHEN p.house_regist_type_id IN (4) THEN pt.chwpart ELSE t.chwpart END as changwat"),
        db.raw('p.last_update as D_Update')
      )
      .where(columnName, searchText);

    return result[0];
  }
  async getService(db: Knex, columnName: string, searchText: any, hospCode = hisHospcode) {
    // 1. Mapping Column Name (Sanitize input)
    const colMap = {
      'visitNo': 'os.vn',
      'vn': 'os.vn',
      'seq_id': 'os.seq_id',
      'hn': 'o.hn',
      'date_serv': 'o.vstdate'
    };
    // ถ้าไม่เจอใน map ให้ใช้ค่าเดิม (แต่ควรระวัง SQL Injection หาก columnName มาจาก User โดยตรง)
    const targetCol = colMap[columnName] || columnName;

    // 2. ตรวจสอบ Driver
    const driver = db.client.driverName; // 'mysql', 'pg', 'mssql'

    // --- Helper Functions ---

    // จัดการวันที่ (Date)
    const sqlDate = (field) => {
      // Logic เช็คค่าว่างแบบครอบจักรวาล
      const nullCheck = (driver === 'mysql' || driver === 'mysql2')
        ? `(${field} IS NULL OR ${field} = '' OR CAST(${field} AS CHAR) LIKE '0000-00-00%')`
        : `(${field} IS NULL)`; // PG/MSSQL เป็น Date แท้ ไม่ต้องเช็ค string 0000-00-00

      if (driver === 'pg') return `CASE WHEN ${nullCheck} THEN '' ELSE TO_CHAR(${field}, 'YYYY-MM-DD') END`;
      if (driver === 'mssql') return `CASE WHEN ${nullCheck} THEN '' ELSE FORMAT(${field}, 'yyyy-MM-dd') END`;
      return `CASE WHEN ${nullCheck} THEN '' ELSE DATE_FORMAT(${field}, '%Y-%m-%d') END`;
    };

    // จัดการเวลา (Time) -> Output format: HHmmss (เช่น 103000)
    const sqlTime = (field) => {
      const nullCheck = (driver === 'mysql' || driver === 'mysql2')
        ? `(${field} IS NULL OR ${field} = '')`
        : `(${field} IS NULL)`;

      if (driver === 'pg') return `CASE WHEN ${nullCheck} THEN '' ELSE TO_CHAR(${field}, 'HH24:MI:SS') END`;
      if (driver === 'mssql') return `CASE WHEN ${nullCheck} THEN '' ELSE FORMAT(${field}, 'HH:mm:ss') END`;
      return `CASE WHEN ${nullCheck} THEN '' ELSE TIME_FORMAT(${field}, '%H:%i:%s') END`;
    };

    // จัดการตัวเลข (Number) -> Output เป็น String ทศนิยมตามกำหนด ไม่เอา comma (REPLACE logic เดิม)
    const sqlNum = (field, decimal = 0) => {
      if (driver === 'pg' || driver === 'postgres' || driver === 'postgresql') {
        return `COALESCE(CAST(ROUND(CAST(${field} AS NUMERIC), ${decimal}) AS TEXT), '0')`;
      } else if (driver === 'mssql' || driver === 'sqlserver') {
        // MSSQL ใช้ STR หรือ CAST
        return `COALESCE(CAST(CAST(${field} AS DECIMAL(18, ${decimal})) AS VARCHAR), '0')`;
      } else {
        // MySQL ใช้ FORMAT แล้วลบ comma ออก
        return `CASE WHEN ${field} IS NOT NULL THEN REPLACE(FORMAT(${field}, ${decimal}), ',', '') ELSE '0' END`;
      }
      // PG/MSSQL ใช้การ CAST เป็น Numeric/Decimal แล้วแปลงเป็น Text
      // CAST(ROUND(col, 2) as DECIMAL(18,2))
    };

    // จัดการ DateTime Update
    const sqlDateTime = (dateField, timeField) => {
      // Logic รวม Date+Time แล้ว Format
      // เพื่อความง่ายและรองรับทุก DB: ใช้ Concat String เอา แล้วค่อย format (หรือส่งค่าดิบไปจัดการที่ APP ก็ได้)
      // แต่เพื่อให้ตรงกับ format เดิม '%Y-%m-%d %H:%i:%s'
      if (driver === 'pg' || driver === 'postgres' || driver === 'postgresql') return `TO_CHAR(CONCAT(${dateField}, ' ', ${timeField})::TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS')`;
      if (driver === 'mssql' || driver === 'sqlserver') return `FORMAT(CAST(CONCAT(${dateField}, ' ', ${timeField}) AS DATETIME), 'yyyy-MM-dd HH:mm:ss')`;
      return `DATE_FORMAT(CONCAT(${dateField}, ' ', ${timeField}), '%Y-%m-%d %H:%i:%s')`;
    };

    let query = db('ovst as o')
      .leftJoin('person as p', 'o.hn', 'p.patient_hn')
      .leftJoin('vn_stat as vn', function () {
        this.on('o.vn', '=', 'vn.vn')
          .andOn('vn.hn', '=', 'p.patient_hn');
      })
      .leftJoin('ipt as i', 'i.vn', 'o.vn')
      .leftJoin('opdscreen as s', function () {
        this.on('o.vn', '=', 's.vn')
          .andOn('o.hn', '=', 's.hn');
      })
      .leftJoin('pttype as p2', 'p2.pttype', 'vn.pttype')
      .leftJoin('village as v', 'v.village_id', 'p.village_id')
      .leftJoin('patient as pt', 'pt.hn', 'o.hn')
      .leftJoin('ovst_seq as os', 'os.vn', 'o.vn')
      .leftJoin('doctor', 'o.doctor', 'doctor.code')
      .leftJoin('er_nursing_detail as er', 'er.vn', 'o.vn');

    return query.select([
      db.raw('? as "HOSPCODE"', [hospCode]),
      'p.cid as CID', 'p.pname as PRENAME', 'p.fname as FNAME', 'p.lname as LNAME',
      'o.hn as HN', 'o.hn as PID', 'p.sex as SEX', 'p.birthdate as DOB',
      'os.seq_id', 'os.vn as SEQ',
      db.raw(`${sqlDate('o.vstdate')} as "DATE_SERV"`),
      db.raw(`${sqlTime('o.vsttime')} as "TIME_SERV"`),
      db.raw(`CASE WHEN v.village_moo <> '0' THEN '1' ELSE '2' END as "LOCATION"`),
      db.raw(`CASE o.visit_type WHEN 'i' THEN '1' WHEN 'o' THEN '2' ELSE '1' END as "INTIME"`),
      db.raw(`COALESCE(NULLIF(p2.pttype_std_code, ''), '9100') as "INSTYPE"`),
      'o.hospmain as MAIN',
      db.raw(`CASE o.pt_subtype WHEN '7' THEN '2' WHEN '9' THEN '3' WHEN '10' THEN '4' ELSE '1' END as "TYPEIN"`),
      db.raw('COALESCE(o.rfrolct, i.rfrolct) as "REFEROUTHOSP"'),
      db.raw('COALESCE(o.rfrocs, i.rfrocs) as "CAUSEOUT"'),
      's.waist', 's.cc', 's.pe', 's.pmh as ph', 's.hpi as pi',
      // Nurse Note: ใช้ CONCAT (PG/MSSQL/MySQL รองรับ) แต่ต้องระวัง NULL ทำให้ string หายในบาง DB
      // ใช้ COALESCE ดัก NULL ไว้ก่อนเพื่อความปลอดภัย
      db.raw(`CONCAT('CC:', COALESCE(s.cc,''), ' HPI:', COALESCE(s.hpi,''), ' PMH:', COALESCE(s.pmh,'')) as nurse_note`),
      db.raw(`CASE WHEN o.pt_subtype IN ('0', '1') THEN '1' ELSE '2' END as "SERVPLACE"`),
      db.raw(`${sqlNum('s.temperature', 1)} as "BTEMP"`),
      db.raw(`${sqlNum('s.bps', 0)} as "SBP"`),
      db.raw(`${sqlNum('s.bpd', 0)} as "DBP"`),
      db.raw(`${sqlNum('s.pulse', 0)} as "PR"`),
      db.raw(`${sqlNum('s.rr', 0)} as "RR"`),
      's.o2sat', 's.bw as weight', 's.height', 's.bmi',
      'er.gcs_e', 'er.gcs_v', 'er.gcs_m',
      'er.pupil_l as pupil_left',
      'er.pupil_r as pupil_right',
      db.raw(`CASE 
                  WHEN (o.ovstost >= '01' AND o.ovstost <= '14') THEN '2' 
                  WHEN o.ovstost IN ('98', '99', '61', '62', '63', '00') THEN '1' 
                  WHEN o.ovstost = '54' THEN '3' 
                  WHEN o.ovstost = '52' THEN '4' 
                  ELSE '7' 
              END as "TYPEOUT"`),
      'o.doctor as dr',
      'doctor.licenseno as provider',
      db.raw(`${sqlNum('vn.inc01 + vn.inc12', 2)} as "COST"`),
      db.raw(`${sqlNum('vn.item_money', 2)} as "PRICE"`),
      db.raw(`${sqlNum('vn.paid_money', 2)} as "PAYPRICE"`),
      db.raw(`${sqlNum('vn.rcpt_money', 2)} as "ACTUALPAY"`),
      db.raw(`${sqlDateTime('o.vstdate', 'o.vsttime')} as "D_UPDATE"`),
      'vn.hospsub as hsub'
    ])
      .whereRaw(`${targetCol} = ?`, [searchText]);
  }

  async getDiagnosisOpd(db: Knex, visitNo, hospCode = hisHospcode) {
    const result = await db('ovst as o')
      .select(
        db.raw('? as HOSPCODE', [hisHospcode]),
        db.raw('pt.cid as CID'),
        db.raw('o.hn as PID'),
        db.raw('o.hn'),
        db.raw('q.seq_id'),
        db.raw('q.vn as SEQ'),
        db.raw('q.vn as VN'),
        db.raw('o.vstdate as DATE_SERV'),
        db.raw(`CASE WHEN odx.diagtype IS NULL THEN '' ELSE odx.diagtype END as DIAGTYPE`),
        db.raw('odx.icd10 as DIAGCODE'),
        db.raw(`CASE WHEN s.provis_code IS NULL THEN '' ELSE s.provis_code END as CLINIC`),
        db.raw('d.CODE as PROVIDER'),
        db.raw('q.update_datetime as D_UPDATE')
      )
      .leftJoin('ovst_seq as q', 'q.vn', 'o.vn')
      .leftJoin('ovstdiag as odx', 'odx.vn', 'o.vn')
      .leftJoin('patient as pt', 'pt.hn', 'o.hn')
      .leftJoin('person as p', 'p.patient_hn', 'pt.hn')
      .leftJoin('spclty as s', 's.spclty', 'o.spclty')
      .leftJoin('doctor as d', 'd.CODE', 'o.doctor')
      .where('q.vn', visitNo)
      .whereRaw(`odx.icd10 REGEXP '[A-Z]'`);

    return result;
  }
  async getDiagnosisOpdAccident(db: Knex, dateStart: any, dateEnd: any, hospCode = hisHospcode) {
    if (dateStart && dateEnd) {
      return db('ovstdiag as dx')
        .whereBetween('vstdate', [dateStart, dateEnd])
        .whereRaw(`left(icd10,1) in ('V','W','X','Y')`)
        .limit(maxLimit);
    } else {
      throw new Error('Invalid parameters');
    }
  }
  async getDiagnosisOpdVWXY(db: Knex, date: any) {
    const subquery = db('ovstdiag as dx')
      .select('vn')
      .where('dx.vstdate', date)
      .whereRaw(`LEFT(icd10, 1) IN ('V', 'W', 'X', 'Y')`);

    const result = await db('ovstdiag as dx')
      .select(
        db.raw('hn'),
        db.raw('vn as visitno'),
        db.raw('dx.vstdate as date'),
        db.raw('icd10 as diagcode'),
        db.raw('icd.name as diag_name'),
        db.raw('dx.diagtype as diag_type'),
        db.raw('doctor as dr'),
        db.raw('dx.episode'),
        db.raw(`'IT' as codeset`),
        db.raw('update_datetime as d_update')
      )
      .leftJoin('icd10_sss as icd', 'dx.icd10', 'icd.code')
      .whereIn('vn', subquery)
      .whereRaw(`LEFT(icd10, 1) IN ('S', 'T', 'V', 'W', 'X', 'Y')`)
      .orderBy('dx.vn')
      .orderBy('diagtype')
      .orderBy('update_datetime')
      .limit(maxLimit);

    return result;
  }
  async getDiagnosisSepsisOpd(db: Knex, date: any) {
    const subquery = db('ovstdiag as dx')
      .select('vn')
      .where('dx.vstdate', date)
      .where(function () {
        this.whereRaw(`LEFT(icd10, 4) IN ('R651', 'R572')`)
          .orWhereRaw(`LEFT(diag, 3) IN ('A40', 'A41')`);
      })
      .groupBy('dx.vn');

    const result = await db('ovstdiag as dx')
      .select(
        db.raw('hn'),
        db.raw('vn as visitno'),
        db.raw('dx.vstdate as date'),
        db.raw('icd10 as diagcode'),
        db.raw('icd.name as diag_name'),
        db.raw('dx.diagtype as diag_type'),
        db.raw('doctor as dr'),
        db.raw('dx.episode'),
        db.raw(`'IT' as codeset`),
        db.raw('update_datetime as d_update')
      )
      .leftJoin('icd10_sss as icd', 'dx.icd10', 'icd.code')
      .whereIn('vn', subquery)
      .orderBy('dx.vn')
      .orderBy('diagtype')
      .orderBy('update_datetime')
      .limit(maxLimit);

    return result;
  }
  async getDiagnosisSepsisIpd(db: Knex, dateStart: any, dateEnd: any) {
    const subquery = db('iptdiag as dx')
      .select('dx.an')
      .leftJoin('ipt', 'dx.an', 'ipt.an')
      .whereBetween('ipt.dchdate', [dateStart, dateEnd])
      .where(function () {
        this.whereRaw(`LEFT(icd10, 4) IN ('R651', 'R572')`)
          .orWhereRaw(`LEFT(diag, 3) IN ('A40', 'A41')`);
      })
      .groupBy('dx.an');

    const result = await db('iptdiag as dx')
      .select(
        db.raw('ipt.hn'),
        db.raw('ipt.vn as visitno'),
        db.raw('dx.an'),
        db.raw('ipt.dchdate as date'),
        db.raw('dx.icd10 as diagcode'),
        db.raw('icd.name as diag_name'),
        db.raw('dx.diagtype as diag_type'),
        db.raw('dx.doctor as dr'),
        db.raw('patient.pname as patient_prename'),
        db.raw('patient.fname as patient_fname'),
        db.raw('patient.lname as patient_lname'),
        db.raw('ipt.ward as wardcode'),
        db.raw('ward.name as wardname'),
        db.raw(`'IT' as codeset`),
        db.raw('dx.entry_datetime as d_update')
      )
      .leftJoin('icd10_sss as icd', 'dx.icd10', 'icd.code')
      .leftJoin('ipt', 'dx.an', 'ipt.an')
      .leftJoin('patient', 'ipt.hn', 'patient.hn')
      .leftJoin('ward', 'ipt.ward', 'ward.ward')
      .whereIn('dx.an', subquery)
      .orderBy('dx.an')
      .orderBy('diagtype')
      .orderBy('ipt.update_datetime')
      .limit(maxLimit);

    return result;
  }

  async getProcedureOpd(db: Knex, visitNo, hospCode = hisHospcode) {
    // First query - health_med_service
    const query1 = db('health_med_service as h1')
      .select(
        db.raw('? as hospcode', [hisHospcode]),
        db.raw('pt.hn as pid'),
        db.raw('os.seq_id'),
        db.raw('os.vn as seq'),
        db.raw('os.vn'),
        db.raw(`CASE 
                    WHEN o.vstdate IS NULL OR TRIM(o.vstdate) = '' OR o.vstdate LIKE '0000-00-00%' 
                    THEN '' 
                    ELSE DATE_FORMAT(o.vstdate, '%Y-%m-%d') 
                END as date_serv`),
        db.raw('sp.provis_code as clinic'),
        db.raw('h3.icd10tm as procedcode'),
        db.raw(`CASE 
                    WHEN h2.service_price IS NOT NULL AND TRIM(h2.service_price) <> '' 
                    THEN REPLACE(FORMAT(h2.service_price, 2), ',', '') 
                    ELSE FORMAT(0, 2) 
                END as serviceprice`),
        db.raw('h1.health_med_doctor_id as provider'),
        db.raw(`CASE 
                    WHEN CONCAT(o.vstdate, ' ', o.vsttime) IS NULL 
                        OR TRIM(CONCAT(o.vstdate, ' ', o.vsttime)) = '' 
                        OR CONCAT(o.vstdate, ' ', o.vsttime) LIKE '0000-00-00%' 
                    THEN '' 
                    ELSE DATE_FORMAT(CONCAT(o.vstdate, ' ', o.vsttime), '%Y-%m-%d %H:%i:%s') 
                END as d_update`)
      )
      .leftJoin('health_med_service_operation as h2', 'h2.health_med_service_id', 'h1.health_med_service_id')
      .leftJoin('health_med_operation_item as h3', 'h3.health_med_operation_item_id', 'h2.health_med_operation_item_id')
      .leftJoin('health_med_organ as g1', 'g1.health_med_organ_id', 'h2.health_med_organ_id')
      .leftJoin('health_med_operation_type as t1', 't1.health_med_operation_type_id', 'h2.health_med_operation_type_id')
      .leftJoin('ovst as o', function () {
        this.on('o.vn', '=', 'h1.vn')
          .andOn('h1.hn', '=', 'o.hn');
      })
      .leftJoin('vn_stat as v', function () {
        this.on('v.vn', '=', 'h1.vn')
          .andOn('h1.hn', '=', 'v.hn');
      })
      .leftJoin('person as p', 'p.patient_hn', 'o.hn')
      .leftJoin('spclty as sp', 'sp.spclty', 'o.spclty')
      .leftJoin('patient as pt', 'pt.hn', 'o.hn')
      .leftJoin('ovst_seq as os', 'os.vn', 'o.vn')
      .whereNotNull('h3.icd10tm')
      .whereNotNull('v.cid')
      .where('v.cid', '<>', '')
      .where('os.vn', visitNo);

    // Second query - er_regist_oper
    const query2 = db('er_regist_oper as r')
      .distinct()
      .select(
        db.raw('? as hospcode', [hisHospcode]),
        db.raw('pt.hn as pid'),
        db.raw('os.seq_id'),
        db.raw('os.vn as seq'),
        db.raw('os.vn'),
        db.raw(`CASE 
                    WHEN o.vstdate IS NULL OR TRIM(o.vstdate) = '' OR o.vstdate LIKE '0000-00-00%' 
                    THEN '' 
                    ELSE DATE_FORMAT(o.vstdate, '%Y-%m-%d') 
                END as date_serv`),
        db.raw('sp.provis_code as clinic'),
        db.raw(`CASE 
                    WHEN e.icd10tm IS NULL OR e.icd10tm = '' 
                    THEN e.icd9cm 
                    ELSE e.icd10tm 
                END as procedcode`),
        db.raw(`CASE 
                    WHEN e.price IS NOT NULL AND TRIM(e.price) <> '' 
                    THEN REPLACE(FORMAT(e.price, 2), ',', '') 
                    ELSE FORMAT(0, 2) 
                END as serviceprice`),
        db.raw('r.doctor as provider'),
        db.raw(`CASE 
                    WHEN CONCAT(o.vstdate, ' ', o.vsttime) IS NULL 
                        OR TRIM(CONCAT(o.vstdate, ' ', o.vsttime)) = '' 
                        OR CONCAT(o.vstdate, ' ', o.vsttime) LIKE '0000-00-00%' 
                    THEN '' 
                    ELSE DATE_FORMAT(CONCAT(o.vstdate, ' ', o.vsttime), '%Y-%m-%d %H:%i:%s') 
                END as d_update`)
      )
      .leftJoin('er_oper_code as e', 'e.er_oper_code', 'r.er_oper_code')
      .leftJoin('vn_stat as v', 'v.vn', 'r.vn')
      .leftJoin('ovst as o', 'o.vn', 'r.vn')
      .leftJoin('person as p', 'p.patient_hn', 'o.hn')
      .leftJoin('spclty as sp', 'sp.spclty', 'o.spclty')
      .leftJoin('patient as pt', 'pt.hn', 'o.hn')
      .leftJoin('ovst_seq as os', 'os.vn', 'o.vn')
      .where('e.icd9cm', '<>', '')
      .whereNotNull('v.cid')
      .where('v.cid', '<>', '')
      .where('os.vn', visitNo);

    // Third query - dtmain
    const query3 = db('dtmain as r')
      .distinct()
      .select(
        db.raw('? as hospcode', [hisHospcode]),
        db.raw('pt.hn as pid'),
        db.raw('os.seq_id'),
        db.raw('os.vn as seq'),
        db.raw('os.vn'),
        db.raw(`CASE 
                    WHEN r.vstdate IS NULL OR TRIM(r.vstdate) = '' OR r.vstdate LIKE '0000-00-00%' 
                    THEN '' 
                    ELSE DATE_FORMAT(r.vstdate, '%Y-%m-%d') 
                END as date_serv`),
        db.raw('sp.provis_code as clinic'),
        db.raw(`CASE 
                    WHEN e.icd10tm_operation_code IS NULL OR e.icd10tm_operation_code = '' 
                    THEN e.icd9cm 
                    ELSE e.icd10tm_operation_code 
                END as procedcode`),
        db.raw(`CASE 
                    WHEN r.fee IS NOT NULL AND TRIM(r.fee) <> '' 
                    THEN REPLACE(FORMAT(r.fee, 2), ',', '') 
                    ELSE FORMAT(0, 2) 
                END as serviceprice`),
        db.raw('r.doctor as provider'),
        db.raw(`CASE 
                    WHEN CONCAT(o.vstdate, ' ', o.vsttime) IS NULL 
                        OR TRIM(CONCAT(o.vstdate, ' ', o.vsttime)) = '' 
                        OR CONCAT(o.vstdate, ' ', o.vsttime) LIKE '0000-00-00%' 
                    THEN '' 
                    ELSE DATE_FORMAT(CONCAT(o.vstdate, ' ', o.vsttime), '%Y-%m-%d %H:%i:%s') 
                END as d_update`)
      )
      .leftJoin('person as p', 'p.patient_hn', 'r.hn')
      .leftJoin('dttm as e', 'e.icd9cm', 'r.icd9')
      .leftJoin('vn_stat as v', function () {
        this.on('v.vn', '=', 'r.vn')
          .andOn('v.hn', '=', 'r.hn');
      })
      .leftJoin('ovst as o', function () {
        this.on('o.vn', '=', 'r.vn')
          .andOn('o.hn', '=', 'r.hn');
      })
      .leftJoin('spclty as sp', 'sp.spclty', 'o.spclty')
      .leftJoin('patient as pt', 'pt.hn', 'o.hn')
      .leftJoin('ovst_seq as os', 'os.vn', 'o.vn')
      .whereNotNull('v.cid')
      .where('v.cid', '<>', '')
      .whereNotNull('e.icd10tm_operation_code')
      .where('os.vn', visitNo);

    // Union all three queries
    const result = await db.raw(`
            ${query1.toString()}
            UNION ALL
            ${query2.toString()}
            UNION ALL
            ${query3.toString()}
        `);

    return result[0];
  }

  async getChargeOpd(db: Knex, visitNo, hospCode = hisHospcode) {
    // ifnull(right(concat('00000000', p.person_id), ${hn_len}),pt.hn) as pid2,
    const result = await db('opitemrece as o')
      .select(
        db.raw('? as hospcode', [hisHospcode]),
        db.raw('pt.hn as pid'),
        db.raw('os.seq_id'),
        db.raw('os.vn as seq'),
        db.raw('os.vn'),
        db.raw(`CASE 
                    WHEN CONCAT(ovst.vstdate) IS NULL 
                        OR TRIM(CONCAT(ovst.vstdate)) = '' 
                        OR CONCAT(ovst.vstdate) LIKE '0000-00-00%' 
                    THEN '' 
                    ELSE DATE_FORMAT(CONCAT(ovst.vstdate), '%Y-%m-%d') 
                END as date_serv`),
        db.raw(`CASE 
                    WHEN sp.provis_code IS NULL OR sp.provis_code = '' 
                    THEN '00100' 
                    ELSE sp.provis_code 
                END as clinic`),
        db.raw('o.income as chargeitem'),
        db.raw(`CASE 
                    WHEN d.charge_list_id IS NULL OR d.charge_list_id = '' 
                    THEN '0000000' 
                    ELSE RIGHT(CONCAT('00000000', d.charge_list_id), 6) 
                END as chargelist`),
        db.raw('o.qty as quantity'),
        db.raw(`CASE 
                    WHEN p2.pttype_std_code IS NULL OR p2.pttype_std_code = '' 
                    THEN '9100' 
                    ELSE p2.pttype_std_code 
                END as instype`),
        db.raw('FORMAT(o.cost, 2) as cost'),
        db.raw('FORMAT(o.sum_price, 2) as price'),
        db.raw(`'0.00' as payprice`),
        db.raw(`CASE 
                    WHEN CONCAT(ovst.vstdate, ' ', ovst.cur_dep_time) IS NULL 
                        OR TRIM(CONCAT(ovst.vstdate, ' ', ovst.cur_dep_time)) = '' 
                        OR CONCAT(ovst.vstdate, ' ', ovst.cur_dep_time) LIKE '0000-00-00%' 
                    THEN '' 
                    ELSE DATE_FORMAT(CONCAT(ovst.vstdate, ' ', ovst.cur_dep_time), '%Y-%m-%d %H:%i:%s') 
                END as d_update`)
      )
      .leftJoin('ovst', 'o.vn', 'ovst.vn')
      .leftJoin('person as p', 'o.hn', 'p.patient_hn')
      .leftJoin('spclty as sp', 'sp.spclty', 'ovst.spclty')
      .leftJoin('pttype as p2', 'p2.pttype', 'o.pttype')
      .leftJoin('patient as pt', 'pt.hn', 'o.hn')
      .leftJoin('ovst_seq as os', 'os.vn', 'o.vn')
      .leftJoin('drugitems_charge_list as d', 'd.icode', 'o.icode')
      .where('os.vn', visitNo);

    return result;
  }

  getLabRequest(db: Knex, columnName: string, searchNo: string, hospCode = hisHospcode) {
    columnName = columnName === 'visitNo' ? 'vn' : columnName;
    return db('lab_order as o')
      .leftJoin('lab_order_service as s', 'o.lab_order_number', 's.lab_order_number')
      .select(db.raw(`'${hospCode}' as hospcode`))
      .select('vn as visitno', 'lab.hn as hn', 'lab.an as an',
        'lab.lab_no as request_id',
        'lab.lab_code as LOCALCODE',
        'lab.lab_name as INVESTNAME',
        'lab.loinc as loinc',
        'lab.icdcm as icdcm',
        'lab.standard as cgd',
        'lab.cost as cost',
        'lab.lab_price as price',
        'lab.date as DATETIME_REPORT')
      .where(columnName, "=", searchNo)
      .limit(maxLimit);
  }

  getInvestigation(db: Knex, columnName: string, searchNo: string, hospCode = hisHospcode) {
    return this.getLabResult(db, columnName, searchNo);
  };
  getLabResult(db: Knex, columnName: string, searchNo: string) {
    columnName = columnName === 'visitNo' ? 'lab_head.vn' : columnName;
    columnName = columnName === 'hn' ? 'ovst.hn' : columnName;
    columnName = columnName === 'cid' ? 'patient.cid' : columnName;

    return db('lab_head')
      .leftJoin('lab_order', 'lab_head.lab_order_number', 'lab_order.lab_order_number')
      .leftJoin('lab_items', 'lab_order.lab_items_code', 'lab_items.lab_items_code')
      .leftJoin('lab_items_sub_group', 'lab_items.lab_items_sub_group_code', 'lab_items_sub_group.lab_items_sub_group_code')
      .innerJoin('ovst', 'lab_head.vn', 'ovst.vn')
      .innerJoin('patient', 'ovst.hn', 'patient.hn')
      .select(db.raw(`'${hisHospcode}' as HOSPCODE,'LAB' as INVESTTYPE`))
      .select('lab_head.vn', 'lab_head.vn as visitno', 'lab_head.vn as SEQ',
        'lab_head.hn as PID', 'patient.cid as CID',
        'lab_head.lab_order_number as request_id',
        'lab_order.lab_items_code as LOCALCODE', 'lab_items.tmlt_code as tmlt',
        'lab_head.form_name as lab_group',
        'lab_order.lab_items_name_ref as INVESTNAME',
        'lab_order.lab_order_result as INVESTVALUE',
        // 'lab_order.lab_order_remark as INVESTRESULT',
        'lab_items.icode as ICDCM',
        'lab_items.lab_items_sub_group_code as GROUPCODE',
        'lab_items_sub_group.lab_items_sub_group_name as GROUPNAME')
      // .select(db.raw(`concat(lab_items.lab_items_unit, ' ', lab_order.lab_items_normal_value_ref) as UNIT`))
      .select(db.raw(`case when lab_order.lab_items_normal_value_ref then concat(lab_items.lab_items_unit,' (', lab_order.lab_items_normal_value_ref,')') else lab_items.lab_items_unit end  as UNIT`))
      .select(db.raw(`concat(lab_head.order_date, ' ', lab_head.order_time) as DATETIME_INVEST`))
      .select(db.raw(`concat(lab_head.report_date, ' ', lab_head.report_time) as DATETIME_REPORT`))
      .where(columnName, searchNo)
      .where(`lab_order.confirm`, 'Y')
      .whereNot(`lab_order.lab_order_result`, '')
      .whereNotNull('lab_order.lab_order_result')
      .limit(maxLimit);
  }

  async getDrugOpd(db: Knex, visitNo, hospCode = hisHospcode) {
    const sql = `
            SELECT ? as HOSPCODE,
                pt.hn as PID, pt.cid as CID,
                os.seq_id, os.vn as SEQ, os.vn,
                if(
                    opi.vstdate  is null 
                        or trim(opi.vstdate)='' 
                        or opi.vstdate  like '0000-00-00%',
                    '',
                    date_format(opi.vstdate ,'%Y-%m-%d')
                ) as date_serv,
                sp.provis_code as clinic,
                d.did as DID,d.tmt_tp_code as DID_TMT,
                d.icode as dcode, d.name as dname,
                opi.qty as amount,
                d.packqty as unit,
                d.units  as unit_packing,
				concat(d.usage_code, ' ' , d.frequency_code, ' ', d.usage_unit_code, ' ', d.time_code) as usage_code,
				concat(drugusage.name1, ' ', drugusage.name2 , ' ' , drugusage.name3) as drug_usage,
				d.therapeutic as caution,
                format(opi.unitprice,2) as drugprice, 
                format(d.unitcost,2)  as drugcost, 
                opi.doctor as provider,
                if(
                    opi.last_modified  is null 
                        or trim(opi.last_modified)='' 
                        or opi.last_modified  like '0000-00-00%',
                    date_format(concat(opi.rxdate,' ',opi.rxtime),'%Y-%m-%d %H:%i:%s'),
                    date_format(opi.last_modified,'%Y-%m-%d %H:%i:%s')
                ) as d_update
                
            FROM
                opitemrece opi 
                left join ovst o on o.vn=opi.vn  and o.hn=opi.hn
                inner join drugitems d on opi.icode=d.icode
                left join drugusage on d.drugusage=drugusage.drugusage
                left join spclty sp on o.spclty=sp.spclty
                left join person p on opi.hn=p.patient_hn 
                left join patient pt on pt.hn = o.hn
                left join ovst_seq os on os.vn = o.vn 
                
            WHERE 
                (opi.an is null or opi.an ='') 
                and opi.vn not in (select i.vn from ipt as i where i.vn=opi.vn) 
                and opi.icode like '1%'
                and os.vn=?
        `;
    // d.icode ขึ้นต้นด้วย 1
    // const sql = `
    //     select 
    //         ? as hospcode,
    //         pt.hn as pid, pt.cid,
    //         os.seq_id, os.vn as seq, os.vn,
    //         if(
    //             opi.vstdate  is null 
    //                 or trim(opi.vstdate)='' 
    //                 or opi.vstdate  like '0000-00-00%',
    //             '',
    //             date_format(opi.vstdate ,'%Y-%m-%d')
    //         ) as date_serv,
    //         sp.provis_code as clinic,
    //         d.did as didstd, d.tmt_tp_code as tmt,
    //         d.name as dname,
    //         opi.qty as amount,
    //         d.packqty as unit,
    //         d.units  as unit_packing,
    //         format(opi.unitprice,2) as drugprice, 
    //         format(d.unitcost,2)  as drugcost, 
    //         opi.doctor as provider,
    //         if(
    //             opi.last_modified  is null 
    //                 or trim(opi.last_modified)='' 
    //                 or opi.last_modified  like '0000-00-00%',
    //             date_format(concat(opi.rxdate,' ',opi.rxtime),'%Y-%m-%d %H:%i:%s'),
    //             date_format(opi.last_modified,'%Y-%m-%d %H:%i:%s')
    //         ) as d_update

    //     from 
    //         opitemrece opi 
    //         left join ovst o on o.vn=opi.vn  and o.hn=opi.hn
    //         left join drugitems d on opi.icode=d.icode
    //         left join spclty sp on o.spclty=sp.spclty
    //         left join person p on opi.hn=p.patient_hn 
    //         left join patient pt on pt.hn = o.hn
    //         left join ovst_seq os on os.vn = o.vn 

    //     where 
    //         (opi.an is null or opi.an ='') 
    //         and opi.vn not in (select i.vn from ipt as i where i.vn=opi.vn) 
    //         and opi.icode in (select d.icode from drugitems d) 
    //         and os.vn = '${visitNo}'
    //     `;
    const result = await db.raw(sql, [hisHospcode, visitNo]);
    return result[0];
  }

  async getAdmission(db: Knex, columnName: string, searchValue: any, hospCode = hisHospcode, isRefer = true) {
    columnName = columnName === 'an' ? 'i.an' : columnName;
    columnName = columnName === 'hn' ? 'i.hn' : columnName;
    columnName = columnName === 'visitNo' ? 'q.vn' : columnName;
    columnName = columnName === 'dateadmit' ? 'i.regdate' : columnName;
    columnName = columnName === 'datedisc' ? 'i.dchdate' : columnName;

    let sqlCommand = db('ipt as i')
      .leftJoin('an_stat as a', 'i.an', 'a.an')
      .leftJoin('iptdiag as idx', 'i.an', 'idx.an')
      .leftJoin('patient as pt', 'i.hn', 'pt.hn')
      .leftJoin('person as p', 'p.patient_hn', 'pt.hn')
      .leftJoin('ovst as o', 'o.vn', 'i.vn')
      .leftJoin('ovst_seq as q', 'q.vn', 'o.vn')
      .leftJoin('opdscreen as os', 'o.vn', 'os.vn')
      .leftJoin('spclty as s', 'i.spclty', 's.spclty')
      .leftJoin('pttype as p1', 'p1.pttype', 'i.pttype')
      .leftJoin('provis_instype as ps', 'ps.CODE', 'p1.nhso_code')
      .leftJoin('dchtype as dt', 'i.dchtype', 'dt.dchtype')
      .leftJoin('dchstts as ds', 'i.dchstts', 'ds.dchstts')
      .leftJoin('opitemrece as c', 'c.an', 'i.an')
      .leftJoin('doctor', 'a.dx_doctor', 'doctor.code')
      .leftJoin('ward', 'i.ward', 'ward.ward');
    if (Array.isArray(searchValue)) {
      sqlCommand.whereIn(columnName, searchValue);
    } else {
      sqlCommand.where(columnName, searchValue);
    }
    if (isRefer) {
      sqlCommand.whereRaw('LENGTH(i.rfrilct) IN (5,9)'); // get only referin
    }
    return sqlCommand
      .select(db.raw(`? as HOSPCODE`, [hisHospcode]),
        'i.hn as PID', 'q.seq_id', 'o.vn as SEQ',
        'i.an AS AN', 'pt.cid', 'pt.sex as SEX', 'pt.birthday as dob',
        db.raw(`date_format(concat(i.regdate, ' ', i.regtime),'%Y-%m-%d %H:%i:%s') as datetime_admit`),
        'i.ward as WARD_LOCAL',
        db.raw(`CASE WHEN s.provis_code IS NULL THEN '' ELSE s.provis_code END AS wardadmit`),
        `ward.name as WARDADMITNAME`,
        db.raw(`CASE WHEN ps.pttype_std_code THEN '' ELSE ps.pttype_std_code END AS instype`),
        db.raw(`RIGHT((SELECT export_code FROM ovstist WHERE ovstist = i.ivstist),1) AS typein`),
        'i.rfrilct as referinhosp', 'i.rfrics as causein',
        db.raw(`cast(
                    IF (
                        i.bw = 0,'',
                            IF (
                                i.bw IS NOT NULL,
                                cast(i.bw / 1000 AS DECIMAL(5, 1)),
                                IF (
                                    os.bw = 0,'',
                                    cast(os.bw AS DECIMAL(5, 1))
                                )
                            )
                    ) AS CHAR (5)
                ) admitweight,
                IF (os.height = 0,'',os.height) admitheight,
                CASE WHEN i.dchdate IS NULL THEN '' ELSE date_format(concat(i.dchdate, ' ', i.dchtime),'%Y-%m-%d %H:%i:%s') END AS datetime_disch,
                CASE WHEN s.provis_code IS NULL THEN '' ELSE s.provis_code END AS warddisch,
                ward.name as WARDDISCHNAME,
                CASE WHEN ds.nhso_dchstts IS NULL THEN '' ELSE ds.nhso_dchstts END AS dischstatus,
                CASE WHEN dt.nhso_dchtype IS NULL THEN '' ELSE dt.nhso_dchtype END AS dischtype,
                IF(i.dchtype = '04',i.rfrolct,'') AS referouthosp,
                IF (
                    i.dchtype = 04,            
                    IF (
                        i.rfrocs = 7,
                        '5',            
                        IF (
                            i.rfrocs IS NOT NULL,
                            '1',
                            ''
                        )
                    ),
                    ''
                ) causeout,
                CASE WHEN sum(c.qty * c.cost) IS NULL THEN 0 ELSE ROUND(sum(c.qty * c.cost),0) END AS cost,
                CASE WHEN a.uc_money IS NULL THEN 0.00 ELSE ROUND(a.uc_money,2) END AS price,
                ROUND(
                    sum(
                        IF (
                            c.paidst IN (01, 03),
                            c.sum_price,
                            0
                            )
                    ),
                    2
                ) payprice`),
        db.raw(`CASE WHEN a.paid_money IS NULL THEN 0.00 ELSE ROUND(a.paid_money,2) END AS actualpay`),
        'a.dx_doctor as dr', 'doctor.licenseno as provider',
        db.raw(`CASE WHEN idx.modify_datetime IS NULL THEN '' ELSE date_format(idx.modify_datetime,'%Y-%m-%d %H:%i:%s') END AS d_update`),
        'i.drg', 'a.rw', 'i.adjrw', 'i.wtlos',
        db.raw(`CASE WHEN i.grouper_err IS NULL THEN 1 ELSE i.grouper_err END AS error,
                CASE WHEN i.grouper_warn IS NULL THEN 64 ELSE i.grouper_warn END AS warning,
                CASE WHEN i.grouper_actlos IS NULL THEN 0 ELSE i.grouper_actlos END AS actlos,
                CASE WHEN i.grouper_version IS NULL THEN '5.1.3' ELSE i.grouper_version END AS grouper_version,
                CASE WHEN i.grouper_version IS NULL THEN '5.1.3' ELSE i.grouper_version END AS grouper_version
        `))
      .groupBy('i.an');
  }

  async getDiagnosisIpd_(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
    columnName = columnName === 'visitNo' ? 'q.vn' : columnName;
    columnName = columnName === 'an' ? 'ipt.an' : columnName;
    const sql = `
            select 
                ? as hospcode,
                pt.hn as pid,
                ipt.an as an,
                ifnull(date_format(concat(ipt.regdate,' ',ipt.regtime),'%Y-%m-%d %H:%i:%s'),'') as datetime_admit,
                concat('0',right(spclty.provis_code,4)) as warddiag,
                iptdiag.diagtype as diagtype,
                iptdiag.icd10 as diagcode, 
                icd.name AS diagname,
                iptdiag.doctor as provider,
                ifnull(date_format(iptdiag.modify_datetime,'%Y-%m-%d %H:%i:%s'),date_format(NOW(),'%Y-%m-%d %H:%i:%s')) d_update,
                pt.cid as CID
                
            from 
                iptdiag
                left join ipt on ipt.an=iptdiag.an
                left join ovst_seq q ON q.vn = ipt.vn
                left join patient pt on pt.hn = ipt.hn
                left join person p on p.patient_hn = ipt.hn
                LEFT JOIN icd10_sss as icd ON iptdiag.icd10 = icd.code
                left outer join spclty on spclty.spclty=ipt.spclty              
            where ${columnName} = ?
            order by ipt.an, iptdiag.diagtype`;
    const result = await db.raw(sql, [hisHospcode, searchNo]);
    return result[0];
  }

  async getDiagnosisIpd(db: Knex, columnName: string, searchNo: any, hospCode = hisHospcode) {
    const client = db.client.config.client;
    const isPostgres = ['pg', 'postgres', 'postgresql'].includes(client);

    // normalize columnName
    columnName = columnName === 'visitNo' ? 'q.vn' : columnName;
    columnName = columnName === 'an' ? 'ipt.an' : columnName;

    // 🔹 Helper: format datetime
    const formatDateTime = (dateField: string, timeField: string, alias: string) => {
      if (isPostgres) {
        return db.raw(`
        CASE 
          WHEN CONCAT(${dateField}, ' ', ${timeField}) IS NULL 
            OR TRIM(CONCAT(${dateField}, ' ', ${timeField})) = '' 
            OR CONCAT(${dateField}, ' ', ${timeField}) LIKE '0000-00-00%'
          THEN ''
          ELSE TO_CHAR(TO_TIMESTAMP(CONCAT(${dateField}, ' ', ${timeField}), 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD HH24:MI:SS')
        END as ${alias}
      `);
      }
      return db.raw(`
      IFNULL(
        DATE_FORMAT(CONCAT(${dateField}, ' ', ${timeField}), '%Y-%m-%d %H:%i:%s'),
        ''
      ) as ${alias}
    `);
    };

    const formatModifyDate = (field: string, alias: string) => {
      if (isPostgres) {
        return db.raw(`
        COALESCE(
          TO_CHAR(${field}, 'YYYY-MM-DD HH24:MI:SS'),
          TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
        ) as ${alias}
      `);
      }
      return db.raw(`
      IFNULL(
        DATE_FORMAT(${field}, '%Y-%m-%d %H:%i:%s'),
        DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s')
      ) as ${alias}
    `);
    };

    let query = db('iptdiag')
      .leftJoin('ipt', 'ipt.an', 'iptdiag.an')
      .leftJoin('ovst_seq as q', 'q.vn', 'ipt.vn')
      .leftJoin('patient as pt', 'pt.hn', 'ipt.hn')
      .leftJoin('person as p', 'p.patient_hn', 'ipt.hn')
      .leftJoin('icd10_sss as icd', 'iptdiag.icd10', 'icd.code')
      .leftJoin('spclty', 'spclty.spclty', 'ipt.spclty')
      .leftJoin('doctor', 'iptdiag.doctor', 'doctor.code')
      .select(
        db.raw('? as hospcode', [hospCode]),
        'pt.hn as pid',
        'ipt.an as an',
        db.raw(`${formatDateTime('ipt.regdate', 'ipt.regtime', 'datetime_admit')}`),
        db.raw(`CONCAT('0', RIGHT(spclty.provis_code${isPostgres ? '::text' : ''}, 4)) as warddiag`),
        'iptdiag.diagtype as diagtype',
        'iptdiag.icd10 as diagcode',
        'icd.name as diagname',
        'doctor.licenseno as provider',
        db.raw(`${formatModifyDate('iptdiag.modify_datetime', 'd_update')}`),
        'pt.cid as cid');

    if (Array.isArray(searchNo)) {
      query = query.whereIn(columnName, searchNo);
    } else {
      query = query.where(columnName, searchNo);
    }
    return await query.orderBy(['ipt.an', 'iptdiag.diagtype']);
  }

  async getDiagnosisIpdAccident(db: Knex, dateStart: any, dateEnd: any, hospCode = hisHospcode) {
    if (dateStart & dateEnd) {
      return db('iptdiag as dx')
        .innerJoin('ipt as ipd', 'dx.an', 'ipd.an')
        .innerJoin('icd10_sss as icd', 'dx.icd10', 'icd.code')
        .select('dx.*', 'icd.name AS diagname')
        .whereBetween('ipd.dchdate', [dateStart, dateEnd])
        .whereRaw(`LEFT(dx.icd10,1) IN ('V','W','X','Y')`)
        .limit(maxLimit);
    } else {
      throw new Error('Invalid parameters');
    }
  }

  async getProcedureIpd(db: Knex, an: any, hospCode = hisHospcode) {
    const client = db.client.config.client;
    const isPostgres = ['pg', 'postgres', 'postgresql'].includes(client);

    // 🔹 Helper: format datetime with CONCAT
    const formatDateTime = (dateField: string, timeField: string, alias: string) => {
      if (isPostgres) {
        return db.raw(`
          CASE 
            WHEN ${dateField} IS NULL OR ${dateField}::text LIKE '0000-00-00%'
            THEN ''
            ELSE TO_CHAR(TO_TIMESTAMP(CONCAT(${dateField}, ' ', ${timeField}), 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD HH24:MI:SS')
          END as ${alias}
        `);
      }
      return db.raw(`
        IF(
          ${dateField} IS NULL OR ${dateField} = '0000-00-00',
          '',
          DATE_FORMAT(CONCAT(${dateField}, ' ', ${timeField}), '%Y-%m-%d %H:%i:%s')
        ) as ${alias}
      `);
    };

    // Helper: format single datetime field
    const formatSingleDateTime = (dateTimeField: string, alias: string) => {
      if (isPostgres) {
        return db.raw(`
          CASE 
            WHEN ${dateTimeField} IS NULL OR ${dateTimeField}::text LIKE '0000-00-00%'
            THEN ''
            ELSE TO_CHAR(${dateTimeField}::timestamp, 'YYYY-MM-DD HH24:MI:SS')
          END as ${alias}`);
      }
      return db.raw(`
        IF(
          ${dateTimeField} IS NULL OR ${dateTimeField} LIKE '0000-00-00%',
          '',
          DATE_FORMAT(${dateTimeField}, '%Y-%m-%d %H:%i:%s')
        ) as ${alias}
      `);
    };

    // Helper: format discharge date
    const formatDischargeDate = (alias: string) => {
      if (isPostgres) {
        return db.raw(`
          CASE 
            WHEN ipt.dchdate IS NOT NULL AND ipt.dchdate::text != '0000-00-00'
            THEN TO_CHAR(TO_TIMESTAMP(CONCAT(ipt.dchdate, ' ', ipt.dchtime), 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD HH24:MI:SS')
            ELSE ''
          END as ${alias}
        `);
      }
      return db.raw(`
        IF(
          ipt.dchdate IS NOT NULL AND ipt.dchdate != '0000-00-00',
          DATE_FORMAT(CONCAT(ipt.dchdate, ' ', ipt.dchtime), '%Y-%m-%d %H:%i:%s'),
          ''
        ) as ${alias}
      `);
    };

    // Helper: format price
    const formatPrice = (priceField: string, alias: string) => {
      if (isPostgres) {
        return db.raw(`
          CASE 
            WHEN ${priceField} IS NOT NULL 
            THEN REPLACE(TO_CHAR(${priceField}, 'FM999999990.00'), ',', '')
            ELSE '0.00'
          END as ${alias}
        `);
      }
      return db.raw(`
        IF(
          ${priceField} IS NOT NULL,
          REPLACE(FORMAT(${priceField}, 2), ',', ''),
          FORMAT(0, 2)
        ) as ${alias}
      `);
    };

    const query = db('ipt_nurse_oper as i')
      .leftJoin('an_stat as a', 'a.an', 'i.an')
      .leftJoin('ipt', 'ipt.an', 'a.an')
      .leftJoin('patient as pt', 'pt.hn', 'ipt.hn')
      .leftJoin('person as p', 'p.patient_hn', 'ipt.hn')
      .leftJoin('spclty', 'spclty.spclty', 'ipt.spclty')
      .leftJoin('ipt_oper_code as ipc', 'ipc.ipt_oper_code', 'i.ipt_oper_code')
      .leftJoin('doctor', 'i.doctor', 'doctor.code')
      .select(
        db.raw('? as hospcode', [hospCode]),
        'pt.hn as pid',
        'ipt.an',
        formatDateTime('ipt.regdate', 'ipt.regtime', 'datetime_admit'),
        db.raw(`CONCAT('0', RIGHT(spclty.provis_code${isPostgres ? '::text' : ''}, 4)) as wardstay`),
        'ipc.icd9cm as procedcode',
        formatSingleDateTime('i.begin_date_time', 'timestart'),
        formatSingleDateTime('i.end_date_time', 'timefinish'),
        formatPrice('ipc.price', 'serviceprice'),
        'doctor.licenseno as provider',
        formatDischargeDate('d_update')
      );
    if (Array.isArray(an)) {
      query.whereIn('ipt.an', an);
    } else {
      query.where('ipt.an', an);
    }
    const result = await query;
    return result;
  }

  async getChargeIpd(db: Knex, an: any, hospCode = hisHospcode) {
    const client = db.client.config.client;
    const isPostgres = ['pg', 'postgres', 'postgresql'].includes(client);

    // 🔹 Helper: format datetime
    const formatDateTime = (dateField: string, timeField: string, alias: string) => {
      if (isPostgres) {
        return db.raw(`
          CASE 
            WHEN CONCAT(${dateField}, ' ', ${timeField}) IS NULL 
              OR TRIM(CONCAT(${dateField}, ' ', ${timeField})) = '' 
              OR CONCAT(${dateField}, ' ', ${timeField}) LIKE '0000-00-00%'
            THEN ''
            ELSE TO_CHAR(TO_TIMESTAMP(CONCAT(${dateField}, ' ', ${timeField}), 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD HH24:MI:SS')
          END as ${alias}
        `);
      }
      return db.raw(`
        IF(
          CONCAT(${dateField}, ' ', ${timeField}) IS NULL 
            OR TRIM(CONCAT(${dateField}, ' ', ${timeField})) = '' 
            OR CONCAT(${dateField}, ' ', ${timeField}) LIKE '0000-00-00%',
          '',
          DATE_FORMAT(CONCAT(${dateField}, ' ', ${timeField}), '%Y-%m-%d %H:%i:%s')
        ) as ${alias}
      `);
    };

    let query = db('opitemrece as o')
      .leftJoin('ipt', function () {
        this.on('o.hn', '=', 'ipt.hn')
          .andOn('o.an', '=', 'ipt.an');
      })
      .leftJoin('person as p', 'o.hn', 'p.patient_hn')
      .leftJoin('spclty as sp', 'sp.spclty', 'ipt.spclty')
      .leftJoin('provis_instype as psi', 'psi.code', 'ipt.pttype')
      .leftJoin('patient as pt', 'pt.hn', 'ipt.hn')
      .leftJoin('drugitems_charge_list as d', 'd.icode', 'o.icode')
      .where(function () {
        this.where('o.an', '<>', '').orWhereNotNull('o.an');
      })
      .where('o.unitprice', '<>', '0');

    if (Array.isArray(an)) {
      query.whereIn('ipt.an', an);
    } else {
      query.where('ipt.an', an);
    }

    if (isPostgres) {
      query.select(
        db.raw('? as hospcode', [hospCode]),
        'pt.hn as pid',
        'o.an as an',
        formatDateTime('ipt.regdate', 'ipt.regtime', 'datetime_admit'),
        db.raw(`CONCAT('1', RIGHT(sp.provis_code::text, 4)) as wardstay`),
        'o.income as chargeitem',
        db.raw(`CASE 
          WHEN d.charge_list_id IS NULL OR d.charge_list_id = '' 
          THEN '000000'
          ELSE RIGHT(CONCAT('000000', d.charge_list_id::text), 6)
        END as chargelist`),
        db.raw(`TO_CHAR(o.qty, 'FM999999999990.00') as quantity`),
        db.raw(`CASE 
          WHEN psi.pttype_std_code IS NULL OR psi.pttype_std_code = '' 
          THEN '9100'
          ELSE psi.pttype_std_code
        END as instype`),
        db.raw(`TO_CHAR(o.cost, 'FM999999999990.00') as cost`),
        db.raw(`TO_CHAR(o.sum_price, 'FM999999999990.00') as price`),
        db.raw(`'0.00' as payprice`),
        formatDateTime('o.rxdate', 'o.rxtime', 'd_update')
      );
    } else {
      // MySQL
      query.select(
        db.raw('? as hospcode', [hospCode]),
        'pt.hn as pid',
        'o.an as an',
        formatDateTime('ipt.regdate', 'ipt.regtime', 'datetime_admit'),
        db.raw(`CONCAT('1', RIGHT(sp.provis_code, 4)) as wardstay`),
        'o.income as chargeitem',
        db.raw(`IF(
          d.charge_list_id IS NULL OR d.charge_list_id = '', 
          '000000',
          RIGHT(CONCAT('000000', d.charge_list_id), 6)
        ) as chargelist`),
        db.raw(`FORMAT(o.qty, 2) as quantity`),
        db.raw(`IF(
          psi.pttype_std_code IS NULL OR psi.pttype_std_code = '', 
          '9100',
          psi.pttype_std_code
        ) as instype`),
        db.raw(`FORMAT(o.cost, 2) as cost`),
        db.raw(`FORMAT(o.sum_price, 2) as price`),
        db.raw(`'0.00' as payprice`),
        formatDateTime('o.rxdate', 'o.rxtime', 'd_update')
      );
    }

    const result = await query;
    return result;
  }

  async getDrugIpd(db: Knex, an: any, hospCode = hisHospcode) {
    const client = db.client.config.client;
    const isPostgres = ['pg', 'postgres', 'postgresql'].includes(client);

    // 🔹 Helper: format datetime
    const formatDateTime = (dateField: string, timeField: string, alias: string) => {
      if (isPostgres) {
        return db.raw(`
        CASE 
          WHEN CONCAT(${dateField}, ' ', ${timeField}) IS NULL 
            OR TRIM(CONCAT(${dateField}, ' ', ${timeField})) = '' 
            OR CONCAT(${dateField}, ' ', ${timeField}) LIKE '0000-00-00%'
          THEN ''
          ELSE TO_CHAR(TO_TIMESTAMP(CONCAT(${dateField}, ' ', ${timeField}), 'YYYY-MM-DD HH24:MI:SS'), 'YYYY-MM-DD HH24:MI:SS')
        END as ${alias}
      `);
      }
      return db.raw(`
      IFNULL(
        DATE_FORMAT(CONCAT(${dateField}, ' ', ${timeField}), '%Y-%m-%d %H:%i:%s'),
        ''
      ) as ${alias}
    `);
    };

    const formatDateOnly = (field: string, alias: string) => {
      if (isPostgres) {
        return db.raw(`COALESCE(TO_CHAR(${field}, 'YYYY-MM-DD'), '') as ${alias}`);
      }
      return db.raw(`IFNULL(DATE_FORMAT(${field}, '%Y-%m-%d'), '') as ${alias}`);
    };

    const formatNumber = (expr: string, alias: string, precision = 2) => {
      if (isPostgres) {
        return db.raw(`TO_CHAR(${expr}, 'FM999999999990.${'0'.repeat(precision)}') as ${alias}`);
      }
      return db.raw(`CAST(${expr} AS DECIMAL(11,${precision})) as ${alias}`);
    };

    let query = db('ipt as i')
      .leftJoin('an_stat as a', 'a.an', 'i.an')
      .leftJoin('opitemrece as o', 'o.an', 'i.an')
      .leftJoin('patient as pt', 'pt.hn', 'i.hn')
      .leftJoin('person as p', 'p.patient_hn', 'pt.hn')
      .leftJoin('spclty as s', 's.spclty', 'i.spclty')
      .leftJoin('drugitems as d', 'd.icode', 'o.icode')
      .leftJoin('medplan_ipd as m', function () {
        this.on('m.an', '=', 'o.an').andOn('m.icode', '=', 'o.icode');
      })
      .whereNotNull('d.icode')
      .where('o.qty', '<>', 0)
      .where('o.sum_price', '>', 0)
      .groupBy('i.an', 'o.icode', 'typedrug')
      .orderBy(['i.an', 'typedrug', 'o.icode'])
      .select(
        db.raw('? as hospcode', [hospCode]),
        db.raw(`COALESCE(p.person_id, '') as pid`),
        db.raw(`COALESCE(i.an, '') as an`),
        formatDateTime('i.regdate', 'i.regtime', 'datetime_admit'),
        db.raw(`COALESCE(s.provis_code, '') as wardstay`),
        db.raw(`CASE WHEN o.item_type='H' THEN '2' ELSE '1' END as typedrug`),
        db.raw(`COALESCE(d.did, '') as didstd`),
        db.raw(`COALESCE(CONCAT(d.name, ' ', d.strength), '') as dname`),
        formatDateOnly('m.orderdate', 'datestart'),
        formatDateOnly('m.offdate', 'datefinish'),
        db.raw(`CAST(SUM(COALESCE(o.qty,0)) AS DECIMAL(12,0)) as amount`),
        db.raw(`COALESCE(d.provis_medication_unit_code, '') as unit`),
        db.raw(`COALESCE(d.packqty, '') as unit_packing`),
        formatNumber('COALESCE(d.unitprice,0)', 'drugprice'),
        formatNumber(`CASE WHEN d.unitcost IS NULL OR d.unitcost=0 THEN COALESCE(d.unitprice,0) ELSE d.unitcost END`, 'drugcost'),
        'o.doctor as provider',
        formatDateTime('o.rxdate', 'o.rxtime', 'd_update'),
        'pt.cid as cid'
      );

    if (Array.isArray(an)) {
      query.whereIn('i.an', an);
    } else {
      query.where('i.an', an);
    }
    const result = await query;
    return result;
  }
  async getDrugIpd_(db: Knex, an, hospCode = hisHospcode) {
    const sql = `
            select 
                (select hospitalcode from opdconfig) as HOSPCODE
                ,p.person_id AS PID
                ,i.an AS AN
                ,CASE WHEN i.regdate IS NULL THEN '' ELSE date_format(concat(i.regdate,' ',i.regtime),'%Y-%m-%d %H:%i:%s') END AS DATETIME_ADMIT
                ,s.provis_code AS WARDSTAY
                ,if(o.item_type='H','2','1') TYPEDRUG
                ,d.did AS DIDSTD
                ,CASE WHEN d.strength IS NULL THEN d.name ELSE concat(d.name,' ',d.strength) END AS DNAME
                ,m.orderdate AS DATESTART
                ,m.offdate AS DATEFINISH
                ,SUM(CASE WHEN o.qty IS NULL THEN 0 ELSE o.qty END) AS AMOUNT
                ,d.provis_medication_unit_code AS UNIT
                ,d.packqty AS UNIT_PACKING
                ,SUM(CASE WHEN d.unitprice IS NULL THEN 0 ELSE d.unitprice END) AS DRUGPRICE
                ,IF(d.unitcost IS NULL OR d.unitcost=0, d.unitprice, d.unitcost) AS DRUGCOST
                ,provider(o.doctor,'doctor') AS PROVIDER
                ,CASE WHEN o.rxdate IS NULL THEN '' ELSE date_format(concat(o.rxdate,' ',o.rxtime),'%Y-%m-%d %H:%i:%s') END AS D_UPDATE
                ,pt.cid as CID
            from ipt i
                left join an_stat a on a.an=i.an
                left join opitemrece o on o.an=i.an
                left join patient pt on pt.hn=i.hn
                left join person p on p.patient_hn=pt.hn
                left join spclty s on s.spclty=i.spclty
                left join drugitems d on d.icode=o.icode
                left join medplan_ipd m on m.an=o.an and m.icode=o.icode                    
            where                 
                i.an= ?     
                and d.icode is not null
                and o.qty<>0
                and o.sum_price>0
            group by i.an,o.icode,typedrug
            order by i.an,typedrug,o.icode      
            `;
    const result = await db.raw(sql, [an]);
    return result[0];
  }

  async getAccident(db: Knex, visitNo, hospCode = hisHospcode) {
    const sql = `
            select 
                ? as hospcode,
                p.hn, p.hn as pid, p.cid,
                q.seq_id, q.vn as seq,
                date_format(concat(o.vstdate, ' ', o.vsttime),'%Y-%m-%d %H:%i:%s') datetime_serv,
                date_format(concat(o.vstdate, ' ', o.vsttime),'%Y-%m-%d %H:%i:%s') datetime_ae,
                ifnull(lpad(d.er_accident_type_id,2,'0'),'') aetype,
                ifnull(lpad(d.accident_place_type_id,2,'0'),'99') aeplace,
                ifnull(vt.export_code, '1') typein_ae,
                ifnull(d.accident_person_type_id,'9') traffic,
                ifnull(tt.export_code, '99') vehicle,
                ifnull(d.accident_alcohol_type_id,'9') alcohol,
                ifnull(d.accident_drug_type_id,'9') nacrotic_drug,
                ifnull(d.accident_belt_type_id,'9') belt,
                ifnull(d.accident_helmet_type_id,'9') helmet,
                ifnull(d.accident_airway_type_id,'3') airway,
                ifnull(d.accident_bleed_type_id,'3') stopbleed,
                ifnull(d.accident_splint_type_id,'3') splint,
                ifnull(d.accident_fluid_type_id,'3') fluid,
                ifnull(d.er_emergency_type, '6') urgency,
                IF (d.gcs_e IN (1, 2, 3, 4),d.gcs_e,'4') coma_eye,
                IF (d.gcs_v IN (1, 2, 3, 4, 5),d.gcs_v,'5') coma_speak,
                IF (d.gcs_m IN (1, 2, 3, 4, 5, 6),d.gcs_m,'6') coma_movement,
                date_format(now(), '%Y-%m-%d %H:%i:%s') d_update
            FROM
                er_regist er
            LEFT JOIN ovst o ON er.vn = o.vn
            LEFT JOIN er_pt_type t ON t.er_pt_type = er.er_pt_type
            LEFT JOIN ovst_seq q ON o.vn = q.vn
            LEFT JOIN patient pt ON pt.hn = o.hn
            LEFT JOIN person p ON p.patient_hn = pt.hn
            LEFT JOIN er_nursing_detail d ON er.vn = d.vn
            LEFT JOIN er_nursing_visit_type vt ON vt.visit_type = d.visit_type
            LEFT JOIN accident_transport_type tt ON tt.accident_transport_type_id = d.accident_transport_type_id                   
            where                 
                q.vn =?
            `;
    const result = await db.raw(sql, [hisHospcode, visitNo]);
    return result[0];
  }

  async getDrugAllergy(db: Knex, hn, hospCode = hisHospcode) {
    return db('opd_allergy as oe')
      .leftJoin('drugitems_register as di', 'oe.agent', 'di.drugname')
      .leftJoin('patient', 'oe.hn', 'patient.hn')
      .leftJoin('person', 'oe.hn', 'person.patient_hn')
      .select(db.raw('? as HOSPCODE', [hisHospcode]))
      .select('patient.hn as PID', 'patient.cid as CID', 'di.std_code as DRUGALLERGY',
        'oe.agent as DNAME', 'oe.seriousness_id as ALEVE',
        'oe.symptom as DETAIL', 'oe.opd_allergy_source_id as INFORMANT')
      .select(db.raw(`if(oe.report_date is null 
                    or trim(oe.report_date)=' ' 
                    or oe.report_date like '0000-00-00%',
                    '', date_format(oe.report_date,'%Y-%m-%d')) as DATERECORD`))
      .select(db.raw('? as INFORMHOSP', [hisHospcode]))
      .select(db.raw(`(select case when 
                    oe.allergy_relation_id in ('1','2','3','4','5') 
                then  oe.allergy_relation_id
                else  '1'  end) as TYPEDX`))
      .select(db.raw(`'' as SYMPTOM`))
      .select(db.raw(`if(oe.update_datetime is null or trim(oe.update_datetime) = '' 
                or oe.update_datetime like '0000-00-00%', '', 
                date_format(oe.update_datetime,'%Y-%m-%d %H:%i:%s')) as D_UPDATE`))
      .where('oe.hn', hn)
  }

  async getAppointment(db: Knex, columnName: string, searchValue: any) {
    const colMap: Record<string, string> = {
      fu_date: "nextdate",
      visit_date: "vstdate",
      visitno: "vn",
      visitNo: "vn",
      hn: "hn",
      vn: "vn",
      an: "an"
    };

    const mapped = colMap[columnName] || null;
    if (!mapped) {
      throw new Error(`Invalid columnName: ${columnName}`);
    }

    // 2) normalize date เฉพาะฟิลด์วันที่
    if (columnName === "fu_date" || columnName === "visit_date") {
      if (Array.isArray(searchValue)) {
        searchValue = searchValue.map((d) => moment(d).format("YYYY-MM-DD"));
      } else {
        searchValue = moment(searchValue).format("YYYY-MM-DD");
      }
    }

    // 3) build query
    let query = db({ o: "oapp" })
      .join({ c: "clinic" }, "c.clinic", "o.clinic")
      .join({ d: "doctor" }, "d.code", "o.doctor")
      .join({ oa: "oapp_status" }, "oa.oapp_status_id", "o.oapp_status_id")
      .leftJoin({ pt: "pttype" }, "o.next_pttype", "pt.pttype");

    // 4) apply filter (DATE เป็น DATE อยู่แล้ว → whereIn/where ใช้ได้ทั้ง mysql/pg)
    const colRef = `o.${mapped}`;
    if (Array.isArray(searchValue)) {
      query = query.whereIn(colRef, searchValue);
    } else {
      query = query.where(colRef, searchValue);
    }

    // 5) select
    query = query
      .select([
        "o.hn","o.an","o.vn","o.visit_vn",
        db.raw("CASE WHEN o.patient_visit = 'Y' THEN 1 ELSE 0 END AS isvisited"),
        db.raw("o.vstdate AS visit_date"),
        db.raw("o.nextdate AS fu_date"),
        db.raw("o.nexttime AS fu_time"),
        db.raw("o.clinic AS cliniccode"),
        db.raw("c.name AS clinicName"),
        db.raw("o.doctor AS dr_code"),
        db.raw("d.name AS dr_name"),
        db.raw("d.licenseno AS provider"),
        db.raw("pt.name AS pt_name"),
        db.raw("o.app_cause AS cause"),
        "o.note",
        db.raw("CASE WHEN o.note1 IS NULL OR o.note1 = '' THEN o.perform_text ELSE o.note1 END AS prepare_text"),
        db.raw("o.lab_list_text AS lab"),
        db.raw("o.xray_list_text AS xray"),
        db.raw("o.contact_point AS visit_area"),
        db.raw("CASE WHEN o.oapp_status_id = 1 THEN 1 ELSE 0 END AS isactive"),
      ])
      .whereNotNull("o.nextdate")
      .whereRaw("o.vstdate < o.nextdate");

    return query.orderBy([{ column: "o.nextdate" }, { column: "o.nexttime" }]).limit(maxLimit);
  }

  async getReferHistory(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
    //columnName = visitNo, referNo
    columnName = columnName === 'visitNo' ? 'os.vn' : columnName;
    columnName = columnName === 'vn' ? 'os.vn' : columnName;
    columnName = columnName === 'seq_id' ? 'os.seq_id' : columnName;
    columnName = columnName === 'referNo' ? 'ro.refer_number' : columnName;
    return db('referout as ro')
      .leftJoin('patient as pt', 'pt.hn', 'ro.hn')
      .leftJoin('person as ps', 'ps.cid', 'pt.cid')
      .leftJoin(db.raw('ovst as o on o.vn = ro.vn or o.an=ro.vn'))
      .leftJoin('ipt as i', 'i.an', 'o.an')
      .leftJoin('ovst_seq as os', 'os.vn', 'o.vn')
      .leftJoin('spclty as sp', 'sp.spclty', 'ro.spclty')
      .leftJoin('opdscreen as s', 's.vn', 'o.vn')
      .leftJoin('er_regist as e', 'e.vn', 'o.vn')
      .leftJoin('doctor', 'o.doctor', 'doctor.code')

      .select(db.raw('? as HOSPCODE', [hisHospcode]))
      .select('ro.refer_number as REFERID'
        , db.raw('concat(?,ro.refer_number) as REFERID_PROVINCE', [hisHospcode]),
        'pt.hn as PID', 'pt.cid', 'os.seq_id', 'os.vn as SEQ', 'o.an as AN')
      .select('o.i_refer_number as REFERID_ORIGIN', 'o.rfrilct as HOSPCODE_ORIGIN',
        db.raw(`if(concat(o.vstdate,' ', o.vsttime) is null 
                or trim(concat(o.vstdate,' ', o.vsttime)) = '' 
                or concat(o.vstdate,' ', o.vsttime) like '0000-00-00%',
                '', date_format(concat(o.vstdate,' ', o.vsttime),'%Y-%m-%d %H:%i:%s')) as DATETIME_SERV`),
        db.raw(`if(concat(i.regdate,' ', i.regtime) is null 
                        or trim(concat(i.regdate,' ', i.regtime)) = '' 
                        or concat(i.regdate,' ', i.regtime) like '0000-00-00%','',
                    date_format(concat(i.regdate,' ', i.regtime),'%Y-%m-%d %H:%i:%s')
                ) as DATETIME_ADMIT`),
        db.raw(`if(
                    concat(ro.refer_date, ' ', ro.refer_time) is null 
                        or trim(concat(ro.refer_date, ' ', ro.refer_time)) = '' 
                        or concat(ro.refer_date, ' ', ro.refer_time) like '0000-00-00%',
                    '',
                    date_format(concat(ro.refer_date, ' ', ro.refer_time),'%Y-%m-%d %H:%i:%s')
                ) as DATETIME_REFER,
                if (
                    sp.provis_code is null 
                        or sp.provis_code = '',
                    '00100',
                    sp.provis_code
                ) as CLINIC_REFER,
                ro.refer_hospcode as HOSP_DESTINATION,
                concat('CC:',s.cc,' HPI:',s.hpi,' PMH:',s.pmh) as CHIEFCOMP,
                '' as PHYSICALEXAM,
                ifnull(ro.pre_diagnosis,'ไม่ระบุ') as DIAGFIRST,
                ifnull(ro.pre_diagnosis,'ไม่ระบุ') as DIAGLAST,
                ifnull(ro.ptstatus_text,'ไม่ระบุ') as PSTATUS,
                ovst.doctor as dr, doctor.licenseno as provider,
                (select case e.er_pt_type 
                    when '2' then '2' 
                    when '1' then '3' 
                else 
                    '1' 
                end
                ) as PTYPE,
                ifnull(e.er_emergency_level_id,'5') as EMERGENCY,
                '99' as PTYPEDIS,
                if(
                    ro.refer_cause = '1' 
                        or ro.refer_cause = '2' ,
                    ro.refer_cause,
                    '1'
                ) as CAUSEOUT,
                ro.request_text as REQUEST,
                ro.doctor as PROVIDER,
                if(
                    concat(o.vstdate, ' ', o.vsttime) is null 
                        or trim(concat(o.vstdate, ' ', o.vsttime)) = '' 
                        or concat(o.vstdate, ' ', o.vsttime) like '0000-00-00%',
                    '',
                    date_format(concat(o.vstdate, ' ', o.vsttime),'%Y-%m-%d %H:%i:%s')
                ) as D_UPDATE `)
      )
      .where(columnName, searchNo)
      .whereNotNull('ro.refer_hospcode')
      .whereNot('ro.refer_hospcode', '');

    // const sql = `
    //     select
    //         ? as HOSPCODE, ro.refer_number as REFERID,
    //         concat(?,ro.refer_number ) as REFERID_PROVINCE,
    //         pt.hn as PID, pt.cid, os.seq_id, os.vn as SEQ, o.an as AN,
    //         o.i_refer_number as REFERID_ORIGIN,o.rfrilct as HOSPCODE_ORIGIN,
    //         if(
    //             concat(o.vstdate,' ', o.vsttime) is null 
    //                 or trim(concat(o.vstdate,' ', o.vsttime)) = '' 
    //                 or concat(o.vstdate,' ', o.vsttime) like '0000-00-00%',
    //             '',
    //             date_format(concat(o.vstdate,' ', o.vsttime),'%Y-%m-%d %H:%i:%s')
    //         ) as DATETIME_SERV,
    //         if(
    //             concat(i.regdate,' ', i.regtime) is null 
    //                 or trim(concat(i.regdate,' ', i.regtime)) = '' 
    //                 or concat(i.regdate,' ', i.regtime) like '0000-00-00%',
    //             '',
    //             date_format(concat(i.regdate,' ', i.regtime),'%Y-%m-%d %H:%i:%s')
    //         ) as DATETIME_ADMIT,
    //         if(
    //             concat(ro.refer_date, ' ', ro.refer_time) is null 
    //                 or trim(concat(ro.refer_date, ' ', ro.refer_time)) = '' 
    //                 or concat(ro.refer_date, ' ', ro.refer_time) like '0000-00-00%',
    //             '',
    //             date_format(concat(ro.refer_date, ' ', ro.refer_time),'%Y-%m-%d %H:%i:%s')
    //         ) as DATETIME_REFER,
    //         if (
    //             sp.provis_code is null 
    //                 or sp.provis_code = '',
    //             '00100',
    //             sp.provis_code
    //         ) as CLINIC_REFER,
    //         ro.refer_hospcode as HOSP_DESTINATION,
    //         concat('CC:',s.cc,' HPI:',s.hpi,' PMH:',s.pmh) as CHIEFCOMP,
    //         '' as PHYSICALEXAM,
    //         ifnull(ro.pre_diagnosis,'ไม่ระบุ') as DIAGFIRST,
    //         ifnull(ro.pre_diagnosis,'ไม่ระบุ') as DIAGLAST,
    //         ifnull(ro.ptstatus_text,'ไม่ระบุ') as PSTATUS,
    //         ovst.doctor as dr, doctor.licenseno as provider,
    //         (select case e.er_pt_type 
    //             when '2' then '2' 
    //             when '1' then '3' 
    //         else 
    //             '1' 
    //         end
    //         ) as PTYPE,
    //         ifnull(e.er_emergency_level_id,'5') as EMERGENCY,
    //         '99' as PTYPEDIS,
    //         if(
    //             ro.refer_cause = '1' 
    //                 or ro.refer_cause = '2' ,
    //             ro.refer_cause,
    //             '1'
    //         ) as CAUSEOUT,
    //         ro.request_text as REQUEST,
    //         ro.doctor as PROVIDER,
    //         if(
    //             concat(o.vstdate, ' ', o.vsttime) is null 
    //                 or trim(concat(o.vstdate, ' ', o.vsttime)) = '' 
    //                 or concat(o.vstdate, ' ', o.vsttime) like '0000-00-00%',
    //             '',
    //             date_format(concat(o.vstdate, ' ', o.vsttime),'%Y-%m-%d %H:%i:%s')
    //         ) as D_UPDATE 

    //     from
    //         referout ro 
    //         left join patient as pt on pt.hn = ro.hn 
    //         left join person as ps on ps.cid = pt.cid 
    //         left join ovst as o on o.vn = ro.vn or o.an=ro.vn
    //         left join ipt as i on i.an = o.an 
    //         left join ovst_seq as os on os.vn = o.vn
    //         left join spclty as sp on sp.spclty = ro.spclty 
    //         left join opdscreen as s on s.vn = o.vn 
    //         left join er_regist as e on e.vn = o.vn 
    //         left join doctor on o.doctor = doctor.code
    //     where
    //         ${columnName}=?
    //         and ro.refer_hospcode!='' and !isnull(ro.refer_hospcode)
    //     `;
    // const result = await db.raw(sql, [hisHospcode, hisHospcode, searchNo]);
    // return result[0];
  }

  getClinicalRefer(db, referNo, hospCode = hisHospcode) {
    return db('view_clinical_refer')
      .select(db.raw(`'${hisHospcode}' as hospcode`))
      .where('refer_no', "=", referNo)
      .limit(maxLimit);
  }

  getInvestigationRefer(db, referNo, hospCode = hisHospcode) {
    return db('view_investigation_refer')
      .select(db.raw(`'${hisHospcode}' as hospcode`))
      .where('refer_no', "=", referNo)
      .limit(maxLimit);
  }

  async getCareRefer(db: Knex, referNo, hospCode = hisHospcode) {
    const sql = `
            select 
                '${hisHospcode}' as hospcode,
                ro.refer_number as referid,
                concat('${hisHospcode}',ro.refer_number ) as referid_province,
                '' as caretype,
                if(
                    concat(ro.refer_date, ' ', ro.refer_time) is null 
                        or trim(concat(ro.refer_date, ' ', ro.refer_time)) = '' 
                        or concat(ro.refer_date, ' ', ro.refer_time) like '0000-00-00%',
                    '',
                    date_format(concat(ro.refer_date, ' ', ro.refer_time),'%Y-%m-%d %H:%i:%s')
                ) as d_update 
                
            from
                referout ro 
            where 
                ro.refer_number = ?
            `;
    const result = await db.raw(sql, [referNo]);
    return result[0];
  }

  // verified for mysql, pg, mssql
  async getReferResult(db: Knex, visitDate: string, hospCode = hisHospcode) {
    try {
      visitDate = moment(visitDate).format('YYYY-MM-DD');
      const hospCode = await this.hospCodeFromTable(db);

      // ตรวจสอบชนิด database เพื่อเลือกฟังก์ชันนับตัวอักษร (MSSQL ใช้ LEN, อื่นๆ ใช้ LENGTH)
      const lenFunc = db.client.driverName === 'mssql' ? 'LEN' : 'LENGTH';

      const result = await db('referin')
        .leftJoin('patient', 'referin.hn', 'patient.hn')
        .leftJoin('ovst', 'referin.vn', 'ovst.vn')
        .leftJoin('refer_reply', 'referin.vn', 'refer_reply.vn')
        .select([
          db.raw('? as "HOSPCODE"', [hospCode]),
          'referin.refer_hospcode as HOSP_SOURCE',
          'patient.cid as CID_IN',
          'referin.hn as PID_IN',
          'referin.vn as SEQ_IN',
          'referin.docno as REFERID',
          'referin.refer_date as DATETIME_REFER',
          'referin.icd10 as detail',
          'refer_reply.diagnosis_text as reply_diagnostic',
          'refer_reply.advice_text as reply_recommend',
          db.raw(`CASE WHEN referin.referin_number IS NOT NULL 
              AND referin.referin_number <> '' 
              AND referin.referin_number <> '-' 
            THEN referin.referin_number 
            ELSE CONCAT(?, '-', referin.docno) 
            END as "REFERID_SOURCE"`, [hospCode]),
          db.raw(`CONCAT(refer_reply.reply_date, ' ', refer_reply.reply_time) as reply_date`),
          db.raw(`'' as "AN_IN"`),
          db.raw(`CONCAT(referin.refer_hospcode, referin.referin_number) as "REFERID_PROVINCE"`),
          db.raw(`CONCAT(ovst.vstdate, ' ', ovst.vsttime) as "DATETIME_IN"`),
          db.raw(`'1' as "REFER_RESULT"`),
          db.raw(`CONCAT(ovst.vstdate, ' ', ovst.vsttime) as "D_UPDATE"`)
        ])
        .where('referin.refer_date', visitDate)
        .where(db.raw(`${lenFunc}(referin.refer_hospcode) IN (5, 9)`))
        .whereNotNull('referin.vn')
        .whereNotNull('patient.hn')
        .limit(maxLimit);

      return result;
    } catch (error) {
      throw error;
    }
  }

  // verified for mysql, pg, mssql
  async getProvider(db: Knex, columnName: string, searchNo: any, hospCode = hisHospcode) {
    try {
      columnName = columnName === 'licenseNo' ? 'd.code' : columnName;
      columnName = columnName === 'cid' ? 'd.cid' : columnName;
      hospCode = await this.hospCodeFromTable(db);

      // Function ช่วยเรื่องวันที่ (จากข้อที่แล้ว)
      const getSqlDate = (field: string, includeTime = false) => {
        const driver = db.client.driverName;
        if (driver === 'pg') {
          const fmt = includeTime ? 'YYYY-MM-DD HH24:MI:SS' : 'YYYY-MM-DD';
          return `TO_CHAR(${field}, '${fmt}')`;
        } else if (driver === 'mssql') {
          const fmt = includeTime ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd';
          return `FORMAT(${field}, '${fmt}')`;
        }
        const fmt = includeTime ? '%Y-%m-%d %H:%i:%s' : '%Y-%m-%d';
        return `DATE_FORMAT(${field}, '${fmt}')`;
      };

      // --- การเขียนแบบ Knex Query Builder ---
      const result = await db('doctor as d')
        .leftJoin('patient as p', 'd.cid', 'p.cid')
        .leftJoin('pname as pn', 'pn.name', 'p.pname')
        // Join แบบซับซ้อน (ON ... = ...) ใช้ .on
        .leftJoin('provis_pname as p2', 'p2.provis_pname_code', 'pn.provis_code')
        .select([
          db.raw('? as hospcode', [hospCode]),

          // 2. Column ปกติ (Knex จัดการ Quote ให้)
          'd.code as provider',
          'd.licenseno as registerno',
          'd.council_code as council',
          'd.cid as cid',

          // 3. Logic ซับซ้อน (ใช้ raw แต่ยังอ่านง่ายกว่า SQL ล้วน)
          db.raw('COALESCE(p2.provis_pname_long_name, d.pname) as prename'),
          db.raw('COALESCE(p.fname, d.fname) as name'),
          db.raw('COALESCE(p.lname, d.lname) as lname'),
          'd.sex',

          // 4. วันที่ (ใช้ Helper function + CASE Check NULL)
          db.raw(`CASE WHEN p.birthday IS NULL THEN '' ELSE ${getSqlDate('p.birthday')} END as birth`),
          'd.provider_type_code as providertype',
          db.raw(`CASE WHEN d.start_date IS NULL THEN '' ELSE ${getSqlDate('d.start_date')} END as startdate`),
          db.raw(`CASE WHEN d.finish_date IS NULL THEN '' ELSE ${getSqlDate('d.finish_date')} END as outdate`),
          'd.move_from_hospcode as movefrom',
          'd.move_to_hospcode as moveto',
          db.raw(`CASE WHEN d.update_datetime IS NULL THEN '' ELSE ${getSqlDate('d.update_datetime', true)} END as d_update`)
        ])
        .where(columnName, searchNo);
      return result;

      // const sql = `
      //       select 
      //           '${hisHospcode}' as hospcode,
      //           d.code as provider,
      //           d.licenseno as registerno,
      //           d.council_code as council,
      //           d.cid as cid,
      //           ifnull(p2.provis_pname_long_name,d.pname) as prename,
      //           ifnull(p.fname,d.fname) as name,
      //           ifnull(p.lname,d.lname) as lname,
      //           d.sex as sex,	
      //           if(p.birthday   is null or trim(p.birthday )='' or p.birthday   like '0000-00-00%','',date_format(p.birthday,'%Y-%m-%d')) as  birth,
      //           d.provider_type_code as providertype,
      //           if( d.start_date is null or trim(d.start_date)='' or d.start_date like '0000-00-00%','',date_format(d.start_date,'%Y-%m-%d')) as startdate,
      //           if( d.finish_date is null or trim(d.finish_date)='' or d.finish_date like '0000-00-00%','',date_format(d.finish_date,'%Y-%m-%d')) as outdate,
      //           d.move_from_hospcode as movefrom,
      //           d.move_to_hospcode as  moveto,
      //           if(d.update_datetime is null or trim(d.update_datetime)='' or d.update_datetime like '0000-00-00%','',date_format(d.update_datetime,'%Y-%m-%d %H:%i:%s') ) as d_update

      //       from 
      //           doctor d 
      //           left join patient p on d.cid = p.cid
      //           left join pname pn on pn.name = p.pname
      //           left join provis_pname p2 on p2.provis_pname_code = pn.provis_code                
      //       where 
      //           ${columnName} = ?`;
      // const result = await db.raw(sql, [searchNo]);
      // return result[0];

    } catch (error) {
      throw error;
    }
  }

  async getProviderDr_(db: Knex, drList: any[]) {
    return db('doctor as d')
      .leftJoin('patient as p', 'd.cid', 'p.cid')
      .leftJoin('pname as pn', 'pn.name', 'p.pname')
      .leftJoin('provis_pname as p2', 'p2.provis_pname_code', 'pn.provis_code')
      .select(db.raw(`
                '${hisHospcode}' as hospcode,
                d.code as provider,
                d.licenseno as registerno,
                d.council_code as council,
                d.cid as cid,
                CASE WHEN p2.provis_pname_long_name IS NULL THEN d.pname ELSE p2.provis_pname_long_name END as prename,
                CASE WHEN p.fname IS NULL THEN d.fname ELSE p.fname END as name,
                CASE WHEN p.lname IS NULL THEN d.lname ELSE p.lname END as lname,
                d.sex as sex,	
                if(p.birthday is null or trim(p.birthday )='' or p.birthday   like '0000-00-00%','',date_format(p.birthday,'%Y-%m-%d')) as  birth,
                d.provider_type_code as providertype,
                if( d.start_date is null or trim(d.start_date)='' or d.start_date like '0000-00-00%','',date_format(d.start_date,'%Y-%m-%d')) as startdate,
                if( d.finish_date is null or trim(d.finish_date)='' or d.finish_date like '0000-00-00%','',date_format(d.finish_date,'%Y-%m-%d')) as outdate,
                d.move_from_hospcode as movefrom,
                d.move_to_hospcode as  moveto,
                if(d.update_datetime is null or trim(d.update_datetime)='' or d.update_datetime like '0000-00-00%','',date_format(d.update_datetime,'%Y-%m-%d %H:%i:%s') ) as d_update`))
      .whereIn('d.code', drList);
  }

  // verified for mysql, pg, mssql
  async getProviderDr(db: Knex, drList: any[]) {
    try {
      const hospCode = await this.hospCodeFromTable(db);

      // 1. ตรวจสอบ Driver เพื่อเลือก Syntax วันที่
      const driver = db.client.driverName; // 'mysql', 'mysql2', 'pg', 'mssql'

      // ฟังก์ชันสร้าง SQL สำหรับแปลงวันที่
      const sqlDate = (field: string, withTime = false) => {
        // Logic สำหรับตรวจสอบค่าว่าง (รองรับ 0000-00-00 ของ mysql เก่า)
        const zeroDateCheck = (driver === 'mysql' || driver === 'mysql2')
          ? `OR CAST(${field} AS CHAR) LIKE '0000-00-00%'` : '';

        let formatFn = '';
        if (driver === 'pg') {
          formatFn = `TO_CHAR(${field}, '${withTime ? 'YYYY-MM-DD HH24:MI:SS' : 'YYYY-MM-DD'}')`;
        } else if (driver === 'mssql') {
          formatFn = `FORMAT(${field}, '${withTime ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd'}')`;
        } else {
          formatFn = `DATE_FORMAT(${field}, '${withTime ? '%Y-%m-%d %H:%i:%s' : '%Y-%m-%d'}')`;
        }
        return `CASE WHEN ${field} IS NULL ${zeroDateCheck} THEN '' ELSE ${formatFn} END`;
      };

      return db('doctor as d')
        .leftJoin('patient as p', 'd.cid', 'p.cid')
        .leftJoin('pname as pn', 'pn.name', 'p.pname')
        .leftJoin('provis_pname as p2', 'p2.provis_pname_code', 'pn.provis_code')
        .select([
          db.raw('? as hospcode', [hospCode]),
          'd.code as provider',
          'd.licenseno as registerno',
          'd.council_code as council',
          'd.cid as cid',
          // ใช้ COALESCE แทน CASE WHEN ยาวๆ (ทำงานเหมือน ifnull แต่เป็น standard)
          db.raw('COALESCE(p2.provis_pname_long_name, d.pname) as prename'),
          db.raw('COALESCE(p.fname, d.fname) as name'),
          db.raw('COALESCE(p.lname, d.lname) as lname'),
          'd.sex as sex',
          db.raw(`${sqlDate('p.birthday')} as birth`),
          'd.provider_type_code as providertype',
          // จัดการวันที่ startdate, outdate, d_update
          db.raw(`${sqlDate('d.start_date')} as startdate`),
          db.raw(`${sqlDate('d.finish_date')} as outdate`),
          'd.move_from_hospcode as movefrom',
          'd.move_to_hospcode as moveto',
          db.raw(`${sqlDate('d.update_datetime', true)} as d_update`)
        ])
        .whereIn('d.code', drList);
    } catch (error) {
      throw error;
    }
  }

  getData(db, tableName, columnName, searchNo, hospCode = hisHospcode) {
    return db(tableName)
      .select(db.raw('"' + hisHospcode + '" as hospcode'))
      .select('*')
      .where(columnName, "=", searchNo)
      .limit(maxLimit);
  }

  // Report Zone =========================================================
  // verified for mysql, pg, mssql
  async sumReferOut(db: Knex, dateStart: any, dateEnd: any) {
    try {
      const hospCode = await this.hospCodeFromTable(db);
      dateStart = moment(dateStart).format('YYYY-MM-DD');
      dateEnd = moment(dateEnd).format('YYYY-MM-DD');
      return db('referout as r')
        .select('r.refer_date')
        // หมายเหตุ: Postgres จะ return count เป็น string (bigint) 
        // ส่วน MySQL/MSSQL return เป็น number (int)
        // ถ้าต้องการให้เป็น number เสมอ อาจต้อง cast ใน javascript ภายหลัง
        .count('r.vn as cases')
        .whereBetween('r.refer_date', [dateStart, dateEnd])
        .whereNotNull('r.vn')
        .where('r.refer_hospcode', '<>', '')
        .whereNotNull('r.refer_hospcode')
        .where('r.refer_hospcode', '<>', hospCode)
        .groupBy('r.refer_date')
        .orderBy('r.refer_date');
    } catch (error) {
      throw error;
    }
  }

  // verified for mysql, pg, mssql
  async sumReferIn(db: Knex, dateStart: any, dateEnd: any) {
    try {
      dateStart = moment(dateStart).format('YYYY-MM-DD');
      dateEnd = moment(dateEnd).format('YYYY-MM-DD');
      const hospCode = await this.hospCodeFromTable(db);

      return db('referin')
        .leftJoin('ovst', 'referin.vn', 'ovst.vn')
        .select('referin.refer_date')
        .count('referin.vn as cases')
        .whereBetween('referin.refer_date', [dateStart, dateEnd])
        .where('referin.refer_hospcode', '<>', hospCode)
        .whereNotNull('referin.refer_hospcode')
        .whereNotNull('referin.vn')
        .whereNotNull('ovst.vn')
        .groupBy('referin.refer_date')
        .orderBy('referin.refer_date');
    } catch (error) {
      throw error;
    }
  }

  // MOPH ERP ==========================================================
  countBedNo(db: Knex) {
    try {
      return db('bedno')
        // .count('bedno.bedno as total_bed')
        .count({ total_bed: 'bedno.bedno' })
        .leftJoin('roomno', 'bedno.roomno', 'roomno.roomno')
        .leftJoin('ward', 'roomno.ward', 'ward.ward')
        .where('ward.ward_active', 'Y').first();
    } catch (error) {
      throw error;
    }
  }

  async getBedNo(db: Knex, bedno: any = null, start = -1, limit: number = 1000) {
    try {
      let sql = db('bedno')
        .leftJoin('roomno', 'bedno.roomno', 'roomno.roomno')
        .leftJoin('ward', 'roomno.ward', 'ward.ward')
        .leftJoin('bedtype', 'bedno.bedtype', 'bedtype.bedtype')
        .leftJoin('bed_status_type as status', 'bedno.bed_status_type_id', 'status.bed_status_type_id')
        .select('bedno.bedno', 'bedno.bedtype', 'bedtype.name as bedtype_name', 'bedno.roomno',
          'roomno.ward as wardcode', 'ward.name as wardname', 'bedno.export_code as std_code',
          'bedno.bed_status_type_id', 'status.bed_status_type_name',
          db.raw("CASE WHEN ward.ward_active !='Y' OR status.is_available !='Y' THEN 0 ELSE 1 END as isactive"),
          db.raw(`
            CASE 
                WHEN LOWER(bedtype.name) LIKE '%พิเศษ%' THEN 'S'
                WHEN LOWER(bedtype.name) LIKE '%icu%' OR bedtype.name LIKE '%ไอซียู%' THEN 'ICU'
                WHEN LOWER(bedtype.name) LIKE '%ห้องคลอด%' OR LOWER(bedtype.name) LIKE '%รอคลอด%' THEN 'LR'
                WHEN LOWER(bedtype.name) LIKE '%Home Ward%' THEN 'HW'
                ELSE 'N'
            END as bed_type`)
        )
        .where('ward.ward_active', 'Y');
      if (bedno) {
        sql = sql.where('bedno.bedno', bedno);
      }
      if (start >= 0) {
        sql = sql.offset(start).limit(limit);
      }
      return sql
        .where('bedno.bedno', '!=', '')
        .whereNotNull('bedno.bedno')
        .where('roomno.ward', '!=', '')
        .whereNotNull('roomno.ward')
        .orderBy('bedno.bedno');
    } catch (error) {
      throw error;
    }
  }

  concurrentIPDByWard(db: Knex, date: any) {
    try {
      // ===== 1. เตรียมช่วงเวลา (1 ชั่วโมง) =====
      const dateStart = moment(date)
        .locale('TH')
        .startOf('hour')
        .format('YYYY-MM-DD HH:mm:ss');

      const dateEnd = moment(date)
        .locale('TH')
        .endOf('hour')
        .format('YYYY-MM-DD HH:mm:ss');

      // ===== 2. เตรียม datetime expression (รองรับหลาย DB) =====
      const regdatetime = getDatetimeExpr(db, 'regdate', 'regtime');
      const dchdatetime = getDatetimeExpr(db, 'dchdate', 'dchtime');

      // ===== 3. base query : เตรียม care_code (คิดครั้งเดียวต่อ row) =====
      const base = db('ipt')
        .leftJoin('iptadm', 'ipt.an', 'iptadm.an')
        .leftJoin('ward', 'ipt.ward', 'ward.ward')
        .leftJoin('bedno', 'iptadm.bedno', 'bedno.bedno')
        .select(
          'ipt.ward as wardcode',
          'ward.name as wardname',

          // care_code = 3 หลักเสมอ
          db.raw(`
          COALESCE(
            SUBSTRING(bedno.export_code,4,3),
            SUBSTRING(ward.ward_export_code,4,3),
            ''
          ) AS care_code
        `),

          // fields ที่ใช้คำนวณ
          'ipt.regdate',
          'ipt.regtime',
          'ipt.dchdate',
          'ipt.dchtime',
          'ipt.dchstts'
        )
        .whereNotNull('ipt.ward')
        .whereNot('ipt.ward', '')
        .where('ward.ward_active', 'Y');

      // ===== 4. query หลัก : นับผลลัพธ์ =====
      const sql = db
        .from(base.as('x'))
        .select(
          'wardcode',
          'wardname',

          // --- case movement ---
          db.raw(
            `SUM(CASE WHEN ${regdatetime.sql} BETWEEN ? AND ? THEN 1 ELSE 0 END) AS new_case`,
            [dateStart, dateEnd]
          ),

          db.raw(
            `SUM(CASE WHEN ${dchdatetime.sql} BETWEEN ? AND ? THEN 1 ELSE 0 END) AS discharge`,
            [dateStart, dateEnd]
          ),

          db.raw(
            `SUM(
            CASE 
              WHEN ${dchdatetime.sql} BETWEEN ? AND ?
                   AND dchstts IN (?, ?)
              THEN 1 ELSE 0 
            END
          ) AS death`,
            [dateStart, dateEnd, '08', '09']
          ),

          // --- ward / care type ---
          db.raw(`SUM(CASE WHEN LEFT(care_code,1)='2' THEN 1 ELSE 0 END) AS icu`),
          db.raw(`SUM(CASE WHEN LEFT(care_code,1)='3' THEN 1 ELSE 0 END) AS semi`),
          db.raw(`SUM(CASE WHEN LEFT(care_code,1)='4' THEN 1 ELSE 0 END) AS stroke`),
          db.raw(`SUM(CASE WHEN LEFT(care_code,1)='5' THEN 1 ELSE 0 END) AS burn`),

          db.raw(`SUM(CASE WHEN care_code IN ('601','602') THEN 1 ELSE 0 END) AS imc`),
          db.raw(`SUM(CASE WHEN care_code='604' THEN 1 ELSE 0 END) AS minithanyaruk`),
          db.raw(`SUM(CASE WHEN care_code='607' THEN 1 ELSE 0 END) AS homeward`)
        )
        .count('* as cases')
        .whereRaw(`${regdatetime.sql} <= ?`, [dateStart])
        .whereRaw(
          `(dchdate IS NULL OR ${dchdatetime.sql} BETWEEN ? AND ?)`,
          [dateStart, dateEnd]
        )
        .groupBy(['wardcode', 'wardname']);

      return sql.orderBy('wardcode');
    } catch (error) {
      throw error;
    }
  }

  concurrentIPDByClinic(db: Knex, date: any) {
    try {
      const formattedDate = moment(date).locale('TH').format('YYYY-MM-DD');
      let sql = db('ipt')
        .leftJoin('iptadm', 'ipt.an', 'iptadm.an')
        .leftJoin('ward', 'ipt.ward', 'ward.ward')
        .leftJoin('bedno', 'iptadm.bedno', 'bedno.bedno')
        .leftJoin('spclty as clinic', 'ipt.spclty', 'clinic.spclty')
        .select('ipt.spclty as cliniccode',
          db.raw('SUM(CASE WHEN ipt.regdate = ? THEN 1 ELSE 0 END) AS new_case', [formattedDate]),
          db.raw('SUM(CASE WHEN ipt.dchdate = ? THEN 1 ELSE 0 END) AS discharge', [formattedDate]),
          db.raw('SUM(CASE WHEN ipt.dchstts IN (?, ?) THEN 1 ELSE 0 END) AS death', ['08', '09']),
          db.raw(`SUM(CASE WHEN SUBSTRING(bedno.export_code,4,1)='2' THEN 1 ELSE 0 END) AS icu`),
          db.raw(`SUM(CASE WHEN SUBSTRING(bedno.export_code,4,1)='3' THEN 1 ELSE 0 END) AS semi`),
          db.raw(`SUM(CASE WHEN SUBSTRING(bedno.export_code,4,1)='4' THEN 1 ELSE 0 END) AS stroke`),
          db.raw(`SUM(CASE WHEN SUBSTRING(bedno.export_code,4,1)='5' THEN 1 ELSE 0 END) AS burn`),
          db.raw(`SUM(CASE WHEN SUBSTRING(bedno.export_code,4,3) IN ('601','602') THEN 1 ELSE 0 END) AS imc`),
          db.raw(`SUM(CASE WHEN SUBSTRING(bedno.export_code,4,3)='604' THEN 1 ELSE 0 END) AS minithanyaruk`),
          db.raw(`SUM(CASE WHEN SUBSTRING(bedno.export_code,4,3)='607' THEN 1 ELSE 0 END) AS homeward`))
        .count('ipt.regdate as cases')
        .where('ipt.regdate', '<=', formattedDate)
        .whereRaw("ipt.spclty is not null and ipt.spclty!= ''")
        .andWhere(function () {
          this.whereNull('ipt.dchdate').orWhere('ipt.dchdate', '>=', formattedDate);
        });
      return sql.where("ward.ward_active", "Y")
        .groupBy(['ipt.spclty'])
        .orderBy('ipt.spclty');
    } catch (error) {
      throw error;
    }
  }
  sumOpdVisitByClinic(db: Knex, date: any) {
    try {
      let sql = db('ovst')
        .leftJoin('spclty', 'ovst.spclty', 'spclty.spclty')
        .select('ovst.vstdate as date', 'spclty.nhso_code as cliniccode',
          db.raw('SUM(CASE WHEN an IS NULL or an=\'\' THEN 0 ELSE 1 END) AS admit'))
        .count('ovst.vstdate as cases')
        .where('ovst.vstdate', date);
      return sql.groupBy(['ovst.vstdate', 'spclty.nhso_code', 'spclty.name'])
        .orderBy('spclty.nhso_code');
    } catch (error) {
      throw error;
    }
  }

  async getVisitForMophAlert(db: Knex, date: any, isRowCount: boolean = false, start = -1, limit: number = 1000) {
    try {
      date = moment(date).locale('TH').format('YYYY-MM-DD');
      if (isRowCount) {
        return db('ovst').where('ovst.vstdate', date).count('ovst.vn as row_count').first();
      } else {
        let sql = db('ovst')
          .leftJoin('patient as p', 'p.hn', 'ovst.hn')
          .leftJoin('ovstost as ot', 'ovst.ovstost', 'ot.ovstost')
          .leftJoin('kskdepartment as d', 'ovst.main_dep', 'd.depcode')
          .select('ovst.hn', 'ovst.vn', 'p.cid',
            db.raw(`? as department_type`, ['OPD']),
            'ovst.main_dep as department_code',
            'd.department as department_name',
            'ovst.vstdate as date_service',
            'ovst.vsttime as time_service',
            'ot.name as service_status', 'ot.name as service_status_name')
          .where('ovst.vstdate', date);
        if (start >= 0) {
          sql = sql.offset(start).limit(limit);
        }
        const rows = await sql;
        return rows.filter((row) => {
          return row.service_status_name && (row.service_status_name.includes('ตรวจแล้ว') || row.service_status_name.includes('รอรับยา'));
        });
      }
    } catch (error) {
      throw error;
    }
  }
}
