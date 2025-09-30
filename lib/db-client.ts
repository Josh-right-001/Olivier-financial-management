"use client"

import { createClient } from "./supabase/client"
import { getSessionId } from "./session"

export interface Transaction {
  id?: string
  transaction_id?: string
  type: "income" | "expense" | "transfer"
  nom: string
  reference?: string
  montant: number
  devise?: string
  motif?: string
  date: string
  heure?: string
  telephone?: string
  mode_paiement?: string
  notes?: string
}

export interface Employee {
  id?: string
  employee_id?: string
  nom: string
  post_nom?: string
  role?: string
  salaire_unitaire?: number
  unite?: string
  salaire_mensuel?: number
  banque?: string
  compte_bancaire?: string
  telephone?: string
  email?: string
  status?: "active" | "inactive" | "suspended"
}

export interface InventoryItem {
  id?: string
  item_id?: string
  produit: string
  quantite: number
  unite?: string
  prix_unitaire?: number
  fournisseur?: string
  date_entree?: string
  notes?: string
}

export interface FuelLog {
  id?: string
  record_id?: string
  date: string
  heure?: string
  quantite_litres: number
  prix_par_litre: number
  vehicule?: string
  conducteur?: string
  notes?: string
}

export interface Debt {
  id?: string
  debt_id?: string
  nom_creancier: string
  montant_total: number
  avance?: number
  motif?: string
  echeance?: string
  statut?: "pending" | "partial" | "paid" | "overdue"
  notes?: string
}

export class DBClient {
  private supabase = createClient()
  private sessionId = getSessionId()

  // Transactions
  async getTransactions() {
    const { data, error } = await this.supabase
      .from("transactions")
      .select("*")
      .eq("session_id", this.sessionId)
      .order("date", { ascending: false })

    if (error) throw error
    return data
  }

  async saveTransaction(transaction: Transaction) {
    const dataToSave = {
      ...transaction,
      session_id: this.sessionId,
    }

    if (transaction.id) {
      const { error } = await this.supabase.from("transactions").update(dataToSave).eq("id", transaction.id)
      if (error) throw error
    } else {
      const { error } = await this.supabase.from("transactions").insert(dataToSave)
      if (error) throw error
    }
  }

  async deleteTransaction(id: string) {
    const { error } = await this.supabase.from("transactions").delete().eq("id", id).eq("session_id", this.sessionId)
    if (error) throw error
  }

  // Employees
  async getEmployees() {
    const { data, error } = await this.supabase
      .from("employees")
      .select("*")
      .eq("session_id", this.sessionId)
      .order("nom", { ascending: true })

    if (error) throw error
    return data
  }

  async saveEmployee(employee: Employee) {
    const dataToSave = {
      ...employee,
      session_id: this.sessionId,
    }

    if (employee.id) {
      const { error } = await this.supabase.from("employees").update(dataToSave).eq("id", employee.id)
      if (error) throw error
    } else {
      const { error } = await this.supabase.from("employees").insert(dataToSave)
      if (error) throw error
    }
  }

  async deleteEmployee(id: string) {
    const { error } = await this.supabase.from("employees").delete().eq("id", id).eq("session_id", this.sessionId)
    if (error) throw error
  }

  // Inventory
  async getInventory() {
    const { data, error } = await this.supabase
      .from("inventory")
      .select("*")
      .eq("session_id", this.sessionId)
      .order("produit", { ascending: true })

    if (error) throw error
    return data
  }

  async saveInventoryItem(item: InventoryItem) {
    const dataToSave = {
      ...item,
      session_id: this.sessionId,
    }

    if (item.id) {
      const { error } = await this.supabase.from("inventory").update(dataToSave).eq("id", item.id)
      if (error) throw error
    } else {
      const { error } = await this.supabase.from("inventory").insert(dataToSave)
      if (error) throw error
    }
  }

  async deleteInventoryItem(id: string) {
    const { error } = await this.supabase.from("inventory").delete().eq("id", id).eq("session_id", this.sessionId)
    if (error) throw error
  }

  // Fuel Log
  async getFuelLogs() {
    const { data, error } = await this.supabase
      .from("fuel_log")
      .select("*")
      .eq("session_id", this.sessionId)
      .order("date", { ascending: false })

    if (error) throw error
    return data
  }

  async saveFuelLog(log: FuelLog) {
    const dataToSave = {
      ...log,
      session_id: this.sessionId,
    }

    if (log.id) {
      const { error } = await this.supabase.from("fuel_log").update(dataToSave).eq("id", log.id)
      if (error) throw error
    } else {
      const { error } = await this.supabase.from("fuel_log").insert(dataToSave)
      if (error) throw error
    }
  }

  async deleteFuelLog(id: string) {
    const { error } = await this.supabase.from("fuel_log").delete().eq("id", id).eq("session_id", this.sessionId)
    if (error) throw error
  }

  // Debts
  async getDebts() {
    const { data, error } = await this.supabase
      .from("debts")
      .select("*")
      .eq("session_id", this.sessionId)
      .order("echeance", { ascending: true })

    if (error) throw error
    return data
  }

  async saveDebt(debt: Debt) {
    const dataToSave = {
      ...debt,
      session_id: this.sessionId,
    }

    if (debt.id) {
      const { error } = await this.supabase.from("debts").update(dataToSave).eq("id", debt.id)
      if (error) throw error
    } else {
      const { error } = await this.supabase.from("debts").insert(dataToSave)
      if (error) throw error
    }
  }

  async deleteDebt(id: string) {
    const { error } = await this.supabase.from("debts").delete().eq("id", id).eq("session_id", this.sessionId)
    if (error) throw error
  }

  // Dashboard stats
  async getDashboardStats() {
    const [transactions, debts, inventory, employees] = await Promise.all([
      this.getTransactions(),
      this.getDebts(),
      this.getInventory(),
      this.getEmployees(),
    ])

    const totalIncome =
      transactions?.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.montant), 0) || 0

    const totalExpenses =
      transactions?.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.montant), 0) || 0

    const balance = totalIncome - totalExpenses

    const totalDebts = debts?.reduce((sum, d) => sum + Number(d.reste || 0), 0) || 0

    const inventoryValue = inventory?.reduce((sum, i) => sum + Number(i.valeur_totale || 0), 0) || 0

    const activeEmployees = employees?.filter((e) => e.status === "active").length || 0

    return {
      balance,
      totalIncome,
      totalExpenses,
      totalDebts,
      inventoryValue,
      activeEmployees,
      recentTransactions: transactions?.slice(0, 5) || [],
      overdueDebts: debts?.filter((d) => d.echeance && new Date(d.echeance) < new Date() && d.statut !== "paid") || [],
    }
  }
}

export const dbClient = new DBClient()
