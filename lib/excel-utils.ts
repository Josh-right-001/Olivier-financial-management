"use client"

import * as XLSX from "xlsx"

export interface ExcelColumn {
  header: string
  key: string
  type?: "string" | "number" | "date" | "time"
}

export interface MappingRule {
  excelColumn: string
  dbField: string
  transform?: (value: any) => any
}

export interface MultiSheetData {
  sheetName: string
  data: any[]
}

export function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet)
        resolve(jsonData)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsBinaryString(file)
  })
}

export function parseMultiSheetExcel(file: File): Promise<MultiSheetData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })

        const allSheets: MultiSheetData[] = workbook.SheetNames.map((sheetName) => {
          const sheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(sheet)
          return {
            sheetName,
            data: jsonData,
          }
        })

        resolve(allSheets)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsBinaryString(file)
  })
}

export function exportToExcel(data: any[], filename: string, sheetName = "Sheet1") {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, filename)
}

export function generateMultiSheetTemplate(filename: string) {
  const workbook = XLSX.utils.book_new()

  // Transactions sheet
  const transactionsData = [
    {
      Type: "Revenu",
      Nom: "Client ABC",
      Reference: "TXN-001",
      Montant: 1000,
      Devise: "USD",
      Motif: "Vente de produits",
      Date: "2024-01-01",
      Heure: "10:00",
      Téléphone: "+243900000000",
      ModePaiement: "Espèces",
      Notes: "Exemple de transaction",
    },
  ]
  const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData)
  XLSX.utils.book_append_sheet(workbook, transactionsSheet, "Transactions")

  // Employees sheet
  const employeesData = [
    {
      Nom: "Dupont",
      PostNom: "Jean",
      Role: "Manager",
      SalaireUnitaire: 50,
      Unité: "Heure",
      SalaireMensuel: 2000,
      Banque: "Banque ABC",
      CompteBancaire: "1234567890",
      Téléphone: "+243900000001",
      Email: "jean.dupont@example.com",
      Statut: "Actif",
    },
  ]
  const employeesSheet = XLSX.utils.json_to_sheet(employeesData)
  XLSX.utils.book_append_sheet(workbook, employeesSheet, "Employees")

  // Inventory sheet
  const inventoryData = [
    {
      Produit: "Ciment",
      Quantité: 100,
      Unité: "Sacs",
      PrixUnitaire: 25,
      Fournisseur: "Fournisseur XYZ",
      DateEntrée: "2024-01-01",
      Notes: "Stock initial",
    },
  ]
  const inventorySheet = XLSX.utils.json_to_sheet(inventoryData)
  XLSX.utils.book_append_sheet(workbook, inventorySheet, "Inventory")

  // Fuel sheet
  const fuelData = [
    {
      Date: "2024-01-01",
      Heure: "08:00",
      QuantitéLitres: 50,
      PrixParLitre: 1.5,
      Véhicule: "Camion-001",
      Conducteur: "Pierre Martin",
      Notes: "Plein complet",
    },
  ]
  const fuelSheet = XLSX.utils.json_to_sheet(fuelData)
  XLSX.utils.book_append_sheet(workbook, fuelSheet, "Fuel_Log")

  // Debts sheet
  const debtsData = [
    {
      NomCréancier: "Fournisseur ABC",
      MontantTotal: 5000,
      Avance: 1000,
      Motif: "Achat de matériaux",
      Échéance: "2024-02-01",
      Statut: "En cours",
      Notes: "Paiement en 3 fois",
    },
  ]
  const debtsSheet = XLSX.utils.json_to_sheet(debtsData)
  XLSX.utils.book_append_sheet(workbook, debtsSheet, "Debts")

  XLSX.writeFile(workbook, filename)
}

export function generateTemplate(columns: ExcelColumn[], filename: string) {
  const sampleData = [
    columns.reduce(
      (acc, col) => {
        acc[col.header] = col.type === "number" ? 0 : col.type === "date" ? "2024-01-01" : "Exemple"
        return acc
      },
      {} as Record<string, any>,
    ),
  ]

  exportToExcel(sampleData, filename, "Template")
}

export function autoMapColumns(excelColumns: string[], dbFields: string[]): MappingRule[] {
  const mappings: MappingRule[] = []

  for (const excelCol of excelColumns) {
    const normalized = excelCol.toLowerCase().replace(/[^a-z0-9]/g, "")

    for (const dbField of dbFields) {
      const dbNormalized = dbField.toLowerCase().replace(/[^a-z0-9]/g, "")

      if (normalized === dbNormalized || normalized.includes(dbNormalized) || dbNormalized.includes(normalized)) {
        mappings.push({
          excelColumn: excelCol,
          dbField: dbField,
        })
        break
      }
    }
  }

  return mappings
}

export function validateData(data: any[], rules: { field: string; required?: boolean; type?: string }[]) {
  const errors: { row: number; field: string; message: string }[] = []

  data.forEach((row, index) => {
    rules.forEach((rule) => {
      const value = row[rule.field]

      if (rule.required && (value === undefined || value === null || value === "")) {
        errors.push({
          row: index + 1,
          field: rule.field,
          message: "Champ obligatoire manquant",
        })
      }

      if (rule.type === "number" && value && Number.isNaN(Number(value))) {
        errors.push({
          row: index + 1,
          field: rule.field,
          message: "Doit être un nombre",
        })
      }

      if (rule.type === "date" && value && Number.isNaN(Date.parse(value))) {
        errors.push({
          row: index + 1,
          field: rule.field,
          message: "Format de date invalide",
        })
      }
    })
  })

  return errors
}
