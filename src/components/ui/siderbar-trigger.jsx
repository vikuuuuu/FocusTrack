// src/components/ui/sidebar-trigger.jsx
"use client"

import * as React from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "./siderbar-provider"

const SidebarTrigger = React.forwardRef(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className={className}
      aria-label="Toggle sidebar"
      {...props}
    >
      <Menu className="h-5 w-5" />
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

export { SidebarTrigger }
