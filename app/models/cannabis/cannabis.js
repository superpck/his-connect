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
exports.CannabisModel = void 0;
const maxLimit = 2500;
const dbName = process.env.CANNABIS_DB_NAME;
class CannabisModel {
    testConnection(db) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db(dbName + '.ccd_person')
                .select('hospcode', 'hn')
                .limit(1);
        });
    }
    searchPatient(db, cid) {
        return __awaiter(this, void 0, void 0, function* () {
            return db(dbName + '.ccd_person')
                .where('cid', cid)
                .limit(1);
        });
    }
    searchVisit(db, hn, startDate = null, endDate = null) {
        return __awaiter(this, void 0, void 0, function* () {
            let where = `ccd_opd_visit.hn='${hn}'`;
            if (startDate && endDate) {
                where = ` and ccd_opd_visit.vstdate between '${startDate}' and '${endDate}'  `;
            }
            return db(dbName + '.ccd_opd_visit')
                .innerJoin(dbName + '.ccd_person', 'ccd_opd_visit.hn', 'ccd_person.hn')
                .select('ccd_opd_visit.*', 'ccd_person.prename', 'ccd_person.fname', 'ccd_person.lname', 'ccd_person.birthday', 'ccd_person.sex', 'ccd_person.address_id', 'ccd_person.mobile')
                .where(db.raw(where))
                .orderByRaw('ccd_opd_visit.vstdate DESC, ccd_opd_visit.vsttime DESC')
                .limit(10);
        });
    }
    patientInfo(db, hn) {
        return __awaiter(this, void 0, void 0, function* () {
            return db(dbName + '.ccd_person')
                .where('hn', hn)
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
exports.CannabisModel = CannabisModel;
