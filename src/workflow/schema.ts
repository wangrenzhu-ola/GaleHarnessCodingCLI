export type WorkflowRunKind = "compound" | "skill" | "review" | "handoff" | "custom"
export type WorkflowNodeKind = "skill" | "agent" | "review_role" | "handoff" | "validator" | "manual" | "custom"
export type RunRelationType = "parent" | "child" | "sibling" | "blocks" | "relates_to"
export type ArtifactKind = "handoff" | "review_findings" | "plan" | "patch" | "pr" | "memory" | "log" | "custom"

export interface WorkflowDagNodeSpec {
  id: string
  kind: WorkflowNodeKind
  name: string
  skill?: string
  role?: string
  dependsOn?: string[]
  produces?: ArtifactKind[]
  consumes?: ArtifactKind[]
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
