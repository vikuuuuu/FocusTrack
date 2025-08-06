// src/app/tasks/page.jsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, orderBy } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Edit, CalendarIcon } from "lucide-react"
import { format, isPast, isToday } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

export default function TasksPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState([])
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskDueDate, setNewTaskDueDate] = useState(null)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [filter, setFilter] = useState("all") // 'all', 'pending', 'completed', 'missed'
  const [saveStatus, setSaveStatus] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
    if (user) {
      fetchTasks()
    }
  }, [user, loading, router])

  const fetchTasks = async () => {
    if (!user) return
    const q = query(collection(db, "tasks"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)
    const fetchedTasks = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      dueDate: doc.data().dueDate ? new Date(doc.data().dueDate.toDate()) : null, // Convert Firestore Timestamp to Date
    }))
    setTasks(fetchedTasks)
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!user || !newTaskDescription.trim()) {
      setSaveStatus("Task description cannot be empty.")
      return
    }

    const taskData = {
      userId: user.uid,
      description: newTaskDescription.trim(),
      completed: false,
      createdAt: new Date(),
      dueDate: newTaskDueDate,
    }

    try {
      if (editingTaskId) {
        await updateDoc(doc(db, "tasks", editingTaskId), {
          description: newTaskDescription.trim(),
          dueDate: newTaskDueDate,
        })
        setSaveStatus("Task updated!")
      } else {
        await addDoc(collection(db, "tasks"), taskData)
        setSaveStatus("Task added!")
      }
      setNewTaskDescription("")
      setNewTaskDueDate(null)
      setEditingTaskId(null)
      fetchTasks()
    } catch (error) {
      console.error("Error saving task:", error)
      setSaveStatus("Error saving task.")
    }
  }

  const handleToggleComplete = async (id, completed) => {
    if (!user) return
    try {
      await updateDoc(doc(db, "tasks", id), { completed: !completed })
      fetchTasks()
    } catch (error) {
      console.error("Error updating task status:", error)
    }
  }

  const handleDeleteTask = async (id) => {
    if (!user) return
    try {
      await deleteDoc(doc(db, "tasks", id))
      setSaveStatus("Task deleted!")
      fetchTasks()
    } catch (error) {
      console.error("Error deleting task:", error)
      setSaveStatus("Error deleting task.")
    }
  }

  const handleEditTask = (task) => {
    setNewTaskDescription(task.description)
    setNewTaskDueDate(task.dueDate)
    setEditingTaskId(task.id)
  }

  const getTaskStatus = (task) => {
    if (task.completed) return "Completed"
    if (task.dueDate && isPast(task.dueDate) && !isToday(task.dueDate)) return "Missed"
    return "Pending"
  }

  const filteredTasks = tasks.filter((task) => {
    const status = getTaskStatus(task)
    if (filter === "all") return true
    return filter === status.toLowerCase()
  })

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading tasks...</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Daily Task Tracker</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingTaskId ? "Edit Task" : "Add New Task"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskDescription">Task Description</Label>
              <Input
                id="taskDescription"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="e.g., Finish report, Study for exam"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newTaskDueDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTaskDueDate ? format(newTaskDueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={newTaskDueDate} onSelect={setNewTaskDueDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit">{editingTaskId ? "Update Task" : "Add Task"}</Button>
              {editingTaskId && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingTaskId(null)
                    setNewTaskDescription("")
                    setNewTaskDueDate(null)
                  }}
                >
                  Cancel Edit
                </Button>
              )}
            </div>
            {saveStatus && <p className="text-sm text-center">{saveStatus}</p>}
          </form>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">Your Tasks</h2>
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
          All
        </Button>
        <Button variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")}>
          Pending
        </Button>
        <Button variant={filter === "completed" ? "default" : "outline"} onClick={() => setFilter("completed")}>
          Completed
        </Button>
        <Button variant={filter === "missed" ? "default" : "outline"} onClick={() => setFilter("missed")}>
          Missed
        </Button>
      </div>

      <div className="space-y-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => handleToggleComplete(task.id, task.completed)}
                  />
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor={`task-${task.id}`}
                      className={cn(
                        "text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                        task.completed && "line-through text-muted-foreground",
                      )}
                    >
                      {task.description}
                    </Label>
                    {task.dueDate && (
                      <p className="text-sm text-muted-foreground">
                        Due: {format(task.dueDate, "PPP")} ({getTaskStatus(task)})
                      </p>
                    )}
                    {!task.dueDate && <p className="text-sm text-muted-foreground">Status: {getTaskStatus(task)}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEditTask(task)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground">No tasks found for the current filter.</p>
        )}
      </div>
    </div>
  )
}
