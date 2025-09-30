"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { dbClient } from "@/lib/db-client"
import { exportToExcel } from "@/lib/excel-utils"
import { Download, FileSpreadsheet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const exportTypes = [
  { id: "transactions", title: "Transactions", description: "Exporter toutes les transactions" },
  { id: "employees", title: "Personnel", description: "Exporter tous les employés" },
  { id: "inventory", title: "Inventaire", description: "Exporter tout l'inventaire" },
  { id: "fuel", title: "Mazout", description: "Exporter les enregistrements de carburant" },
  { id: "debts", title: "Dettes", description: "Exporter toutes les dettes" },
  { id: "all", title: "Tout exporter", description: "Exporter toutes les données" },
]

export default function ExportPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const handleExport = async (type: string) => {
    setLoading(type)
    try {
      let data: any[] = []
      let filename = ""

      switch (type) {
        case "transactions":
          data = await dbClient.getTransactions()
          filename = "transactions.xlsx"
          break
        case "employees":
          data = await dbClient.getEmployees()
          filename = "employees.xlsx"
          break
        case "inventory":
          data = await dbClient.getInventory()
          filename = "inventory.xlsx"
          break
        case "fuel":
          data = await dbClient.getFuelLogs()
          filename = "fuel_log.xlsx"
          break
        case "debts":
          data = await dbClient.getDebts()
          filename = "debts.xlsx"
          break
        case "all":
          const [transactions, employees, inventory, fuel, debts] = await Promise.all([
            dbClient.getTransactions(),
            dbClient.getEmployees(),
            dbClient.getInventory(),
            dbClient.getFuelLogs(),
            dbClient.getDebts(),
          ])

          const workbook = {
            SheetNames: ["Transactions", "Employees", "Inventory", "Fuel", "Debts"],
            Sheets: {
              Transactions: (window as any).XLSX.utils.json_to_sheet(transactions),
              Employees: (window as any).XLSX.utils.json_to_sheet(employees),
              Inventory: (window as any).XLSX.utils.json_to_sheet(inventory),
              Fuel: (window as any).XLSX.utils.json_to_sheet(fuel),
              Debts: (window as any).XLSX.utils.json_to_sheet(debts),
            },
          }
          ;(window as any).XLSX.writeFile(workbook, "olivier_export_complet.xlsx")

          toast({
            title: "Succès",
            description: "Toutes les données exportées",
          })
          setLoading(null)
          return
      }

      exportToExcel(data, filename)
      toast({
        title: "Succès",
        description: `${data.length} lignes exportées`,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de l'exportation",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Exporter des données" description="Exporter vers Excel" />
      <main className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exportTypes.map((type) => (
            <Card key={type.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-accent/10 p-2">
                    <FileSpreadsheet className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <CardTitle>{type.title}</CardTitle>
                    <CardDescription>{type.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full gap-2" onClick={() => handleExport(type.id)} disabled={loading === type.id}>
                  <Download className="h-4 w-4" />
                  {loading === type.id ? "Exportation..." : "Exporter"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
