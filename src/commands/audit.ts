import { defineCommand } from "citty"
import { promises as fs } from "fs"
import path from "path"
import { loadMorphConfig } from "../morph/config"
import { collectMorphSourceFiles, matchBaselineFiles } from "../morph/files"
import { buildMorphSimilarityReport } from "../morph/report"
import type { MorphConfigThresholds, MorphSimilarityReport } from "../morph/types"

export default defineCommand({
  meta: {
    name: "audit",
    description: "Audit generated code for Morph-X similarity risk",
  },
  args: {
    target: {
      type: "positional",
      required: false,
      default: ".",
      description: "Project directory or source file to scan",
    },
    similarity: {
      type: "boolean",
      default: false,
      description: "Run similarity audit",
    },
    baseline: {
      type: "string",
      description: "Baseline directory or source file. Overrides .morph-config.yaml baselines.",
    },
    threshold: {
      type: "string",
      description: "Override all similarity thresholds with a number between 0 and 1",
    },
    json: {
      type: "boolean",
      default: false,
      description: "Print machine-readable JSON",
    },
    failOnThreshold: {
      type: "boolean",
      default: false,
      alias: "fail-on-threshold",
      description: "Exit non-zero when any file meets or exceeds a threshold",
    },
  },
  async run({ args }) {
    if (!args.similarity) {
      throw new Error("audit currently requires --similarity")
    }

    const target = String(args.target ?? ".")
    const thresholdOverride = parseThresholdOverride(args.threshold)
    const baselinePaths = args.baseline ? splitList(String(args.baseline)) : undefined
    const configRoot = await resolveConfigRoot(target)
    const config = await loadMorphConfig(configRoot, {
      baselinePaths,
      thresholds: thresholdOverride ? allThresholds(thresholdOverride) : undefined,
    })
    const sources = await collectMorphSourceFiles(target, { excludePaths: config.baselines.paths })
    const matches = await matchBaselineFiles(sources, config.baselines.paths)
    const report = buildMorphSimilarityReport(matches.map((match) => ({
      path: match.source.path,
      source: match.source.content,
      baselinePath: match.baselinePath,
      baselineSource: match.baselineSource,
    })), config.thresholds)
    report.warnings.push(...config.warnings.map((warning) => warning.code))

    if (args.json) {
      console.log(JSON.stringify(report, null, 2))
    } else {
      printSimilarityReport(report)
    }

    if (args.failOnThreshold && report.status === "blocked") {
      process.exitCode = 2
    }
  },
})

function parseThresholdOverride(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error("Invalid --threshold: expected number between 0 and 1")
  }
  return parsed
}

async function resolveConfigRoot(target: string): Promise<string> {
  const resolved = path.resolve(target)
  const stat = await fs.stat(resolved)
  return stat.isDirectory() ? resolved : path.dirname(resolved)
}

function allThresholds(value: number): Partial<MorphConfigThresholds> {
  return {
    statementJaccard: value,
    tokenNgram: value,
    structuralHash: value,
    controlFlow: value,
  }
}

function splitList(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean)
}

function printSimilarityReport(report: MorphSimilarityReport): void {
  console.log(`Morph-X similarity audit: ${report.status}`)
  if (report.files.length === 0) {
    console.log("No Swift/ObjC source files found.")
  }

  for (const file of report.files) {
    const marker = file.highRisk ? "risk" : "ok"
    const metrics = Object.entries(file.metrics)
      .map(([name, score]) => `${name}=${formatScore(score)}`)
      .join(", ")
    console.log(`- ${marker} ${file.path}${metrics ? ` (${metrics})` : ""}`)
    for (const reason of file.riskReasons) {
      console.log(`  ${reason.reason}`)
    }
    for (const warning of file.warnings) {
      console.log(`  warning: ${warning}`)
    }
  }

  for (const warning of report.warnings) {
    console.log(`warning: ${warning}`)
  }
}

function formatScore(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(3) : "n/a"
}
