"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { dbClient, type InventoryItem } from "@/lib/db-client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoadingScreen } from "@/components/loading-screen"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, Search, Package } from "lucide-react"
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

export default function InventoryPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState<InventoryItem>({
    produit: "",
    quantite: 0,
    unite: "",
    prix_unitaire: 0,
    fournisseur: "",
    date_entree: new Date().toISOString().split("T")[0],
    notes: "",
  })

  useEffect(() => {
    loadItems()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      setFilteredItems(
        items.filter(
          (item) =>
            item.produit.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.fournisseur?.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      )
    } else {
      setFilteredItems(items)
    }
  }, [items, searchTerm])

  async function loadItems() {
    try {
      const data = await dbClient.getInventory()
      setItems(data || [])
      setFilteredItems(data || [])
    } catch (error) {
      console.error("[v0] Failed to load inventory:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await dbClient.saveInventoryItem(formData)
      await loadItems()
      toast({ title: "Succès", description: "Article enregistré" })
      setIsFormOpen(false)
      resetForm()
    } catch (error) {
      toast({ title: "Erreur", description: "Échec de l'enregistrement", variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await dbClient.deleteInventoryItem(deleteId)
        await loadItems()
        toast({ title: "Succès", description: "Article supprimé" })
      } catch (error) {
        toast({ title: "Erreur", description: "Échec de la suppression", variant: "destructive" })
      }
      setDeleteId(null)
    }
  }

  const handleEdit = (item: InventoryItem) => {
    setFormData(item)
    setEditingItem(item)
    setIsFormOpen(true)
  }

  const resetForm = () => {
    setFormData({
      produit: "",
      quantite: 0,
      unite: "",
      prix_unitaire: 0,
      fournisseur: "",
      date_entree: new Date().toISOString().split("T")[0],
      notes: "",
    })
    setEditingItem(undefined)
  }

  const totalValue = items.reduce((sum, item) => sum + Number(item.valeur_totale || 0), 0)
  const totalItems = items.length
  const lowStockItems = items.filter((item) => item.quantite < 10).length

  if (loading) return <LoadingScreen />

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Inventaire"
        description="Gérer votre stock"
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
              <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Articles</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
              <Package className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{lowStockItems}</div>
            </CardContent>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par produit ou fournisseur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Prix Unitaire</TableHead>
                <TableHead>Valeur Totale</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aucun article
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.produit}</TableCell>
                    <TableCell>
                      <span className={item.quantite < 10 ? "text-destructive font-bold" : ""}>
                        {item.quantite} {item.unite}
                      </span>
                    </TableCell>
                    <TableCell>${Number(item.prix_unitaire).toLocaleString()}</TableCell>
                    <TableCell className="font-bold">${Number(item.valeur_totale).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{item.fournisseur || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id!)}>
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
            <DialogTitle>{editingItem ? "Modifier l'article" : "Nouvel article"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="produit">Produit *</Label>
                <Input
                  id="produit"
                  value={formData.produit}
                  onChange={(e) => setFormData({ ...formData, produit: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantite">Quantité *</Label>
                <Input
                  id="quantite"
                  type="number"
                  step="0.01"
                  value={formData.quantite}
                  onChange={(e) => setFormData({ ...formData, quantite: Number.parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unite">Unité</Label>
                <Input
                  id="unite"
                  value={formData.unite}
                  onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prix_unitaire">Prix Unitaire</Label>
                <Input
                  id="prix_unitaire"
                  type="number"
                  step="0.01"
                  value={formData.prix_unitaire}
                  onChange={(e) => setFormData({ ...formData, prix_unitaire: Number.parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fournisseur">Fournisseur</Label>
                <Input
                  id="fournisseur"
                  value={formData.fournisseur}
                  onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_entree">Date d'entrée</Label>
                <Input
                  id="date_entree"
                  type="date"
                  value={formData.date_entree}
                  onChange={(e) => setFormData({ ...formData, date_entree: e.target.value })}
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
              Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.
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
