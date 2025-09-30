"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Rapports" description="Générer des rapports PDF" />
      <main className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Rapport Financier</CardTitle>
                  <CardDescription>Revenus et dépenses</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full gap-2" disabled>
                <Download className="h-4 w-4" />
                Générer PDF
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Rapport Inventaire</CardTitle>
                  <CardDescription>État du stock</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full gap-2" disabled>
                <Download className="h-4 w-4" />
                Générer PDF
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Rapport Paie</CardTitle>
                  <CardDescription>Masse salariale</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full gap-2" disabled>
                <Download className="h-4 w-4" />
                Générer PDF
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fonctionnalité à venir</CardTitle>
            <CardDescription>La génération de rapports PDF sera disponible dans une prochaine version</CardDescription>
          </CardHeader>
        </Card>
      </main>
    </div>
  )
}
