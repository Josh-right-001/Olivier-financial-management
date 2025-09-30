"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { TransactionForm } from "@/components/transaction-form"
import { TransactionTable } from "@/components/transaction-table"
import { dbClient, type Transaction } from "@/lib/db-client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoadingScreen } from "@/components/loading-screen"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>()
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  useEffect(() => {
    loadTransactions()
  }, [])

  useEffect(() => {
    let filtered = transactions

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.motif?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === typeFilter)
    }

    setFilteredTransactions(filtered)
  }, [transactions, searchTerm, typeFilter])

  async function loadTransactions() {
    try {
      const data = await dbClient.getTransactions()
      setTransactions(data || [])
      setFilteredTransactions(data || [])
    } catch (error) {
      console.error("[v0] Failed to load transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (transaction: Transaction) => {
    await dbClient.saveTransaction(transaction)
    await loadTransactions()
    setIsFormOpen(false)
    setEditingTransaction(undefined)
  }

  const handleDelete = async (id: string) => {
    await dbClient.deleteTransaction(id)
    await loadTransactions()
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsFormOpen(true)
  }

  const handleAdd = () => {
    setEditingTransaction(undefined)
    setIsFormOpen(true)
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Transactions"
        description="Gérer vos revenus et dépenses"
        action={{ label: "Ajouter", onClick: handleAdd }}
      />
      <main className="flex-1 space-y-4 p-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, référence ou motif..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="income">Revenus</SelectItem>
              <SelectItem value="expense">Dépenses</SelectItem>
              <SelectItem value="transfer">Transferts</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TransactionTable transactions={filteredTransactions} onEdit={handleEdit} onDelete={handleDelete} />
      </main>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? "Modifier la transaction" : "Nouvelle transaction"}</DialogTitle>
          </DialogHeader>
          <TransactionForm
            transaction={editingTransaction}
            onSave={handleSave}
            onCancel={() => {
              setIsFormOpen(false)
              setEditingTransaction(undefined)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
