# Gale workflow runtime MVP

This runtime surface adds a typed workflow layer over the existing `gale-task` ledger. It does not replace `gh:review` or any existing skill: it projects current skill, review, handoff, and relation events into a queryable workflow graph.

## Schema surfaces

- `WorkflowDagSpec`: minimal DAG with `nodes[].id`, `kind`, `name`, `skill`, `role`, `dependsOn`, `produces`, and `consumes`.
- `HandoffArtifactContract`: stable handoff artifact pointer with `artifactId`, `runId`, `kind`, `path` or `url`, optional `sha256`, and metadata.
- `RunRelationSpec`: parent/child/sibling/blocking relation between run ids.

Runtime types live in `src/workflow/schema.ts`.

## Validators

`src/workflow/validators.ts` provides deterministic validators for:

1. DAG node identity and required fields.
2. Dependency integrity and acyclic DAG shape.
3. Handoff artifact location/checksum shape.
4. Run relation required fields and self-relation rejection.

CLI usage:

```bash
gale-task validate --file workflow-bundle.json
```

where `workflow-bundle.json` may contain:

```json
{
  "dag": { "id": "gcw-demo", "nodes": [{ "id": "plan", "kind": "skill", "name": "Plan" }] },
  "artifacts": [{ "artifactId": "handoff-1", "runId": "run-1", "kind": "handoff", "path": ".context/handoff.md" }],
  "relations": [{ "runId": "run-1", "relatedRunId": "run-2", "relationType": "child" }]
}
```

## Event ledger projection

The SQLite `task_events` table now accepts additive nullable workflow columns (`run_type`, `node_id`, `review_role`, `artifact_*`, relation fields, and `metadata_json`). Existing rows and existing Board-compatible fields remain valid.

Log examples:

```bash
gale-task log workflow_started --task-id run-1 --run-type compound --title "GCW issue 42"
gale-task log review_role_started --task-id run-1 --review-role security --node-id review-security
gale-task log review_role_completed --task-id run-1 --review-role security --node-id review-security
gale-task log handoff_artifact_linked --task-id run-1 --artifact-id handoff-1 --artifact-type handoff --artifact-path .context/gcw/handoff.md
gale-task log run_relation_linked --task-id run-1 --related-run-id run-2 --relation-type child
```

Projection APIs:

```bash
gale-task events --run-id run-1
gale-task graph --run-id run-1
gale-task rollup --run-id run-1
```

The graph projection explicitly models multi-role `gh:review` output as review-role events/artifacts rather than rebuilding the review workflow.
