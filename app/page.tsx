"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { dbClient } from "@/lib/db-client"
import { DollarSign, TrendingUp, TrendingDown, Package, Users, AlertCircle } from "lucide-react"
import { LoadingScreen } from "@/components/loading-screen"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await dbClient.getDashboardStats()
        setStats(data)
      } catch (error) {
        console.error("[v0] Failed to load dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Tableau de bord" description="Vue d'ensemble de votre activité" />
      <main className="flex-1 space-y-6 p-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Solde"
            value={`$${stats?.balance?.toLocaleString() || 0}`}
            description="Revenus - Dépenses"
            icon={DollarSign}
          />
          <StatCard
            title="Revenus"
            value={`$${stats?.totalIncome?.toLocaleString() || 0}`}
            description="Total des entrées"
            icon={TrendingUp}
            className="border-l-4 border-l-accent"
          />
          <StatCard
            title="Dépenses"
            value={`$${stats?.totalExpenses?.toLocaleString() || 0}`}
            description="Total des sorties"
            icon={TrendingDown}
            className="border-l-4 border-l-destructive"
          />
          <StatCard
            title="Dettes"
            value={`$${stats?.totalDebts?.toLocaleString() || 0}`}
            description="Montant restant"
            icon={AlertCircle}
            className="border-l-4 border-l-secondary"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            title="Valeur Inventaire"
            value={`$${stats?.inventoryValue?.toLocaleString() || 0}`}
            description="Valeur totale du stock"
            icon={Package}
          />
          <StatCard
            title="Personnel Actif"
            value={stats?.activeEmployees || 0}
            description="Employés en service"
            icon={Users}
          />
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Transactions Récentes</CardTitle>
              <CardDescription>Les 5 dernières transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentTransactions?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentTransactions.map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium">{transaction.nom}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(transaction.date), "dd MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={transaction.type === "income" ? "default" : "destructive"}>
                          {transaction.type === "income" ? "Revenu" : "Dépense"}
                        </Badge>
                        <span
                          className={`font-bold ${transaction.type === "income" ? "text-accent" : "text-destructive"}`}
                        >
                          {transaction.type === "income" ? "+" : "-"}${Number(transaction.montant).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">Aucune transaction</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dettes en Retard</CardTitle>
              <CardDescription>Paiements en souffrance</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.overdueDebts?.length > 0 ? (
                <div className="space-y-3">
                  {stats.overdueDebts.map((debt: any) => (
                    <div key={debt.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium">{debt.nom_creancier}</p>
                        <p className="text-xs text-destructive">
                          Échéance: {format(new Date(debt.echeance), "dd MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      <span className="font-bold text-destructive">${Number(debt.reste).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">Aucune dette en retard</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
