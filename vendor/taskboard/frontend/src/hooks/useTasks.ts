import { useState, useEffect, useCallback } from "react"
import type { DerivedTask } from "../types"

export function useTasks() {
  const [tasks, setTasks] = useState<DerivedTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { tasks: DerivedTask[] }
      setTasks(data.tasks)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
    const interval = setInterval(fetchTasks, 5000)
    return () => clearInterval(interval)
  }, [fetchTasks])

  return { tasks, loading, error, refetch: fetchTasks }
}
