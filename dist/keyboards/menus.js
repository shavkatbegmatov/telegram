"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMainMenuKeyboard = getMainMenuKeyboard;
exports.getAdminReplyInlineKeyboard = getAdminReplyInlineKeyboard;
const grammy_1 = require("grammy");
function getMainMenuKeyboard() {
    return new grammy_1.Keyboard()
        .text("👤 Profile").text("⭐ Premium").row()
        .text("💬 Support").row()
        .resized();
}
function getAdminReplyInlineKeyboard(userChatId) {
    return new grammy_1.InlineKeyboard().text(`💬 Direct Reply to ID: ${userChatId}`, `admin_prompt_reply:${userChatId}`);
}
