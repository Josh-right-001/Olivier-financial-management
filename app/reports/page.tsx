"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Fuel,
  AlertTriangle,
} from "lucide-react"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface FinancialData {
  revenus: number
  depenses: number
  balance: number
  transactionsCount: number
}

interface MonthlyData {
  month: string
  revenus: number
  depenses: number
}

const COLORS = ["#0B3B5A", "#1F6F8B", "#7BC043", "#F59E0B", "#EF4444"]

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [financialData, setFinancialData] = useState<FinancialData>({
    revenus: 0,
    depenses: 0,
    balance: 0,
    transactionsCount: 0,
  })
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [stats, setStats] = useState({
    employees: 0,
    inventory: 0,
    fuel: 0,
    debts: 0,
  })

  useEffect(() => {
    loadReportData()
  }, [])

  const loadReportData = async () => {
    const supabase = createBrowserClient()

    // Get financial transactions
    const { data: transactions } = await supabase.from("transactions").select("*")

    let revenus = 0
    let depenses = 0

    transactions?.forEach((t) => {
      const amount = Number(t.montant) || 0
      if (t.type?.toLowerCase() === "revenu") {
        revenus += amount
      } else {
        depenses += amount
      }
    })

    setFinancialData({
      revenus,
      depenses,
      balance: revenus - depenses,
      transactionsCount: transactions?.length || 0,
    })

    // Get monthly data (last 6 months)
    const monthlyMap = new Map<string, { revenus: number; depenses: number }>()
    transactions?.forEach((t) => {
      const date = new Date(t.date || t.created_at)
      const monthKey = date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })
      const amount = Number(t.montant) || 0

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { revenus: 0, depenses: 0 })
      }

      const monthData = monthlyMap.get(monthKey)!
      if (t.type?.toLowerCase() === "revenu") {
        monthData.revenus += amount
      } else {
        monthData.depenses += amount
      }
    })

    const monthly = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .slice(-6)

    setMonthlyData(monthly)

    // Category breakdown
    const categoryMap = new Map<string, number>()
    transactions?.forEach((t) => {
      const category = t.type || "Autre"
      const amount = Number(t.montant) || 0
      categoryMap.set(category, (categoryMap.get(category) || 0) + amount)
    })

    const categories = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }))
    setCategoryData(categories)

    // Get other stats
    const [employees, inventory, fuel, debts] = await Promise.all([
      supabase.from("employees").select("*", { count: "exact", head: true }),
      supabase.from("inventory").select("*", { count: "exact", head: true }),
      supabase.from("fuel_log").select("*", { count: "exact", head: true }),
      supabase.from("debts").select("*", { count: "exact", head: true }),
    ])

    setStats({
      employees: employees.count || 0,
      inventory: inventory.count || 0,
      fuel: fuel.count || 0,
      debts: debts.count || 0,
    })

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <DashboardHeader title="Statistiques" description="Rapports et analyses" />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </main>
      </div>
    )
  }

  const balanceIsPositive = financialData.balance >= 0

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Statistiques & Rapports" description="Analyse détaillée des opérations" />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        {/* Financial Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">${financialData.revenus.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Entrées d'argent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dépenses Totales</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">${financialData.depenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Sorties d'argent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <DollarSign className={`h-4 w-4 ${balanceIsPositive ? "text-accent" : "text-destructive"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balanceIsPositive ? "text-accent" : "text-destructive"}`}>
                ${Math.abs(financialData.balance).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">{balanceIsPositive ? "Bénéfice" : "Déficit"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{financialData.transactionsCount}</div>
              <p className="text-xs text-muted-foreground">Opérations enregistrées</p>
            </CardContent>
          </Card>
        </div>

        {/* Professional Analysis */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Analyse Professionnelle de la Situation Financière
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Situation Actuelle:</h4>
              <p className="text-sm leading-relaxed text-foreground">
                {balanceIsPositive ? (
                  <>
                    Votre entreprise affiche une <strong className="text-accent">santé financière positive</strong> avec
                    un bénéfice net de <strong>${Math.abs(financialData.balance).toLocaleString()}</strong>. Les revenus
                    de <strong>${financialData.revenus.toLocaleString()}</strong> dépassent les dépenses de{" "}
                    <strong>${financialData.depenses.toLocaleString()}</strong>, ce qui indique une gestion efficace des
                    ressources et une rentabilité opérationnelle satisfaisante.
                  </>
                ) : (
                  <>
                    Votre entreprise présente actuellement un <strong className="text-destructive">déficit</strong> de{" "}
                    <strong>${Math.abs(financialData.balance).toLocaleString()}</strong>. Les dépenses de{" "}
                    <strong>${financialData.depenses.toLocaleString()}</strong> excèdent les revenus de{" "}
                    <strong>${financialData.revenus.toLocaleString()}</strong>. Il est recommandé d'analyser les postes
                    de dépenses et d'optimiser les sources de revenus.
                  </>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Évolution et Tendances:</h4>
              <p className="text-sm leading-relaxed text-foreground">
                L'analyse des {monthlyData.length} derniers mois montre{" "}
                {monthlyData.length > 0 && monthlyData[monthlyData.length - 1].revenus > monthlyData[0]?.revenus ? (
                  <strong className="text-accent">une croissance des revenus</strong>
                ) : (
                  <strong className="text-destructive">une stabilisation ou baisse des revenus</strong>
                )}{" "}
                avec {financialData.transactionsCount} transactions enregistrées. Cette activité reflète le dynamisme
                opérationnel de votre entreprise. Le suivi régulier de ces indicateurs permet d'anticiper les besoins de
                trésorerie et d'ajuster la stratégie commerciale.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Recommandations Stratégiques:</h4>
              <ul className="space-y-1 text-sm text-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>
                    Maintenir un ratio revenus/dépenses supérieur à 1.2 pour assurer une marge de sécurité financière
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>Diversifier les sources de revenus pour réduire la dépendance à un seul canal</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>Optimiser les coûts opérationnels sans compromettre la qualité des services</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>
                    Constituer une réserve de trésorerie équivalente à 3-6 mois de dépenses pour faire face aux imprévus
                  </span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution Mensuelle des Revenus et Dépenses</CardTitle>
            <CardDescription>Comparaison des flux financiers sur les 6 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenus" stroke="#7BC043" strokeWidth={2} name="Revenus" />
                <Line type="monotone" dataKey="depenses" stroke="#EF4444" strokeWidth={2} name="Dépenses" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Répartition par Catégorie</CardTitle>
              <CardDescription>Distribution des montants par type de transaction</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={(entry) => entry.name}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Indicateurs Opérationnels</CardTitle>
              <CardDescription>Vue d'ensemble des ressources et obligations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm">Personnel</span>
                  </div>
                  <span className="text-lg font-bold">{stats.employees}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="text-sm">Articles en stock</span>
                  </div>
                  <span className="text-lg font-bold">{stats.inventory}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-primary" />
                    <span className="text-sm">Enregistrements mazout</span>
                  </div>
                  <span className="text-lg font-bold">{stats.fuel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm">Dettes actives</span>
                  </div>
                  <span className="text-lg font-bold text-destructive">{stats.debts}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle>Exporter les Rapports</CardTitle>
            <CardDescription>Télécharger les données pour analyse externe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Button variant="outline" className="gap-2 bg-transparent" disabled>
                <Download className="h-4 w-4" />
                Rapport PDF Complet
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent" disabled>
                <Download className="h-4 w-4" />
                Données Excel
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent" disabled>
                <Download className="h-4 w-4" />
                Graphiques PNG
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Fonctionnalité d'export disponible dans une prochaine version
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
