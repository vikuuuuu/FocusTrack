// src/app/progress/page.jsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isBefore, addDays } from "date-fns"

export default function ProgressPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [dailyCompletionData, setDailyCompletionData] = useState([])
  const [weeklySuccessRate, setWeeklySuccessRate] = useState(0)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
    if (user) {
      fetchProgressData()
    }
  }, [user, loading, router])

  const fetchProgressData = async () => {
    if (!user) return

    const tasksRef = collection(db, "tasks")
    const q = query(tasksRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)
    const allTasks = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(), // Convert Firestore Timestamp to Date
      dueDate: doc.data().dueDate ? doc.data().dueDate.toDate() : null,
    }))

    calculateDailyCompletion(allTasks)
    calculateWeeklySuccessRate(allTasks)
    calculateStreak(allTasks)
  }

  const calculateDailyCompletion = (tasks) => {
    const today = new Date()
    const sevenDaysAgo = addDays(today, -6) // Last 7 days including today

    const dailyCounts = eachDayOfInterval({ start: sevenDaysAgo, end: today }).map((date) => {
      const completedCount = tasks.filter((task) => task.completed && isSameDay(task.createdAt, date)).length
      const totalCount = tasks.filter((task) => isSameDay(task.createdAt, date)).length
      return {
        date: format(date, "MMM dd"),
        completed: completedCount,
        total: totalCount,
      }
    })
    setDailyCompletionData(dailyCounts)
  }

  const calculateWeeklySuccessRate = (tasks) => {
    const now = new Date()
    const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 }) // Monday as start of week
    const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 })

    const weeklyTasks = tasks.filter(
      (task) => task.createdAt >= startOfCurrentWeek && task.createdAt <= endOfCurrentWeek,
    )

    const completedWeeklyTasks = weeklyTasks.filter((task) => task.completed).length
    const totalWeeklyTasks = weeklyTasks.length

    if (totalWeeklyTasks === 0) {
      setWeeklySuccessRate(0)
    } else {
      setWeeklySuccessRate(((completedWeeklyTasks / totalWeeklyTasks) * 100).toFixed(2))
    }
  }

  const calculateStreak = (tasks) => {
    const completedTasks = tasks
      .filter((task) => task.completed)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    let currentStreak = 0
    let lastCompletedDay = null
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if today has completed tasks
    const hasCompletedToday = completedTasks.some((task) => isSameDay(task.createdAt, today))
    if (hasCompletedToday) {
      currentStreak = 1
      lastCompletedDay = today
    } else {
      // If no tasks completed today, check yesterday
      const yesterday = addDays(today, -1)
      const hasCompletedYesterday = completedTasks.some((task) => isSameDay(task.createdAt, yesterday))
      if (hasCompletedYesterday) {
        currentStreak = 1
        lastCompletedDay = yesterday
      } else {
        setStreak(0)
        return
      }
    }

    // Continue checking previous days
    for (let i = 0; i < completedTasks.length; i++) {
      const taskDate = new Date(completedTasks[i].createdAt)
      taskDate.setHours(0, 0, 0, 0)

      if (lastCompletedDay && isSameDay(taskDate, lastCompletedDay)) {
        continue // Same day, skip
      }

      const dayBeforeLast = addDays(lastCompletedDay, -1)
      if (isSameDay(taskDate, dayBeforeLast)) {
        currentStreak++
        lastCompletedDay = taskDate
      } else if (isBefore(taskDate, dayBeforeLast)) {
        break // Gap in streak
      }
    }
    setStreak(currentStreak)
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading progress...</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Progress Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Success Rate</CardTitle>
            <CardDescription>Your task completion rate this week.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-primary">{weeklySuccessRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current Streak</CardTitle>
            <CardDescription>Consecutive days with completed tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-primary">{streak} Days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Tasks (Last 7 Days)</CardTitle>
            <CardDescription>All tasks created in the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-primary">
              {dailyCompletionData.reduce((sum, day) => sum + day.total, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Completed Tasks</CardTitle>
          <CardDescription>Number of tasks completed each day over the last 7 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              completed: {
                label: "Completed Tasks",
                color: "hsl(var(--primary))",
              },
              total: {
                label: "Total Tasks",
                color: "hsl(var(--muted-foreground))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyCompletionData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="var(--color-completed)" name="Completed" />
                <Line type="monotone" dataKey="total" stroke="var(--color-total)" name="Total" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
