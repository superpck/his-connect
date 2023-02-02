"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsUserModel = void 0;
const moment = require("moment");
class IsUserModel {
    list(knex, id) {
        if (id > 0) {
            return knex('is_user')
                .where({ id })
                .orderBy('fname');
        }
        else {
            return knex('is_user')
                .orderBy('fname');
        }
    }
    selectSql(knex, tableName, selectText, whereText, groupBy, orderBy) {
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
        sql = sql + ' limit 0,500';
        return knex.raw(sql);
    }
    getByID(knex, userID) {
        return knex('is_user')
            .where('id', userID)
            .orderBy('fname', 'lname');
    }
    getByUserName(knex, userName) {
        return knex('is_user')
            .where('username', userName)
            .orderBy('fname', 'lname');
    }
    getByName(knex, typeSearch, valSearch, HospCode) {
        let sql;
        if (typeSearch == "fname") {
            sql = 'select * from is_user where fname like "' + valSearch + '%" order by fname,lname limit 0,50';
        }
        else {
            sql = 'select * from is_user where lname like "' + valSearch + '%" order by fname,lname limit 0,50';
        }
        return knex.raw(sql);
    }
    saveUser(knex, id, arrData) {
        arrData.updated_at = moment().format('x');
        if (id > 0) {
            return knex('is_user').update(arrData)
                .where('id', '=', id);
        }
        else {
            arrData.created_at = moment().format('x');
            return knex('is_user').insert(arrData, 'id');
        }
    }
    remove(knex, id) {
        return knex('is_user')
            .where('id', id)
            .del();
    }
}
exports.IsUserModel = IsUserModel;
