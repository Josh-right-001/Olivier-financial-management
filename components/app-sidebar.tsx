"use client"
import {
  LayoutDashboard,
  Receipt,
  Package,
  Fuel,
  Users,
  CreditCard,
  FileText,
  Settings,
  Download,
  Upload,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Tableau de bord",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: Receipt,
  },
  {
    title: "Inventaire",
    url: "/inventory",
    icon: Package,
  },
  {
    title: "Mazout",
    url: "/fuel",
    icon: Fuel,
  },
  {
    title: "Personnel",
    url: "/employees",
    icon: Users,
  },
  {
    title: "Dettes",
    url: "/debts",
    icon: CreditCard,
  },
]

const toolsItems = [
  {
    title: "Importer",
    url: "/import",
    icon: Upload,
  },
  {
    title: "Exporter",
    url: "/export",
    icon: Download,
  },
  {
    title: "Rapports",
    url: "/reports",
    icon: FileText,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0">
            <Image src="/logo.png" alt="OLIVIER" fill className="object-contain" priority />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-sidebar-foreground">OLIVIER</span>
            <span className="text-xs text-sidebar-foreground/70">Gestion Financière</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Outils</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>Paramètres</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
