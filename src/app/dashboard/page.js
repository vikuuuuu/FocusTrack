// src/app/dashboard/page.jsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-950">
      <h1 className="text-4xl font-bold mb-4 text-center">Welcome to FocusTrack, {user.email}!</h1>
      <p className="text-lg mb-8 text-center text-muted-foreground">Your personal study & productivity planner.</p>
      <Button onClick={handleLogout} className="mb-12">
        Logout
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle>Custom Time Table</CardTitle>
            <CardDescription>Create and manage your daily/weekly study schedule.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/timetable" passHref>
              <Button className="mt-4 w-full">Go to Time Table</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle>Daily Task Tracker</CardTitle>
            <CardDescription>Keep track of your tasks: pending, completed, or missed.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/tasks" passHref>
              <Button className="mt-4 w-full">Go to Tasks</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle>Progress Dashboard</CardTitle>
            <CardDescription>Visualize your productivity and track your streaks.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/progress" passHref>
              <Button className="mt-4 w-full">View Progress</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Manage your account and preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings" passHref>
              <Button className="mt-4 w-full">Go to Settings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
