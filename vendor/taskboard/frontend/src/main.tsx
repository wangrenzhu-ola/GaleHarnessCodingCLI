import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { useTasks } from "./hooks/useTasks"
import { TaskList } from "./components/TaskList"
import { cyberTheme } from "./theme"

function App() {
  const { tasks, loading, error } = useTasks()

  return (
    <div style={{
      maxWidth: 1000,
      margin: "0 auto",
      padding: "32px 24px",
      fontFamily: cyberTheme.font.sans,
      color: cyberTheme.text.primary,
      minHeight: "100vh",
    }}>
      {/* Scanline overlay */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.02) 2px, rgba(0, 255, 255, 0.02) 4px)",
        pointerEvents: "none",
        zIndex: 1000,
      }} />

      <header style={{ marginBottom: 32, position: "relative" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 8,
        }}>
          <div style={{
            width: 12,
            height: 12,
            background: cyberTheme.neon.cyan,
            boxShadow: `0 0 10px ${cyberTheme.neon.cyan}, 0 0 20px ${cyberTheme.neon.cyan}`,
          }} />
          <h1 style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            color: cyberTheme.text.glow,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            textShadow: `0 0 10px ${cyberTheme.neon.cyan}, 0 0 20px ${cyberTheme.neon.cyan}, 0 0 40px ${cyberTheme.neon.purple}`,
            fontFamily: cyberTheme.font.mono,
          }}>
            GaleHarness // Task_Board
          </h1>
        </div>
        <p style={{
          margin: 0,
          fontSize: 13,
          color: cyberTheme.text.secondary,
          fontFamily: cyberTheme.font.mono,
          letterSpacing: "0.05em",
        }}>
          <span style={{ color: cyberTheme.neon.cyan }}>&gt;</span> 监控所有 gh: 技能执行 · 每 5 秒同步
          {error && (
            <span style={{
              color: cyberTheme.neon.red,
              marginLeft: 12,
              textShadow: `0 0 10px ${cyberTheme.neon.red}`,
            }}>
              [ERROR] {error}
            </span>
          )}
        </p>
      </header>

      {loading ? (
        <div style={{
          textAlign: "center",
          padding: "80px 0",
          color: cyberTheme.neon.cyan,
          fontFamily: cyberTheme.font.mono,
        }}>
          <div>INITIALIZING...</div>
        </div>
      ) : (
        <TaskList tasks={tasks} />
      )}
    </div>
  )
}

const rootElement = document.getElementById("root")
if (rootElement) {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}
