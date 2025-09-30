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
import { Upload, CheckCircle, AlertCircle, FileCheck } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

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
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importProgress, setImportProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setLoading(true)
    setUploadProgress(0)
    setIsComplete(false)

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 100)

    try {
      console.log("[v0] Starting Excel file parsing:", selectedFile.name)
      const data = await parseExcelFile(selectedFile)
      console.log("[v0] Parsed data rows:", data.length)

      setUploadProgress(100)
      clearInterval(progressInterval)
      setParsedData(data)

      if (data.length > 0) {
        const columns = Object.keys(data[0])
        console.log("[v0] Excel columns found:", columns)
        setExcelColumns(columns)

        const autoMappings = autoMapColumns(
          columns,
          fieldMappings.map((f) => f.key),
        )
        console.log("[v0] Auto-mapped columns:", autoMappings.length)
        setMappings(autoMappings)

        setTimeout(() => {
          setIsComplete(true)
          setStep("mapping")
        }, 500)
      }
    } catch (error) {
      console.error("[v0] Excel parsing error:", error)
      clearInterval(progressInterval)
      toast({
        title: "Erreur",
        description: "Impossible de lire le fichier Excel",
        variant: "destructive",
      })
      setUploadProgress(0)
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
    setImportProgress(0)

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

      console.log("[v0] Starting import of", transformedData.length, "rows")

      for (let i = 0; i < transformedData.length; i++) {
        setImportProgress(Math.round(((i + 1) / transformedData.length) * 100))
        await new Promise((resolve) => setTimeout(resolve, 10)) // Small delay for UI update
      }

      await onImport(transformedData)
      console.log("[v0] Import completed successfully")

      setImportProgress(100)
      toast({
        title: "Succès",
        description: `${transformedData.length} lignes importées avec succès`,
      })

      setTimeout(() => {
        onOpenChange(false)
        resetState()
      }, 1000)
    } catch (error) {
      console.error("[v0] Import error:", error)
      toast({
        title: "Erreur",
        description: "Échec de l'importation des données",
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
    setUploadProgress(0)
    setImportProgress(0)
    setIsComplete(false)
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

            {loading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Chargement du fichier...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {isComplete && (
              <div className="flex items-center justify-center gap-2 text-sm text-accent">
                <FileCheck className="h-5 w-5" />
                <span className="font-medium">Fichier chargé avec succès!</span>
              </div>
            )}
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

            {loading && importProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Importation en cours...</span>
                  <span className="font-medium">{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("mapping")} disabled={loading}>
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
