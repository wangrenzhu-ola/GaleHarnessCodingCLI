import { Hono } from "hono"
import { cors } from "hono/cors"
import { serveStatic } from "hono/bun"
import tasks from "./routes/tasks.ts"

const app = new Hono()

app.use("/api/*", cors({
  origin: "http://localhost:5173",
  allowMethods: ["GET", "OPTIONS"],
}))

app.route("/api/tasks", tasks)

// Serve built frontend in production
app.use("/*", serveStatic({ root: "./dist" }))

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: "Internal server error" }, 500)
})

const port = parseInt(process.env.BOARD_PORT ?? "4321")

export default {
  port,
  hostname: "127.0.0.1",
  fetch: app.fetch,
}
