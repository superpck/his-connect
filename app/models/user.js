"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
class UserModel {
    getUser(db) {
        return db('users').select('id', 'username', 'fullname');
    }
}
exports.UserModel = UserModel;
