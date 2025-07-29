"use client"

import { useState, useEffect } from "react"
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "./useAuth"

export interface Task {
  id: string
  title: string
  completed: boolean
  category: string
  priority: string
  dueDate: string
  description?: string
  userId: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Note {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  userId: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ScheduleItem {
  id: string
  title: string
  time: string
  duration: string
  type: string
  completed: boolean
  description?: string
  userId: string
  date: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setTasks([])
      setLoading(false)
      return
    }

    const q = query(collection(db, "tasks"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[]
      setTasks(tasksData)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  const addTask = async (taskData: Omit<Task, "id" | "userId" | "createdAt" | "updatedAt">) => {
    if (!user) return

    await addDoc(collection(db, "tasks"), {
      ...taskData,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    await updateDoc(doc(db, "tasks", taskId), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  }

  const deleteTask = async (taskId: string) => {
    await deleteDoc(doc(db, "tasks", taskId))
  }

  return { tasks, loading, addTask, updateTask, deleteTask }
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setNotes([])
      setLoading(false)
      return
    }

    const q = query(collection(db, "notes"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[]
      setNotes(notesData)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  const addNote = async (noteData: Omit<Note, "id" | "userId" | "createdAt" | "updatedAt">) => {
    if (!user) return

    await addDoc(collection(db, "notes"), {
      ...noteData,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    await updateDoc(doc(db, "notes", noteId), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  }

  const deleteNote = async (noteId: string) => {
    await deleteDoc(doc(db, "notes", noteId))
  }

  return { notes, loading, addNote, updateNote, deleteNote }
}

export function useSchedule() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setSchedule([])
      setLoading(false)
      return
    }

    const today = new Date().toISOString().split("T")[0]
    const q = query(
      collection(db, "schedule"),
      where("userId", "==", user.uid),
      where("date", "==", today),
      orderBy("time", "asc"),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scheduleData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ScheduleItem[]
      setSchedule(scheduleData)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  const addScheduleItem = async (itemData: Omit<ScheduleItem, "id" | "userId" | "createdAt" | "updatedAt">) => {
    if (!user) return

    await addDoc(collection(db, "schedule"), {
      ...itemData,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  const updateScheduleItem = async (itemId: string, updates: Partial<ScheduleItem>) => {
    await updateDoc(doc(db, "schedule", itemId), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  }

  const deleteScheduleItem = async (itemId: string) => {
    await deleteDoc(doc(db, "schedule", itemId))
  }

  return { schedule, loading, addScheduleItem, updateScheduleItem, deleteScheduleItem }
}
