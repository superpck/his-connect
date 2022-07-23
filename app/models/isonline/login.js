"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsLoginModel = void 0;
const moment = require("moment");
const dbName = process.env.DB_NAME;
class IsLoginModel {
    doLogin(knex, username, password) {
        return knex('is_user')
            .leftJoin('lib_hospcode', 'hcode', 'off_id')
            .select('is_user.*', 'lib_hospcode.name as hospname', 'lib_hospcode.changwatcode as hospprov')
            .where({
            username: username,
            sha: password
        })
            .limit(1);
    }
    checkToken(knex, token) {
        let today = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
        return knex('is_token as token')
            .leftJoin('is_user as user', 'token.uid', 'user.id')
            .select('user.id as uid', 'token.token', 'token.created_at', 'token.expire', 'token.type', 'user.hcode', 'user.prename', 'user.fname', 'user.lname', 'user.position', 'user.position_level', 'user.user_level', 'user.department')
            .where('token', '=', token)
            .where('expire', '>', today);
    }
    saveToken(knex, tokenInfo) {
        return knex('is_token')
            .insert(tokenInfo);
    }
}
exports.IsLoginModel = IsLoginModel;
