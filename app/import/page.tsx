"use client"

import type React from "react"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ExcelImportDialog } from "@/components/excel-import-dialog"
import { dbClient } from "@/lib/db-client"
import { generateTemplate, generateMultiSheetTemplate, parseMultiSheetExcel } from "@/lib/excel-utils"
import { Download, Upload, FileSpreadsheet, Layers } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const importTypes = [
  {
    id: "transactions",
    title: "Transactions",
    description: "Importer des revenus et dépenses",
    icon: FileSpreadsheet,
    fields: [
      { label: "Type", key: "type", required: true },
      { label: "Nom", key: "nom", required: true },
      { label: "Montant", key: "montant", required: true, type: "number" },
      { label: "Date", key: "date", required: true, type: "date" },
      { label: "Référence", key: "reference" },
      { label: "Devise", key: "devise" },
      { label: "Motif", key: "motif" },
      { label: "Téléphone", key: "telephone" },
      { label: "Mode de paiement", key: "mode_paiement" },
      { label: "Notes", key: "notes" },
    ],
  },
  {
    id: "employees",
    title: "Personnel",
    description: "Importer des employés",
    icon: FileSpreadsheet,
    fields: [
      { label: "Nom", key: "nom", required: true },
      { label: "Post-nom", key: "post_nom" },
      { label: "Rôle", key: "role" },
      { label: "Salaire unitaire", key: "salaire_unitaire", type: "number" },
      { label: "Unité", key: "unite" },
      { label: "Salaire mensuel", key: "salaire_mensuel", type: "number" },
      { label: "Banque", key: "banque" },
      { label: "Compte bancaire", key: "compte_bancaire" },
      { label: "Téléphone", key: "telephone" },
      { label: "Email", key: "email" },
    ],
  },
  {
    id: "inventory",
    title: "Inventaire",
    description: "Importer des articles",
    icon: FileSpreadsheet,
    fields: [
      { label: "Produit", key: "produit", required: true },
      { label: "Quantité", key: "quantite", required: true, type: "number" },
      { label: "Unité", key: "unite" },
      { label: "Prix unitaire", key: "prix_unitaire", type: "number" },
      { label: "Fournisseur", key: "fournisseur" },
      { label: "Date d'entrée", key: "date_entree", type: "date" },
      { label: "Notes", key: "notes" },
    ],
  },
  {
    id: "fuel",
    title: "Mazout",
    description: "Importer des enregistrements de carburant",
    icon: FileSpreadsheet,
    fields: [
      { label: "Date", key: "date", required: true, type: "date" },
      { label: "Quantité (litres)", key: "quantite_litres", required: true, type: "number" },
      { label: "Prix par litre", key: "prix_par_litre", required: true, type: "number" },
      { label: "Véhicule", key: "vehicule" },
      { label: "Conducteur", key: "conducteur" },
      { label: "Notes", key: "notes" },
    ],
  },
  {
    id: "debts",
    title: "Dettes",
    description: "Importer des dettes",
    icon: FileSpreadsheet,
    fields: [
      { label: "Créancier", key: "nom_creancier", required: true },
      { label: "Montant total", key: "montant_total", required: true, type: "number" },
      { label: "Avance", key: "avance", type: "number" },
      { label: "Motif", key: "motif" },
      { label: "Échéance", key: "echeance", type: "date" },
      { label: "Statut", key: "statut" },
      { label: "Notes", key: "notes" },
    ],
  },
]

export default function ImportPage() {
  const { toast } = useToast()
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [multiSheetFile, setMultiSheetFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  const handleDownloadTemplate = (type: (typeof importTypes)[0]) => {
    generateTemplate(
      type.fields.map((f) => ({ header: f.label, key: f.key, type: f.type as any })),
      `template_${type.id}.xlsx`,
    )
    toast({
      title: "Téléchargement",
      description: "Modèle Excel téléchargé",
    })
  }

  const handleDownloadMultiSheetTemplate = () => {
    generateMultiSheetTemplate("olivier_template_complet.xlsx")
    toast({
      title: "Téléchargement",
      description: "Modèle Excel complet téléchargé avec toutes les feuilles",
    })
  }

  const handleMultiSheetImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const sheets = await parseMultiSheetExcel(file)

      let totalImported = 0

      for (const sheet of sheets) {
        const sheetNameLower = sheet.sheetName.toLowerCase()

        if (sheetNameLower.includes("transaction")) {
          for (const item of sheet.data) {
            await dbClient.saveTransaction(item)
            totalImported++
          }
        } else if (sheetNameLower.includes("employee")) {
          for (const item of sheet.data) {
            await dbClient.saveEmployee(item)
            totalImported++
          }
        } else if (sheetNameLower.includes("inventory")) {
          for (const item of sheet.data) {
            await dbClient.saveInventoryItem(item)
            totalImported++
          }
        } else if (sheetNameLower.includes("fuel")) {
          for (const item of sheet.data) {
            await dbClient.saveFuelLog(item)
            totalImported++
          }
        } else if (sheetNameLower.includes("debt")) {
          for (const item of sheet.data) {
            await dbClient.saveDebt(item)
            totalImported++
          }
        }
      }

      toast({
        title: "Import réussi",
        description: `${totalImported} enregistrements importés depuis ${sheets.length} feuilles`,
      })

      setMultiSheetFile(null)
      e.target.value = ""
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de l'importation du fichier multi-feuilles",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  const handleImport = async (data: any[]) => {
    const type = importTypes.find((t) => t.id === selectedType)
    if (!type) return

    for (const item of data) {
      switch (type.id) {
        case "transactions":
          await dbClient.saveTransaction(item)
          break
        case "employees":
          await dbClient.saveEmployee(item)
          break
        case "inventory":
          await dbClient.saveInventoryItem(item)
          break
        case "fuel":
          await dbClient.saveFuelLog(item)
          break
        case "debts":
          await dbClient.saveDebt(item)
          break
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Importer des données" description="Importer depuis Excel" />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/20 p-3">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Import Complet Multi-Feuilles</CardTitle>
                <CardDescription>
                  Importer toutes les données en une seule fois depuis un fichier Excel avec plusieurs feuilles
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-primary/30 bg-background p-6">
              <Label htmlFor="multi-sheet-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium">
                    {multiSheetFile ? multiSheetFile.name : "Cliquez pour sélectionner un fichier Excel"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Le fichier doit contenir les feuilles: Transactions, Employees, Inventory, Fuel_Log, Debts
                  </span>
                </div>
              </Label>
              <Input
                id="multi-sheet-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleMultiSheetImport}
                className="hidden"
                disabled={importing}
              />
            </div>
            <Button
              variant="outline"
              className="w-full gap-2 bg-transparent"
              onClick={handleDownloadMultiSheetTemplate}
            >
              <Download className="h-4 w-4" />
              Télécharger le modèle complet
            </Button>
          </CardContent>
        </Card>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Ou importer par type</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {importTypes.map((type) => (
            <Card key={type.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <type.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{type.title}</CardTitle>
                    <CardDescription>{type.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full gap-2 bg-transparent"
                  onClick={() => handleDownloadTemplate(type)}
                >
                  <Download className="h-4 w-4" />
                  Télécharger le modèle
                </Button>
                <Button className="w-full gap-2" onClick={() => setSelectedType(type.id)}>
                  <Upload className="h-4 w-4" />
                  Importer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {selectedType && (
        <ExcelImportDialog
          open={!!selectedType}
          onOpenChange={(open) => !open && setSelectedType(null)}
          onImport={handleImport}
          fieldMappings={importTypes.find((t) => t.id === selectedType)?.fields || []}
          title={`Importer ${importTypes.find((t) => t.id === selectedType)?.title}`}
        />
      )}
    </div>
  )
}
