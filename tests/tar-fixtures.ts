import { gzipSync } from "node:zlib"

export interface TarFixtureEntry {
  name: string
  content?: string
  type?: "file" | "symlink" | "hardlink" | "directory" | "character-device"
  linkName?: string
}

function writeString(buffer: Buffer, offset: number, length: number, value: string): void {
  buffer.write(value.slice(0, length), offset, length, "utf-8")
}

function writeOctal(buffer: Buffer, offset: number, length: number, value: number): void {
  const encoded = value.toString(8).padStart(length - 1, "0")
  writeString(buffer, offset, length, `${encoded}\0`)
}

function padToBlock(buffer: Buffer): Buffer {
  const remainder = buffer.length % 512
  if (remainder === 0) return buffer
  return Buffer.concat([buffer, Buffer.alloc(512 - remainder)])
}

function tarHeader(entry: TarFixtureEntry, size: number): Buffer {
  const header = Buffer.alloc(512)
  const typeflag =
    entry.type === "symlink"
      ? "2"
      : entry.type === "hardlink"
        ? "1"
        : entry.type === "directory"
          ? "5"
          : entry.type === "character-device"
            ? "3"
            : "0"

  writeString(header, 0, 100, entry.name)
  writeOctal(header, 100, 8, entry.type === "directory" ? 0o755 : 0o644)
  writeOctal(header, 108, 8, 0)
  writeOctal(header, 116, 8, 0)
  writeOctal(header, 124, 12, typeflag === "0" ? size : 0)
  writeOctal(header, 136, 12, 0)
  header.fill(0x20, 148, 156)
  writeString(header, 156, 1, typeflag)
  if (entry.linkName) writeString(header, 157, 100, entry.linkName)
  writeString(header, 257, 6, "ustar")
  writeString(header, 263, 2, "00")

  let checksum = 0
  for (const byte of header) checksum += byte
  writeString(header, 148, 8, checksum.toString(8).padStart(6, "0") + "\0 ")
  return header
}

export function createTarGz(entries: TarFixtureEntry[]): Buffer {
  const blocks: Buffer[] = []
  for (const entry of entries) {
    const content = Buffer.from(entry.content ?? "", "utf-8")
    blocks.push(tarHeader(entry, content.length))
    if ((entry.type ?? "file") === "file") {
      blocks.push(padToBlock(content))
    }
  }
  blocks.push(Buffer.alloc(1024))
  return gzipSync(Buffer.concat(blocks))
}
