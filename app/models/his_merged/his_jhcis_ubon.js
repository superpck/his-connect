"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisJhcisUbonModel = void 0;
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
const dbName = process.env.HIS_DB_NAME;
const dbClient = process.env.HIS_DB_CLIENT;
class HisJhcisUbonModel {
    check() {
        return true;
    }
}
exports.HisJhcisUbonModel = HisJhcisUbonModel;
