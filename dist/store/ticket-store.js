"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketStore = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class TicketStore {
    filePath;
    // Maps adminMessageId -> TicketMapping
    adminMsgToTicket = new Map();
    // Maps userChatId -> Array of TicketMappings
    userTickets = new Map();
    constructor(dataDir = path_1.default.join(process.cwd(), "data")) {
        if (!fs_1.default.existsSync(dataDir)) {
            fs_1.default.mkdirSync(dataDir, { recursive: true });
        }
        this.filePath = path_1.default.join(dataDir, "tickets.json");
        this.load();
    }
    load() {
        if (!fs_1.default.existsSync(this.filePath)) {
            return;
        }
        try {
            const raw = fs_1.default.readFileSync(this.filePath, "utf-8");
            const data = JSON.parse(raw);
            if (Array.isArray(data.mappings)) {
                for (const item of data.mappings) {
                    this.adminMsgToTicket.set(item.adminMsgId, item.mapping);
                    const existing = this.userTickets.get(item.mapping.userChatId) || [];
                    existing.push(item.mapping);
                    this.userTickets.set(item.mapping.userChatId, existing);
                }
            }
        }
        catch (err) {
            console.warn("⚠️ Could not parse existing tickets file, starting fresh.", err);
        }
    }
    save() {
        try {
            const mappings = [];
            for (const [adminMsgId, mapping] of this.adminMsgToTicket.entries()) {
                mappings.push({ adminMsgId, mapping });
            }
            fs_1.default.writeFileSync(this.filePath, JSON.stringify({ mappings, updatedAt: new Date().toISOString() }, null, 2), "utf-8");
        }
        catch (err) {
            console.error("❌ Failed to save tickets persistence file:", err);
        }
    }
    saveTicket(adminMessageId, mapping) {
        mapping.adminMessageId = adminMessageId;
        this.adminMsgToTicket.set(adminMessageId, mapping);
        const list = this.userTickets.get(mapping.userChatId) || [];
        list.push(mapping);
        this.userTickets.set(mapping.userChatId, list);
        this.save();
    }
    getTicketByAdminMessage(adminMessageId) {
        return this.adminMsgToTicket.get(adminMessageId);
    }
    getLastTicketByUser(userChatId) {
        const list = this.userTickets.get(userChatId);
        if (!list || list.length === 0)
            return undefined;
        return list[list.length - 1];
    }
    getTotalTicketsCount() {
        return this.adminMsgToTicket.size;
    }
    getUniqueUsersCount() {
        return this.userTickets.size;
    }
}
exports.TicketStore = TicketStore;
