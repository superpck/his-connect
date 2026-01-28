"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moph_refer_1 = require("../middleware/moph-refer");
const getMophConfig = async () => {
    return await (0, moph_refer_1.getHospitalConfig)();
};
exports.default = { getMophConfig };
