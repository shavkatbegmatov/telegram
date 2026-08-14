import { Keyboard, InlineKeyboard } from "grammy"

export function getMainMenuKeyboard() {
  return new Keyboard()
    .text("👤 Profile").text("⭐ Premium").row()
    .text("💬 Support").row()
    .resized()
}

export function getAdminReplyInlineKeyboard(userChatId: number) {
  return new InlineKeyboard().text(`💬 Direct Reply to ID: ${userChatId}`, `admin_prompt_reply:${userChatId}`)
}
