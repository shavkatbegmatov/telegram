import fs from "fs"
import path from "path"

export interface TicketMapping {
  userChatId: number
  userMessageId: number
  userName: string
  userHandle?: string
  timestamp: number
  adminMessageId?: number
}

export class TicketStore {
  private filePath: string
  // Maps adminMessageId -> TicketMapping
  private adminMsgToTicket: Map<number, TicketMapping> = new Map()
  // Maps userChatId -> Array of TicketMappings
  private userTickets: Map<number, TicketMapping[]> = new Map()

  constructor(dataDir = path.join(process.cwd(), "data")) {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    this.filePath = path.join(dataDir, "tickets.json")
    this.load()
  }

  private load(): void {
    if (!fs.existsSync(this.filePath)) {
      return
    }
    try {
      const raw = fs.readFileSync(this.filePath, "utf-8")
      const data = JSON.parse(raw) as {
        mappings: Array<{ adminMsgId: number; mapping: TicketMapping }>
      }
      if (Array.isArray(data.mappings)) {
        for (const item of data.mappings) {
          this.adminMsgToTicket.set(item.adminMsgId, item.mapping)
          const existing = this.userTickets.get(item.mapping.userChatId) || []
          existing.push(item.mapping)
          this.userTickets.set(item.mapping.userChatId, existing)
        }
      }
    } catch (err) {
      console.warn("⚠️ Could not parse existing tickets file, starting fresh.", err)
    }
  }

  private save(): void {
    try {
      const mappings: Array<{ adminMsgId: number; mapping: TicketMapping }> = []
      for (const [adminMsgId, mapping] of this.adminMsgToTicket.entries()) {
        mappings.push({ adminMsgId, mapping })
      }
      fs.writeFileSync(
        this.filePath,
        JSON.stringify({ mappings, updatedAt: new Date().toISOString() }, null, 2),
        "utf-8"
      )
    } catch (err) {
      console.error("❌ Failed to save tickets persistence file:", err)
    }
  }

  public saveTicket(adminMessageId: number, mapping: TicketMapping): void {
    mapping.adminMessageId = adminMessageId
    this.adminMsgToTicket.set(adminMessageId, mapping)

    const list = this.userTickets.get(mapping.userChatId) || []
    list.push(mapping)
    this.userTickets.set(mapping.userChatId, list)

    this.save()
  }

  public getTicketByAdminMessage(adminMessageId: number): TicketMapping | undefined {
    return this.adminMsgToTicket.get(adminMessageId)
  }

  public getLastTicketByUser(userChatId: number): TicketMapping | undefined {
    const list = this.userTickets.get(userChatId)
    if (!list || list.length === 0) return undefined
    return list[list.length - 1]
  }

  public getTotalTicketsCount(): number {
    return this.adminMsgToTicket.size
  }

  public getUniqueUsersCount(): number {
    return this.userTickets.size
  }
}
