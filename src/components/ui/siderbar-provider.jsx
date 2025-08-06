// src/components/ui/sidebar-provider.jsx
"use client"

import * as React from "react"

const SidebarContext = React.createContext(undefined)

export function SidebarProvider({ children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  // Persist sidebar state in a cookie
  React.useEffect(() => {
    document.cookie = `sidebar:state=${isOpen}; path=/; max-age=31536000` // 1 year
  }, [isOpen])

  const toggleSidebar = React.useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const value = React.useMemo(() => ({ isOpen, toggleSidebar }), [isOpen, toggleSidebar])

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
