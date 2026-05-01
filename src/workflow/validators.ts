import {
  ARTIFACT_KINDS,
  RUN_RELATION_TYPES,
  WORKFLOW_CONTEXT_BOUNDARIES,
  WORKFLOW_CONTRACT_NODE_TYPES,
  WORKFLOW_NODE_KINDS,
  WORKFLOW_RISK_LEVELS,
  WORKFLOW_TRIGGER_RULES,
  type HandoffArtifactContract,
  type RunRelationSpec,
  type WorkflowDagNodeSpec,
  type WorkflowDagSpec,
  type WorkflowValidationIssue,
  type WorkflowValidationResult,
} from "./schema.js"

function issue(code: string, message: string, path?: string): WorkflowValidationIssue {
  return { code, message, ...(path ? { path } : {}) }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function enumSet<T extends readonly string[]>(values: T): Set<string> {
  return new Set(values as readonly string[])
}

const nodeKinds = enumSet(WORKFLOW_NODE_KINDS)
const nodeTypes = enumSet(WORKFLOW_CONTRACT_NODE_TYPES)
const triggerRules = enumSet(WORKFLOW_TRIGGER_RULES)
const contextBoundaries = enumSet(WORKFLOW_CONTEXT_BOUNDARIES)
const riskLevels = enumSet(WORKFLOW_RISK_LEVELS)
const artifactKinds = enumSet(ARTIFACT_KINDS)
const relationTypes = enumSet(RUN_RELATION_TYPES)

function requireString(value: unknown, code: string, message: string, path: string, issues: WorkflowValidationIssue[]): value is string {
  if (typeof value !== "string" || value.length === 0) {
    issues.push(issue(code, message, path))
    return false
  }
  return true
}

function validateStringArray(value: unknown, code: string, message: string, path: string, issues: WorkflowValidationIssue[]): string[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) {
    issues.push(issue(code, message, path))
    return []
  }
  const strings: string[] = []
  for (const [index, item] of value.entries()) {
    if (typeof item !== "string" || item.length === 0) {
      issues.push(issue(code, `${message}; item ${index} must be a non-empty string`, `${path}[${index}]`))
    } else {
      strings.push(item)
    }
  }
  return strings
}

function validateEnum(value: unknown, allowed: Set<string>, code: string, message: string, path: string, issues: WorkflowValidationIssue[]): void {
  if (typeof value !== "string" || !allowed.has(value)) {
    issues.push(issue(code, `${message}. Allowed values: ${[...allowed].join(", ")}`, path))
  }
}

function validateEnumArray(value: unknown, allowed: Set<string>, code: string, message: string, path: string, issues: WorkflowValidationIssue[]): void {
  if (value === undefined) return
  if (!Array.isArray(value)) {
    issues.push(issue(code, message, path))
    return
  }
  for (const [index, item] of value.entries()) {
    if (typeof item !== "string" || !allowed.has(item)) {
      issues.push(issue(code, `${message}; item ${index} must be one of: ${[...allowed].join(", ")}`, `${path}[${index}]`))
    }
  }
}

function nodeDependencies(node: WorkflowDagNodeSpec): string[] {
  return [...(Array.isArray(node.dependsOn) ? node.dependsOn : []), ...(Array.isArray(node.depends_on) ? node.depends_on : [])]
}

function validateNodeShape(node: unknown, path: string, issues: WorkflowValidationIssue[]): node is WorkflowDagNodeSpec {
  if (!isRecord(node)) {
    issues.push(issue("node.shape.invalid", "Node must be an object", path))
    return false
  }
  requireString(node.id, "node.id.required", "Node id is required", `${path}.id`, issues)
  requireString(node.name, "node.name.required", "Node name is required", `${path}.name`, issues)
  if (node.kind === undefined) {
    issues.push(issue("node.kind.required", "Node kind is required", `${path}.kind`))
  } else {
    validateEnum(node.kind, nodeKinds, "node.kind.invalid", "Node kind is invalid", `${path}.kind`, issues)
  }
  if (node.type !== undefined) validateEnum(node.type, nodeTypes, "node.type.invalid", "Node type is invalid", `${path}.type`, issues)
  if (node.trigger_rule !== undefined) validateEnum(node.trigger_rule, triggerRules, "node.trigger_rule.invalid", "Node trigger_rule is invalid", `${path}.trigger_rule`, issues)
  if (node.context_boundary !== undefined) validateEnum(node.context_boundary, contextBoundaries, "node.context_boundary.invalid", "Node context_boundary is invalid", `${path}.context_boundary`, issues)
  if (node.risk_level !== undefined) validateEnum(node.risk_level, riskLevels, "node.risk_level.invalid", "Node risk_level is invalid", `${path}.risk_level`, issues)
  if (node.parallel_group !== undefined && typeof node.parallel_group !== "string") {
    issues.push(issue("node.parallel_group.invalid", "Node parallel_group must be a string", `${path}.parallel_group`))
  }
  validateStringArray(node.dependsOn, "node.dependsOn.invalid", "Node dependsOn must be an array of node ids", `${path}.dependsOn`, issues)
  validateStringArray(node.depends_on, "node.depends_on.invalid", "Node depends_on must be an array of node ids", `${path}.depends_on`, issues)
  validateEnumArray(node.produces, artifactKinds, "node.produces.invalid", "Node produces must be an array of artifact kinds", `${path}.produces`, issues)
  validateEnumArray(node.consumes, artifactKinds, "node.consumes.invalid", "Node consumes must be an array of artifact kinds", `${path}.consumes`, issues)
  validateEnumArray(node.input_artifacts, artifactKinds, "node.input_artifacts.invalid", "Node input_artifacts must be an array of artifact kinds", `${path}.input_artifacts`, issues)
  validateEnumArray(node.output_artifacts, artifactKinds, "node.output_artifacts.invalid", "Node output_artifacts must be an array of artifact kinds", `${path}.output_artifacts`, issues)
  validateStringArray(node.validators, "node.validators.invalid", "Node validators must be an array of validator ids", `${path}.validators`, issues)
  return true
}

export function validateWorkflowDag(spec: WorkflowDagSpec): WorkflowValidationResult {
  const issues: WorkflowValidationIssue[] = []

  if (!isRecord(spec)) {
    return { valid: false, issues: [issue("dag.shape.invalid", "Workflow DAG must be an object")] }
  }
  if (!spec.id || typeof spec.id !== "string") {
    issues.push(issue("dag.id.required", "Workflow DAG id is required", "id"))
  }
  if (!Array.isArray(spec.nodes) || spec.nodes.length === 0) {
    issues.push(issue("dag.nodes.required", "Workflow DAG must include at least one node", "nodes"))
    return { valid: issues.length === 0, issues }
  }

  const nodes: WorkflowDagNodeSpec[] = []
  const ids = new Set<string>()
  const duplicateIds = new Set<string>()
  for (const [index, rawNode] of spec.nodes.entries()) {
    const path = `nodes[${index}]`
    if (!validateNodeShape(rawNode, path, issues)) continue
    const node = rawNode as WorkflowDagNodeSpec
    nodes.push(node)
    if (node.id && ids.has(node.id)) duplicateIds.add(node.id)
    if (node.id) ids.add(node.id)
  }
  for (const id of duplicateIds) {
    issues.push(issue("node.id.duplicate", `Duplicate node id: ${id}`, "nodes"))
  }

  for (const node of nodes) {
    for (const dep of nodeDependencies(node)) {
      if (!ids.has(dep)) {
        issues.push(issue("node.dependency.missing", `Node ${node.id} depends on missing node ${dep}`, `nodes.${node.id}.dependsOn`))
      }
      if (dep === node.id) {
        issues.push(issue("node.dependency.self", `Node ${node.id} cannot depend on itself`, `nodes.${node.id}.dependsOn`))
      }
    }
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const stack: string[] = []

  function visit(id: string): void {
    if (visited.has(id) || !byId.has(id)) return
    if (visiting.has(id)) {
      const cycleStart = stack.indexOf(id)
      const cycle = stack.slice(cycleStart).concat(id).join(" -> ")
      issues.push(issue("dag.cycle", `Workflow DAG contains a cycle: ${cycle}`, "nodes"))
      return
    }
    visiting.add(id)
    stack.push(id)
    for (const dep of nodeDependencies(byId.get(id) as WorkflowDagNodeSpec)) visit(dep)
    stack.pop()
    visiting.delete(id)
    visited.add(id)
  }

  for (const node of nodes) visit(node.id)
  return { valid: issues.length === 0, issues }
}

export function validateHandoffArtifact(artifact: HandoffArtifactContract): WorkflowValidationResult {
  const issues: WorkflowValidationIssue[] = []
  if (!isRecord(artifact)) return { valid: false, issues: [issue("artifact.shape.invalid", "Artifact must be an object")] }
  if (!artifact.artifactId) issues.push(issue("artifact.id.required", "Artifact id is required", "artifactId"))
  if (!artifact.runId) issues.push(issue("artifact.run.required", "Artifact runId is required", "runId"))
  if (!artifact.kind) issues.push(issue("artifact.kind.required", "Artifact kind is required", "kind"))
  else validateEnum(artifact.kind, artifactKinds, "artifact.kind.invalid", "Artifact kind is invalid", "kind", issues)
  if (!artifact.path && !artifact.url) issues.push(issue("artifact.location.required", "Artifact must include path or url", "path"))
  if (artifact.path && artifact.path.includes("\0")) issues.push(issue("artifact.path.invalid", "Artifact path contains a null byte", "path"))
  if (artifact.sha256 && !/^[a-f0-9]{64}$/i.test(artifact.sha256)) {
    issues.push(issue("artifact.sha256.invalid", "Artifact sha256 must be 64 hex characters", "sha256"))
  }
  return { valid: issues.length === 0, issues }
}

export function validateRunRelation(relation: RunRelationSpec): WorkflowValidationResult {
  const issues: WorkflowValidationIssue[] = []
  if (!isRecord(relation)) return { valid: false, issues: [issue("relation.shape.invalid", "Relation must be an object")] }
  if (!relation.runId) issues.push(issue("relation.run.required", "Relation runId is required", "runId"))
  if (!relation.relatedRunId) issues.push(issue("relation.related.required", "Relation relatedRunId is required", "relatedRunId"))
  if (relation.runId && relation.relatedRunId && relation.runId === relation.relatedRunId) {
    issues.push(issue("relation.self.invalid", "A run cannot relate to itself", "relatedRunId"))
  }
  if (!relation.relationType) issues.push(issue("relation.type.required", "Relation type is required", "relationType"))
  else validateEnum(relation.relationType, relationTypes, "relation.type.invalid", "Relation type is invalid", "relationType", issues)
  return { valid: issues.length === 0, issues }
}

export function validateWorkflowBundle(input: {
  dag?: WorkflowDagSpec
  artifacts?: HandoffArtifactContract[]
  relations?: RunRelationSpec[]
}): WorkflowValidationResult {
  const issues: WorkflowValidationIssue[] = []
  if (!isRecord(input)) return { valid: false, issues: [issue("bundle.shape.invalid", "Workflow bundle must be an object")] }
  if (input.dag) issues.push(...validateWorkflowDag(input.dag).issues)
  if (input.artifacts !== undefined) {
    if (!Array.isArray(input.artifacts)) issues.push(issue("bundle.artifacts.invalid", "Bundle artifacts must be an array", "artifacts"))
    else issues.push(...input.artifacts.flatMap((artifact) => validateHandoffArtifact(artifact).issues))
  }
  if (input.relations !== undefined) {
    if (!Array.isArray(input.relations)) issues.push(issue("bundle.relations.invalid", "Bundle relations must be an array", "relations"))
    else issues.push(...input.relations.flatMap((relation) => validateRunRelation(relation).issues))
  }
  return { valid: issues.length === 0, issues }
}
