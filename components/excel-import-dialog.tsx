"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { parseExcelFile, autoMapColumns, validateData, type MappingRule } from "@/lib/excel-utils"
import { Upload, CheckCircle, AlertCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface ExcelImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (data: any[]) => Promise<void>
  fieldMappings: { label: string; key: string; required?: boolean; type?: string }[]
  title: string
}

export function ExcelImportDialog({ open, onOpenChange, onImport, fieldMappings, title }: ExcelImportDialogProps) {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [excelColumns, setExcelColumns] = useState<string[]>([])
  const [mappings, setMappings] = useState<MappingRule[]>([])
  const [errors, setErrors] = useState<any[]>([])
  const [step, setStep] = useState<"upload" | "mapping" | "preview">("upload")
  const [loading, setLoading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setLoading(true)

    try {
      const data = await parseExcelFile(selectedFile)
      setParsedData(data)

      if (data.length > 0) {
        const columns = Object.keys(data[0])
        setExcelColumns(columns)

        const autoMappings = autoMapColumns(
          columns,
          fieldMappings.map((f) => f.key),
        )
        setMappings(autoMappings)
        setStep("mapping")
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de lire le fichier Excel",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMappingChange = (excelColumn: string, dbField: string) => {
    setMappings((prev) => {
      const existing = prev.find((m) => m.excelColumn === excelColumn)
      if (existing) {
        return prev.map((m) => (m.excelColumn === excelColumn ? { ...m, dbField } : m))
      }
      return [...prev, { excelColumn, dbField }]
    })
  }

  const handlePreview = () => {
    const transformedData = parsedData.map((row) => {
      const transformed: any = {}
      mappings.forEach((mapping) => {
        if (mapping.dbField !== "ignore") {
          transformed[mapping.dbField] = row[mapping.excelColumn]
        }
      })
      return transformed
    })

    const validationErrors = validateData(
      transformedData,
      fieldMappings.map((f) => ({ field: f.key, required: f.required, type: f.type })),
    )

    setErrors(validationErrors)
    setStep("preview")
  }

  const handleImport = async () => {
    if (errors.length > 0) {
      toast({
        title: "Erreurs de validation",
        description: "Veuillez corriger les erreurs avant d'importer",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const transformedData = parsedData.map((row) => {
        const transformed: any = {}
        mappings.forEach((mapping) => {
          if (mapping.dbField !== "ignore") {
            transformed[mapping.dbField] = row[mapping.excelColumn]
          }
        })
        return transformed
      })

      await onImport(transformedData)
      toast({
        title: "Succès",
        description: `${transformedData.length} lignes importées`,
      })
      onOpenChange(false)
      resetState()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de l'importation",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetState = () => {
    setFile(null)
    setParsedData([])
    setExcelColumns([])
    setMappings([])
    setErrors([])
    setStep("upload")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12">
              <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-sm font-medium">Cliquez pour sélectionner un fichier Excel</span>
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                disabled={loading}
              />
              {file && <p className="mt-2 text-sm text-muted-foreground">{file.name}</p>}
            </div>
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Associez les colonnes Excel aux champs de la base de données
            </p>
            <div className="space-y-2">
              {excelColumns.map((col) => {
                const mapping = mappings.find((m) => m.excelColumn === col)
                return (
                  <div key={col} className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">{col}</Label>
                    </div>
                    <div className="flex-1">
                      <Select
                        value={mapping?.dbField || "ignore"}
                        onValueChange={(value) => handleMappingChange(col, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ignore">Ignorer</SelectItem>
                          {fieldMappings.map((field) => (
                            <SelectItem key={field.key} value={field.key}>
                              {field.label}
                              {field.required && " *"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Retour
              </Button>
              <Button onClick={handlePreview}>Prévisualiser</Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{parsedData.length} lignes à importer</p>
                {errors.length > 0 && <p className="text-sm text-destructive">{errors.length} erreurs détectées</p>}
              </div>
              {errors.length === 0 && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Prêt à importer
                </Badge>
              )}
            </div>

            {errors.length > 0 && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm font-medium text-destructive">Erreurs de validation</p>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {errors.slice(0, 10).map((error, i) => (
                    <p key={i} className="text-xs text-destructive">
                      Ligne {error.row}, {error.field}: {error.message}
                    </p>
                  ))}
                  {errors.length > 10 && (
                    <p className="text-xs text-destructive">... et {errors.length - 10} autres erreurs</p>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-md border max-h-64 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {mappings
                      .filter((m) => m.dbField !== "ignore")
                      .map((m) => (
                        <TableHead key={m.dbField}>{fieldMappings.find((f) => f.key === m.dbField)?.label}</TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 5).map((row, i) => (
                    <TableRow key={i}>
                      {mappings
                        .filter((m) => m.dbField !== "ignore")
                        .map((m) => (
                          <TableCell key={m.dbField}>{row[m.excelColumn]}</TableCell>
                        ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("mapping")}>
                Retour
              </Button>
              <Button onClick={handleImport} disabled={loading || errors.length > 0}>
                {loading ? "Importation..." : "Importer"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
