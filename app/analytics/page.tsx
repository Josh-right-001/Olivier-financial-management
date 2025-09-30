"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createBrowserClient } from "@/lib/supabase/client"
import { TrendingUp, Activity, Database } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface EvolutionData {
  date: string
  transactions: number
  employees: number
  inventory: number
  fuel: number
  debts: number
}

export default function AnalyticsPage() {
  const [evolutionData, setEvolutionData] = useState<EvolutionData[]>([])
  const [stats, setStats] = useState({
    totalRecords: 0,
    weeklyGrowth: 0,
    monthlyGrowth: 0,
    mostActiveTable: "",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    const supabase = createBrowserClient()

    // Get counts for each table
    const [transactions, employees, inventory, fuel, debts] = await Promise.all([
      supabase.from("transactions").select("*", { count: "exact", head: true }),
      supabase.from("employees").select("*", { count: "exact", head: true }),
      supabase.from("inventory").select("*", { count: "exact", head: true }),
      supabase.from("fuel_log").select("*", { count: "exact", head: true }),
      supabase.from("debts").select("*", { count: "exact", head: true }),
    ])

    const totalRecords =
      (transactions.count || 0) +
      (employees.count || 0) +
      (inventory.count || 0) +
      (fuel.count || 0) +
      (debts.count || 0)

    // Get evolution data (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split("T")[0]
    })

    const evolutionPromises = last7Days.map(async (date) => {
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      const nextDateStr = nextDate.toISOString().split("T")[0]

      const [t, e, inv, f, d] = await Promise.all([
        supabase
          .from("transactions")
          .select("*", { count: "exact", head: true })
          .gte("created_at", date)
          .lt("created_at", nextDateStr),
        supabase
          .from("employees")
          .select("*", { count: "exact", head: true })
          .gte("created_at", date)
          .lt("created_at", nextDateStr),
        supabase
          .from("inventory")
          .select("*", { count: "exact", head: true })
          .gte("created_at", date)
          .lt("created_at", nextDateStr),
        supabase
          .from("fuel_log")
          .select("*", { count: "exact", head: true })
          .gte("created_at", date)
          .lt("created_at", nextDateStr),
        supabase
          .from("debts")
          .select("*", { count: "exact", head: true })
          .gte("created_at", date)
          .lt("created_at", nextDateStr),
      ])

      return {
        date: new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
        transactions: t.count || 0,
        employees: e.count || 0,
        inventory: inv.count || 0,
        fuel: f.count || 0,
        debts: d.count || 0,
      }
    })

    const evolution = await Promise.all(evolutionPromises)
    setEvolutionData(evolution)

    // Calculate growth
    const weeklyGrowth = evolution.reduce(
      (sum, day) => sum + day.transactions + day.employees + day.inventory + day.fuel + day.debts,
      0,
    )

    // Find most active table
    const tableCounts = {
      Transactions: transactions.count || 0,
      Personnel: employees.count || 0,
      Inventaire: inventory.count || 0,
      Mazout: fuel.count || 0,
      Dettes: debts.count || 0,
    }
    const mostActive = Object.entries(tableCounts).sort((a, b) => b[1] - a[1])[0][0]

    setStats({
      totalRecords,
      weeklyGrowth,
      monthlyGrowth: weeklyGrowth * 4,
      mostActiveTable: mostActive,
    })

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <DashboardHeader title="Évolution" description="Analyse de la croissance des données" />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <Activity className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Évolution Dashboard" description="Suivi de la croissance de la base de données" />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enregistrements</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRecords}</div>
              <p className="text-xs text-muted-foreground">Dans toutes les tables</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Croissance Hebdomadaire</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">+{stats.weeklyGrowth}</div>
              <p className="text-xs text-muted-foreground">Derniers 7 jours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projection Mensuelle</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">+{stats.monthlyGrowth}</div>
              <p className="text-xs text-muted-foreground">Basé sur la tendance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Table la Plus Active</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mostActiveTable}</div>
              <p className="text-xs text-muted-foreground">Plus d'enregistrements</p>
            </CardContent>
          </Card>
        </div>

        {/* Evolution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des Enregistrements (7 derniers jours)</CardTitle>
            <CardDescription>Nombre de nouveaux enregistrements par jour et par table</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="transactions" stroke="#0B3B5A" name="Transactions" strokeWidth={2} />
                <Line type="monotone" dataKey="employees" stroke="#1F6F8B" name="Personnel" strokeWidth={2} />
                <Line type="monotone" dataKey="inventory" stroke="#7BC043" name="Inventaire" strokeWidth={2} />
                <Line type="monotone" dataKey="fuel" stroke="#F59E0B" name="Mazout" strokeWidth={2} />
                <Line type="monotone" dataKey="debts" stroke="#EF4444" name="Dettes" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution des Enregistrements par Table</CardTitle>
            <CardDescription>Répartition totale des données dans la base</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  {
                    name: "Tables",
                    Transactions: evolutionData.reduce((sum, d) => sum + d.transactions, 0),
                    Personnel: evolutionData.reduce((sum, d) => sum + d.employees, 0),
                    Inventaire: evolutionData.reduce((sum, d) => sum + d.inventory, 0),
                    Mazout: evolutionData.reduce((sum, d) => sum + d.fuel, 0),
                    Dettes: evolutionData.reduce((sum, d) => sum + d.debts, 0),
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Transactions" fill="#0B3B5A" />
                <Bar dataKey="Personnel" fill="#1F6F8B" />
                <Bar dataKey="Inventaire" fill="#7BC043" />
                <Bar dataKey="Mazout" fill="#F59E0B" />
                <Bar dataKey="Dettes" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
