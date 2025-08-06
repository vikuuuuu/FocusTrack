// src/components/ui/sidebar-inset.jsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./siderbar-provider"

const SidebarInset = React.forwardRef(({ className, ...props }, ref) => {
  const { isOpen } = useSidebar()
  return (
    <div
      ref={ref}
      className={cn(
        "flex-1 transition-all duration-200 ease-in-out",
        isOpen ? "ml-64" : "ml-16", // Adjust margin based on sidebar state
        className,
      )}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

export { SidebarInset }
