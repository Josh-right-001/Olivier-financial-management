"use client"

import { Home, FileText, BarChart3, TrendingUp, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const mobileNavItems = [
  {
    title: "Accueil",
    url: "/",
    icon: Home,
  },
  {
    title: "Documents",
    url: "/transactions",
    icon: FileText,
  },
  {
    title: "Statistiques",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "Évolution",
    url: "/analytics",
    icon: TrendingUp,
  },
  {
    title: "Paramètres",
    url: "/settings",
    icon: Settings,
  },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 md:hidden">
      <div className="flex items-center gap-1 rounded-[30px] bg-primary/95 p-2 shadow-2xl backdrop-blur-lg border border-primary-foreground/10">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.url
          return (
            <Link
              key={item.url}
              href={item.url}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-[24px] px-4 py-2.5 transition-all duration-300 ease-out",
                "hover:bg-accent/20 hover:scale-110 active:scale-95",
                isActive && "bg-accent scale-105 shadow-lg",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors duration-300",
                  isActive ? "text-accent-foreground" : "text-primary-foreground",
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors duration-300",
                  isActive ? "text-accent-foreground" : "text-primary-foreground/80",
                )}
              >
                {item.title}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
