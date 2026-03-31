"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moph_refer_1 = require("../middleware/moph-refer");
const getMophConfig = async (options = {}) => {
    return await (0, moph_refer_1.getHospitalConfig)(options);
};
exports.default = { getMophConfig };
