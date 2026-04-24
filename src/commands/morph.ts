import { defineCommand } from "citty"
import { promises as fs } from "fs"
import path from "path"
import { loadMorphConfig } from "../morph/config"
import { collectMorphSourceFiles, matchBaselineFiles } from "../morph/files"
import { buildMorphSimilarityReport } from "../morph/report"
import { runSwiftAdapter, applySwiftAdapterResult } from "../morph/swift-adapter"
import { selectMorphStrategy } from "../morph/strategies"

export default defineCommand({
  meta: {
    name: "morph",
    description: "Apply Morph-X code-structure transforms and produce an audit report",
  },
  args: {
    target: {
      type: "positional",
      required: false,
      default: ".",
      description: "Project directory or source file to process",
    },
    apply: {
      type: "boolean",
      default: false,
      description: "Apply transformations when an adapter is available",
    },
    baseline: {
      type: "string",
      description: "Baseline directory or source file. Overrides .morph-config.yaml baselines.",
    },
    seed: {
      type: "string",
      description: "Override Morph-X project seed",
    },
    json: {
      type: "boolean",
      default: false,
      description: "Print machine-readable JSON",
    },
    report: {
      type: "string",
      description: "Write JSON report to this file",
    },
  },
  async run({ args }) {
    const target = String(args.target ?? ".")
    const baselinePaths = args.baseline ? splitList(String(args.baseline)) : undefined
    const configRoot = await resolveConfigRoot(target)
    const config = await loadMorphConfig(configRoot, {
      seed: args.seed ? String(args.seed) : undefined,
      baselinePaths,
    })
    const sources = await collectMorphSourceFiles(target, { excludePaths: config.baselines.paths })
    const selection = selectMorphStrategy({
      seed: config.seed,
      usedFingerprints: config.usedFingerprints,
      blacklistedTags: config.blacklistedPatternTags,
      languages: Array.from(new Set(sources.map((source) => source.language))),
    })

    const swiftSources = sources.filter((source) => source.language === "swift")
    const adapterResult = await runSwiftAdapter({
      files: swiftSources.map((source) => ({ path: source.path, content: source.content })),
      strategyFingerprint: selection.strategy.fingerprint,
      strategyTags: selection.strategy.tags,
      apply: Boolean(args.apply),
    })
    const written = args.apply ? await applySwiftAdapterResult(adapterResult) : []
    const refreshedSources = written.length > 0
      ? await collectMorphSourceFiles(target, { excludePaths: config.baselines.paths })
      : sources
    const matches = await matchBaselineFiles(refreshedSources, config.baselines.paths)
    const similarity = buildMorphSimilarityReport(matches.map((match) => ({
      path: match.source.path,
      source: match.source.content,
      baselinePath: match.baselinePath,
      baselineSource: match.baselineSource,
    })), config.thresholds)
    similarity.warnings.push(...config.warnings.map((warning) => warning.code), ...adapterResult.warnings)

    const report = {
      status: similarity.status,
      seed: config.seed,
      blueprint: selection.blueprint,
      strategy: selection.strategy,
      fingerprint: selection.fingerprint,
      applied: Boolean(args.apply),
      filesChanged: written,
      adapter: {
        ok: adapterResult.ok,
        unavailable: adapterResult.unavailable === true,
        warnings: adapterResult.warnings,
      },
      similarity,
      warnings: [...selection.warnings, ...similarity.warnings],
    }

    if (args.report) {
      await fs.writeFile(String(args.report), JSON.stringify(report, null, 2) + "\n", "utf8")
    }

    if (args.json) {
      console.log(JSON.stringify(report, null, 2))
    } else {
      console.log(`Morph-X strategy: ${selection.strategy.fingerprint}`)
      console.log(`Morph-X blueprint: ${selection.blueprint.fingerprint}`)
      console.log(`Files changed: ${written.length}`)
      for (const warning of report.warnings) {
        console.log(`warning: ${warning}`)
      }
    }
  },
})

function splitList(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean)
}

async function resolveConfigRoot(target: string): Promise<string> {
  const resolved = path.resolve(target)
  const stat = await fs.stat(resolved)
  return stat.isDirectory() ? resolved : path.dirname(resolved)
}
