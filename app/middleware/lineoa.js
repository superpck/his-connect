"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const sendLineOAMessage = async (lineID, content, type = 'flex') => {
    if (content && lineID) {
        return await push(lineID, content, type).then((response) => {
            return response;
        });
    }
    else {
        return false;
    }
};
const push = async (lineID, contents, type = 'flex') => {
    const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message';
    const LINE_HEADER = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`
    };
    let messages;
    if (type == 'flex') {
        messages = [{ type, altText: 'KKH message', contents }];
    }
    else {
        messages = [{ type: 'text', text: contents }];
    }
    const body = { to: lineID, messages };
    const option = {
        method: `POST`,
        url: `${LINE_MESSAGING_API}/push`,
        headers: LINE_HEADER,
        data: body
    };
    try {
        const response = await (0, axios_1.default)(option);
        return response;
    }
    catch (error) {
        console.log('push Line Message error:', lineID, error.status, error.message || error);
        return error;
    }
};
module.exports = { sendLineOAMessage };
