"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PmkModel = void 0;
const maxLimit = 2500;
const dbName = process.env.CANNABIS_DB_NAME;
const hcode = process.env.HOSPCODE;
class PmkModel {
    testConnection(db) {
        return db('PATIENTS as p')
            .select(db.raw(`'${hcode}' AS "hospcode"`))
            .select('p.ID_CARD as cid', 'p.HN as hn', 'p.PRENAME as provis_pname', 'p.PRENAME as prename', 'p.NAME as fname', 'p.SURNAME as lname', 'p.BIRTHDAY as birthday')
            .select(db.raw(`case when p.SEX='F' then 2 else 1 end as sex`))
            .select('p.HOME as address', 'p.VILLAGE as moo', 'p.VILLANAME as village', 'p.ROAD as street', 'p.SOIMAIN as soi')
            .select(db.raw(`substr(p.TAMBON,1,2) as province_code`))
            .select(db.raw(`substr(p.TAMBON,3,2) as district_code`))
            .select(db.raw(`substr(p.TAMBON,5,2) as subdistrict_code`))
            .select('p.TAMBON as address_id', 'p.ZIP_CODE as zip', 'p.TEL as telephone', 'p.MOBILE as mobile', 'p.MAR_MARYSTATUS_ID as nhso_marriage_code', 'p.ETH_ETHNIC_ID as nation_code', 'p.ETH_ETHNIC_ID as citizenship', 'p.REL_RELIGION_ID as religion_code', 'p.WHO as informname', 'p.RELATION', 'p.WHO_PLACE as informtel', 'p.DRUG_ALLERGY_HX as drugallergy')
            .limit(1);
    }
    searchPatient(db, cid) {
        return db('PATIENTS as p')
            .select(db.raw(`'${hcode}' AS "hospcode"`))
            .select('p.ID_CARD as cid', 'p.HN as hn', 'p.PRENAME as provis_pname', 'p.PRENAME as prename', 'p.NAME as fname', 'p.SURNAME as lname', 'p.BIRTHDAY as birthday')
            .select(db.raw(`case when p.SEX='F' then 2 else 1 end as sex`))
            .select('p.HOME as address', 'p.VILLAGE as moo', 'p.VILLANAME as village', 'p.ROAD as street', 'p.SOIMAIN as soi')
            .select(db.raw(`substr(p.TAMBON,1,2) as province_code`))
            .select(db.raw(`substr(p.TAMBON,3,2) as district_code`))
            .select(db.raw(`substr(p.TAMBON,5,2) as subdistrict_code`))
            .select('p.TAMBON as address_id', 'p.ZIP_CODE as zip', 'p.TEL as telephone', 'p.MOBILE as mobile', 'p.MAR_MARYSTATUS_ID as nhso_marriage_code', 'p.ETH_ETHNIC_ID as nation_code', 'p.ETH_ETHNIC_ID as citizenship', 'p.REL_RELIGION_ID as religion_code', 'p.WHO as informname', 'p.RELATION', 'p.WHO_PLACE as informtel', 'p.DRUG_ALLERGY_HX as drugallergy')
            .where('p.ID_CARD', cid)
            .limit(1);
    }
    searchVisit(db, hn, startDate = null, endDate = null) {
        return __awaiter(this, void 0, void 0, function* () {
            let where = `o.hn='${hn}'`;
            if (startDate && endDate) {
                where = ` and o.vstdate between TO_DATE('${startDate}', 'YYYY-MM-DD HH24:MI:SS') and TO_DATE('${endDate}', 'YYYY-MM-DD HH24:MI:SS')`;
            }
            return db(`CCD_OPD_VISIT as o`)
                .innerJoin(db.raw('PATIENTS as p on o.PAT_RUN_HN=p.PAT_RUN_HN and o.PAT_YEAR_HN=p.PAT_YEAR_HN'))
                .select('o.*')
                .whereRaw(db.raw(where))
                .limit(maxLimit);
        });
    }
    patientInfo(db, hn) {
        return __awaiter(this, void 0, void 0, function* () {
            return db('PATIENTS as p')
                .select(db.raw(`'${hcode}' AS "hospcode"`))
                .select('p.ID_CARD as cid', 'p.HN as hn', 'p.PRENAME as provis_pname', 'p.PRENAME as prename', 'p.NAME as fname', 'p.SURNAME as lname', 'p.BIRTHDAY as birthday')
                .select(db.raw(`case when p.SEX='F' then 2 else 1 end as sex`))
                .select('p.HOME as address', 'p.VILLAGE as moo', 'p.VILLANAME as village', 'p.ROAD as street', 'p.SOIMAIN as soi')
                .select(db.raw(`substr(p.TAMBON,1,2) as province_code`))
                .select(db.raw(`substr(p.TAMBON,3,2) as district_code`))
                .select(db.raw(`substr(p.TAMBON,5,2) as subdistrict_code`))
                .select('p.TAMBON as address_id', 'p.ZIP_CODE as zip', 'p.TEL as telephone', 'p.MOBILE as mobile', 'p.MAR_MARYSTATUS_ID as nhso_marriage_code', 'p.ETH_ETHNIC_ID as nation_code', 'p.ETH_ETHNIC_ID as citizenship', 'p.REL_RELIGION_ID as religion_code', 'p.WHO as informname', 'p.RELATION', 'p.WHO_PLACE as informtel', 'p.DRUG_ALLERGY_HX as drugallergy')
                .where('p.HN', hn)
                .limit(1);
        });
    }
    getVisitLab(db, hn, vn) {
        return __awaiter(this, void 0, void 0, function* () {
            return db(dbName + '.ccd_lab_result')
                .where('hn', hn)
                .where('vn', vn)
                .limit(maxLimit);
        });
    }
    getVisitDrug(db, hn, vn) {
        return __awaiter(this, void 0, void 0, function* () {
            return db(dbName + '.ccd_dispense_items')
                .where('hn', hn)
                .where('vn', vn)
                .limit(maxLimit);
        });
    }
    getVisitAppointment(db, hn, vn) {
        return __awaiter(this, void 0, void 0, function* () {
            return db(dbName + '.ccd_appointment')
                .where('hn', hn)
                .where('vn', vn)
                .limit(maxLimit);
        });
    }
    getVisitDiagText(db, hn, vn) {
        return __awaiter(this, void 0, void 0, function* () {
            return db(dbName + '.ccd_opd_visit_diag_text')
                .where('hn', hn)
                .where('vn', vn)
                .limit(maxLimit);
        });
    }
    getVisitDiagnosis(db, hn, vn) {
        return __awaiter(this, void 0, void 0, function* () {
            return db(dbName + '.ccd_opd_visit_diag')
                .where('hn', hn)
                .where('vn', vn)
                .limit(maxLimit);
        });
    }
    getVisitProcedure(db, hn, vn) {
        return __awaiter(this, void 0, void 0, function* () {
            return db(dbName + '.ccd_opd_visit_procedure')
                .where('hn', hn)
                .where('vn', vn)
                .limit(maxLimit);
        });
    }
    getVisitScreening(db, hn, vn) {
        return __awaiter(this, void 0, void 0, function* () {
            return db(dbName + '.ccd_opd_visit_screen')
                .where('hn', hn)
                .where('vn', vn)
                .limit(maxLimit);
        });
    }
}
exports.PmkModel = PmkModel;
