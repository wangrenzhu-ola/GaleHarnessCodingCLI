import { useState, useEffect } from "react"
import { usePR } from "../hooks/usePR"
import type { DerivedTask } from "../types"
import { StatusBadge } from "./StatusBadge"
import { cyberTheme } from "../theme"

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
}

function PRPanel({ taskId, prUrl }: { taskId: string; prUrl: string }) {
  const { pr, loading, error, fetchPR } = usePR(taskId, prUrl)

  useEffect(() => {
    fetchPR()
  }, [fetchPR])

  if (loading) return (
    <div style={{
      color: cyberTheme.neon.cyan,
      fontSize: 12,
      fontFamily: cyberTheme.font.mono,
      padding: "8px 0",
    }}>
      <span style={{ animation: "blink 1s infinite" }}>▌</span> FETCHING_PR_DATA...
    </div>
  )

  if (error) return (
    <div style={{
      color: cyberTheme.neon.red,
      fontSize: 12,
      fontFamily: cyberTheme.font.mono,
      padding: "8px 12px",
      background: `${cyberTheme.neon.red}10`,
      border: `1px solid ${cyberTheme.neon.red}40`,
      borderRadius: 4,
    }}>
      [ERROR] {error}
    </div>
  )

  if (!pr) return null

  const stateColor = pr.state === "open" ? cyberTheme.neon.green : pr.state === "merged" ? cyberTheme.neon.purple : cyberTheme.text.muted

  return (
    <div style={{
      marginTop: 12,
      padding: "12px 16px",
      background: cyberTheme.bg.secondary,
      borderRadius: 6,
      border: `1px solid ${cyberTheme.neon.cyan}30`,
      borderLeft: `3px solid ${cyberTheme.neon.cyan}`,
      boxShadow: `inset 0 0 20px ${cyberTheme.neon.cyan}10`,
    }}>
      <div style={{
        fontWeight: 600,
        fontSize: 13,
        marginBottom: 6,
        fontFamily: cyberTheme.font.mono,
      }}>
        <a
          href={prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cyber-link"
          style={{
            color: cyberTheme.neon.cyan,
            textDecoration: "none",
            textShadow: `0 0 10px ${cyberTheme.neon.cyan}80`,
          }}
        >
          #{prUrl.match(/\/pull\/(\d+)/)?.[1]} {pr.title}
        </a>
        {" "}
        <span style={{
          color: stateColor,
          fontSize: 10,
          fontWeight: 700,
          padding: "2px 6px",
          background: `${stateColor}20`,
          border: `1px solid ${stateColor}60`,
          borderRadius: 3,
          textTransform: "uppercase",
        }}>
          {pr.state}
        </span>
      </div>
      <div style={{
        fontSize: 11,
        color: cyberTheme.text.muted,
        fontFamily: cyberTheme.font.mono,
      }}>
        @{pr.author} · {formatTime(pr.created_at)}
      </div>
    </div>
  )
}

interface Props {
  task: DerivedTask
}

export function TaskCard({ task }: Props) {
  const [expanded, setExpanded] = useState(false)

  const hasDetails = task.error || task.pr_url || task.memories.length > 0 || task.parent_task_id

  return (
    <div
      className="task-card"
      style={{
        background: cyberTheme.bg.card,
        border: `1px solid ${cyberTheme.border.default}`,
        borderRadius: 8,
        padding: "16px 20px",
        marginBottom: 12,
        boxShadow: expanded ? cyberTheme.border.glow : "none",
        transition: "all 0.3s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Corner accent */}
      <div style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 40,
        height: 40,
        background: `linear-gradient(135deg, transparent 50%, ${cyberTheme.neon.cyan}20 50%)`,
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
            <StatusBadge status={task.status} />
            <span style={{
              fontSize: 12,
              color: cyberTheme.neon.magenta,
              fontFamily: cyberTheme.font.mono,
              fontWeight: 500,
              letterSpacing: "0.05em",
            }}>
              {task.skill}
            </span>
            <span style={{
              fontSize: 11,
              color: cyberTheme.text.muted,
              fontFamily: cyberTheme.font.mono,
              padding: "2px 8px",
              background: cyberTheme.bg.secondary,
              borderRadius: 3,
            }}>
              {task.project}
            </span>
          </div>

          {task.title && (
            <div style={{
              marginTop: 8,
              fontWeight: 600,
              fontSize: 15,
              color: cyberTheme.text.glow,
              textShadow: `0 0 20px ${cyberTheme.neon.cyan}30`,
              letterSpacing: "0.02em",
            }}>
              {task.title}
            </div>
          )}

          <div style={{
            marginTop: 10,
            fontSize: 12,
            color: cyberTheme.text.secondary,
            fontFamily: cyberTheme.font.mono,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{ color: cyberTheme.neon.cyan }}>◷</span>
            {formatTime(task.started_at)}
            {task.completed_at && (
              <>
                <span style={{ color: cyberTheme.text.muted }}>→</span>
                <span style={{ color: cyberTheme.neon.green }}>◷</span>
                {formatTime(task.completed_at)}
              </>
            )}
          </div>
        </div>

        {hasDetails && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="expand-btn"
            style={{
              background: expanded ? `${cyberTheme.neon.cyan}20` : cyberTheme.bg.secondary,
              border: `1px solid ${expanded ? cyberTheme.neon.cyan : cyberTheme.border.default}`,
              borderRadius: 4,
              cursor: "pointer",
              padding: "6px 12px",
              fontSize: 11,
              color: expanded ? cyberTheme.neon.cyan : cyberTheme.text.secondary,
              fontFamily: cyberTheme.font.mono,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              flexShrink: 0,
              boxShadow: expanded ? `0 0 10px ${cyberTheme.neon.cyan}40` : "none",
              transition: "all 0.2s",
            }}
          >
            {expanded ? "[收起]" : "[详情]"}
          </button>
        )}
      </div>

      {expanded && (
        <div style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: `1px solid ${cyberTheme.border.default}`,
        }}>
          {/* Timeline */}
          <div style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: cyberTheme.neon.cyan,
              marginBottom: 8,
              fontFamily: cyberTheme.font.mono,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <span>◈</span>
              执行时间线
            </div>
            <div style={{
              fontSize: 12,
              color: cyberTheme.text.secondary,
              fontFamily: cyberTheme.font.mono,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              padding: "10px 12px",
              background: cyberTheme.bg.secondary,
              borderRadius: 4,
              borderLeft: `2px solid ${cyberTheme.neon.cyan}`,
            }}>
              <div>
                <span style={{ color: cyberTheme.neon.cyan }}>STARTED</span>
                <span style={{ color: cyberTheme.text.muted, margin: "0 8px" }}>→</span>
                {formatTime(task.started_at)}
              </div>
              {(task.status === "completed" || task.status === "failed") && task.completed_at && (
                <div>
                  <span style={{ color: task.status === "failed" ? cyberTheme.neon.red : cyberTheme.neon.green }}>
                    {task.status === "failed" ? "FAILED" : "COMPLETED"}
                  </span>
                  <span style={{ color: cyberTheme.text.muted, margin: "0 8px" }}>→</span>
                  {formatTime(task.completed_at)}
                </div>
              )}
              {task.status === "stale" && (
                <div>
                  <span style={{ color: cyberTheme.neon.orange }}>STALE</span>
                  <span style={{ color: cyberTheme.text.muted, margin: "0 8px" }}>→</span>
                  执行超时未结束
                </div>
              )}
            </div>
          </div>

          {task.error && (
            <div style={{
              padding: "12px 16px",
              background: `${cyberTheme.neon.red}10`,
              border: `1px solid ${cyberTheme.neon.red}50`,
              borderRadius: 6,
              fontSize: 13,
              color: cyberTheme.neon.red,
              marginBottom: 12,
              fontFamily: cyberTheme.font.mono,
              boxShadow: `inset 0 0 20px ${cyberTheme.neon.red}10`,
            }}>
              <div style={{ fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Error</div>
              {task.error}
            </div>
          )}

          {task.pr_url && <PRPanel taskId={task.task_id} prUrl={task.pr_url} />}

          {task.memories.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: cyberTheme.neon.magenta,
                marginBottom: 8,
                fontFamily: cyberTheme.font.mono,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span>◈</span>
                知识沉淀
              </div>
              {task.memories.map((m, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 12,
                    color: cyberTheme.text.secondary,
                    padding: "8px 12px",
                    marginBottom: 6,
                    background: cyberTheme.bg.secondary,
                    borderLeft: `2px solid ${cyberTheme.neon.magenta}`,
                    fontFamily: cyberTheme.font.mono,
                  }}
                >
                  {m.memory_title}
                </div>
              ))}
            </div>
          )}

          {task.parent_task_id && (
            <div style={{
              marginTop: 12,
              fontSize: 11,
              color: cyberTheme.text.muted,
              fontFamily: cyberTheme.font.mono,
              padding: "8px 12px",
              background: cyberTheme.bg.secondary,
              borderRadius: 4,
            }}>
              <span style={{ color: cyberTheme.neon.purple }}>Parent:</span>{" "}
              <code style={{
                color: cyberTheme.neon.cyan,
                background: `${cyberTheme.neon.cyan}10`,
                padding: "2px 6px",
                borderRadius: 3,
              }}>
                {task.parent_task_id.slice(0, 8)}…
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
