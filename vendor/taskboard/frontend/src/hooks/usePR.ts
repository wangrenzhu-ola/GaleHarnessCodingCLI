import { useState, useCallback } from "react"
import type { PRData } from "../types"

const cache = new Map<string, PRData>()

export function usePR(taskId: string, prUrl: string) {
  const [pr, setPR] = useState<PRData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    if (cache.has(prUrl)) {
      setPR(cache.get(prUrl)!)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/tasks/${taskId}/pr`)
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json() as { pr: PRData }
      cache.set(prUrl, data.pr)
      setPR(data.pr)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch PR")
    } finally {
      setLoading(false)
    }
  }, [taskId, prUrl])

  return { pr, loading, error, fetchPR: fetch_ }
}
