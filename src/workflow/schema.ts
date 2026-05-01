export type WorkflowRunKind = "compound" | "skill" | "review" | "handoff" | "custom"
export type WorkflowNodeKind = "skill" | "agent" | "review_role" | "handoff" | "validator" | "manual" | "custom"
export type WorkflowContractNodeType = "ai" | "script" | "approval" | "handoff" | "pmo"
export type WorkflowTriggerRule = "all_success" | "all_done" | "one_success" | "none_failed"
export type WorkflowContextBoundary = "handoff" | "fresh" | "inherit"
export type WorkflowRiskLevel = "low" | "medium" | "high" | "critical"
export type RunRelationType = "parent" | "child" | "sibling" | "blocks" | "relates_to"
export type ArtifactKind = "handoff" | "review_findings" | "plan" | "patch" | "pr" | "memory" | "log" | "custom"

export const WORKFLOW_NODE_KINDS = ["skill", "agent", "review_role", "handoff", "validator", "manual", "custom"] as const
export const WORKFLOW_CONTRACT_NODE_TYPES = ["ai", "script", "approval", "handoff", "pmo"] as const
export const WORKFLOW_TRIGGER_RULES = ["all_success", "all_done", "one_success", "none_failed"] as const
export const WORKFLOW_CONTEXT_BOUNDARIES = ["handoff", "fresh", "inherit"] as const
export const WORKFLOW_RISK_LEVELS = ["low", "medium", "high", "critical"] as const
export const RUN_RELATION_TYPES = ["parent", "child", "sibling", "blocks", "relates_to"] as const
export const ARTIFACT_KINDS = ["handoff", "review_findings", "plan", "patch", "pr", "memory", "log", "custom"] as const

export interface WorkflowDagNodeSpec {
  id: string
  kind: WorkflowNodeKind
  name: string
  type?: WorkflowContractNodeType
  skill?: string
  role?: string
  dependsOn?: string[]
  depends_on?: string[]
  produces?: ArtifactKind[]
  consumes?: ArtifactKind[]
  trigger_rule?: WorkflowTriggerRule
  context_boundary?: WorkflowContextBoundary
  input_artifacts?: ArtifactKind[]
  output_artifacts?: ArtifactKind[]
  validators?: string[]
  parallel_group?: string
  risk_level?: WorkflowRiskLevel
  metadata?: Record<string, unknown>
}

export interface WorkflowDagSpec {
  id: string
  title?: string
  kind?: WorkflowRunKind
  version?: string
  nodes: WorkflowDagNodeSpec[]
  metadata?: Record<string, unknown>
}

export interface HandoffArtifactContract {
  artifactId: string
  runId: string
  producerNodeId?: string
  kind: ArtifactKind
  path?: string
  url?: string
  title?: string
  summary?: string
  sha256?: string
  metadata?: Record<string, unknown>
}

export interface RunRelationSpec {
  runId: string
  relatedRunId: string
  relationType: RunRelationType
  reason?: string
  metadata?: Record<string, unknown>
}

export interface WorkflowValidationIssue {
  code: string
  message: string
  path?: string
}

export interface WorkflowValidationResult {
  valid: boolean
  issues: WorkflowValidationIssue[]
}

export const WORKFLOW_EVENT_TYPES = [
  "workflow_started",
  "workflow_completed",
  "workflow_failed",
  "workflow_node_started",
  "workflow_node_completed",
  "workflow_node_failed",
  "handoff_artifact_linked",
  "review_role_started",
  "review_role_completed",
  "run_relation_linked",
] as const

export type WorkflowEventType = (typeof WORKFLOW_EVENT_TYPES)[number]
