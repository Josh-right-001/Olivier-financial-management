import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { LoadingScreen } from "@/components/loading-screen"
import { MobileNav } from "@/components/mobile-nav"
import { ThemeProvider } from "@/components/theme-provider"

import { Montserrat } from "next/font/google"

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "OLIVIER - Gestion Financière et RH",
  description: "Application de gestion financière, logistique et RH pour PME et chantiers",
  generator: "v0.app",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "OLIVIER - Gestion Financière et RH",
    description: "Application de gestion financière, logistique et RH pour PME et chantiers",
    images: ["/logo-full.jpg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`font-sans ${montserrat.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <div className="hidden md:block">
                <AppSidebar />
              </div>
              <div className="flex flex-1 flex-col pb-24 md:pb-0">
                <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
              </div>
            </div>
            <MobileNav />
          </SidebarProvider>
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
