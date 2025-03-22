import axios from "axios";

interface BotConfig {
  botToken: string;
  chatID?: string;
}

const tokenList: Record<string, BotConfig> = {
  "group name": {
    botToken: "token1",
  }
};

/**
 * Sends a message to a Telegram chat
 * @param botID The ID of the bot to use
 * @param message The message to send
 * @returns Status code of the operation
 */
export const sendTelegramMessage = async (botID: string, message: string, parse_mode: "HTML" | "TEXT" = "HTML"): Promise<number> => {
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

    await axios.post(url, {
      chat_id,
      parse_mode,
      text: message
    });

    console.log("📩 Message sent to Telegram group:", botID);
    return 200;
  } catch (error: any) {
    const errorMessage = error.message || (error.response?.data ? JSON.stringify(error.response.data) : "Unknown error");
    const statusCode = error.response?.status || 500;

    console.error(`❌ Error sending message to ${botID}:`, errorMessage);
    return statusCode;
  }
};

/**
 * Retrieves the chat ID for a given bot
 * @param botID The ID of the bot
 * @returns The chat ID or undefined if not found
 */
const getChatID = async (botID: string): Promise<string | undefined> => {
  const chatToken = tokenList[botID];

  if (!chatToken) {
    console.error(`❌ Bot ID "${botID}" not found in token list`);
    return undefined;
  }

  try {
    const response = await axios.get(`https://api.telegram.org/bot${chatToken.botToken}/getUpdates`);
    const results = response.data?.result || [];
    const validResults = results.filter((item: any) => item?.message?.message_id);

    return validResults.length > 0
      ? validResults[0].message?.chat?.id
      : chatToken.chatID;
  } catch (error: any) {
    console.error(`❌ Error getting chat ID for ${botID}:`, error.message || "Unknown error");
    return chatToken.chatID;
  }
};