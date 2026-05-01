import type {
  HandoffArtifactContract,
  RunRelationSpec,
  WorkflowDagSpec,
  WorkflowValidationIssue,
  WorkflowValidationResult,
} from "./schema.js"

function issue(code: string, message: string, path?: string): WorkflowValidationIssue {
  return { code, message, ...(path ? { path } : {}) }
}

export function validateWorkflowDag(spec: WorkflowDagSpec): WorkflowValidationResult {
  const issues: WorkflowValidationIssue[] = []

  if (!spec.id || typeof spec.id !== "string") {
    issues.push(issue("dag.id.required", "Workflow DAG id is required", "id"))
  }
  if (!Array.isArray(spec.nodes) || spec.nodes.length === 0) {
    issues.push(issue("dag.nodes.required", "Workflow DAG must include at least one node", "nodes"))
    return { valid: issues.length === 0, issues }
  }

  const ids = new Set<string>()
  const duplicateIds = new Set<string>()
  for (const [index, node] of spec.nodes.entries()) {
    const path = `nodes[${index}]`
    if (!node.id) issues.push(issue("node.id.required", "Node id is required", `${path}.id`))
    if (!node.name) issues.push(issue("node.name.required", "Node name is required", `${path}.name`))
    if (node.id && ids.has(node.id)) duplicateIds.add(node.id)
    if (node.id) ids.add(node.id)
  }
  for (const id of duplicateIds) {
    issues.push(issue("node.id.duplicate", `Duplicate node id: ${id}`, "nodes"))
  }

  for (const node of spec.nodes) {
    for (const dep of node.dependsOn ?? []) {
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
  const byId = new Map(spec.nodes.map((node) => [node.id, node]))
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
    for (const dep of byId.get(id)?.dependsOn ?? []) visit(dep)
    stack.pop()
    visiting.delete(id)
    visited.add(id)
  }

  for (const node of spec.nodes) visit(node.id)
  return { valid: issues.length === 0, issues }
}

export function validateHandoffArtifact(artifact: HandoffArtifactContract): WorkflowValidationResult {
  const issues: WorkflowValidationIssue[] = []
  if (!artifact.artifactId) issues.push(issue("artifact.id.required", "Artifact id is required", "artifactId"))
  if (!artifact.runId) issues.push(issue("artifact.run.required", "Artifact runId is required", "runId"))
  if (!artifact.kind) issues.push(issue("artifact.kind.required", "Artifact kind is required", "kind"))
  if (!artifact.path && !artifact.url) issues.push(issue("artifact.location.required", "Artifact must include path or url", "path"))
  if (artifact.path && artifact.path.includes("\0")) issues.push(issue("artifact.path.invalid", "Artifact path contains a null byte", "path"))
  if (artifact.sha256 && !/^[a-f0-9]{64}$/i.test(artifact.sha256)) {
    issues.push(issue("artifact.sha256.invalid", "Artifact sha256 must be 64 hex characters", "sha256"))
  }
  return { valid: issues.length === 0, issues }
}

export function validateRunRelation(relation: RunRelationSpec): WorkflowValidationResult {
  const issues: WorkflowValidationIssue[] = []
  if (!relation.runId) issues.push(issue("relation.run.required", "Relation runId is required", "runId"))
  if (!relation.relatedRunId) issues.push(issue("relation.related.required", "Relation relatedRunId is required", "relatedRunId"))
  if (relation.runId && relation.relatedRunId && relation.runId === relation.relatedRunId) {
    issues.push(issue("relation.self.invalid", "A run cannot relate to itself", "relatedRunId"))
  }
  if (!relation.relationType) issues.push(issue("relation.type.required", "Relation type is required", "relationType"))
  return { valid: issues.length === 0, issues }
}

export function validateWorkflowBundle(input: {
  dag?: WorkflowDagSpec
  artifacts?: HandoffArtifactContract[]
  relations?: RunRelationSpec[]
}): WorkflowValidationResult {
  const results = [
    ...(input.dag ? [validateWorkflowDag(input.dag)] : []),
    ...(input.artifacts ?? []).map(validateHandoffArtifact),
    ...(input.relations ?? []).map(validateRunRelation),
  ]
  const issues = results.flatMap((result) => result.issues)
  return { valid: issues.length === 0, issues }
}
