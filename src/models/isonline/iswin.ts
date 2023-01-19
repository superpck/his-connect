import { Knex } from 'knex';
import { IisStructure } from '../model';
import * as moment from 'moment';
const dbName = process.env.DB_NAME;
const defaultHCode = process.env.HOSPCODE;

export class IswinModel {

  getVersion(db: Knex) {
    return db('version')
      .where('id', 'IS')
      .limit(1)
  }

  getTableName(knex: Knex) {
    return knex('information_schema.tables')
      .select('table_name')
      .where('TABLE_SCHEMA', '=', dbName);
  }

  selectSqlK(knex: Knex, tableName: string, selectText: string, whereText: string, groupBy: string, orderBy: string, limit = '2000') {
    let Sql: string = knex(tableName).select(selectText)
      .where(whereText)
      .groupBy(groupBy)
      .orderBy(orderBy)
      .limit(+limit)
      .toString();
    return knex.raw(Sql);
  }

  getOffices(knex: Knex, HospCode: string, groupCode: string) {
    let Sql = "select *, `hospname` as name, `off_id` as subcode " +
      " from lib_hosp " +
      " where `type` = '" + groupCode + "' and hospcode='" + HospCode + "' " +
      " order by `off_id` ";
    return knex.raw(Sql);
  }

  getLibs(knex: Knex, HospCode: string, groupCode: string) {
    let Sql = "select *, `describe` as name, substr(`code`,3) as subcode " +
      " from lib_code " +
      " where substr(`code`,1,2) = '" + groupCode + "' and hospcode='" + HospCode + "' " +
      " order by `code` ";
    return knex.raw(Sql);
  }

  getLib(knex: Knex, HospCode: string, tableName: string, columnsName: string, textSearch: string) {
    let Sql = "select * " +
      " from `" + tableName + "`"
    " where `" + columnsName + "` = '" + textSearch + "' and `hospcode`='" + HospCode + "' " +
      " order by `" + columnsName + "`";
    return knex.raw(Sql);
  }

  selectSql(knex: Knex, tableName: string, selectText: string, whereText: string, groupBy: string, orderBy: string, limit: string) {
    console.log(dbName);
    let sql = 'select ' + selectText + ' from ' + tableName;
    if (whereText != '') {
      sql = sql + ' where ' + whereText;
    }
    if (groupBy != '') {
      sql = sql + ' group by ' + groupBy;
    }
    if (orderBy != '') {
      sql = sql + ' order by ' + orderBy;
    }
    if (limit === '') {
      sql = sql + ' limit 0,1000';
    } else {
      sql = sql + ' limit ' + limit;
    }
    return knex.raw(sql);
  }

  list(knex: Knex, limit: number = 50, offset: number = 0) {
    // return knex('is')
    //   .select('*')
    //   .orderBy('adate', 'DESC')
    //  .limit(limit)
    //  .offset(offset);
    let sql = 'select * from `is` limit ' + offset + ',' + limit;
    return knex.raw(sql);
  }

  getByDatet(knex: Knex, typeSearch: string, dateStart: string, dateEnd: string, HospCode: string) {
    if (dateStart.length < 13) {
      dateStart = dateStart + ' 00:00:00';
      dateEnd = dateEnd + ' 23:59:59';
    }
    return knex('is')
      .whereBetween(typeSearch, [dateStart, dateEnd])
      .where('hosp', HospCode)
      .orderBy(typeSearch, 'DESC')
  }

  async getByDate(db: Knex, typeDate: string, dateStart: string, dateEnd: string, HospCode: string = defaultHCode) {
    if (dateStart.length < 13) {
      dateStart = dateStart + ' 00:00:00';
      dateEnd = dateEnd + ' 23:59:59';
    }
    return db('is')
      .whereBetween(typeDate, [dateStart, dateEnd])
      .where('hosp', HospCode)
      .orderBy(typeDate, 'desc')
      .limit(2500);
  }

  getByRef(knex: Knex, refSeach: number, HospCode: string) {
    let sql = 'select * from `is` where ref=' + refSeach
      + ' and hosp="' + HospCode + '" ';
    return knex.raw(sql);
  }

  reportByDate(knex: Knex, typeDate: string, date1: string, date2: string, HospCode: string) {
    let sql = 'select substr(' + typeDate + ',1,10) as reportdate ,count(1) as cases, sum(if(sex=1,1,0)) as male,sum(if(sex=2,1,0)) as female,sum(if(sex<1 or sex>2,1,0)) as sex_error'
      + ',sum(if(ps>=0.75,1,0)) as psm75 '
      + ',sum(if(ps>0 and ps<0.75,1,0)) as ps75, sum(if(ps="" or isnull(ps) , 1,0)) as ps_error '
      + ',sum(if(staer=1,1,0)) as dba, sum(if(staer=6,1,0)) as dead '
      + ',sum(if(staer=3,1,0)) as refer, sum(if(staer in (1,3,6),0,1)) as staer '
      + ' from `is` '
      + ' where ' + typeDate
      + ' between "' + date1 + ' 00:00:00" and "'
      + date2 + ' 23:59:59" and hosp="'
      + HospCode + '" '
      + ' group by reportdate order by ' + typeDate;
    return knex.raw(sql);
  }

  getByDatex(knex: Knex, typeSearch: string, dateSearch: string, HospCode: string) {
    let sql = 'select * from `is` where ' + typeSearch + ' between "' + dateSearch + ' 00:00:00" and "' + dateSearch + ' 23:59:59" order by ' + typeSearch + ' DESC limit 0,500';
    return knex.raw(sql);
  }

  getByID(knex: Knex, idSeach: string, HospCode: string) {
    let sql = 'select * from `is` where id="' + idSeach + '" and hosp="' + HospCode + '" limit 0,1';
    return knex.raw(sql);
  }

  getByName(knex: Knex, typeSearch: string, valSearch: string, HospCode: string) {
    let sql: string;
    if (typeSearch == "name") {
      sql = 'select * from `is` where hosp="' + HospCode + '" and (name like "' + valSearch + '%" or fname like "%' + valSearch + '%") order by name,fname,adate DESC,hdate DESC limit 0,50';
    } else {
      sql = 'select * from `is` where hosp="' + HospCode + '" and ' + typeSearch + ' like "' + valSearch + '%" order by ' + typeSearch + ',adate DESC,hdate DESC limit 0,50';
    }
    return knex.raw(sql);
  }

  reportAgeGroup1(knex: Knex, date1: string, date2: string, HospCode: string) {
    let Sql = "SELECT CASE " +
      " WHEN age<1 and (month>0 or day>0) THEN '  น้อยกว่า 1 ปี' " +
      " WHEN age between 1 and 5 THEN ' 1-5' " +
      " WHEN age between 6 and 10 THEN ' 6-10' " +
      " WHEN age between 11 and 15 THEN '11-15' " +
      " WHEN age between 16 and 20 THEN '16-20' " +
      " WHEN age between 21 and 25 THEN '21-25' " +
      " WHEN age between 26 and 30 THEN '26-30' " +
      " WHEN age between 31 and 35 THEN '31-35' " +
      " WHEN age between 36 and 40 THEN '36-40' " +
      " WHEN age between 41 and 45 THEN '41-45' " +
      " WHEN age between 46 and 50 THEN '46-50' " +
      " WHEN age between 51 and 55 THEN '51-55' " +
      " WHEN age between 56 and 60 THEN '56-60' " +
      " WHEN age between 61 and 65 THEN '61-65' " +
      " WHEN age between 66 and 70 THEN '66-70' " +
      " WHEN age between 71 and 75 THEN '71-75' " +
      " WHEN age between 76 and 80 THEN '76-80' " +
      " WHEN age>80 THEN 'มากกว่า 80' " +
      " ELSE 'อายุ error' " +
      " END AS agegroup, " +
      " count(1) as `cases`, sum(if(sex=1,1,0)) as male " +
      " ,sum(if(sex = 2, 1, 0)) as female, sum(if(sex in (1,2), 0, 1)) as sex_error " +
      " ,sum(if(staer=1,1,0)) as dba " +
      " ,sum(if(staer=6 and sex = 1,1,0)) as male_dead " +
      " ,sum(if(staer=6 and sex = 2,1,0)) as female_dead " +
      " FROM `is` " +
      " WHERE adate BETWEEN '" + date1 + "' AND '" + date2 + "' AND hosp='" + HospCode + "' " +
      " GROUP BY agegroup;";
    return knex.raw(Sql);
  }

  saveIs(knex: Knex, ref: number, arrData: IisStructure) {
    delete arrData['lastupdate'];
    if (ref > 0) {
      return knex('is').update(arrData)
        .where('ref', '=', ref);
    } else {
      return knex('is').insert(arrData, 'ref');
    }
  }

  saveMapPointIs(knex: Knex, arrData) {
    let isStruc = {
      lat: arrData.lat,
      lng: arrData.lng
    };
    return knex('is').update(isStruc)
      .where('ref', '=', arrData.accident);
  }

  saveMapPoint(knex: Knex, ref, arrData) {
    if (ref > 0) {
      return knex('accident_location').update(arrData)
        .where('id', '=', ref);
    } else {
      return knex('accident_location').insert(arrData, 'id');
    }
  }

  saveLib(knex: Knex, saveType: string, arrData) {
    if (saveType == 'UPDATE') {
      return knex('lib_code').update(arrData)
        .where('code', '=', arrData.code);
    } else {
      return knex('lib_code').insert(arrData, 'code');
    }
  }

  saveLibHosp(knex: Knex, saveType: string, arrData) {
    if (saveType == 'UPDATE') {
      return knex('lib_hosp').update(arrData)
        .where('hospcode', '=', arrData.hospcode)
        .andWhere('type','=',arrData.type)
        .andWhere('off_id','=',arrData.off_id);
    } else {
      return knex('lib_hosp').insert(arrData);
    }
  }

  save(knex: Knex, datas: any) {
    return knex('is')
      .insert(datas);
  }

  update(knex: Knex, isId: string, datas: any) {
    return knex('is')
      .where('id', isId)
      .update(datas);
  }

  detail(knex: Knex, isId: string) {
    return knex('id')
      .where('id', isId);
  }

  async remove(db: Knex, ref: number) {
    const exists = await db.schema.hasTable('is_deleted');
    if (!exists) {
      await this.createISDeleted(db);
    }

    const isData = await db('is').where('ref', ref);
    if (isData && isData.length) {
      await db('is_deleted').insert({
        is_id: isData[0].id,
        hcode: isData[0].hosp,
        date: moment().locale('th').format('YYYY-MM-DD HH:mm:ss')
      });
    }

    return db('is')
      .where('ref', ref)
      .del();
  }

  async createISDeleted(db: Knex) {
    // return db.schema.createTable('is_deleted', function (table) {
    //   table.increments('ref').unsigned();
    //   table.string('hcode', 5).notNullable();
    //   table.bigInteger('is_id').unsigned().notNullable();
    //   table.dateTime('date').defaultTo(db.fn.now()).notNullable();
    //   table.dateTime('deleted');
    //   table.timestamp('lastupdate').defaultTo(db.fn.now());
    // });

    const sql = `CREATE TABLE is_deleted (
      ref int(11) unsigned NOT NULL AUTO_INCREMENT,
      hcode varchar(5) DEFAULT NULL,
      is_id bigint(15) unsigned NOT NULL,
      date datetime DEFAULT CURRENT_TIMESTAMP,
      moph_deleted datetime DEFAULT NULL,
      inp_id varchar(15) DEFAULT NULL,
      lastupdate timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (ref),
      UNIQUE KEY is_id (hcode,is_id) USING BTREE,
      KEY date (date),
      KEY moph_deleted (moph_deleted)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`;

    return db.raw(sql);
  }
}
