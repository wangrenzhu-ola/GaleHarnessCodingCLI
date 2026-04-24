import { afterEach, describe, expect, test } from "bun:test"
import { promises as fs } from "fs"
import os from "os"
import path from "path"
import { loadMorphConfig } from "../src/morph/config"

const tempRoots: string[] = []

async function makeTempProject(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "morph-config-"))
  tempRoots.push(root)
  return root
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })))
})

describe("loadMorphConfig", () => {
  test("loads a complete .morph-config.yaml", async () => {
    const projectRoot = await makeTempProject()
    await fs.writeFile(
      path.join(projectRoot, ".morph-config.yaml"),
      [
        "seed: ios-demo-a",
        "thresholds:",
        "  statementJaccard: 0.1",
        "  tokenNgram: 0.12",
        "  structuralHash: 0.2",
        "  controlFlow: 0.25",
        "baselines:",
        "  paths:",
        "    - fixtures/baseline-a",
        "blacklistedPatternTags:",
        "  - state.mvvm-service",
        "usedFingerprints:",
        "  - seed: old-seed",
        "    blueprint: blueprint-old",
        "    strategy: strategy-old",
        "    tags:",
        "      - layout.extensions-by-role",
        "    createdAt: '2026-04-24T00:00:00Z'",
        "",
      ].join("\n"),
    )

    const config = await loadMorphConfig(projectRoot)

    expect(config.source).toBe("file")
    expect(config.seed).toBe("ios-demo-a")
    expect(config.thresholds.statementJaccard).toBe(0.1)
    expect(config.thresholds.tokenNgram).toBe(0.12)
    expect(config.thresholds.structuralHash).toBe(0.2)
    expect(config.thresholds.controlFlow).toBe(0.25)
    expect(config.baselines.paths).toEqual([path.join(projectRoot, "fixtures/baseline-a")])
    expect(config.blacklistedPatternTags).toEqual(["state.mvvm-service"])
    expect(config.usedFingerprints).toEqual([
      {
        seed: "old-seed",
        blueprint: "blueprint-old",
        strategy: "strategy-old",
        tags: ["layout.extensions-by-role"],
        createdAt: "2026-04-24T00:00:00Z",
      },
    ])
    expect(config.warnings).toHaveLength(0)
  })

  test("returns defaults when the config file is missing", async () => {
    const projectRoot = await makeTempProject()

    const config = await loadMorphConfig(projectRoot)

    expect(config.source).toBe("default")
    expect(config.seed).toBe(`default:${path.basename(projectRoot)}`)
    expect(config.thresholds.statementJaccard).toBe(0.15)
    expect(config.baselines.paths).toEqual([])
    expect(config.warnings.map((warning) => warning.code)).toEqual(["default_seed", "baseline_missing"])
  })

  test("merges partial config with defaults", async () => {
    const projectRoot = await makeTempProject()
    await fs.writeFile(
      path.join(projectRoot, ".morph-config.yaml"),
      ["seed: 42", "thresholds:", "  tokenNgram: 0.33", "baselinePaths:", "  - ../shared-baseline", ""].join("\n"),
    )

    const config = await loadMorphConfig(projectRoot)

    expect(config.seed).toBe("42")
    expect(config.thresholds.statementJaccard).toBe(0.15)
    expect(config.thresholds.tokenNgram).toBe(0.33)
    expect(config.baselines.paths).toEqual([path.resolve(projectRoot, "../shared-baseline")])
  })

  test("overrides config values with CLI options", async () => {
    const projectRoot = await makeTempProject()
    await fs.writeFile(path.join(projectRoot, ".morph-config.yaml"), "seed: file-seed\n")

    const config = await loadMorphConfig(projectRoot, {
      seed: "cli-seed",
      thresholds: { controlFlow: 0.09 },
      baselinePaths: ["cli-baseline"],
    })

    expect(config.seed).toBe("cli-seed")
    expect(config.thresholds.controlFlow).toBe(0.09)
    expect(config.baselines.paths).toEqual([path.join(projectRoot, "cli-baseline")])
  })

  test("reports invalid YAML with the config file name", async () => {
    const projectRoot = await makeTempProject()
    await fs.writeFile(path.join(projectRoot, ".morph-config.yaml"), "seed: [unterminated\n")

    await expect(loadMorphConfig(projectRoot)).rejects.toThrow("Invalid .morph-config.yaml")
  })

  test("rejects thresholds outside the 0 to 1 range", async () => {
    const projectRoot = await makeTempProject()
    await fs.writeFile(
      path.join(projectRoot, ".morph-config.yaml"),
      ["thresholds:", "  statementJaccard: -0.1", ""].join("\n"),
    )

    await expect(loadMorphConfig(projectRoot)).rejects.toThrow("thresholds.statementJaccard")
  })
})
