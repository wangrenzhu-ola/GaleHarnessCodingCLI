#!/usr/bin/env python3
# /// script
# requires-python = ">=3.9"
# dependencies = [
#     "flask>=3.0.0",
#     "openai>=1.0.0",
#     "requests>=2.31.0",
#     "tqdm>=4.66.0",
#     "numpy>=1.24.0",
# ]
# ///
"""
HKT-Memory v5.0 - 自动分层存储系统

核心特性：
- L2 写入后自动触发 L1/L0 生成
- 使用 LLM 智能提取摘要
- 真正的三层文件系统

环境变量:
    HKT_MEMORY_DIR: 记忆存储目录（默认: ./memory）
    ZHIPU_API_KEY: 智谱 AI API Key（用于 L1 摘要提取）
    OPENAI_API_KEY: OpenAI API Key（可选）
    MINIMAX_API_KEY: MiniMax API Key（可选）
    L1_EXTRACTOR_PROVIDER: 摘要提取器提供商 (zhipu/openai/minimax)

使用方法:
    # 基础存储（自动触发三层）
    uv run scripts/hkt_memory_v5.py store --content "长文本..." --layer all
    
    # 仅存储 L2
    uv run scripts/hkt_memory_v5.py store --content "文本..." --layer L2
    
    # 全量同步（重新生成所有 L1/L0）
    uv run scripts/hkt_memory_v5.py sync --full
    
    # 检索
    uv run scripts/hkt_memory_v5.py retrieve --query "关键词" --layer all
"""

import argparse
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Any

# 添加项目路径
SCRIPT_DIR = Path(__file__).parent.parent.absolute()
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from layers.manager_v5 import LayerManagerV5
from config.loader import ConfigLoader


class HKTMv5:
    """HKT-Memory v5.0 主类"""
    
    def __init__(self, memory_dir: str = None, llm_provider: str = None):
        self.memory_dir = Path(memory_dir or os.environ.get("HKT_MEMORY_DIR", "memory"))
        self.memory_dir.mkdir(parents=True, exist_ok=True)
        self.config = ConfigLoader(SCRIPT_DIR).load()
        
        # 初始化分层管理器
        self.layers = LayerManagerV5(
            base_path=self.memory_dir,
            llm_provider=llm_provider or os.getenv("L1_EXTRACTOR_PROVIDER", "zhipu"),
            config=self.config
        )
    
    def store(self, 
              content: str, 
              title: str = "", 
              topic: str = "general",
              layer: str = "L2",
              metadata: Dict = None,
              auto_extract: bool = True) -> Dict[str, str]:
        """
        存储记忆
        
        Args:
            content: 内容
            title: 标题
            topic: 主题
            layer: 目标层 (L0/L1/L2/all)
            metadata: 元数据
            auto_extract: 是否自动提取（layer=all 时）
        """
        return self.layers.store(
            content=content,
            title=title,
            topic=topic,
            layer=layer,
            metadata=metadata,
            auto_extract=auto_extract
        )
    
    def retrieve(self,
                 query: str,
                 layer: str = "all",
                 topic: str = None,
                 limit: int = 10,
                 min_similarity: float = None,
                 vector_weight: float = None,
                 bm25_weight: float = None,
                 debug: bool = False,
                 entity: str = None) -> Dict[str, List[Dict]]:
        """检索记忆"""
        return self.layers.retrieve(
            query=query,
            layer=layer,
            topic=topic,
            limit=limit,
            min_similarity=min_similarity,
            vector_weight=vector_weight,
            bm25_weight=bm25_weight,
            debug=debug,
            entity=entity,
        )
    
    def sync(self, full: bool = False, rebuild_index: bool = False):
        """同步各层"""
        if full:
            result = self.layers.sync_layers(full_sync=True)
        else:
            result = {
                "success": True,
                "message": "未执行全量同步",
                "incremental_sync": {"success": False, "message": "增量同步暂未实现"},
            }
        if rebuild_index and hasattr(self.layers.vector_store, "rebuild_from_files"):
            entries = self.layers.l2.iter_entries()
            index_result = self.layers.vector_store.rebuild_from_files(entries)
            result["rebuild_index"] = index_result
            result["success"] = bool(result.get("success", True) and index_result.get("success", False))
        return result
    
    def stats(self) -> Dict[str, Any]:
        """获取统计"""
        return self.layers.get_stats()

    def forget(self, memory_id: str, force: bool = False) -> Dict[str, Any]:
        return self.layers.forget(memory_id=memory_id, force=force)

    def restore(self, memory_id: str) -> Dict[str, Any]:
        return self.layers.restore(memory_id=memory_id)

    def cleanup(self, dry_run: bool = False, scope: str = None) -> Dict[str, Any]:
        return self.layers.cleanup(dry_run=dry_run, scope=scope)

    def pin(self, memory_id: str, pinned: bool) -> Dict[str, Any]:
        return self.layers.set_pinned(memory_id=memory_id, pinned=pinned)

    def set_importance(self, memory_id: str, importance: str) -> Dict[str, Any]:
        return self.layers.set_importance(memory_id=memory_id, importance=importance)

    def feedback(
        self,
        label: str,
        memory_id: str = None,
        topic: str = None,
        query: str = None,
        note: str = "",
    ) -> Dict[str, Any]:
        return self.layers.feedback(
            label=label,
            memory_id=memory_id,
            topic=topic,
            query=query,
            note=note,
        )

    def rebuild(self, include_archived: bool = False) -> Dict[str, Any]:
        return self.layers.rebuild_aggregates(include_archived=include_archived)

    def ingest_artifact(
        self,
        content: str,
        source_mode: str,
        artifact_type: str,
        title: str = "",
        topic: str = "closeout",
        artifact_id: str = None,
        source_uri: str = None,
        layer: str = "L2",
        auto_extract: bool = False,
    ) -> Dict[str, Any]:
        return self.layers.ingest_artifact(
            content=content,
            source_mode=source_mode,
            artifact_type=artifact_type,
            title=title,
            topic=topic,
            artifact_id=artifact_id,
            source_uri=source_uri,
            layer=layer,
            auto_extract=auto_extract,
        )

    def conflict_scan(self, output_path: str = None) -> Dict[str, Any]:
        return self.layers.scan_conflicts(output_path=output_path)


def main():
    parser = argparse.ArgumentParser(
        prog="hkt-memory-v5.0",
        description="HKT-Memory v5.0 - 自动分层存储系统"
    )
    
    parser.add_argument(
        "--memory-dir",
        default=os.getenv("HKT_MEMORY_DIR", "memory"),
        help="记忆存储目录"
    )
    parser.add_argument(
        "--llm-provider",
        default=os.getenv("L1_EXTRACTOR_PROVIDER", "zhipu"),
        choices=["zhipu", "openai", "minimax"],
        help="LLM 提供商"
    )
    
    subparsers = parser.add_subparsers(dest="command", help="命令")
    
    # Store command
    store_parser = subparsers.add_parser("store", help="存储记忆")
    store_parser.add_argument("--content", "-c", required=True, help="内容")
    store_parser.add_argument("--title", "-t", default="", help="标题")
    store_parser.add_argument("--topic", default="general", help="主题")
    store_parser.add_argument(
        "--layer", 
        choices=["L0", "L1", "L2", "all"], 
        default="all",
        help="目标层（默认: all，自动触发三层）"
    )
    store_parser.add_argument(
        "--no-extract", 
        action="store_true",
        help="禁用自动提取（仅当 layer=all 时有效）"
    )
    store_parser.add_argument(
        "--importance",
        choices=["high", "medium", "low"],
        default="medium",
        help="重要性"
    )
    store_parser.add_argument("--pinned", action="store_true", help="创建后立即 pin")
    
    # Retrieve command
    retrieve_parser = subparsers.add_parser("retrieve", help="检索记忆")
    retrieve_parser.add_argument("--query", "-q", required=True, help="查询")
    retrieve_parser.add_argument(
        "--layer",
        choices=["L0", "L1", "L2", "all"],
        default="all",
        help="目标层"
    )
    retrieve_parser.add_argument("--topic", help="主题过滤")
    retrieve_parser.add_argument("--limit", "-n", type=int, default=10, help="数量限制")
    retrieve_parser.add_argument("--min-similarity", type=float, help="向量召回最小相似度阈值")
    retrieve_parser.add_argument("--vector-weight", type=float, help="混合召回中的向量权重")
    retrieve_parser.add_argument("--bm25-weight", type=float, help="混合召回中的 BM25 权重")
    retrieve_parser.add_argument("--debug", action="store_true", help="输出命中解释与召回细节")
    retrieve_parser.add_argument("--entity", help="按实体名过滤检索")

    # Sync command
    sync_parser = subparsers.add_parser("sync", help="同步各层")
    sync_parser.add_argument(
        "--full",
        action="store_true",
        help="全量同步（重新生成所有 L1/L0）"
    )
    sync_parser.add_argument(
        "--rebuild-index",
        action="store_true",
        help="从文件系统重建向量索引"
    )
    
    # Stats command
    subparsers.add_parser("stats", help="显示统计")

    forget_parser = subparsers.add_parser("forget", help="遗忘记忆")
    forget_parser.add_argument("--memory-id", required=True, help="记忆ID")
    forget_parser.add_argument("--force", action="store_true", help="执行硬删除")

    restore_parser = subparsers.add_parser("restore", help="恢复记忆")
    restore_parser.add_argument("--memory-id", required=True, help="记忆ID")

    cleanup_parser = subparsers.add_parser("cleanup", help="清理事件日志")
    cleanup_parser.add_argument("--dry-run", action="store_true", help="仅预览，不执行删除")
    cleanup_parser.add_argument("--scope", help="可选的 scope 过滤")

    pin_parser = subparsers.add_parser("pin", help="设置 pinned 状态")
    pin_parser.add_argument("--memory-id", required=True, help="记忆ID")
    pin_parser.add_argument(
        "--value",
        choices=["true", "false"],
        default="true",
        help="是否置顶"
    )

    importance_parser = subparsers.add_parser("importance", help="设置重要性")
    importance_parser.add_argument("--memory-id", required=True, help="记忆ID")
    importance_parser.add_argument(
        "--value",
        choices=["high", "medium", "low"],
        required=True,
        help="目标重要性"
    )

    feedback_parser = subparsers.add_parser("feedback", help="记录 useful/wrong/missing 反馈")
    feedback_parser.add_argument(
        "--label",
        choices=["useful", "wrong", "missing"],
        required=True,
        help="反馈标签"
    )
    feedback_parser.add_argument("--memory-id", help="关联的记忆ID")
    feedback_parser.add_argument("--topic", help="关联主题，missing 时推荐提供")
    feedback_parser.add_argument("--query", help="反馈对应的检索 query")
    feedback_parser.add_argument("--note", default="", help="补充说明")

    rebuild_parser = subparsers.add_parser("rebuild", help="物理重建并压缩 L0/L1 聚合文件")
    rebuild_parser.add_argument("--include-archived", action="store_true", help="是否包含 archived 记忆")

    ingest_parser = subparsers.add_parser("ingest-artifact", help="统一入口写入 governed/compound 产物")
    ingest_parser.add_argument("--content", help="产物文本内容")
    ingest_parser.add_argument("--content-file", help="从文件读取产物内容")
    ingest_parser.add_argument("--source-mode", choices=["governed", "compound"], required=True, help="来源模式")
    ingest_parser.add_argument("--artifact-type", required=True, help="产物类型，如 spec/checklist/tasks/implementation/decision")
    ingest_parser.add_argument("--title", default="", help="标题")
    ingest_parser.add_argument("--topic", default="closeout", help="主题")
    ingest_parser.add_argument("--artifact-id", help="可选业务主键")
    ingest_parser.add_argument("--source-uri", help="可选来源 URI（文件路径/PR URL/Issue）")
    ingest_parser.add_argument("--layer", choices=["L0", "L1", "L2", "all"], default="L2", help="写入层")
    ingest_parser.add_argument("--auto-extract", action="store_true", help="是否自动提取 L1/L0")

    conflict_parser = subparsers.add_parser("conflict-scan", help="扫描冲突并输出 MEMORY_CONFLICT.md")
    conflict_parser.add_argument("--output", help="输出路径，默认 <memory-dir>/MEMORY_CONFLICT.md")
    
    # Test command
    test_parser = subparsers.add_parser("test", help="测试存储和检索")

    # Serve command
    serve_parser = subparsers.add_parser("serve", help="启动 MCP HTTP 服务器")
    serve_parser.add_argument("--host", default="127.0.0.1", help="HTTP 主机地址")
    serve_parser.add_argument("--port", type=int, default=8765, help="HTTP 端口")

    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # 初始化
    memory = HKTMv5(
        memory_dir=args.memory_dir,
        llm_provider=args.llm_provider
    )
    
    if args.command == "store":
        print("📝 存储记忆...")
        print(f"   Layer: {args.layer}")
        print(f"   Topic: {args.topic}")
        print(f"   Title: {args.title or 'Untitled'}")
        print()
        
        result = memory.store(
            content=args.content,
            title=args.title,
            topic=args.topic,
            layer=args.layer,
            metadata={"importance": args.importance, "pinned": args.pinned},
            auto_extract=not args.no_extract
        )
        
        print("\n✅ 存储完成!")
        print(f"   L2: {result.get('L2', 'N/A')}")
        print(f"   L1: {result.get('L1', 'N/A')}")
        print(f"   L0: {result.get('L0', 'N/A')}")
    
    elif args.command == "retrieve":
        print(f"🔍 检索: {args.query}")
        print(f"   Layer: {args.layer}")
        if args.min_similarity is not None:
            print(f"   Min Similarity: {args.min_similarity}")
        if args.vector_weight is not None or args.bm25_weight is not None:
            print(f"   Weights: vector={args.vector_weight}, bm25={args.bm25_weight}")
        if args.entity:
            print(f"   Entity: {args.entity}")
        print()

        results = memory.retrieve(
            query=args.query,
            layer=args.layer,
            topic=args.topic,
            limit=args.limit,
            min_similarity=args.min_similarity,
            vector_weight=args.vector_weight,
            bm25_weight=args.bm25_weight,
            debug=args.debug,
            entity=args.entity,
        )
        
        for layer_name, items in results.items():
            if layer_name == "debug":
                continue
            print(f"\n{'='*60}")
            print(f"📂 {layer_name} 层 ({len(items)} 条结果)")
            print(f"{'='*60}")
            
            for i, item in enumerate(items[:5], 1):
                title = item.get('title', item.get('id', 'Untitled'))
                content = item.get('summary', item.get('content', ''))[:100]
                print(f"\n{i}. {title}")
                print(f"   {content}...")
                if args.debug:
                    explain = item.get("_debug_explain", {})
                    print(
                        "   "
                        f"hybrid={explain.get('hybrid_score', 0.0):.4f} "
                        f"vector={explain.get('vector_score', 0.0):.4f} "
                        f"bm25={explain.get('bm25_score', 0.0):.4f} "
                        f"match={explain.get('match_score', 0.0):.4f} "
                        f"lifecycle={explain.get('lifecycle_score', 0.0):.4f}"
                    )
                    matched_terms = explain.get("matched_terms", [])
                    if matched_terms:
                        print(f"   matched_terms: {', '.join(matched_terms[:8])}")
                    reasons = explain.get("reasons", [])
                    if reasons:
                        print(f"   reasons: {' | '.join(reasons)}")

        if args.debug and results.get("debug"):
            debug_info = results["debug"]
            print(f"\n{'='*60}")
            print("🧪 Debug 命中解释")
            print(f"{'='*60}")
            config = debug_info.get("config", {})
            print(
                "   "
                f"vector_weight={config.get('vector_weight', 0.0):.4f} "
                f"bm25_weight={config.get('bm25_weight', 0.0):.4f} "
                f"min_similarity={config.get('min_similarity', 0.0):.4f}"
            )
            vector_info = debug_info.get("vector", {})
            if vector_info:
                print(
                    "   "
                    f"vector raw_hits={vector_info.get('raw_hits', 0)} "
                    f"returned_hits={vector_info.get('returned_hits', 0)}"
                )
                if vector_info.get("filtered_out"):
                    filtered = ", ".join(
                        f"{item.get('id')}:{item.get('score', 0.0):.4f}"
                        for item in vector_info.get("filtered_out", [])[:5]
                    )
                    print(f"   filtered_by_similarity: {filtered}")
            for layer_name, info in debug_info.get("layers", {}).items():
                print(f"   {layer_name} candidates={info.get('candidate_count', 0)}")
    
    elif args.command == "sync":
        print("🔄 同步各层...")
        if args.full:
            print("   模式: 全量同步")
        else:
            print("   模式: 增量同步")
        if args.rebuild_index:
            print("   操作: 重建向量索引")
        print()

        result = memory.sync(full=args.full, rebuild_index=args.rebuild_index)
        if result:
            print("🔁 同步结果\n")
            for key, value in result.items():
                print(f"   {key}: {value}")
    
    elif args.command == "stats":
        print("📊 统计信息\n")
        stats = memory.stats()
        
        for layer_name, layer_stats in stats.items():
            print(f"\n{'='*60}")
            print(f"📂 {layer_name} 层")
            print(f"{'='*60}")
            for key, value in layer_stats.items():
                print(f"   {key}: {value}")

    elif args.command == "forget":
        result = memory.forget(memory_id=args.memory_id, force=args.force)
        print("🧠 遗忘结果\n")
        for key, value in result.items():
            print(f"   {key}: {value}")

    elif args.command == "restore":
        result = memory.restore(memory_id=args.memory_id)
        print("♻️ 恢复结果\n")
        for key, value in result.items():
            print(f"   {key}: {value}")

    elif args.command == "cleanup":
        result = memory.cleanup(dry_run=args.dry_run, scope=args.scope)
        print("🧹 清理结果\n")
        for key, value in result.items():
            print(f"   {key}: {value}")

    elif args.command == "pin":
        result = memory.pin(memory_id=args.memory_id, pinned=args.value == "true")
        print("📌 Pin 结果\n")
        for key, value in result.items():
            print(f"   {key}: {value}")

    elif args.command == "importance":
        result = memory.set_importance(memory_id=args.memory_id, importance=args.value)
        print("⭐ 重要性结果\n")
        for key, value in result.items():
            print(f"   {key}: {value}")

    elif args.command == "feedback":
        result = memory.feedback(
            label=args.label,
            memory_id=args.memory_id,
            topic=args.topic,
            query=args.query,
            note=args.note,
        )
        print("🪝 反馈结果\n")
        for key, value in result.items():
            print(f"   {key}: {value}")

        # 触发结构化反射分析
        if args.label == "useful" and args.memory_id:
            from governance.reflection_analyzer import ReflectionAnalyzer
            analyzer = ReflectionAnalyzer(memory.memory_dir)
            manifest = memory.layers.lifecycle.get_memory(args.memory_id)
            access_count = manifest.get("access_count", 0) if manifest else 0
            threshold = memory.config.get("governance", {}).get("reflection_threshold", 3)
            if analyzer.should_trigger(access_count, threshold):
                l2_entry = memory.layers.l2.get_entry(args.memory_id)
                memories = [l2_entry] if l2_entry else []
                skill = analyzer.analyze(memories, feedback_context={
                    "memory_id": args.memory_id,
                    "query": args.query,
                    "note": args.note,
                    "access_count": access_count,
                })
                if skill:
                    analyzer.write_skill(skill)
                    print(f"\n✨ 已提取并写入技能: {skill['skill_name']}")
                else:
                    print(f"\n⚠️ 反射分析未产出有效 skill")

    elif args.command == "rebuild":
        result = memory.rebuild(include_archived=args.include_archived)
        print("🧱 聚合重建结果\n")
        for key, value in result.items():
            print(f"   {key}: {value}")

    elif args.command == "ingest-artifact":
        payload = args.content
        if args.content_file:
            payload = Path(args.content_file).read_text(encoding="utf-8")
        if not payload:
            raise ValueError("ingest-artifact requires --content or --content-file")
        result = memory.ingest_artifact(
            content=payload,
            source_mode=args.source_mode,
            artifact_type=args.artifact_type,
            title=args.title,
            topic=args.topic,
            artifact_id=args.artifact_id,
            source_uri=args.source_uri,
            layer=args.layer,
            auto_extract=args.auto_extract,
        )
        print("📥 产物写入结果\n")
        for key, value in result.items():
            print(f"   {key}: {value}")

    elif args.command == "conflict-scan":
        result = memory.conflict_scan(output_path=args.output)
        print("⚔️ 冲突扫描结果\n")
        for key, value in result.items():
            if key == "conflicts":
                print(f"   conflicts: {len(value)} entries")
            else:
                print(f"   {key}: {value}")
    
    elif args.command == "test":
        print("🧪 运行测试...\n")
        
        test_content = """# MiniMax 语音转纪要工具

基于 MiniMax CodePlan API 的语音转文字工具，支持一键将录音文件转为结构化会议纪要。

## 核心特性

- 支持多种音频格式（mp3, m4a, mp4 等）
- 自动触发 L1/L0 分层存储
- 使用 LLM 智能提取摘要

## 决策

- 采用 MiniMax API 而非飞书妙记（成本考虑）
- 使用智谱 AI 进行摘要提取

## 行动项

- [ ] 测试 API 连接（负责人: 开发团队，截止: 今天）
- [ ] 编写使用文档（负责人: PM，截止: 明天）
"""
        
        print("Step 1/3: 存储测试内容（layer=all）...")
        result = memory.store(
            content=test_content,
            title="MiniMax 语音转纪要",
            topic="tools",
            layer="all"
        )
        print(f"   结果: L2={result.get('L2')}, L1={result.get('L1')}, L0={result.get('L0')}")
        
        print("\nStep 2/3: 检索测试...")
        results = memory.retrieve(query="MiniMax", layer="all", limit=3)
        for layer, items in results.items():
            print(f"   {layer}: {len(items)} 条结果")
        
        print("\nStep 3/3: 统计...")
        stats = memory.stats()
        for layer, layer_stats in stats.items():
            total = layer_stats.get('total_entries') or layer_stats.get('total_topics', 0)
            print(f"   {layer}: {total} 条记录")
        
        print("\n✅ 测试完成!")
        print(f"\n查看生成的文件:")
        print(f"   L2: {args.memory_dir}/L2-Full/daily/")
        print(f"   L1: {args.memory_dir}/L1-Overview/topics/tools.md")
        print(f"   L0: {args.memory_dir}/L0-Abstract/topics/tools.md")

    elif args.command == "serve":
        from mcp.server import MemoryMCPServer
        print(f"🚀 启动 MCP HTTP 服务器 {args.host}:{args.port} ...")
        server = MemoryMCPServer(args.memory_dir)
        server.start_http(host=args.host, port=args.port)


if __name__ == "__main__":
    main()
