"""
Learning Tracker - Records agent learnings
"""

import re
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any


class LearningTracker:
    """
    学习记录追踪器
    
    记录和追踪Agent的学习过程
    ID格式: LRN-YYYYMMDD-XXX
    """
    
    def __init__(self, base_path: Path):
        self.base_path = Path(base_path)
        self.learnings_file = self.base_path / "LEARNINGS.md"
        self._ensure_structure()
    
    def _ensure_structure(self):
        """确保目录和文件结构"""
        self.base_path.mkdir(parents=True, exist_ok=True)
        
        if not self.learnings_file.exists():
            header = """# Learning Records

> 记录Agent的学习过程和改进

## Format

- **ID**: LRN-YYYYMMDD-XXX
- **Status**: pending → validated → integrated
- **Category**: pattern/methodology/insight

## Records

"""
            self.learnings_file.write_text(header, encoding='utf-8')
    
    def _generate_id(self) -> str:
        """生成学习记录ID"""
        date_str = datetime.now().strftime("%Y%m%d")
        # 计算当天的序号
        content = self.learnings_file.read_text(encoding='utf-8')
        count = content.count(f"LRN-{date_str}-")
        return f"LRN-{date_str}-{count + 1:03d}"
    
    def record(self,
               content: str,
               category: str = "insight",
               context: str = "",
               tags: List[str] = None) -> str:
        """
        记录学习
        
        Args:
            content: 学习内容
            category: 类别 (pattern/methodology/insight)
            context: 上下文
            tags: 标签列表
            
        Returns:
            学习记录ID
        """
        learning_id = self._generate_id()
        timestamp = datetime.now().isoformat()
        
        entry = f"""### {learning_id}

**Category**: {category}  
**Status**: pending  
**Created**: {timestamp[:19]}  
**Tags**: {', '.join(tags or [])}

**Content**:
{content}

**Context**:
{context}

---

"""
        
        with open(self.learnings_file, 'a', encoding='utf-8') as f:
            f.write(entry)
        
        return learning_id
    
    def update_status(self, learning_id: str, status: str) -> bool:
        """
        更新学习记录状态
        
        Args:
            learning_id: 记录ID
            status: 新状态 (pending/validated/integrated/rejected)
            
        Returns:
            是否成功
        """
        content = self.learnings_file.read_text(encoding='utf-8')
        
        # 查找并更新状态
        pattern = rf"(### {re.escape(learning_id)}.*?\*\*Status\*\*: )(\w+)"
        replacement = rf"\g<1>{status}"
        
        new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        
        if new_content != content:
            self.learnings_file.write_text(new_content, encoding='utf-8')
            return True
        
        return False
    
    def search(self, query: str = "", category: str = "", status: str = "") -> List[Dict[str, Any]]:
        """
        搜索学习记录
        
        Args:
            query: 关键词
            category: 类别过滤
            status: 状态过滤
            
        Returns:
            匹配的记录列表
        """
        content = self.learnings_file.read_text(encoding='utf-8')
        
        # 简单解析（按###分割）
        records = []
        sections = content.split('###')[1:]
        
        for section in sections:
            lines = section.strip().split('\n')
            if not lines:
                continue
            
            record_id = lines[0].strip()
            
            # 提取字段
            record = {'id': record_id}
            
            for line in lines:
                if '**Category**' in line:
                    record['category'] = line.split(':', 1)[1].strip()
                elif '**Status**' in line:
                    record['status'] = line.split(':', 1)[1].strip()
                elif '**Created**' in line:
                    record['created'] = line.split(':', 1)[1].strip()
                elif '**Tags**' in line:
                    tags_str = line.split(':', 1)[1].strip()
                    record['tags'] = [t.strip() for t in tags_str.split(',') if t.strip()]
            
            # 过滤
            if category and record.get('category') != category:
                continue
            if status and record.get('status') != status:
                continue
            if query and query.lower() not in section.lower():
                continue
            
            records.append(record)
        
        return records
    
    def extract_skill(self, learning_id: str) -> Optional[str]:
        """
        从学习记录中提取技能
        
        Args:
            learning_id: 学习记录ID
            
        Returns:
            技能内容或None
        """
        content = self.learnings_file.read_text(encoding='utf-8')
        
        # 查找记录
        pattern = rf"### {re.escape(learning_id)}(.*?)(?=### |\Z)"
        match = re.search(pattern, content, re.DOTALL)
        
        if not match:
            return None
        
        section = match.group(1)
        
        # 提取Content部分
        content_match = re.search(r'\*\*Content\*\*:\s*(.*?)(?=\*\*Context|$)', section, re.DOTALL)
        if content_match:
            return content_match.group(1).strip()
        
        return None
    
    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        content = self.learnings_file.read_text(encoding='utf-8')
        
        total = content.count('### LRN-')
        
        statuses = {}
        for status in ['pending', 'validated', 'integrated', 'rejected']:
            count = content.count(f'**Status**: {status}')
            statuses[status] = count
        
        categories = {}
        for category in ['pattern', 'methodology', 'insight']:
            count = len(re.findall(rf'\*\*Category\*\*: {category}', content))
            categories[category] = count
        
        return {
            'total_learnings': total,
            'by_status': statuses,
            'by_category': categories
        }
