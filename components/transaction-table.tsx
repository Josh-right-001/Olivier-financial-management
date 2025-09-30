"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2 } from "lucide-react"
import type { Transaction } from "@/lib/db-client"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
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

interface TransactionTableProps {
  transactions: Transaction[]
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => Promise<void>
}

export function TransactionTable({ transactions, onEdit, onDelete }: TransactionTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId)
      setDeleteId(null)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Aucune transaction
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{format(new Date(transaction.date), "dd MMM yyyy", { locale: fr })}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.type === "income"
                          ? "default"
                          : transaction.type === "expense"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {transaction.type === "income"
                        ? "Revenu"
                        : transaction.type === "expense"
                          ? "Dépense"
                          : "Transfert"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{transaction.nom}</TableCell>
                  <TableCell className="text-muted-foreground">{transaction.reference || "-"}</TableCell>
                  <TableCell
                    className={`font-bold ${transaction.type === "income" ? "text-accent" : transaction.type === "expense" ? "text-destructive" : ""}`}
                  >
                    {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}$
                    {Number(transaction.montant).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{transaction.mode_paiement || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(transaction)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(transaction.id!)}>
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action est irréversible.
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
    </>
  )
}
