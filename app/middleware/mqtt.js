"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mqtt = void 0;
const axios_1 = __importDefault(require("axios"));
const moph_refer_1 = require("./moph-refer");
const package_json_1 = require("../../package.json");
class Mqtt {
    constructor() {
        this.mqttSubscribe = async () => {
            const code = await this.getCode();
            if (!code) {
                return false;
            }
            try {
                const url = process.env.MQTT_url || 'https://connect.moph.go.th/api/mqtt';
                const options = {
                    url: `${url}/subscribe`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + this.token,
                        'content-encoding': 'gzip',
                    },
                    data: {
                        code: code
                    }
                };
                const { status, data } = await (0, axios_1.default)(options);
                if (data?.statusCode === 200) {
                }
                else {
                }
            }
            catch (error) {
            }
        };
    }
    async getCode() {
        try {
            if (!this.token) {
                const result = await (0, moph_refer_1.getReferToken)();
                this.token = result?.token || result || null;
            }
            if (!this.token) {
                return null;
            }
            const url = `${process.env.NREFER_API_URL || 'https://nrefer.moph.go.th/api/beta'}`;
            const options = {
                url: `${url}/create-access-code/HIS-CONNECT-MQTT?source=HIS-CONNECT&&version=${package_json_1.version}`,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.token,
                    'content-encoding': 'gzip',
                }
            };
            const { status, data } = await (0, axios_1.default)(options);
            if (data && (data?.statusCode || data?.status)) {
                return data?.code || null;
            }
            else {
                return null;
            }
        }
        catch (error) {
            throw error;
        }
    }
}
exports.Mqtt = Mqtt;
