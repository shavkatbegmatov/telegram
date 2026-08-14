import { Composer } from "grammy"
import type { Config } from "../config.js"
import type { TicketStore } from "../store/ticket-store.js"

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export function setupAdminHandler(config: Config, ticketStore: TicketStore) {
  const composer = new Composer()

  composer.on("message", async (ctx) => {
    if (ctx.chat.id !== config.adminChatIdNumber) {
      return
    }

    const replyTo = ctx.message.reply_to_message

    if (replyTo) {
      const ticket = ticketStore.getTicketByAdminMessage(replyTo.message_id)

      if (ticket) {
        try {
          await ctx.api.sendMessage(
            ticket.userChatId,
            `💬 <b>Support Team Reply:</b>`,
            { parse_mode: "HTML" }
          )

          await ctx.api.copyMessage(
            ticket.userChatId,
            ctx.chat.id,
            ctx.message.message_id
          )

          await ctx.reply(
            `✅ Reply delivered to <b>${escapeHtml(ticket.userName)}</b> (<code>${ticket.userChatId}</code>)`,
            { parse_mode: "HTML", reply_parameters: { message_id: ctx.message.message_id } }
          )
          return
        } catch (err: any) {
          console.error("❌ Failed to deliver admin reply to user:", err)
          await ctx.reply(
            `❌ Could not send reply to user <code>${ticket.userChatId}</code>: ${escapeHtml(err.message)}`,
            { parse_mode: "HTML" }
          )
          return
        }
      } else {
        await ctx.reply(
          `⚠️ Could not find a linked support ticket for this message. If you want to send a manual message, use <code>/reply &lt;user_id&gt; &lt;text&gt;</code>.`,
          { parse_mode: "HTML" }
        )
        return
      }
    }

    if (ctx.message.text && !ctx.message.text.startsWith("/")) {
      await ctx.reply(
        `💡 <b>Tip:</b> Reply directly to a forwarded user message to send them an answer, or use <code>/reply &lt;user_id&gt; &lt;text&gt;</code>.`,
        { parse_mode: "HTML" }
      )
    }
  })

  return composer
}
