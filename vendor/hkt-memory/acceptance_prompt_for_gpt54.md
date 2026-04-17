# HKTMemory v5.2.0 最终验收提示词（供 GPT-5.4 / Claude 使用）

## 项目背景

仓库：`https://github.com/wangrenzhu-ola/HKTMemory`
分支：`feat/openvikings-agent-gaps`
Tag：`v5.2.0`
计划文档：`docs/plans/hktmemory-openvikings-agent-plan.md`

本次实现了 OpenVikings Agent 差距闭合计划的全部 8 个任务（P0/P1/P2），请你作为最终验收方，使用 **gstack 技能集**（`/browse`、`/canary`、`/benchmark`、`/health`、`/qa` 等）进行系统性验收。

---

## 已实施任务清单

### P0（关键缺口）
- **TASK-01**：生命周期链路端到端验证与修复
  - stats 输出包含 `lifecycle.statuses`（active/disabled/archived/deleted）
  - `forget` 默认软删除（disabled），`--force` 硬删除（deleted）
  - `cleanup --dry-run` 返回预览结果
  - MCP `memory_forget` 走软删除语义
- **TASK-02**：MCP 工具端到端集成测试
  - 9 个核心工具覆盖通过（`tests/test_mcp_integration.py`）
  - MCP server 支持 JSON-RPC 2.0 / `tools/call` 格式
-  - capabilities 版本为 `HKT-Memory v5` / `5.1.0`
- **TASK-03**：Auto-Capture / Auto-Recall（Claude Code 钩子集成）
  - `hooks/auto_recall.py` + `hooks/auto_capture.py`
  - `.claude/settings.json` 配置了 `PreCompact` 和 `PostToolUse`
- **TASK-04**：噪声预过滤
  - `filters/noise_filter.py` 拦截问候语/确认词/emoji/重复字符
  - stats 展示 `filter_count`

### P1（重要缺口）
- **TASK-05**：REST API 端点对齐
  - `mcp/server.py` 新增 `/store`、`/recall`、`/forget`、`/stats`
  - CLI 新增 `serve` 子命令
- **TASK-06**：实体关系提取最小可行版（Knowledge Graph MVP）
  - `extractors/l1_extractor.py` 支持 `triples` + `valid_until`
  - `graph/entity_index.py` SQLite 实体索引
  - `retrieve --entity <name>` 可按实体过滤
  - 过期事实标注 `⚠️ 已过期`
- **TASK-07**：结构化反射/自改进管道
  - `governance/reflection_analyzer.py`
  - `feedback --label useful` 在 `access_count >= 3` 时触发，写入 `governance/SKILLS.md`

### P2（增强缺口）
- **TASK-08**：SQLite 向量索引后端
  - `vector_store/sqlite_backend.py`（可选 faiss 加速）
  - `config/default.json` 支持 `"vector_backend": "sqlite"`
  - `sync --rebuild-index` 可重建索引

---

## 验收要求

请你按以下顺序执行验收，**优先使用 gstack 技能**进行真实测试：

### 1. 静态代码健康检查（`/health`）
运行项目内置的 type checker / linter / test runner，确认全部通过。

### 2. MCP 端到端功能验收（`/browse` + `/qa`）
1. 启动 MCP HTTP server：`uv run scripts/hkt_memory_v5.py serve --port 8765`
2. 使用 `/browse` 或 curl 验证以下端点返回正确 JSON：
   - `POST /store` → 存储记忆，返回 `success: true`
   - `POST /recall` → 返回记忆列表
   - `GET /stats` → 包含 `lifecycle.statuses` 和 `filter_count`
   - `POST /forget` → 软删除语义验证
3. 使用 `/qa` 对 MCP server 做一轮功能回归，生成结构化报告。

### 3. Claude Code 钩子验收（`/browse` 模拟）
1. 检查 `.claude/settings.json` 存在且钩子配置正确。
2. 手动执行 `python hooks/auto_recall.py`（设置 `HKT_QUERY` 环境变量），验证输出为 Markdown 记忆块，且问候语（如 "你好"）不触发输出。
3. 手动执行 `python hooks/auto_capture.py`，验证低信息内容被过滤、正常内容写入 `session:<id>` scope。

### 4. 知识图谱与反射管道验收（`/qa` 或手动）
1. 存储一条包含实体的记忆（如 "张三是工程师"），然后执行 `retrieve --entity 张三`，验证能召回该记忆。
2. 对同一记忆反复 `feedback --label useful` 3 次以上，验证 `governance/SKILLS.md` 出现新 skill 条目。

### 5. SQLite 向量后端验收（`/benchmark`）
1. 修改 `config/default.json` 中 `"vector_backend": "sqlite"`。
2. 运行 `sync --rebuild-index`，验证无报错。
3. 使用 `/benchmark` 或脚本测试 retrieve 延迟，报告 P95 延迟（1000 条规模下目标是 < 200ms；当前数据集较小，报告实际值即可）。

### 6. 生产部署健康检查（`/canary`）
如果 MCP server 已部署到某个线上地址，请用 `/canary` 监控 3 分钟，检查无 console error 和 5xx。

---

## 输出格式

请输出一份 **验收报告**，包含：
1. **总体结论**：PASS / PARTIAL PASS / FAIL
2. **逐任务验收结果**：每项的验证方式、实际结果、状态
3. **gstack 技能调用日志**：使用了哪些技能、关键输出截图/摘要
4. **发现的问题列表**：如果有阻塞性问题请标注 `BLOCKER`
5. **修复建议**（如有）

---

## 约束

- 不要修改代码，只做验证和报告。
- 如果测试需要修改 `config/default.json` 做临时切换，测试后请恢复原值。
- 验收中遇到任何失败，请先记录复现步骤，再给出修复建议。
