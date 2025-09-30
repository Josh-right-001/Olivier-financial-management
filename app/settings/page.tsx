"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { clearSession } from "@/lib/session"
import { createBrowserClient } from "@/lib/supabase/client"
import { Trash2, Database, TrendingUp, Activity } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const { toast } = useToast()
  const [dbStats, setDbStats] = useState({
    transactions: 0,
    employees: 0,
    inventory: 0,
    fuel: 0,
    debts: 0,
    total: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDatabaseStats()
  }, [])

  const loadDatabaseStats = async () => {
    const supabase = createBrowserClient()

    const [transactions, employees, inventory, fuel, debts] = await Promise.all([
      supabase.from("transactions").select("*", { count: "exact", head: true }),
      supabase.from("employees").select("*", { count: "exact", head: true }),
      supabase.from("inventory").select("*", { count: "exact", head: true }),
      supabase.from("fuel_log").select("*", { count: "exact", head: true }),
      supabase.from("debts").select("*", { count: "exact", head: true }),
    ])

    const stats = {
      transactions: transactions.count || 0,
      employees: employees.count || 0,
      inventory: inventory.count || 0,
      fuel: fuel.count || 0,
      debts: debts.count || 0,
      total:
        (transactions.count || 0) +
        (employees.count || 0) +
        (inventory.count || 0) +
        (fuel.count || 0) +
        (debts.count || 0),
    }

    setDbStats(stats)
    setLoading(false)
  }

  const handleClearSession = () => {
    clearSession()
    toast({
      title: "Session effacée",
      description: "Rechargez la page pour créer une nouvelle session",
    })
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Paramètres" description="Configurer l'application" />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Base de Données
            </CardTitle>
            <CardDescription>Statistiques et évolution des enregistrements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Activity className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p className="text-2xl font-bold">{dbStats.transactions}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Personnel</p>
                    <p className="text-2xl font-bold">{dbStats.employees}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Inventaire</p>
                    <p className="text-2xl font-bold">{dbStats.inventory}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Mazout</p>
                    <p className="text-2xl font-bold">{dbStats.fuel}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Dettes</p>
                    <p className="text-2xl font-bold">{dbStats.debts}</p>
                  </div>
                  <div className="rounded-lg border bg-primary/5 p-4">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-primary">{dbStats.total}</p>
                  </div>
                </div>

                <Link href="/analytics">
                  <Button className="w-full gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Voir l'évolution détaillée
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>Gérer votre session locale</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleClearSession} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Effacer la session
            </Button>
            <p className="mt-2 text-sm text-muted-foreground">
              Cela créera une nouvelle session et vous perdrez l'accès aux données actuelles
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
