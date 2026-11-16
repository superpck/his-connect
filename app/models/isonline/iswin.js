"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IswinModel = void 0;
const moment_1 = __importDefault(require("moment"));
const dbName = process.env.DB_NAME;
const defaultHCode = process.env.HOSPCODE;
class IswinModel {
    getVersion(db) {
        return db('version')
            .where({ id: 'IS' })
            .limit(1);
    }
    getTableName(knex) {
        return knex('information_schema.tables')
            .select('table_name')
            .where('TABLE_SCHEMA', '=', dbName);
    }
    getOffices(knex, HospCode, groupCode) {
        return knex('lib_hosp')
            .where('type', groupCode)
            .andWhere('hospcode', HospCode)
            .orderBy('off_id');
    }
    getLibs(knex, HospCode, groupCode) {
        return knex('lib_code')
            .where('hospcode', HospCode)
            .andWhereRaw('substr(`code`,1,2) = ?', [groupCode])
            .orderBy('code');
    }
    getLib(knex, HospCode, tableName, columnsName, textSearch) {
        return knex(tableName)
            .where(columnsName, textSearch)
            .andWhere('hospcode', HospCode)
            .orderBy(columnsName);
    }
    list(knex, limit = 50, offset = 0) {
        return knex('is').limit(limit).offset(offset);
    }
    getByDatet(knex, typeSearch, dateStart, dateEnd, HospCode) {
        if (dateStart.length < 13) {
            dateStart = dateStart + ' 00:00:00';
            dateEnd = dateEnd + ' 23:59:59';
        }
        return knex('is')
            .whereBetween(typeSearch, [dateStart, dateEnd])
            .where('hosp', HospCode)
            .orderBy(typeSearch, 'DESC');
    }
    async getByDate(db, typeDate, dateStart, dateEnd, HospCode = defaultHCode) {
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
    getByRef(knex, refSeach, HospCode) {
        return knex('is').where({ ref: refSeach, hosp: HospCode });
    }
    reportByDate(knex, typeDate, date1, date2, HospCode) {
        return knex('is')
            .whereBetween(typeDate, [date1 + ' 00:00:00', date2 + ' 23:59:59'])
            .andWhere('hosp', HospCode)
            .groupByRaw('substr(' + typeDate + ',1,10)')
            .orderBy(typeDate);
    }
    getByDatex(knex, typeSearch, dateSearch, HospCode) {
        return knex('is')
            .whereBetween(typeSearch, [dateSearch + ' 00:00:00', dateSearch + ' 23:59:59'])
            .andWhere('hosp', HospCode)
            .orderBy(typeSearch, 'DESC')
            .limit(500);
    }
    getByID(knex, idSeach, HospCode) {
        return knex('is')
            .where('id', idSeach)
            .andWhere('hosp', HospCode)
            .limit(1);
    }
    getByName(knex, typeSearch, valSearch, HospCode) {
        if (typeSearch == "name") {
            return knex('is')
                .where('hosp', HospCode)
                .andWhere(function () {
                this.where('name', 'like', valSearch + '%')
                    .orWhere('fname', 'like', '%' + valSearch + '%');
            })
                .orderBy([{ column: 'name', order: 'asc' }, { column: 'fname', order: 'asc' }, { column: 'adate', order: 'desc' }, { column: 'hdate', order: 'desc' }])
                .limit(50);
        }
        else {
            return knex('is')
                .where('hosp', HospCode)
                .andWhere(typeSearch, 'like', valSearch + '%')
                .orderBy([{ column: typeSearch, order: 'asc' }, { column: 'adate', order: 'desc' }, { column: 'hdate', order: 'desc' }])
                .limit(50);
        }
    }
    reportAgeGroup1(knex, date1, date2, HospCode) {
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
            " WHERE adate BETWEEN ? AND ? AND hosp=? " +
            " GROUP BY agegroup;";
        return knex.raw(Sql, [date1, date2, HospCode]);
    }
    saveIs(knex, ref, arrData) {
        delete arrData['lastupdate'];
        if (ref > 0) {
            return knex('is').update(arrData)
                .where('ref', '=', ref);
        }
        else {
            return knex('is').insert(arrData, 'ref');
        }
    }
    saveMapPointIs(knex, arrData) {
        let isStruc = {
            lat: arrData.lat,
            lng: arrData.lng
        };
        return knex('is').update(isStruc)
            .where('ref', '=', arrData.accident);
    }
    saveMapPoint(knex, ref, arrData) {
        if (ref > 0) {
            return knex('accident_location').update(arrData)
                .where('id', '=', ref);
        }
        else {
            return knex('accident_location').insert(arrData, 'id');
        }
    }
    saveLib(knex, saveType, arrData) {
        if (saveType == 'UPDATE') {
            return knex('lib_code').update(arrData)
                .where('code', '=', arrData.code);
        }
        else {
            return knex('lib_code').insert(arrData, 'code');
        }
    }
    saveLibHosp(knex, saveType, arrData) {
        if (saveType == 'UPDATE') {
            return knex('lib_hosp').update(arrData)
                .where('hospcode', '=', arrData.hospcode)
                .andWhere('type', '=', arrData.type)
                .andWhere('off_id', '=', arrData.off_id);
        }
        else {
            return knex('lib_hosp').insert(arrData);
        }
    }
    save(knex, datas) {
        return knex('is')
            .insert(datas);
    }
    update(knex, isId, datas) {
        return knex('is')
            .where('id', isId)
            .update(datas);
    }
    detail(knex, isId) {
        return knex('is')
            .where('id', isId);
    }
    async remove(db, ref) {
        const exists = await db.schema.hasTable('is_deleted');
        if (!exists) {
            await this.createISDeleted(db);
        }
        const isData = await db('is').where('ref', ref);
        if (isData && isData.length) {
            await db('is_deleted').insert({
                is_id: isData[0].id,
                hcode: isData[0].hosp,
                date: (0, moment_1.default)().locale('th').format('YYYY-MM-DD HH:mm:ss')
            });
        }
        return db('is')
            .where('ref', ref)
            .del();
    }
    async createISDeleted(db) {
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
exports.IswinModel = IswinModel;
