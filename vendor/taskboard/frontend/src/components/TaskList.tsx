import { useState, useMemo } from "react"
import type { DerivedTask, TaskStatus } from "../types"
import { TaskCard } from "./TaskCard"
import { cyberTheme } from "../theme"

interface Props {
  tasks: DerivedTask[]
}

const ALL_STATUSES: TaskStatus[] = ["in_progress", "completed", "failed", "stale"]
const STATUS_LABELS: Record<TaskStatus, string> = {
  in_progress: "运行中",
  completed: "已完成",
  failed: "失败",
  stale: "超时",
}

const statusColors: Record<TaskStatus, string> = {
  in_progress: cyberTheme.neon.cyan,
  completed: cyberTheme.neon.green,
  failed: cyberTheme.neon.red,
  stale: cyberTheme.neon.orange,
}

export function TaskList({ tasks }: Props) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all")
  const [skillFilter, setSkillFilter] = useState<string>("all")

  const skills = useMemo(() => {
    const set = new Set<string>()
    for (const t of tasks) {
      if (t.skill && t.skill !== "unknown") set.add(t.skill)
    }
    return Array.from(set).sort()
  }, [tasks])

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false
      if (skillFilter !== "all" && t.skill !== skillFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          t.title.toLowerCase().includes(q) ||
          t.project.toLowerCase().includes(q) ||
          t.skill.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [tasks, search, statusFilter, skillFilter])

  // Group by project
  const grouped = useMemo(() => {
    const map = new Map<string, DerivedTask[]>()
    for (const task of filtered) {
      const list = map.get(task.project) ?? []
      list.push(task)
      map.set(task.project, list)
    }
    return map
  }, [filtered])

  return (
    <div>
      {/* Filter bar */}
      <div style={{
        display: "flex",
        gap: 16,
        marginBottom: 28,
        flexWrap: "wrap",
        alignItems: "center",
        padding: "16px 20px",
        background: cyberTheme.bg.card,
        border: `1px solid ${cyberTheme.border.default}`,
        borderRadius: 8,
        boxShadow: cyberTheme.border.glow,
      }}>
        <div style={{
          position: "relative",
          flex: 1,
          minWidth: 240,
        }}>
          <span style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: cyberTheme.neon.cyan,
            fontFamily: cyberTheme.font.mono,
            fontSize: 14,
          }}>
            &gt;
          </span>
          <input
            type="text"
            placeholder="搜索任务、项目、技能..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 28px",
              background: cyberTheme.bg.secondary,
              border: `1px solid ${cyberTheme.border.default}`,
              borderRadius: 6,
              fontSize: 14,
              outline: "none",
              color: cyberTheme.text.primary,
              fontFamily: cyberTheme.font.mono,
              transition: "all 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = cyberTheme.neon.cyan
              e.target.style.boxShadow = `0 0 10px ${cyberTheme.neon.cyan}40`
            }}
            onBlur={(e) => {
              e.target.style.borderColor = cyberTheme.border.default
              e.target.style.boxShadow = "none"
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <FilterButton
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
            color={cyberTheme.neon.magenta}
          >
            全部
          </FilterButton>
          {ALL_STATUSES.map((s) => (
            <FilterButton
              key={s}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
              color={statusColors[s]}
            >
              {STATUS_LABELS[s]}
            </FilterButton>
          ))}
        </div>
        <div>
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            style={{
              padding: "8px 28px 8px 12px",
              borderRadius: 4,
              border: `1px solid ${cyberTheme.border.default}`,
              background: cyberTheme.bg.secondary,
              color: skillFilter === "all" ? cyberTheme.text.secondary : cyberTheme.neon.cyan,
              fontFamily: cyberTheme.font.mono,
              fontSize: 13,
              cursor: "pointer",
              outline: "none",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23606080' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = cyberTheme.neon.cyan
            }}
            onBlur={(e) => {
              e.target.style.borderColor = cyberTheme.border.default
            }}
          >
            <option value="all">全部技能</option>
            {skills.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "80px 0",
          color: cyberTheme.text.muted,
          fontFamily: cyberTheme.font.mono,
        }}>
          <div style={{
            fontSize: 48,
            marginBottom: 16,
            opacity: 0.3,
          }}>
            ◈
          </div>
          {tasks.length === 0 ? (
            <>
              <div style={{ color: cyberTheme.neon.cyan, marginBottom: 8 }}>NO_DATA_FOUND</div>
              <div style={{ fontSize: 13 }}>运行 gh: 技能后，执行记录将自动同步至此</div>
            </>
          ) : (
            <>
              <div style={{ color: cyberTheme.neon.orange, marginBottom: 8 }}>NO_MATCHING_RECORDS</div>
              <div style={{ fontSize: 13 }}>没有匹配的任务</div>
            </>
          )}
        </div>
      )}

      {[...grouped.entries()].map(([project, projectTasks]) => (
        <div key={project} style={{ marginBottom: 32 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: `1px solid ${cyberTheme.neon.purple}40`,
          }}>
            <div style={{
              width: 8,
              height: 8,
              background: cyberTheme.neon.purple,
              boxShadow: `0 0 10px ${cyberTheme.neon.purple}`,
            }} />
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: cyberTheme.neon.purple,
              fontFamily: cyberTheme.font.mono,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}>
              {project}
            </div>
            <div style={{
              padding: "2px 8px",
              background: `linear-gradient(90deg, ${cyberTheme.neon.purple}20, transparent)`,
              borderLeft: `2px solid ${cyberTheme.neon.purple}`,
              fontSize: 12,
              color: cyberTheme.text.secondary,
              fontFamily: cyberTheme.font.mono,
            }}>
              {String(projectTasks.length).padStart(2, "0")} TASKS
            </div>
          </div>
          {projectTasks.map((t) => <TaskCard key={t.task_id} task={t} />)}
        </div>
      ))}
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  color: string
}) {
  return (
    <button
      onClick={onClick}
      className="filter-btn"
      style={{
        padding: "8px 16px",
        borderRadius: 4,
        border: `1px solid ${active ? color : cyberTheme.border.default}`,
        backgroundColor: active ? `${color}20` : cyberTheme.bg.secondary,
        color: active ? color : cyberTheme.text.secondary,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        fontFamily: cyberTheme.font.mono,
        letterSpacing: "0.05em",
        boxShadow: active ? `0 0 10px ${color}40, inset 0 0 10px ${color}10` : "none",
        transition: "all 0.2s",
        "--hover-color": color,
      } as React.CSSProperties}
    >
      {children}
    </button>
  )
}
