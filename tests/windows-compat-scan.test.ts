import { describe, expect, test } from "bun:test"
import { buildRules, getExclusions, loadConfig, scanContent } from "../scripts/windows-compat-scan"

describe("windows-compat-scan", () => {
  describe("rules", () => {
    const rules = buildRules()

    function findRules(lines: string[], ext: string): string[] {
      return scanContent(lines, rules, ext).map((f) => f.rule)
    }

    test("bash-shebang detects #!/bin/bash", () => {
      expect(findRules(["#!/bin/bash"], ".sh")).toEqual(["bash-shebang"])
    })

    test("bash-shebang detects #!/usr/bin/env bash", () => {
      expect(findRules(["#!/usr/bin/env bash"], ".sh")).toEqual(["bash-shebang"])
    })

    test("bash-shebang ignores #!/bin/sh", () => {
      expect(findRules(["#!/bin/sh"], ".sh")).toEqual([])
    })

    test("command-v detects bash builtin", () => {
      expect(findRules(["if command -v node >/dev/null; then"], ".sh")).toEqual(["command-v"])
    })

    test("brew-install detects macOS package manager", () => {
      expect(findRules(["brew install node"], ".sh")).toEqual(["brew-install"])
    })

    test("rm-rf detects recursive removal", () => {
      expect(findRules(["rm -rf dist/"], ".sh")).toEqual(["rm-rf"])
    })

    test("rm-rf ignores rm without flags", () => {
      expect(findRules(["rm file.txt"], ".sh")).toEqual([])
    })

    test("mkdir-p detects recursive mkdir", () => {
      expect(findRules(["mkdir -p dist/assets"], ".sh")).toEqual(["mkdir-p"])
    })

    test("hardcoded-slash detects / in path.join", () => {
      expect(findRules(["path.join('src', '/components')"], ".ts")).toEqual(["hardcoded-slash"])
    })

    test("hardcoded-slash ignores normal path.join", () => {
      expect(findRules(["path.join('src', 'components')"], ".ts")).toEqual([])
    })

    test("process-env-home detects Unix home var", () => {
      expect(findRules(["const home = process.env.HOME"], ".ts")).toEqual(["process-env-home"])
    })

    test("colon-in-path detects colon in path.join", () => {
      expect(findRules(["path.join('dir', 'name:with:colons')"], ".ts")).toEqual(["colon-in-path"])
    })

    test("bash-array detects array assignment", () => {
      expect(findRules(["arr=(one two three)"], ".sh")).toEqual(["bash-array"])
    })

    test("bash-array ignores non-array parentheses", () => {
      expect(findRules(["echo (foo)"], ".sh")).toEqual([])
    })

    test("source-bash detects source command", () => {
      expect(findRules(["source ~/.bashrc"], ".sh")).toEqual(["source-bash"])
    })

    test("source-bash ignores source in comments", () => {
      expect(findRules(["// source of truth"], ".ts")).toEqual([])
    })
  })

  describe("python-subprocess-bash", () => {
    const rules = buildRules()

    function findRules(lines: string[], ext: string): string[] {
      return scanContent(lines, rules, ext).map((f) => f.rule)
    }

    test("detects subprocess.run with bash list", () => {
      expect(findRules(['subprocess.run(["bash", "-c", "echo hi"])'], ".py")).toEqual(["python-subprocess-bash"])
    })

    test("detects subprocess.Popen with sh list", () => {
      expect(findRules(["subprocess.Popen(['sh', '-c', 'echo hi'])"], ".py")).toEqual(["python-subprocess-bash"])
    })

    test("detects subprocess.call with bash string", () => {
      expect(findRules(['subprocess.call("bash -c echo hi")'], ".py")).toEqual(["python-subprocess-bash"])
    })

    test("detects subprocess.check_output with sh", () => {
      expect(findRules(['subprocess.check_output(["sh", "-c", "whoami"])'], ".py")).toEqual(["python-subprocess-bash"])
    })

    test("detects subprocess.check_call with bash", () => {
      expect(findRules(['subprocess.check_call(["bash", "script.sh"])'], ".py")).toEqual(["python-subprocess-bash"])
    })

    test("ignores subprocess.run with python", () => {
      expect(findRules(['subprocess.run(["python", "script.py"])'], ".py")).toEqual([])
    })

    test("ignores subprocess.run with cmd.exe", () => {
      expect(findRules(['subprocess.run(["cmd.exe", "/c", "dir"])'], ".py")).toEqual([])
    })

    test("ignores subprocess in Python comments", () => {
      expect(findRules(["# subprocess.run(['bash', '-c', 'echo hi'])"], ".py")).toEqual([])
    })
  })

  describe("config overrides", () => {
    test("severity override changes finding severity", () => {
      const overridden = buildRules({ rules: { "bash-shebang": { severity: "warn" } } })
      const findings = scanContent(["#!/bin/bash"], overridden, ".sh")
      expect(findings).toHaveLength(1)
      expect(findings[0].severity).toBe("warn")
    })

    test("disabled rule removes finding", () => {
      const overridden = buildRules({ rules: { "bash-shebang": { enabled: false } } })
      const findings = scanContent(["#!/bin/bash"], overridden, ".sh")
      expect(findings).toHaveLength(0)
    })

    test("unknown rule id in config is ignored", () => {
      const overridden = buildRules({ rules: { "unknown-rule": { severity: "info" } } })
      expect(overridden).toHaveLength(buildRules().length)
    })

    test("getExclusions merges defaults and extras", () => {
      const exclusions = getExclusions({ exclude: ["custom/**"] })
      expect(exclusions).toContain("node_modules")
      expect(exclusions).toContain("custom/**")
    })

    test("getExclusions returns defaults when config is empty", () => {
      const exclusions = getExclusions()
      expect(exclusions).toContain("node_modules")
      expect(exclusions).toContain(".git")
    })

    test("loadConfig returns undefined for missing file", async () => {
      const config = await loadConfig("/nonexistent/path/config.json")
      expect(config).toBeUndefined()
    })
  })
})
