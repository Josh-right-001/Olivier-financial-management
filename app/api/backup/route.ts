import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch all data for this session
    const [transactions, employees, inventory, fuelLogs, debts] = await Promise.all([
      supabase.from("transactions").select("*").eq("session_id", sessionId),
      supabase.from("employees").select("*").eq("session_id", sessionId),
      supabase.from("inventory").select("*").eq("session_id", sessionId),
      supabase.from("fuel_log").select("*").eq("session_id", sessionId),
      supabase.from("debts").select("*").eq("session_id", sessionId),
    ])

    const backup = {
      sessionId,
      timestamp: new Date().toISOString(),
      data: {
        transactions: transactions.data || [],
        employees: employees.data || [],
        inventory: inventory.data || [],
        fuelLogs: fuelLogs.data || [],
        debts: debts.data || [],
      },
    }

    return NextResponse.json(backup)
  } catch (error) {
    console.error("[v0] Backup error:", error)
    return NextResponse.json({ error: "Failed to create backup" }, { status: 500 })
  }
}
