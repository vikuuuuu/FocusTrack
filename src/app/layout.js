// src/app/layout.jsx
import { Inter } from 'next/font/google'
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-context"
import { SidebarProvider } from "@/components/ui/siderbar-provider"
import { SidebarTrigger } from "@/components/ui/siderbar-trigger"
import { SidebarInset } from "@/components/ui/siderbar-inset"
import { AppSidebar } from "@/components/app-sidebar"
import { cookies } from "next/headers"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "FocusTrack",
  description: "Your Personal Study & Productivity Planner",
}

export default async function RootLayout({ children }) {
  const cookieStore = cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <SidebarProvider defaultOpen={defaultOpen}>
              <AppSidebar />
              <SidebarInset>
                <main className="flex-1 flex flex-col">
                  <div className="p-4 flex items-center gap-2 border-b">
                    <SidebarTrigger />
                    <h1 className="text-xl font-semibold">FocusTrack</h1>
                  </div>
                  {children}
                </main>
              </SidebarInset>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
