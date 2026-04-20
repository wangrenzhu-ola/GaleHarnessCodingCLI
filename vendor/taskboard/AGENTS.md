# GaleHarness 任务看板

本地研发任务看板，展示所有项目中 gh: 技能的执行记录。

## 启动

```bash
bun install
bun run board      # 生产模式，访问 http://localhost:4321
bun run dev        # 开发模式（热更新），服务端 :4321，前端 :5173
```

## 数据文件

任务事件数据库：`~/.galeharness/tasks.db`（SQLite，由 GaleHarnessCLI 平台层写入，本 board 只读）

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `BOARD_PORT` | `4321` | 服务端口 |
| `BOARD_STALE_HOURS` | `2` | in_progress 任务超过此小时数标记为 stale |

## 技术栈

- 服务端：Hono + Bun
- 前端：React 18 + Vite 5
- 数据：`~/.galeharness/tasks.db`（SQLite，只读）

## 知识沉淀

`docs/solutions/` 存放已记录的问题解决方案与最佳实践（按 category 组织，带 YAML frontmatter），涉及相关模块时可作为参考。
