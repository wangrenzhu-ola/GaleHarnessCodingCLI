import { describe, expect, test } from "bun:test"
import { win32 as win32Path } from "path"
import { sanitizePathName } from "../src/utils/files"

describe("path.win32 — cache directory resolution", () => {
  test("resolves a Windows user home cache path", () => {
    const home = "C:\\Users\\TestUser"
    const cacheDir = win32Path.join(home, ".hermes")
    expect(cacheDir).toBe("C:\\Users\\TestUser\\.hermes")
  })

  test("resolves nested cache subdirectories", () => {
    const home = "C:\\Users\\TestUser"
    const sessionsDir = win32Path.join(home, ".hermes", "sessions", "2026-04-18")
    expect(sessionsDir).toBe("C:\\Users\\TestUser\\.hermes\\sessions\\2026-04-18")
  })
})

describe("path.win32 — config file write paths", () => {
  test("joins config path under user profile", () => {
    const configPath = win32Path.join("C:\\Users", "hermes", "config.yaml")
    expect(configPath).toBe("C:\\Users\\hermes\\config.yaml")
  })

  test("joins config path with explicit user directory", () => {
    const configPath = win32Path.join("C:\\Users\\Alice", ".config", "hermes", "settings.json")
    expect(configPath).toBe("C:\\Users\\Alice\\.config\\hermes\\settings.json")
  })
})

describe("path.win32 — colon handling in filename segments (non-drive)", () => {
  test("join with a raw colon-containing name preserves the colon in the joined string", () => {
    const raw = win32Path.join("C:\\Users", "gh:brainstorm")
    expect(raw).toBe("C:\\Users\\gh:brainstorm")
  })

  test("join with a sanitized name removes the colon from the filename segment", () => {
    const sanitized = sanitizePathName("gh:brainstorm")
    const safePath = win32Path.join("C:\\Users", sanitized)
    expect(safePath).toBe("C:\\Users\\gh-brainstorm")
    expect(sanitized).not.toContain(":")
  })

  test("multiple colons in a filename segment are sanitized away", () => {
    const sanitized = sanitizePathName("a:b:c")
    const safePath = win32Path.join("skills", sanitized, "SKILL.md")
    expect(safePath).toBe("skills\\a-b-c\\SKILL.md")
    expect(safePath).not.toMatch(/[<>:"|?*]/)
  })
})

describe("path.win32 — drive letter handling", () => {
  test("C:\\ drive path is absolute", () => {
    expect(win32Path.isAbsolute("C:\\foo")).toBe(true)
  })

  test("D:\\ drive path is absolute", () => {
    expect(win32Path.isAbsolute("D:\\foo")).toBe(true)
  })

  test("joining onto a C:\\ drive path preserves the drive letter", () => {
    const joined = win32Path.join("C:\\", "Users", "test")
    expect(joined).toBe("C:\\Users\\test")
    expect(joined.startsWith("C:")).toBe(true)
  })

  test("joining onto a D:\\ drive path preserves the drive letter", () => {
    const joined = win32Path.join("D:\\Projects", "hermes")
    expect(joined).toBe("D:\\Projects\\hermes")
    expect(joined.startsWith("D:")).toBe(true)
  })
})

describe("path.win32 — backslash vs forward slash normalization", () => {
  test("normalizes mixed separators to backslash", () => {
    const normalized = win32Path.normalize("C:/Users\\test/.config/hermes")
    expect(normalized).toBe("C:\\Users\\test\\.config\\hermes")
  })

  test("join normalizes forward slashes in segments", () => {
    const joined = win32Path.join("C:\\Users", "test/.config", "hermes")
    expect(joined).toBe("C:\\Users\\test\\.config\\hermes")
  })
})

describe("path.win32 — path segments with spaces", () => {
  test("join preserves spaces in directory names", () => {
    const pathWithSpaces = win32Path.join("C:\\Program Files", "Hermes", "config.yaml")
    expect(pathWithSpaces).toBe("C:\\Program Files\\Hermes\\config.yaml")
  })

  test("join preserves spaces in user profile paths", () => {
    const pathWithSpaces = win32Path.join("C:\\Users", "Alice Smith", ".hermes", "cache")
    expect(pathWithSpaces).toBe("C:\\Users\\Alice Smith\\.hermes\\cache")
  })
})

describe("path.win32 — absolute vs relative", () => {
  test("detects absolute Windows paths", () => {
    expect(win32Path.isAbsolute("C:\\foo")).toBe(true)
    expect(win32Path.isAbsolute("D:\\bar\\baz")).toBe(true)
    expect(win32Path.isAbsolute("\\\\server\\share")).toBe(true)
  })

  test("detects relative Windows paths", () => {
    expect(win32Path.isAbsolute("foo")).toBe(false)
    expect(win32Path.isAbsolute("foo\\bar")).toBe(false)
    expect(win32Path.isAbsolute(".\\foo")).toBe(false)
    expect(win32Path.isAbsolute("..\\foo")).toBe(false)
  })
})

describe("path.win32 — path normalization", () => {
  test("normalizes .. segments", () => {
    const normalized = win32Path.normalize("C:\\Users\\test\\..\\admin")
    expect(normalized).toBe("C:\\Users\\admin")
  })

  test("normalizes . segments", () => {
    const normalized = win32Path.normalize("C:\\Users\\.\\test")
    expect(normalized).toBe("C:\\Users\\test")
  })

  test("normalizes combined . and .. segments", () => {
    const normalized = win32Path.normalize("C:\\Users\\.\\test\\..\\.\\admin")
    expect(normalized).toBe("C:\\Users\\admin")
  })

  test("normalizes trailing separators", () => {
    const normalized = win32Path.normalize("C:\\Users\\test\\")
    expect(normalized).toBe("C:\\Users\\test\\")
  })

  test("normalizes excessive separators", () => {
    const normalized = win32Path.normalize("C:\\Users\\\\\\test")
    expect(normalized).toBe("C:\\Users\\test")
  })
})
