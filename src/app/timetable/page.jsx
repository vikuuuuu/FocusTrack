// src/app/timetable/page.jsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Edit } from "lucide-react"
import { useNotifications } from "@/hook/use-notification"
import { differenceInMilliseconds, set } from "date-fns"

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export default function TimeTablePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [timetable, setTimetable] = useState({})
  const [subject, setSubject] = useState("")
  const [day, setDay] = useState(daysOfWeek[0])
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [editingId, setEditingId] = useState(null)
  const [saveStatus, setSaveStatus] = useState("")
  const { showNotification, permission } = useNotifications()

  // Store timeouts to clear them if entries are deleted/edited
  const notificationTimeouts = useRef({})

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
    if (user) {
      fetchTimetable()
    }
    // Cleanup timeouts on unmount
    return () => {
      Object.values(notificationTimeouts.current).forEach(clearTimeout)
    }
  }, [user, loading, router])

  const fetchTimetable = async () => {
    if (!user) return
    const q = query(collection(db, "timetables"), where("userId", "==", user.uid))
    const querySnapshot = await getDocs(q)
    const fetchedTimetable = {}
    querySnapshot.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() }
      if (!fetchedTimetable[data.day]) {
        fetchedTimetable[data.day] = []
      }
      fetchedTimetable[data.day].push(data)
    })
    // Sort entries by start time for each day
    Object.keys(fetchedTimetable).forEach((day) => {
      fetchedTimetable[day].sort((a, b) => a.startTime.localeCompare(b.startTime))
    })
    setTimetable(fetchedTimetable)
    scheduleNotifications(fetchedTimetable)
  }

  const scheduleNotifications = (currentTimetable) => {
    // Clear existing timeouts first
    Object.values(notificationTimeouts.current).forEach(clearTimeout)
    notificationTimeouts.current = {}

    if (permission !== "granted") {
      console.log("Notification permission not granted. Cannot schedule reminders.")
      return
    }

    const now = new Date()
    const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1 // Monday=0, Sunday=6
    const currentDayName = daysOfWeek[currentDayIndex]

    Object.keys(currentTimetable).forEach((dayName) => {
      currentTimetable[dayName].forEach((entry) => {
        const entryDayIndex = daysOfWeek.indexOf(dayName)

        // Calculate the date for the upcoming session
        let sessionDate = new Date(now)
        sessionDate.setDate(now.getDate() + ((entryDayIndex - currentDayIndex + 7) % 7))

        // Parse time and set it to the session date
        const [hours, minutes] = entry.startTime.split(":").map(Number)
        sessionDate = set(sessionDate, { hours, minutes, seconds: 0, milliseconds: 0 })

        // Calculate reminder time (10 minutes before)
        const reminderTime = new Date(sessionDate.getTime() - 10 * 60 * 1000) // 10 minutes before

        const timeUntilReminder = differenceInMilliseconds(reminderTime, now)

        if (timeUntilReminder > 0) {
          const timeoutId = setTimeout(() => {
            showNotification(`Upcoming Session: ${entry.subject}`, {
              body: `Your ${entry.subject} session starts in 10 minutes on ${entry.day} at ${entry.startTime}.`,
              icon: "/placeholder.svg?height=64&width=64",
              vibrate: [200, 100, 200],
            })
          }, timeUntilReminder)
          notificationTimeouts.current[entry.id] = timeoutId
        }
      })
    })
  }

  const handleSaveTimetable = async (e) => {
    e.preventDefault()
    if (!user || !subject || !day || !startTime || !endTime) {
      setSaveStatus("Please fill all fields.")
      return
    }

    const newEntry = {
      userId: user.uid,
      subject,
      day,
      startTime,
      endTime,
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, "timetables", editingId), newEntry)
        setSaveStatus("Timetable entry updated!")
      } else {
        await addDoc(collection(db, "timetables"), newEntry)
        setSaveStatus("Timetable entry added!")
      }
      setSubject("")
      setDay(daysOfWeek[0])
      setStartTime("09:00")
      setEndTime("10:00")
      setEditingId(null)
      fetchTimetable() // Refresh data and reschedule notifications
    } catch (error) {
      console.error("Error saving timetable:", error)
      setSaveStatus("Error saving timetable.")
    }
  }

  const handleEdit = (entry) => {
    setSubject(entry.subject)
    setDay(entry.day)
    setStartTime(entry.startTime)
    setEndTime(entry.endTime)
    setEditingId(entry.id)
  }

  const handleDelete = async (id) => {
    if (!user) return
    try {
      await deleteDoc(doc(db, "timetables", id))
      setSaveStatus("Timetable entry deleted!")
      // Clear specific timeout if it exists
      if (notificationTimeouts.current[id]) {
        clearTimeout(notificationTimeouts.current[id])
        delete notificationTimeouts.current[id]
      }
      fetchTimetable() // Refresh data
    } catch (error) {
      console.error("Error deleting timetable:", error)
      setSaveStatus("Error deleting timetable.")
    }
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading timetable...</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Custom Time Table Creator</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingId ? "Edit Schedule Entry" : "Add New Schedule Entry"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveTimetable} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Math, Coding, Reading"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="day">Day of Week</Label>
              <Select value={day} onValueChange={setDay} required>
                <SelectTrigger id="day">
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="submit">{editingId ? "Update Entry" : "Add Entry"}</Button>
              {editingId && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingId(null)
                    setSubject("")
                    setDay(daysOfWeek[0])
                    setStartTime("09:00")
                    setEndTime("10:00")
                  }}
                >
                  Cancel Edit
                </Button>
              )}
            </div>
            {saveStatus && <p className="md:col-span-2 text-sm text-center">{saveStatus}</p>}
          </form>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">Your Weekly Schedule</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {daysOfWeek.map((d) => (
          <Card key={d}>
            <CardHeader>
              <CardTitle>{d}</CardTitle>
            </CardHeader>
            <CardContent>
              {timetable[d] && timetable[d].length > 0 ? (
                <ul className="space-y-3">
                  {timetable[d].map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <div>
                        <p className="font-medium">{entry.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.startTime} - {entry.endTime}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No entries for {d}.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
