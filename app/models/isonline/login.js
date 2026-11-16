"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsLoginModel = void 0;
const moment_1 = __importDefault(require("moment"));
class IsLoginModel {
    checkToken(knex, token) {
        let today = (0, moment_1.default)().locale('th').format('YYYY-MM-DD HH:mm:ss');
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
