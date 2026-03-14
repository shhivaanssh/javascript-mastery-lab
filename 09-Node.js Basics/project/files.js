import fsp  from "fs/promises";
import fs   from "fs";
import path from "path";
import { createReadStream } from "fs";
import readline from "readline";

// ── File existence check ──
export async function exists(p) {
  try { await fsp.access(p); return true; }
  catch { return false; }
}

// ── Walk directory tree — async generator ──
export async function* walk(dir, { ignore = [] } = {}) {
  let entries;
  try { entries = await fsp.readdir(dir, { withFileTypes: true }); }
  catch { return; }

  for (const entry of entries) {
    if (ignore.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full, { ignore });
    else if (entry.isFile()) yield full;
  }
}

// ── Get file metadata ──
export async function getFileMeta(filepath) {
  const stat   = await fsp.stat(filepath);
  const parsed = path.parse(filepath);
  return {
    path:     filepath,
    name:     parsed.base,
    stem:     parsed.name,
    ext:      parsed.ext.toLowerCase(),
    dir:      parsed.dir,
    size:     stat.size,
    modified: stat.mtime,
    created:  stat.birthtime,
  };
}

// ── Format file size ──
export function formatSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 ** 2)   return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3)   return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

// ── Format relative time ──
export function formatAge(date) {
  const diff = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return "just now";
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 30)  return `${days}d ago`;
  return date.toLocaleDateString();
}

// ── Atomic JSON write ──
export async function writeJSONAtomic(filepath, data) {
  await fsp.mkdir(path.dirname(filepath), { recursive: true });
  const tmp = filepath + ".tmp." + process.pid;
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fsp.rename(tmp, filepath);
}

// ── Safe JSON read ──
export async function readJSON(filepath, fallback = null) {
  try {
    const text = await fsp.readFile(filepath, "utf8");
    return JSON.parse(text);
  } catch { return fallback; }
}

// ── Search for text in files using streams ──
export async function* grepFile(filepath, pattern) {
  const re     = pattern instanceof RegExp ? pattern : new RegExp(pattern, "i");
  const rl     = readline.createInterface({
    input:     createReadStream(filepath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    if (re.test(line)) yield { file: filepath, line: lineNum, text: line.trim() };
  }
}

// ── Copy file (stream-based for large files) ──
export async function copyFile(src, dst) {
  await fsp.mkdir(path.dirname(dst), { recursive: true });
  await fsp.copyFile(src, dst);
}

// ── Classify file by extension ──
const CATEGORIES = {
  code:     [".js", ".ts", ".jsx", ".tsx", ".py", ".rb", ".go", ".rs", ".java", ".c", ".cpp", ".h", ".cs", ".php", ".sh", ".bash"],
  docs:     [".md", ".txt", ".pdf", ".doc", ".docx", ".odt", ".rtf"],
  images:   [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico", ".bmp", ".tiff"],
  video:    [".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv"],
  audio:    [".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a"],
  data:     [".json", ".yaml", ".yml", ".csv", ".xml", ".toml", ".env"],
  archives: [".zip", ".tar", ".gz", ".bz2", ".7z", ".rar"],
  fonts:    [".ttf", ".otf", ".woff", ".woff2", ".eot"],
};

export function getCategory(ext) {
  const e = ext.toLowerCase();
  for (const [cat, exts] of Object.entries(CATEGORIES)) {
    if (exts.includes(e)) return cat;
  }
  return "other";
}

// ── Highlight a pattern in text ──
export function highlight(text, pattern) {
  if (!pattern) return text;
  const re = pattern instanceof RegExp ? pattern : new RegExp(`(${escapeRegex(pattern)})`, "gi");
  return text.replace(re, "\x1b[33m$1\x1b[0m"); // yellow
}

export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
