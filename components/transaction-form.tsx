"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Transaction } from "@/lib/db-client"
import { useToast } from "@/hooks/use-toast"

interface TransactionFormProps {
  transaction?: Transaction
  onSave: (transaction: Transaction) => Promise<void>
  onCancel: () => void
}

export function TransactionForm({ transaction, onSave, onCancel }: TransactionFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Transaction>({
    id: transaction?.id,
    type: transaction?.type || "expense",
    nom: transaction?.nom || "",
    reference: transaction?.reference || "",
    montant: transaction?.montant || 0,
    devise: transaction?.devise || "USD",
    motif: transaction?.motif || "",
    date: transaction?.date || new Date().toISOString().split("T")[0],
    heure: transaction?.heure || "",
    telephone: transaction?.telephone || "",
    mode_paiement: transaction?.mode_paiement || "",
    notes: transaction?.notes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSave(formData)
      toast({
        title: "Succès",
        description: transaction ? "Transaction mise à jour" : "Transaction créée",
      })
      onCancel()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la transaction",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Revenu</SelectItem>
              <SelectItem value="expense">Dépense</SelectItem>
              <SelectItem value="transfer">Transfert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nom">Nom *</Label>
          <Input
            id="nom"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="montant">Montant *</Label>
          <Input
            id="montant"
            type="number"
            step="0.01"
            value={formData.montant}
            onChange={(e) => setFormData({ ...formData, montant: Number.parseFloat(e.target.value) })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="devise">Devise</Label>
          <Select value={formData.devise} onValueChange={(value) => setFormData({ ...formData, devise: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="CDF">CDF</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
          <Label htmlFor="reference">Référence</Label>
          <Input
            id="reference"
            value={formData.reference}
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mode_paiement">Mode de paiement</Label>
          <Select
            value={formData.mode_paiement}
            onValueChange={(value) => setFormData({ ...formData, mode_paiement: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Espèces</SelectItem>
              <SelectItem value="bank">Virement bancaire</SelectItem>
              <SelectItem value="mobile">Mobile Money</SelectItem>
              <SelectItem value="check">Chèque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="telephone">Téléphone</Label>
          <Input
            id="telephone"
            value={formData.telephone}
            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
          />
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
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  )
}
