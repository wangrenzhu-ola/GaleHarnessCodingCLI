import path from "path"
import {
  copySkillDir,
  ensureDir,
  sanitizePathName,
  writeText,
} from "../utils/files"
import type { KimiBundle } from "../converters/claude-to-kimi"

/**
 * Write Kimi bundle to the output directory.
 *
 * Kimi structure:
 * ~/.kimi/
 *   └── skills/<skill-name>/SKILL.md
 */
export async function writeKimiBundle(
  outputRoot: string,
  bundle: KimiBundle,
): Promise<void> {
  const skillsDir = path.join(outputRoot, "skills")

  // Copy original skills
  if (bundle.skillDirs.length > 0) {
    await ensureDir(skillsDir)
    for (const skill of bundle.skillDirs) {
      const destDir = path.join(skillsDir, sanitizePathName(skill.name))
      await copySkillDir(skill.sourceDir, destDir, undefined, false)
      console.log(`Installed skill: ${skill.name}`)
    }
  }

  // Write generated skills (agents and commands)
  if (bundle.generatedSkills.length > 0) {
    await ensureDir(skillsDir)
    const seenNames = new Set<string>()
    for (const skill of bundle.generatedSkills) {
      const safeName = sanitizePathName(skill.name)
      if (seenNames.has(safeName)) {
        console.warn(
          `Skipping generated skill "${skill.name}": sanitized name "${safeName}" collides with another skill`,
        )
        continue
      }
      seenNames.add(safeName)
      const destDir = path.join(skillsDir, safeName)
      await ensureDir(destDir)
      await writeText(path.join(destDir, "SKILL.md"), skill.content + "\n")
      console.log(`Installed generated skill: ${skill.name}`)
    }
  }

  console.log(`\nKimi installation complete at: ${outputRoot}`)
}
