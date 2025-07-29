"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw, Coffee, BookOpen, Settings } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<"work" | "break" | "longBreak">("work")
  const [sessions, setSessions] = useState(0)
  const [settings, setSettings] = useState({
    workTime: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4,
  })
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const getModeConfig = () => {
    switch (mode) {
      case "work":
        return { duration: settings.workTime * 60, label: "Focus Time", icon: BookOpen, color: "bg-blue-500" }
      case "break":
        return { duration: settings.shortBreak * 60, label: "Short Break", icon: Coffee, color: "bg-green-500" }
      case "longBreak":
        return { duration: settings.longBreak * 60, label: "Long Break", icon: Coffee, color: "bg-purple-500" }
    }
  }

  const currentConfig = getModeConfig()
  const progress = ((currentConfig.duration - timeLeft) / currentConfig.duration) * 100

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((time) => time - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      // Timer finished
      setIsActive(false)
      if (mode === "work") {
        setSessions((prev) => prev + 1)
        // Switch to break
        if ((sessions + 1) % settings.sessionsUntilLongBreak === 0) {
          setMode("longBreak")
          setTimeLeft(settings.longBreak * 60)
        } else {
          setMode("break")
          setTimeLeft(settings.shortBreak * 60)
        }
      } else {
        // Switch back to work
        setMode("work")
        setTimeLeft(settings.workTime * 60)
      }

      // Play notification sound (you can add actual sound here)
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`${currentConfig.label} finished!`, {
          body: mode === "work" ? "Time for a break!" : "Time to get back to work!",
          icon: "/favicon.ico",
        })
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, timeLeft, mode, sessions, settings])

  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setIsActive(false)
    setTimeLeft(currentConfig.duration)
  }

  const switchMode = (newMode: "work" | "break" | "longBreak") => {
    setIsActive(false)
    setMode(newMode)
    const config =
      newMode === "work"
        ? settings.workTime * 60
        : newMode === "break"
          ? settings.shortBreak * 60
          : settings.longBreak * 60
    setTimeLeft(config)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const updateSettings = () => {
    // Reset timer with new settings
    const newTime =
      mode === "work" ? settings.workTime * 60 : mode === "break" ? settings.shortBreak * 60 : settings.longBreak * 60
    setTimeLeft(newTime)
    setIsActive(false)
    setIsSettingsOpen(false)
  }

  // Request notification permission on component mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  const IconComponent = currentConfig.icon

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <IconComponent className="h-6 w-6" />
            Pomodoro Timer
          </CardTitle>
          <CardDescription>Stay focused with the Pomodoro Technique</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Selector */}
          <div className="flex justify-center space-x-2">
            <Button
              variant={mode === "work" ? "default" : "outline"}
              size="sm"
              onClick={() => switchMode("work")}
              className={mode === "work" ? "bg-blue-500 hover:bg-blue-600" : ""}
            >
              <BookOpen className="h-4 w-4 mr-1" />
              Focus
            </Button>
            <Button
              variant={mode === "break" ? "default" : "outline"}
              size="sm"
              onClick={() => switchMode("break")}
              className={mode === "break" ? "bg-green-500 hover:bg-green-600" : ""}
            >
              <Coffee className="h-4 w-4 mr-1" />
              Short Break
            </Button>
            <Button
              variant={mode === "longBreak" ? "default" : "outline"}
              size="sm"
              onClick={() => switchMode("longBreak")}
              className={mode === "longBreak" ? "bg-purple-500 hover:bg-purple-600" : ""}
            >
              <Coffee className="h-4 w-4 mr-1" />
              Long Break
            </Button>
          </div>

          {/* Timer Display */}
          <div className="text-center space-y-4">
            <div
              className={`w-48 h-48 mx-auto rounded-full ${currentConfig.color} flex items-center justify-center text-white shadow-lg`}
            >
              <div className="text-center">
                <div className="text-4xl font-mono font-bold">{formatTime(timeLeft)}</div>
                <div className="text-sm opacity-90 mt-2">{currentConfig.label}</div>
              </div>
            </div>

            <Progress value={progress} className="w-full max-w-md mx-auto h-2" />
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            <Button onClick={toggleTimer} size="lg" className={`${currentConfig.color} hover:opacity-90`}>
              {isActive ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Start
                </>
              )}
            </Button>
            <Button onClick={resetTimer} variant="outline" size="lg">
              <RotateCcw className="h-5 w-5 mr-2" />
              Reset
            </Button>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg">
                  <Settings className="h-5 w-5 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Timer Settings</DialogTitle>
                  <DialogDescription>Customize your Pomodoro timer intervals</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="workTime">Focus Time (minutes)</Label>
                    <Input
                      id="workTime"
                      type="number"
                      value={settings.workTime}
                      onChange={(e) => setSettings({ ...settings, workTime: Number.parseInt(e.target.value) || 25 })}
                      min="1"
                      max="60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shortBreak">Short Break (minutes)</Label>
                    <Input
                      id="shortBreak"
                      type="number"
                      value={settings.shortBreak}
                      onChange={(e) => setSettings({ ...settings, shortBreak: Number.parseInt(e.target.value) || 5 })}
                      min="1"
                      max="30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longBreak">Long Break (minutes)</Label>
                    <Input
                      id="longBreak"
                      type="number"
                      value={settings.longBreak}
                      onChange={(e) => setSettings({ ...settings, longBreak: Number.parseInt(e.target.value) || 15 })}
                      min="1"
                      max="60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sessionsUntilLongBreak">Sessions until Long Break</Label>
                    <Input
                      id="sessionsUntilLongBreak"
                      type="number"
                      value={settings.sessionsUntilLongBreak}
                      onChange={(e) =>
                        setSettings({ ...settings, sessionsUntilLongBreak: Number.parseInt(e.target.value) || 4 })
                      }
                      min="2"
                      max="10"
                    />
                  </div>
                  <Button onClick={updateSettings} className="w-full">
                    Save Settings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Session Counter */}
          <div className="text-center">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Sessions Completed: {sessions}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Pomodoro Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Focus completely on one task during work sessions</li>
            <li>• Take short breaks to rest your mind</li>
            <li>• Use long breaks for more substantial rest</li>
            <li>• Turn off notifications during focus time</li>
            <li>• Track your progress and celebrate completed sessions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
