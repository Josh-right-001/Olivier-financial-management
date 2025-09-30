"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { dbClient, type Debt } from "@/lib/db-client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoadingScreen } from "@/components/loading-screen"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, Search, CreditCard, AlertCircle } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function DebtsPage() {
  const { toast } = useToast()
  const [debts, setDebts] = useState<Debt[]>([])
  const [filteredDebts, setFilteredDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDebt, setEditingDebt] = useState<Debt | undefined>()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState<Debt>({
    nom_creancier: "",
    montant_total: 0,
    avance: 0,
    motif: "",
    echeance: "",
    statut: "pending",
    notes: "",
  })

  useEffect(() => {
    loadDebts()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      setFilteredDebts(
        debts.filter(
          (debt) =>
            debt.nom_creancier.toLowerCase().includes(searchTerm.toLowerCase()) ||
            debt.motif?.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      )
    } else {
      setFilteredDebts(debts)
    }
  }, [debts, searchTerm])

  async function loadDebts() {
    try {
      const data = await dbClient.getDebts()
      setDebts(data || [])
      setFilteredDebts(data || [])
    } catch (error) {
      console.error("[v0] Failed to load debts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await dbClient.saveDebt(formData)
      await loadDebts()
      toast({ title: "Succès", description: "Dette enregistrée" })
      setIsFormOpen(false)
      resetForm()
    } catch (error) {
      toast({ title: "Erreur", description: "Échec de l'enregistrement", variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await dbClient.deleteDebt(deleteId)
        await loadDebts()
        toast({ title: "Succès", description: "Dette supprimée" })
      } catch (error) {
        toast({ title: "Erreur", description: "Échec de la suppression", variant: "destructive" })
      }
      setDeleteId(null)
    }
  }

  const handleEdit = (debt: Debt) => {
    setFormData(debt)
    setEditingDebt(debt)
    setIsFormOpen(true)
  }

  const resetForm = () => {
    setFormData({
      nom_creancier: "",
      montant_total: 0,
      avance: 0,
      motif: "",
      echeance: "",
      statut: "pending",
      notes: "",
    })
    setEditingDebt(undefined)
  }

  const totalDebts = debts.reduce((sum, debt) => sum + Number(debt.reste || 0), 0)
  const paidDebts = debts.filter((d) => d.statut === "paid").length
  const overdueDebts = debts.filter(
    (d) => d.echeance && new Date(d.echeance) < new Date() && d.statut !== "paid",
  ).length

  if (loading) return <LoadingScreen />

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Dettes"
        description="Gérer vos dettes et créances"
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
              <CardTitle className="text-sm font-medium">Total Restant</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">${totalDebts.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dettes Payées</CardTitle>
              <CreditCard className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{paidDebts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Retard</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{overdueDebts}</div>
            </CardContent>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par créancier ou motif..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Créancier</TableHead>
                <TableHead>Montant Total</TableHead>
                <TableHead>Avance</TableHead>
                <TableHead>Reste</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDebts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Aucune dette
                  </TableCell>
                </TableRow>
              ) : (
                filteredDebts.map((debt) => {
                  const isOverdue = debt.echeance && new Date(debt.echeance) < new Date() && debt.statut !== "paid"
                  return (
                    <TableRow key={debt.id}>
                      <TableCell className="font-medium">{debt.nom_creancier}</TableCell>
                      <TableCell>${Number(debt.montant_total).toLocaleString()}</TableCell>
                      <TableCell className="text-accent">${Number(debt.avance || 0).toLocaleString()}</TableCell>
                      <TableCell className="font-bold text-destructive">
                        ${Number(debt.reste).toLocaleString()}
                      </TableCell>
                      <TableCell className={isOverdue ? "text-destructive font-bold" : ""}>
                        {debt.echeance ? format(new Date(debt.echeance), "dd MMM yyyy", { locale: fr }) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            debt.statut === "paid"
                              ? "default"
                              : debt.statut === "partial"
                                ? "secondary"
                                : isOverdue
                                  ? "destructive"
                                  : "outline"
                          }
                        >
                          {debt.statut === "paid"
                            ? "Payée"
                            : debt.statut === "partial"
                              ? "Partielle"
                              : isOverdue
                                ? "En retard"
                                : "En attente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(debt)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(debt.id!)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDebt ? "Modifier la dette" : "Nouvelle dette"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nom_creancier">Créancier *</Label>
                <Input
                  id="nom_creancier"
                  value={formData.nom_creancier}
                  onChange={(e) => setFormData({ ...formData, nom_creancier: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="montant_total">Montant Total *</Label>
                <Input
                  id="montant_total"
                  type="number"
                  step="0.01"
                  value={formData.montant_total}
                  onChange={(e) => setFormData({ ...formData, montant_total: Number.parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avance">Avance</Label>
                <Input
                  id="avance"
                  type="number"
                  step="0.01"
                  value={formData.avance}
                  onChange={(e) => setFormData({ ...formData, avance: Number.parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="echeance">Échéance</Label>
                <Input
                  id="echeance"
                  type="date"
                  value={formData.echeance}
                  onChange={(e) => setFormData({ ...formData, echeance: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="statut">Statut</Label>
                <Select
                  value={formData.statut}
                  onValueChange={(value: any) => setFormData({ ...formData, statut: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="partial">Partielle</SelectItem>
                    <SelectItem value="paid">Payée</SelectItem>
                    <SelectItem value="overdue">En retard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="motif">Motif</Label>
                <Input
                  id="motif"
                  value={formData.motif}
                  onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
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
              Êtes-vous sûr de vouloir supprimer cette dette ? Cette action est irréversible.
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
