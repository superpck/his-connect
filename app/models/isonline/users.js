"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsUserModel = void 0;
class IsUserModel {
    list(knex, id) {
        if (id > 0) {
            console.log(knex('is_user')
                .where('id', '=', id)
                .orderBy('fname')
                .toString());
            return knex('is_user')
                .where('id', '=', id)
                .orderBy('fname');
        }
        else {
            console.log(knex('is_user')
                .orderBy('fname')
                .toString());
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
        console.log(sql);
        return knex.raw(sql);
    }
    getByID(knex, userID) {
        return knex
            .select('*')
            .from('is_user')
            .where('id', userID)
            .orderBy('fname', 'lname');
    }
    getByUserName(knex, userName) {
        return knex
            .select('*')
            .from('is_user')
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
        if (id > 0) {
            return knex('is_user').update(arrData)
                .where('id', '=', id);
        }
        else {
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
