import path from "path"
import {
  copySkillDir,
  ensureDir,
  sanitizePathName,
  writeText,
} from "../utils/files"
import type { CursorBundle } from "../converters/claude-to-cursor"

/**
 * Write Cursor bundle to the output directory.
 *
 * Cursor structure:
 * ~/.cursor/
 *   └── rules/
 *       ├── <rule-name>.mdc
 *       └── skills/
 *           └── <skill-name>/SKILL.md
 *
 * Or project-level:
 * .cursor/
 *   └── rules/
 *       └── *.mdc
 */
export async function writeCursorBundle(
  outputRoot: string,
  bundle: CursorBundle,
): Promise<void> {
  const cursorPaths = resolveCursorPaths(outputRoot)

  // Write rules
  if (bundle.rules.length > 0) {
    await ensureDir(cursorPaths.rulesDir)
    const seenRules = new Set<string>()
    for (const rule of bundle.rules) {
      const safeName = sanitizePathName(rule.name)
      if (seenRules.has(safeName)) {
        console.warn(
          `Skipping rule "${rule.name}": sanitized name "${safeName}" collides with another rule`,
        )
        continue
      }
      seenRules.add(safeName)
      // Cursor uses .mdc extension for rules
      await writeText(path.join(cursorPaths.rulesDir, `${safeName}.mdc`), rule.content + "\n")
      console.log(`Installed rule: ${rule.name}.mdc`)
    }
  }

  // Copy skills as subdirectories under rules/skills
  if (bundle.skillDirs.length > 0) {
    const skillsDir = path.join(cursorPaths.rulesDir, "skills")
    await ensureDir(skillsDir)
    for (const skill of bundle.skillDirs) {
      const destDir = path.join(skillsDir, sanitizePathName(skill.name))
      // Cursor uses the same SKILL.md format, copy without transformation
      await copySkillDir(skill.sourceDir, destDir, undefined, false)
      console.log(`Installed skill: ${skill.name}`)
    }
  }

  console.log(`\nCursor installation complete at: ${cursorPaths.root}`)
  console.log("Restart Cursor to load the new rules.")
}

function resolveCursorPaths(outputRoot: string) {
  const base = path.basename(outputRoot)

  // If outputRoot is already the cursor directory, use it directly
  if (base === ".cursor" || base === "cursor") {
    return {
      root: outputRoot,
      rulesDir: path.join(outputRoot, "rules"),
    }
  }

  // Otherwise, assume we're installing to ~/.cursor
  return {
    root: outputRoot,
    rulesDir: path.join(outputRoot, "rules"),
  }
}
