// src/app/settings/page.jsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { permission, requestPermission } = useNotifications()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  const handleRequestNotificationPermission = async () => {
    await requestPermission()
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Manage your personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user.email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" type="text" placeholder="Your Name" value={user.displayName || ""} disabled />
            <p className="text-sm text-muted-foreground">
              (Currently, display name updates are not supported directly here.)
            </p>
          </div>
          <Button disabled>Update Profile</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure your notification preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Current permission status: <span className="font-semibold">{permission}</span>
          </p>
          {permission === "denied" && (
            <p className="text-sm text-red-500">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          )}
          {permission !== "granted" && (
            <Button onClick={handleRequestNotificationPermission}>Request Notification Permission</Button>
          )}
          {permission === "granted" && <p className="text-sm text-green-600">Notifications are enabled!</p>}
          <p className="text-sm text-muted-foreground mt-4">
            **Note on Web Push Notifications:** For notifications to work when your browser tab is closed, a **Service
            Worker** and a **backend server** are required to manage push subscriptions and send messages. This
            client-side environment can only provide in-app reminders or browser notifications when the application tab
            is open.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
