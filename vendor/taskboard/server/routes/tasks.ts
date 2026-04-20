import { Hono } from "hono"
import { readAndMergeTasks } from "../lib/events-reader.ts"
import { getCached, setCached, type PRData } from "../lib/pr-cache.ts"

const tasks = new Hono()

tasks.get("/", async (c) => {
  const allTasks = await readAndMergeTasks()
  return c.json({ tasks: allTasks })
})

// GET /api/tasks/:id/pr — fetch GitHub PR data for a task
tasks.get("/:id/pr", async (c) => {
  const taskId = c.req.param("id")
  const allTasks = await readAndMergeTasks()
  const task = allTasks.find((t) => t.task_id === taskId)

  if (!task) {
    return c.json({ error: "Task not found" }, 404)
  }
  if (!task.pr_url) {
    return c.json({ error: "Task has no linked PR" }, 404)
  }

  const prUrl = task.pr_url

  // Check cache first
  const cached = getCached(prUrl)
  if (cached) {
    return c.json({ pr: cached })
  }

  // Parse PR URL: https://github.com/{owner}/{repo}/pull/{number}
  const match = prUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/)
  if (!match) {
    return c.json({ error: "Invalid PR URL format" }, 422)
  }
  const [, owner, repo, prNumber] = match

  // Validate owner/repo to prevent injection
  const safeSegment = /^[a-zA-Z0-9_.\-]+$/
  if (!safeSegment.test(owner) || !safeSegment.test(repo)) {
    return c.json({ error: "Invalid PR URL format" }, 422)
  }

  // Fetch via gh CLI
  let prData: PRData
  try {
    const proc = Bun.spawn(
      ["gh", "api", `repos/${owner}/${repo}/pulls/${prNumber}`],
      { stdout: "pipe", stderr: "pipe" }
    )
    const stdout = await new Response(proc.stdout).text()
    const exitCode = await proc.exited

    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text()
      console.error(`gh api failed (exit ${exitCode}): ${stderr.trim()}`)
      return c.json({ error: "Failed to fetch PR data from GitHub" }, 502)
    }

    const raw = JSON.parse(stdout) as {
      title?: string
      state?: string
      user?: { login?: string }
      created_at?: string
    }

    prData = {
      title: raw.title ?? "",
      state: raw.state ?? "unknown",
      author: raw.user?.login ?? "unknown",
      created_at: raw.created_at ?? "",
    }
  } catch (err) {
    console.error("PR fetch error:", err)
    return c.json({ error: "Failed to fetch PR data" }, 502)
  }

  setCached(prUrl, prData)
  return c.json({ pr: prData })
})

export default tasks
