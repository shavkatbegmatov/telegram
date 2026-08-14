# Telegram Support Bot

A lightweight, powerful, and secure Telegram Support & Helpdesk Bot built with **Node.js**, **TypeScript**, and **grammY**.

Any user can send text, photos, documents, or voice messages to the bot. The bot forwards the user's message to an Admin / Admin Group, where admins can reply directly to the forwarded message in Telegram to answer the user.

---

## Features

- **Automatic User Message Forwarding**: Messages sent to the bot by users are formatted with user metadata (Name, `@username`, User ID) and forwarded to the Admin chat.
- **Direct Telegram Replies**: Admins reply directly to the forwarded message in Telegram. The bot intercepts the reply and delivers it to the target user.
- **Support for Media**: Supports text, photos, documents, videos, voice notes, stickers, and audio.
- **Manual Reply Command**: Admins can use `/reply <user_id> <message>` for direct messaging.
- **Persistent Ticket Mapping**: Admin Message ID to User Chat ID mappings are saved to `data/tickets.json`, so replies work across bot restarts.
- **Chat ID Helper**: Use `/id` or `/myid` to inspect your Telegram Chat ID.

---

## Setup Guide

### 1. Requirements
- Node.js 18+ and npm installed.
- A Telegram Bot Token from [@BotFather](https://t.me/BotFather).
- An Admin Telegram User ID or Group Chat ID.

---

### 2. Configuration (`.env`)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your `.env` variables:

```env
# Telegram Bot Token from @BotFather
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyZ

# Telegram Chat ID of the admin user or admin group
ADMIN_CHAT_ID=123456789

# Optional custom messages
WELCOME_MESSAGE="👋 Welcome to Support! Send us any question, feedback, or request and our team will get back to you shortly."
AUTO_REPLY_MESSAGE="✅ Your message has been received by our support team! We will reply to you as soon as possible."
```

> **How to find your ADMIN_CHAT_ID:**
> 1. Message [@userinfobot](https://t.me/userinfobot) or [@raw_data_bot](https://t.me/raw_data_bot) on Telegram to get your user ID.
> 2. Or launch this bot and send `/id` in your chat with the bot.

---

### 3. Installation & Local Development

Install dependencies:

```bash
npm install
```

Validate your configuration:

```bash
npm run validate
```

Start the bot in local development mode (with auto-reload):

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Start in production mode:

```bash
npm start
```

---

## Bot Commands

| Command | Allowed Users | Description |
| :--- | :--- | :--- |
| `/start` | Everyone | Welcome message & instructions |
| `/help` | Everyone | Help guide for submitting support messages |
| `/id` | Everyone | Returns caller's Telegram Chat ID |
| `/stats` | Admin Only | Displays total messages processed and unique users |
| `/reply <user_id> <text>` | Admin Only | Sends a direct support message to a specific user |

---

## How It Works

1. **User asks question**: User messages `@YourSupportBot`.
2. **Auto-reply**: User receives an automated confirmation message.
3. **Admin Alert**: Bot posts a card in `ADMIN_CHAT_ID` with sender info + copies the user's message.
4. **Admin Answers**: Admin right-clicks or long-presses the message in Telegram and taps **Reply**.
5. **Delivery**: The bot matches the reply and sends the response back to the user on Telegram.

---

## Deployment Instructions

### Option 1: Railway / Render / Fly.io (Recommended)
1. Push your repository to GitHub.
2. Create a new service on Railway or Render.
3. Set the build command: `npm run build`.
4. Set the start command: `npm start`.
5. Add `BOT_TOKEN` and `ADMIN_CHAT_ID` under Environment Variables.

### Option 2: VPS (Ubuntu / Debian + PM2)
1. Clone repository to your server.
2. Run `npm install` and `npm run build`.
3. Start process with PM2:
   ```bash
   pm2 start dist/index.js --name "support-bot"
   pm2 save
   ```

### Option 3: Docker
Build and run with Docker:
```bash
docker build -t support-bot .
docker run -d --name support-bot --env-file .env support-bot
```
