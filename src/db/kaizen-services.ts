import type { SupabaseClient } from "@supabase/supabase-js"

export interface Profile {
  id: string
  username: string
  full_name?: string
  level: number
  xp: number
  streak: number
  kaizen_score: number
  league: string
  telegram_chat_id?: number
  telegram_username?: string
  notify_high_priority_mins?: number
  notify_medium_priority_mins?: number
  notify_low_priority_mins?: number
}

export interface Task {
  id: string
  user_id: string
  title: string
  description?: string
  priority: "low" | "medium" | "high"
  difficulty: "tiny" | "easy" | "medium" | "hard" | "epic"
  status: "pending" | "in_progress" | "completed" | "cancelled"
  deadline?: string
  xp_reward: number
  completed_at?: string
  notified_before_deadline?: boolean
}

export interface Goal {
  id: string
  title: string
  category?: string
  priority: string
  status: string
  progress: number
  target_value: number
  unit?: string
}

export interface Habit {
  id: string
  title: string
  streak: number
  xp_reward: number
  active: boolean
  is_completed_today?: boolean
}

export class KaizenService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Link a Telegram user chat ID to a Kaizen profile via single-use token
   */
  async linkAccountByToken(chatId: number, username: string | undefined, token: string) {
    const cleanToken = token.trim().toUpperCase()

    const { data: tokenData, error: tokenErr } = await this.supabase
      .from("telegram_link_tokens")
      .select("*, user_id")
      .eq("token", cleanToken)
      .single()

    if (tokenErr || !tokenData) {
      return { success: false, error: "Invalid link code. Please generate a new code in Kaizen Settings." }
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      await this.supabase.from("telegram_link_tokens").delete().eq("id", tokenData.id)
      return { success: false, error: "Link code expired. Please generate a new code in Kaizen Settings." }
    }

    const userId = tokenData.user_id

    const { data: profile, error: updateErr } = await this.supabase
      .from("profiles")
      .update({
        telegram_chat_id: chatId,
        telegram_username: username || null,
      })
      .eq("id", userId)
      .select()
      .single()

    if (updateErr) {
      return { success: false, error: "Failed to update profile: " + updateErr.message }
    }

    await this.supabase.from("telegram_link_tokens").delete().eq("id", tokenData.id)

    return { success: true, profile: profile as Profile }
  }

  /**
   * Get user profile by Telegram Chat ID
   */
  async getProfileByChatId(chatId: number): Promise<Profile | null> {
    const { data } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("telegram_chat_id", chatId)
      .single()

    return (data as Profile) || null
  }

  /**
   * Update notification lead times from Telegram
   */
  async updateNotificationSettings(
    chatId: number,
    settings: {
      notify_high_priority_mins?: number
      notify_medium_priority_mins?: number
      notify_low_priority_mins?: number
    }
  ) {
    const { data, error } = await this.supabase
      .from("profiles")
      .update(settings)
      .eq("telegram_chat_id", chatId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as Profile
  }

  /**
   * Get user's active/pending tasks
   */
  async getTodayTasks(userId: string): Promise<Task[]> {
    const { data } = await this.supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["pending", "in_progress"])
      .order("deadline", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(10)

    return (data as Task[]) || []
  }

  /**
   * Quick create a task
   */
  async createQuickTask(userId: string, title: string): Promise<Task> {
    const { data, error } = await this.supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title,
        priority: "medium",
        difficulty: "easy",
        xp_reward: 10,
        status: "pending",
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as Task
  }

  /**
   * Complete a task & award XP via add_xp RPC
   */
  async completeTask(userId: string, taskId: string): Promise<{ task: Task; xpAwarded: number }> {
    const { data: task } = await this.supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", userId)
      .single()

    if (!task) throw new Error("Task not found")

    const xpAmount = task.xp_reward || 10

    await this.supabase
      .from("tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", taskId)

    await this.supabase.rpc("add_xp", {
      p_user_id: userId,
      p_amount: xpAmount,
      p_source: "task",
      p_source_id: taskId,
      p_description: `Completed task via Telegram: ${task.title}`,
    })

    return { task: task as Task, xpAwarded: xpAmount }
  }

  /**
   * Get active goals
   */
  async getActiveGoals(userId: string): Promise<Goal[]> {
    const { data } = await this.supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5)

    return (data as Goal[]) || []
  }

  /**
   * Get habits with today's completion status
   */
  async getHabitsWithTodayStatus(userId: string): Promise<Habit[]> {
    const todayStr = new Date().toISOString().split("T")[0]

    const { data: habits } = await this.supabase
      .from("habits")
      .select("*, habit_completions(*)")
      .eq("user_id", userId)
      .eq("active", true)
      .order("created_at", { ascending: false })

    if (!habits) return []

    return habits.map((h: any) => ({
      id: h.id,
      title: h.title,
      streak: h.streak,
      xp_reward: h.xp_reward,
      active: h.active,
      is_completed_today: h.habit_completions?.some((c: any) => c.completed_date === todayStr),
    }))
  }

  /**
   * Log habit completion
   */
  async logHabitCompletion(userId: string, habitId: string): Promise<{ xpAwarded: number }> {
    const todayStr = new Date().toISOString().split("T")[0]

    const { data: habit } = await this.supabase
      .from("habits")
      .select("*")
      .eq("id", habitId)
      .single()

    if (!habit) throw new Error("Habit not found")

    await this.supabase.from("habit_completions").insert({
      habit_id: habitId,
      user_id: userId,
      completed_date: todayStr,
    })

    const xpAmount = habit.xp_reward || 5

    await this.supabase.rpc("add_xp", {
      p_user_id: userId,
      p_amount: xpAmount,
      p_source: "habit",
      p_source_id: habitId,
      p_description: `Logged habit via Telegram: ${habit.title}`,
    })

    return { xpAwarded: xpAmount }
  }

  /**
   * Get weekly review summary
   */
  async getWeeklySummary(userId: string) {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)

    const weekStartStr = weekStart.toISOString()

    const [{ data: tasksCompleted }, { data: xpEarned }] = await Promise.all([
      this.supabase
        .from("tasks")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("completed_at", weekStartStr),
      this.supabase
        .from("xp_transactions")
        .select("amount")
        .eq("user_id", userId)
        .gte("created_at", weekStartStr),
    ])

    const totalXp = xpEarned?.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0) || 0

    return {
      tasksCompletedCount: tasksCompleted?.length || 0,
      xpEarnedThisWeek: totalXp,
    }
  }

  /**
   * Query expiring tasks dynamically based on user's priority lead time preference!
   */
  async getExpiringTasksForNotification(): Promise<Array<{ task: Task; profile: Profile; leadTimeMins: number }>> {
    const now = new Date()
    const nowIso = now.toISOString()

    // Fetch pending tasks with a future deadline
    const { data: tasks, error } = await this.supabase
      .from("tasks")
      .select("*, profiles!inner(*)")
      .in("status", ["pending", "in_progress"])
      .gt("deadline", nowIso)
      .or("notified_before_deadline.is.null,notified_before_deadline.eq.false")

    if (error || !tasks) return []

    const results: Array<{ task: Task; profile: Profile; leadTimeMins: number }> = []

    for (const t of tasks as any[]) {
      const profile = t.profiles as Profile
      if (!profile || !profile.telegram_chat_id) continue

      // Determine lead time based on task priority
      const priority = (t.priority || "medium").toLowerCase()
      let leadTimeMins = 60 // default 1h

      if (priority === "high") {
        leadTimeMins = profile.notify_high_priority_mins ?? 120
      } else if (priority === "medium") {
        leadTimeMins = profile.notify_medium_priority_mins ?? 60
      } else if (priority === "low") {
        leadTimeMins = profile.notify_low_priority_mins ?? 30
      }

      const deadlineTime = new Date(t.deadline).getTime()
      const notifyTargetTime = deadlineTime - leadTimeMins * 60 * 1000

      // If current time is within or past the notice window (up to deadline)
      if (now.getTime() >= notifyTargetTime && now.getTime() < deadlineTime) {
        results.push({
          task: t as Task,
          profile,
          leadTimeMins,
        })
      }
    }

    return results
  }

  /**
   * Mark task as notified
   */
  async markTaskNotified(taskId: string) {
    await this.supabase
      .from("tasks")
      .update({
        notified_before_deadline: true,
        notified_at: new Date().toISOString(),
      })
      .eq("id", taskId)
  }
}
