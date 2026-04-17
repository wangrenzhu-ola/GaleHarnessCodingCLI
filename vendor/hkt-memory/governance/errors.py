"""
Error Tracker - Records and analyzes errors
"""

import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any


class ErrorTracker:
    """
    错误记录追踪器
    
    记录错误并追踪解决方案
    ID格式: ERR-YYYYMMDD-XXX
    """
    
    def __init__(self, base_path: Path):
        self.base_path = Path(base_path)
        self.errors_file = self.base_path / "ERRORS.md"
        self._ensure_structure()
    
    def _ensure_structure(self):
        """确保目录和文件结构"""
        self.base_path.mkdir(parents=True, exist_ok=True)
        
        if not self.errors_file.exists():
            header = """# Error Records

> 记录错误及其解决方案

## Format

- **ID**: ERR-YYYYMMDD-XXX
- **Status**: open → investigating → resolved
- **Severity**: critical/high/medium/low

## Records

"""
            self.errors_file.write_text(header, encoding='utf-8')
    
    def _generate_id(self) -> str:
        """生成错误记录ID"""
        date_str = datetime.now().strftime("%Y%m%d")
        content = self.errors_file.read_text(encoding='utf-8')
        count = content.count(f"ERR-{date_str}-")
        return f"ERR-{date_str}-{count + 1:03d}"
    
    def record(self,
               error_description: str,
               severity: str = "medium",
               context: str = "",
               error_message: str = "",
               tags: List[str] = None) -> str:
        """
        记录错误
        
        Args:
            error_description: 错误描述
            severity: 严重程度 (critical/high/medium/low)
            context: 上下文
            error_message: 错误消息
            tags: 标签
            
        Returns:
            错误记录ID
        """
        error_id = self._generate_id()
        timestamp = datetime.now().isoformat()
        
        entry = f"""### {error_id}

**Severity**: {severity}  
**Status**: open  
**Created**: {timestamp[:19]}  
**Tags**: {', '.join(tags or [])}

**Description**:
{error_description}

**Error Message**:
```
{error_message}
```

**Context**:
{context}

**Solution**:
_TODO: Add solution when resolved_

---

"""
        
        with open(self.errors_file, 'a', encoding='utf-8') as f:
            f.write(entry)
        
        return error_id
    
    def resolve(self, error_id: str, solution: str) -> bool:
        """
        标记错误为已解决
        
        Args:
            error_id: 错误ID
            solution: 解决方案
            
        Returns:
            是否成功
        """
        content = self.errors_file.read_text(encoding='utf-8')
        
        # 更新状态
        status_pattern = rf"(### {re.escape(error_id)}.*?\*\*Status\*\*: )(\w+)"
        content = re.sub(status_pattern, r"\g<1>resolved", content, flags=re.DOTALL)
        
        # 更新解决方案
        solution_pattern = rf"(### {re.escape(error_id)}.*?\*\*Solution\*\*:\s*)_TODO.*?_"
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        solution_text = f"[{timestamp}] {solution}"
        
        new_content = re.sub(solution_pattern, rf"\g<1>{solution_text}", content, flags=re.DOTALL)
        
        if new_content != content:
            self.errors_file.write_text(new_content, encoding='utf-8')
            return True
        
        return False
    
    def update_status(self, error_id: str, status: str) -> bool:
        """
        更新错误状态
        
        Args:
            error_id: 错误ID
            status: 新状态 (open/investigating/resolved)
            
        Returns:
            是否成功
        """
        content = self.errors_file.read_text(encoding='utf-8')
        
        pattern = rf"(### {re.escape(error_id)}.*?\*\*Status\*\*: )(\w+)"
        replacement = rf"\g<1>{status}"
        
        new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        
        if new_content != content:
            self.errors_file.write_text(new_content, encoding='utf-8')
            return True
        
        return False
    
    def search(self, 
               query: str = "", 
               severity: str = "", 
               status: str = "",
               tags: List[str] = None) -> List[Dict[str, Any]]:
        """
        搜索错误记录
        
        Args:
            query: 关键词
            severity: 严重程度过滤
            status: 状态过滤
            tags: 标签过滤
            
        Returns:
            匹配的记录列表
        """
        content = self.errors_file.read_text(encoding='utf-8')
        
        records = []
        sections = content.split('###')[1:]
        
        for section in sections:
            lines = section.strip().split('\n')
            if not lines:
                continue
            
            record_id = lines[0].strip()
            record = {'id': record_id}
            
            for line in lines:
                if '**Severity**' in line:
                    record['severity'] = line.split(':', 1)[1].strip()
                elif '**Status**' in line:
                    record['status'] = line.split(':', 1)[1].strip()
                elif '**Created**' in line:
                    record['created'] = line.split(':', 1)[1].strip()
                elif '**Tags**' in line:
                    tags_str = line.split(':', 1)[1].strip()
                    record['tags'] = [t.strip() for t in tags_str.split(',') if t.strip()]
            
            # 过滤
            if severity and record.get('severity') != severity:
                continue
            if status and record.get('status') != status:
                continue
            if tags and not all(t in record.get('tags', []) for t in tags):
                continue
            if query and query.lower() not in section.lower():
                continue
            
            records.append(record)
        
        return records
    
    def get_open_errors(self, severity: str = None) -> List[Dict[str, Any]]:
        """
        获取未解决的错误
        
        Args:
            severity: 严重程度过滤
            
        Returns:
            未解决的错误列表
        """
        return self.search(status="open", severity=severity)
    
    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        content = self.errors_file.read_text(encoding='utf-8')
        
        total = content.count('### ERR-')
        
        # 按状态统计
        statuses = {}
        for status in ['open', 'investigating', 'resolved']:
            count = content.count(f'**Status**: {status}')
            statuses[status] = count
        
        # 按严重程度统计
        severities = {}
        for sev in ['critical', 'high', 'medium', 'low']:
            count = len(re.findall(rf'\*\*Severity\*\*: {sev}', content))
            severities[sev] = count
        
        return {
            'total_errors': total,
            'by_status': statuses,
            'by_severity': severities
        }
