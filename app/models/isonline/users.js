"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsUserModel = void 0;
const moment_1 = __importDefault(require("moment"));
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
        let query = knex(tableName).select(knex.raw(selectText));
        if (whereText != '') {
            query = query.whereRaw(whereText);
        }
        if (groupBy != '') {
            query = query.groupByRaw(groupBy);
        }
        if (orderBy != '') {
            query = query.orderByRaw(orderBy);
        }
        return query.limit(500);
    }
    getByID(knex, userID) {
        return knex('is_user')
            .where('id', userID)
            .orderBy('fname', 'lname');
    }
    getByUserName(knex, userName) {
        return knex('is_user').select('*')
            .where('username', userName)
            .orderBy('fname', 'lname');
    }
    getByName(db, typeSearch, valSearch, HospCode) {
        const column = typeSearch === "fname" ? 'fname' : 'lname';
        let query = db('is_user').select('*').
            where(column, 'LIKE', valSearch + '%');
        return query.orderBy('fname', 'lname').limit(50);
    }
    saveUser(knex, id, arrData) {
        arrData.updated_at = (0, moment_1.default)().format('x');
        if (id > 0) {
            return knex('is_user').update(arrData)
                .where('id', '=', id);
        }
        else {
            arrData.created_at = (0, moment_1.default)().format('x');
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
