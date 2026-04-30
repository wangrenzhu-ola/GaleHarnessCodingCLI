/**
 * 全局知识仓库核心类型定义
 */

/** 知识文档类型 */
export type KnowledgeDocType = 'brainstorms' | 'plans' | 'solutions' | 'ideation';

/** 有效文档类型列表 */
export const VALID_DOC_TYPES: readonly KnowledgeDocType[] = ["brainstorms", "plans", "solutions", "ideation"] as const

/** 类型守卫：判断字符串是否为有效文档类型 */
export function isValidDocType(type: string): type is KnowledgeDocType {
  return (VALID_DOC_TYPES as readonly string[]).includes(type)
}

/** 知识仓库配置 */
export interface KnowledgeConfig {
  /** 知识仓库根路径 */
  home: string;
}

/** 路径解析结果 */
export interface KnowledgePathResult {
  /** 知识仓库根目录 */
  home: string;
  /** 项目目录路径 (home/<project>) */
  projectDir: string;
  /** 文档类型目录路径 (home/<project>/<type>) */
  docDir: string;
  /** 项目名 */
  projectName: string;
}

/** resolveKnowledgePath 参数 */
export interface ResolveKnowledgePathOptions {
  /** 文档类型 */
  type: KnowledgeDocType;
  /** 项目名（可选，未提供时从 git remote 提取） */
  projectName?: string;
}
