import type { TaskStatus } from "../types"
import { cyberTheme } from "../theme"

const labels: Record<TaskStatus, string> = {
  in_progress: "RUNNING",
  completed: "DONE",
  failed: "ERROR",
  stale: "STALE",
}

const cyberColors: Record<TaskStatus, { bg: string; glow: string; border: string }> = {
  in_progress: {
    bg: "rgba(0, 255, 255, 0.15)",
    glow: cyberTheme.neon.cyan,
    border: cyberTheme.neon.cyan,
  },
  completed: {
    bg: "rgba(0, 255, 136, 0.15)",
    glow: cyberTheme.neon.green,
    border: cyberTheme.neon.green,
  },
  failed: {
    bg: "rgba(255, 0, 68, 0.15)",
    glow: cyberTheme.neon.red,
    border: cyberTheme.neon.red,
  },
  stale: {
    bg: "rgba(255, 136, 0, 0.15)",
    glow: cyberTheme.neon.orange,
    border: cyberTheme.neon.orange,
  },
}

interface Props {
  status: TaskStatus
}

export function StatusBadge({ status }: Props) {
  const colors = cyberColors[status]

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        color: colors.glow,
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        boxShadow: `0 0 8px ${colors.glow}40, inset 0 0 8px ${colors.glow}20`,
        fontFamily: cyberTheme.font.mono,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}
    >
      {labels[status]}
    </span>
  )
}
