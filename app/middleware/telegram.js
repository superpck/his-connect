"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTelegramMessage = void 0;
const axios_1 = require("axios");
const tokenList = {
    "group name": {
        botToken: "token1",
    }
};
const sendTelegramMessage = async (botID, message, parse_mode = "HTML") => {
    try {
        const chatToken = tokenList[botID];
        if (!chatToken) {
            console.error(`❌ Bot ID ${botID} not found.`);
            return 404;
        }
        const chat_id = chatToken.chatID ?? await getChatID(botID);
        if (!chat_id) {
            console.error(`❌ Could not determine chat ID for bot "${botID}"`);
            return 400;
        }
        const url = `https://api.telegram.org/bot${chatToken.botToken}/sendMessage`;
        await axios_1.default.post(url, {
            chat_id,
            parse_mode,
            text: message
        });
        console.log("📩 Message sent to Telegram group:", botID);
        return 200;
    }
    catch (error) {
        const errorMessage = error.message || (error.response?.data ? JSON.stringify(error.response.data) : "Unknown error");
        const statusCode = error.response?.status || 500;
        console.error(`❌ Error sending message to ${botID}:`, errorMessage);
        return statusCode;
    }
};
exports.sendTelegramMessage = sendTelegramMessage;
const getChatID = async (botID) => {
    const chatToken = tokenList[botID];
    if (!chatToken) {
        console.error(`❌ Bot ID "${botID}" not found in token list`);
        return undefined;
    }
    try {
        const response = await axios_1.default.get(`https://api.telegram.org/bot${chatToken.botToken}/getUpdates`);
        const results = response.data?.result || [];
        const validResults = results.filter((item) => item?.message?.message_id);
        return validResults.length > 0
            ? validResults[0].message?.chat?.id
            : chatToken.chatID;
    }
    catch (error) {
        console.error(`❌ Error getting chat ID for ${botID}:`, error.message || "Unknown error");
        return chatToken.chatID;
    }
};
