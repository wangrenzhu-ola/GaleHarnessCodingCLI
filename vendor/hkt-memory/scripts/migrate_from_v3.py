#!/usr/bin/env python3
"""
Migration script from HKT-Memory v3 to v4

Migrates:
- Daily logs (YYYY-MM-DD.md) -> L2-Full/daily/
- MEMORY.md -> L2-Full/evergreen/
- Vector database entries -> with tier metadata
"""

import os
import sys
import shutil
import sqlite3
import json
from pathlib import Path
from datetime import datetime

# Migration configuration
OLD_MEMORY_DIR = Path(".trae/skills/hkt-memory/memory")
NEW_MEMORY_DIR = Path("memory")


def migrate_daily_logs():
    """迁移每日日志"""
    print("Migrating daily logs...")
    
    old_daily = OLD_MEMORY_DIR
    new_daily = NEW_MEMORY_DIR / "L2-Full" / "daily"
    new_daily.mkdir(parents=True, exist_ok=True)
    
    migrated = 0
    for log_file in old_daily.glob("*.md"):
        if log_file.name in ["MEMORY.md", "index.md", "README.md"]:
            continue
        
        # 复制文件
        shutil.copy2(log_file, new_daily / log_file.name)
        migrated += 1
        print(f"  Copied: {log_file.name}")
    
    print(f"  Migrated {migrated} daily logs")
    return migrated


def migrate_evergreen():
    """迁移永久记忆"""
    print("Migrating evergreen memories...")
    
    old_memory = OLD_MEMORY_DIR / "MEMORY.md"
    new_evergreen = NEW_MEMORY_DIR / "L2-Full" / "evergreen"
    new_evergreen.mkdir(parents=True, exist_ok=True)
    
    if old_memory.exists():
        shutil.copy2(old_memory, new_evergreen / "MEMORY.md")
        print(f"  Copied: MEMORY.md")
        return 1
    
    print("  No MEMORY.md found")
    return 0


def migrate_vector_db():
    """迁移向量数据库"""
    print("Migrating vector database...")
    
    old_db = OLD_MEMORY_DIR / "memory.db"
    new_db = NEW_MEMORY_DIR / "memory.db"
    
    if not old_db.exists():
        print("  No vector database found")
        return 0
    
    # 复制数据库
    shutil.copy2(old_db, new_db)
    
    # 添加tier列（如果不存在）
    try:
        conn = sqlite3.connect(new_db)
        cursor = conn.cursor()
        
        # 检查tier列是否存在
        cursor.execute("PRAGMA table_info(chunks)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'tier' not in columns:
            cursor.execute("ALTER TABLE chunks ADD COLUMN tier TEXT DEFAULT 'peripheral'")
            conn.commit()
            print("  Added 'tier' column")
        
        conn.close()
    except Exception as e:
        print(f"  Warning: Could not update schema: {e}")
    
    print(f"  Migrated vector database")
    return 1


def create_governance_structure():
    """创建治理结构"""
    print("Creating governance structure...")
    
    governance_dir = NEW_MEMORY_DIR / "governance"
    governance_dir.mkdir(parents=True, exist_ok=True)
    
    # LEARNINGS.md
    learnings_file = governance_dir / "LEARNINGS.md"
    if not learnings_file.exists():
        learnings_file.write_text("""# Learning Records

> 记录Agent的学习过程和改进

## Records

""", encoding='utf-8')
        print("  Created LEARNINGS.md")
    
    # ERRORS.md
    errors_file = governance_dir / "ERRORS.md"
    if not errors_file.exists():
        errors_file.write_text("""# Error Records

> 记录错误及其解决方案

## Records

""", encoding='utf-8')
        print("  Created ERRORS.md")
    
    # IMPROVEMENTS.md
    improvements_file = governance_dir / "IMPROVEMENTS.md"
    if not improvements_file.exists():
        improvements_file.write_text("""# Improvement Records

> 追踪改进和优化

## Records

""", encoding='utf-8')
        print("  Created IMPROVEMENTS.md")


def generate_layer_abstracts():
    """为L2内容生成L0摘要"""
    print("Generating L0 abstracts from L2 content...")
    
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from layers import LayerManager
    
    layers = LayerManager(NEW_MEMORY_DIR)
    
    # 为每日日志生成摘要
    l2_daily = NEW_MEMORY_DIR / "L2-Full" / "daily"
    if l2_daily.exists():
        for log_file in l2_daily.glob("*.md"):
            content = log_file.read_text(encoding='utf-8')
            # 生成简单摘要（前100个字符）
            abstract = content.replace('\n', ' ')[:150]
            if len(content) > 150:
                abstract += "..."
            
            # 存储到L0
            date = log_file.stem
            layers.l0.store(
                content=abstract,
                topic=f"daily_{date}",
                source=str(log_file.relative_to(NEW_MEMORY_DIR))
            )
        
        print(f"  Generated abstracts for {len(list(l2_daily.glob('*.md')))} daily logs")


def main():
    print("=" * 60)
    print("HKT-Memory v3 -> v4 Migration")
    print("=" * 60)
    print()
    
    # 确认
    print(f"Source: {OLD_MEMORY_DIR}")
    print(f"Target: {NEW_MEMORY_DIR}")
    print()
    
    response = input("Continue? [y/N]: ")
    if response.lower() != 'y':
        print("Migration cancelled.")
        return
    
    print()
    
    # 创建目录结构
    print("Creating directory structure...")
    (NEW_MEMORY_DIR / "L0-Abstract" / "topics").mkdir(parents=True, exist_ok=True)
    (NEW_MEMORY_DIR / "L1-Overview" / "sessions").mkdir(parents=True, exist_ok=True)
    (NEW_MEMORY_DIR / "L1-Overview" / "projects").mkdir(parents=True, exist_ok=True)
    (NEW_MEMORY_DIR / "L2-Full" / "episodes").mkdir(parents=True, exist_ok=True)
    print("  Done")
    print()
    
    # 执行迁移
    migrated_logs = migrate_daily_logs()
    migrated_evergreen = migrate_evergreen()
    migrated_db = migrate_vector_db()
    create_governance_structure()
    
    # 生成L0摘要
    try:
        generate_layer_abstracts()
    except Exception as e:
        print(f"  Warning: Could not generate abstracts: {e}")
    
    print()
    print("=" * 60)
    print("Migration Summary")
    print("=" * 60)
    print(f"Daily logs migrated: {migrated_logs}")
    print(f"Evergreen memories: {migrated_evergreen}")
    print(f"Vector database: {migrated_db}")
    print()
    print("Next steps:")
    print("1. Review migrated data in memory/ directory")
    print("2. Test with: python scripts/hkt_memory_v4.py stats")
    print("3. Update your AGENTS.md with new commands")


if __name__ == "__main__":
    main()
