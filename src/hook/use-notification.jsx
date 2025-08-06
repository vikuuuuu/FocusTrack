// src/hooks/use-notifications.js
"use client"

import { useState, useEffect, useCallback } from "react"

export function useNotifications() {
  const [permission, setPermission] = useState("default") // 'default', 'granted', 'denied'

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("Notifications not supported in this browser.")
      return false
    }

    if (Notification.permission === "granted") {
      setPermission("granted")
      return true
    }

    if (Notification.permission === "denied") {
      setPermission("denied")
      return false
    }

    const result = await Notification.requestPermission()
    setPermission(result)
    return result === "granted"
  }, [])

  const showNotification = useCallback(
    (title, options) => {
      if (permission === "granted") {
        new Notification(title, options)
      } else {
        console.warn("Notification permission not granted.")
      }
    },
    [permission],
  )

  return { permission, requestPermission, showNotification }
}
