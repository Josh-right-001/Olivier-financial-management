"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { dbClient, type FuelLog } from "@/lib/db-client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoadingScreen } from "@/components/loading-screen"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, Fuel } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function FuelPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<FuelLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<FuelLog | undefined>()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FuelLog>({
    date: new Date().toISOString().split("T")[0],
    heure: "",
    quantite_litres: 0,
    prix_par_litre: 0,
    vehicule: "",
    conducteur: "",
    notes: "",
  })

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    try {
      const data = await dbClient.getFuelLogs()
      setLogs(data || [])
    } catch (error) {
      console.error("[v0] Failed to load fuel logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await dbClient.saveFuelLog(formData)
      await loadLogs()
      toast({ title: "Succès", description: "Enregistrement sauvegardé" })
      setIsFormOpen(false)
      resetForm()
    } catch (error) {
      toast({ title: "Erreur", description: "Échec de l'enregistrement", variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await dbClient.deleteFuelLog(deleteId)
        await loadLogs()
        toast({ title: "Succès", description: "Enregistrement supprimé" })
      } catch (error) {
        toast({ title: "Erreur", description: "Échec de la suppression", variant: "destructive" })
      }
      setDeleteId(null)
    }
  }

  const handleEdit = (log: FuelLog) => {
    setFormData(log)
    setEditingLog(log)
    setIsFormOpen(true)
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      heure: "",
      quantite_litres: 0,
      prix_par_litre: 0,
      vehicule: "",
      conducteur: "",
      notes: "",
    })
    setEditingLog(undefined)
  }

  const totalLitres = logs.reduce((sum, log) => sum + Number(log.quantite_litres), 0)
  const totalCost = logs.reduce((sum, log) => sum + Number(log.cout_total || 0), 0)
  const avgPricePerLitre = totalLitres > 0 ? totalCost / totalLitres : 0

  if (loading) return <LoadingScreen />

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Gestion du Mazout"
        description="Suivre la consommation de carburant"
        action={{
          label: "Ajouter",
          onClick: () => {
            resetForm()
            setIsFormOpen(true)
          },
        }}
      />
      <main className="flex-1 space-y-4 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Litres</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLitres.toLocaleString()} L</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coût Total</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalCost.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prix Moyen/L</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${avgPricePerLitre.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Quantité (L)</TableHead>
                <TableHead>Prix/L</TableHead>
                <TableHead>Coût Total</TableHead>
                <TableHead>Véhicule</TableHead>
                <TableHead>Conducteur</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Aucun enregistrement
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{format(new Date(log.date), "dd MMM yyyy", { locale: fr })}</TableCell>
                    <TableCell className="font-medium">{Number(log.quantite_litres).toLocaleString()} L</TableCell>
                    <TableCell>${Number(log.prix_par_litre).toFixed(2)}</TableCell>
                    <TableCell className="font-bold">${Number(log.cout_total).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{log.vehicule || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{log.conducteur || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(log)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(log.id!)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLog ? "Modifier l'enregistrement" : "Nouvel enregistrement"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heure">Heure</Label>
                <Input
                  id="heure"
                  type="time"
                  value={formData.heure}
                  onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantite_litres">Quantité (litres) *</Label>
                <Input
                  id="quantite_litres"
                  type="number"
                  step="0.01"
                  value={formData.quantite_litres}
                  onChange={(e) => setFormData({ ...formData, quantite_litres: Number.parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prix_par_litre">Prix par litre *</Label>
                <Input
                  id="prix_par_litre"
                  type="number"
                  step="0.01"
                  value={formData.prix_par_litre}
                  onChange={(e) => setFormData({ ...formData, prix_par_litre: Number.parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicule">Véhicule</Label>
                <Input
                  id="vehicule"
                  value={formData.vehicule}
                  onChange={(e) => setFormData({ ...formData, vehicule: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conducteur">Conducteur</Label>
                <Input
                  id="conducteur"
                  value={formData.conducteur}
                  onChange={(e) => setFormData({ ...formData, conducteur: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFormOpen(false)
                  resetForm()
                }}
              >
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet enregistrement ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
