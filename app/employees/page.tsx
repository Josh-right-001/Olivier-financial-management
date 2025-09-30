"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { dbClient, type Employee } from "@/lib/db-client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoadingScreen } from "@/components/loading-screen"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, Search, Users } from "lucide-react"
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

export default function EmployeesPage() {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState<Employee>({
    nom: "",
    post_nom: "",
    role: "",
    salaire_unitaire: 0,
    unite: "",
    salaire_mensuel: 0,
    banque: "",
    compte_bancaire: "",
    telephone: "",
    email: "",
    status: "active",
  })

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      setFilteredEmployees(
        employees.filter(
          (emp) =>
            emp.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.post_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.role?.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      )
    } else {
      setFilteredEmployees(employees)
    }
  }, [employees, searchTerm])

  async function loadEmployees() {
    try {
      const data = await dbClient.getEmployees()
      setEmployees(data || [])
      setFilteredEmployees(data || [])
    } catch (error) {
      console.error("[v0] Failed to load employees:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await dbClient.saveEmployee(formData)
      await loadEmployees()
      toast({ title: "Succès", description: "Employé enregistré" })
      setIsFormOpen(false)
      resetForm()
    } catch (error) {
      toast({ title: "Erreur", description: "Échec de l'enregistrement", variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await dbClient.deleteEmployee(deleteId)
        await loadEmployees()
        toast({ title: "Succès", description: "Employé supprimé" })
      } catch (error) {
        toast({ title: "Erreur", description: "Échec de la suppression", variant: "destructive" })
      }
      setDeleteId(null)
    }
  }

  const handleEdit = (employee: Employee) => {
    setFormData(employee)
    setEditingEmployee(employee)
    setIsFormOpen(true)
  }

  const resetForm = () => {
    setFormData({
      nom: "",
      post_nom: "",
      role: "",
      salaire_unitaire: 0,
      unite: "",
      salaire_mensuel: 0,
      banque: "",
      compte_bancaire: "",
      telephone: "",
      email: "",
      status: "active",
    })
    setEditingEmployee(undefined)
  }

  const activeEmployees = employees.filter((e) => e.status === "active").length
  const totalPayroll = employees
    .filter((e) => e.status === "active")
    .reduce((sum, e) => sum + Number(e.salaire_mensuel || 0), 0)

  if (loading) return <LoadingScreen />

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Personnel"
        description="Gérer vos employés"
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
              <CardTitle className="text-sm font-medium">Employés Actifs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeEmployees}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employés</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Masse Salariale</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPayroll.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou rôle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Salaire Mensuel</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aucun employé
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      {employee.nom} {employee.post_nom}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{employee.role || "-"}</TableCell>
                    <TableCell className="font-bold">${Number(employee.salaire_mensuel).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{employee.telephone || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          employee.status === "active"
                            ? "default"
                            : employee.status === "inactive"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {employee.status === "active"
                          ? "Actif"
                          : employee.status === "inactive"
                            ? "Inactif"
                            : "Suspendu"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(employee)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(employee.id!)}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? "Modifier l'employé" : "Nouvel employé"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
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
                <Label htmlFor="post_nom">Post-nom</Label>
                <Input
                  id="post_nom"
                  value={formData.post_nom}
                  onChange={(e) => setFormData({ ...formData, post_nom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="suspended">Suspendu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaire_unitaire">Salaire Unitaire</Label>
                <Input
                  id="salaire_unitaire"
                  type="number"
                  step="0.01"
                  value={formData.salaire_unitaire}
                  onChange={(e) => setFormData({ ...formData, salaire_unitaire: Number.parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unite">Unité</Label>
                <Input
                  id="unite"
                  value={formData.unite}
                  onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
                  placeholder="ex: heure, jour"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaire_mensuel">Salaire Mensuel</Label>
                <Input
                  id="salaire_mensuel"
                  type="number"
                  step="0.01"
                  value={formData.salaire_mensuel}
                  onChange={(e) => setFormData({ ...formData, salaire_mensuel: Number.parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banque">Banque</Label>
                <Input
                  id="banque"
                  value={formData.banque}
                  onChange={(e) => setFormData({ ...formData, banque: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compte_bancaire">Compte Bancaire</Label>
                <Input
                  id="compte_bancaire"
                  value={formData.compte_bancaire}
                  onChange={(e) => setFormData({ ...formData, compte_bancaire: e.target.value })}
                />
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
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
              Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible.
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
