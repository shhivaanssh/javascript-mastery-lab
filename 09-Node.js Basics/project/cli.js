#!/usr/bin/env node
// Module 09 Mini Project — file-system-cli
//
// Commands:
//   node bin/cli.js ls [dir]                  — list files in a directory
//   node bin/cli.js find <dir> [options]       — find files matching criteria
//   node bin/cli.js search <pattern> [dir]     — search file contents
//   node bin/cli.js tag add <file> <tags...>   — add tags to a file
//   node bin/cli.js tag remove <file> <tags...>— remove tags from a file
//   node bin/cli.js tag list [file]            — list tags
//   node bin/cli.js tag find <tag>             — find files with a tag
//   node bin/cli.js stats [dir]               — directory statistics
//   node bin/cli.js --help                    — show help
//
// Node.js concepts used:
//   process.argv        — parse CLI arguments
//   process.env         — colour/pager settings
//   fs/promises         — readdir, stat, readFile, mkdir, rename
//   path                — join, parse, resolve, extname
//   EventEmitter        — progress events during long operations
//   Streams / readline  — grep files without loading them into memory
//   Buffers             — byte-level file size accounting
//   http                — not used here (see concepts/events-and-http.js)

import path from "path";
import fsp  from "fs/promises";
import { EventEmitter }  from "events";
import { walk, getFileMeta, formatSize, formatAge, getCategory, grepFile, highlight, escapeRegex } from "../lib/files.js";
import { TagDB } from "../lib/tags.js";
import { color, colorExt, printTable, printHeader, printSuccess, printError, printInfo, printWarn, printTags, printTag, createSpinner } from "../lib/output.js";

const argv = process.argv.slice(2);
const [command, ...rest] = argv;

const IGNORE = ["node_modules", ".git", ".DS_Store", "dist", "build", ".next"];

// ── Help ──────────────────────────────────────────────

function showHelp() {
  console.log(`
${color.bold("fscli")} — file system CLI

${color.bold("USAGE")}
  node bin/cli.js <command> [options]

${color.bold("COMMANDS")}
  ${color.cyan("ls")} [dir]                  List files (default: current dir)
    ${color.gray("--ext .js,.ts")}             Filter by extension
    ${color.gray("--sort size|name|date")}     Sort order (default: name)
    ${color.gray("--limit 20")}                Max results

  ${color.cyan("find")} <dir> [options]        Find files by criteria
    ${color.gray("--ext .js,.ts")}             Extension filter
    ${color.gray("--name glob")}               Name pattern (simple, not full glob)
    ${color.gray("--cat code|docs|images")}    Category filter
    ${color.gray("--min 1kb")}                 Min file size
    ${color.gray("--max 5mb")}                 Max file size
    ${color.gray("--newer 7d")}                Modified within N days

  ${color.cyan("search")} <pattern> [dir]      Search file contents
    ${color.gray("--ext .js,.ts")}             Only search these extensions
    ${color.gray("--case")}                    Case-sensitive search

  ${color.cyan("tag add")} <file> <tag...>      Add tags to a file
  ${color.cyan("tag remove")} <file> <tag...>   Remove tags from a file
  ${color.cyan("tag list")} [file]              List all tags (or tags for file)
  ${color.cyan("tag find")} <tag>              Find files with this tag

  ${color.cyan("stats")} [dir]                 Directory statistics

${color.bold("EXAMPLES")}
  node bin/cli.js ls ./src --ext .js --sort size
  node bin/cli.js find . --cat code --newer 7d
  node bin/cli.js search "TODO" ./src --ext .js
  node bin/cli.js tag add ./index.js important work-in-progress
  node bin/cli.js tag find important
  node bin/cli.js stats .
`);
}

// ── Argument parsing ──────────────────────────────────

function parseFlags(args) {
  const flags = {};
  const pos   = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key  = args[i].slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) { flags[key] = next; i++; }
      else flags[key] = true;
    } else {
      pos.push(args[i]);
    }
  }
  return { flags, pos };
}

function parseSize(str) {
  if (!str) return null;
  const m = str.match(/^([\d.]+)\s*(b|kb|mb|gb)?$/i);
  if (!m) return null;
  const n    = parseFloat(m[1]);
  const unit = (m[2] ?? "b").toLowerCase();
  const mult = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 };
  return n * (mult[unit] ?? 1);
}

function parseDays(str) {
  if (!str) return null;
  const m = str.match(/^(\d+)d?$/);
  return m ? parseInt(m[1]) : null;
}


// ── ls command ───────────────────────────────────────

async function cmdLs(args) {
  const { flags, pos } = parseFlags(args);
  const dir   = path.resolve(pos[0] ?? ".");
  const exts  = flags.ext ? flags.ext.split(",").map(e => e.startsWith(".") ? e : "." + e) : null;
  const sort  = flags.sort ?? "name";
  const limit = flags.limit ? parseInt(flags.limit) : 50;

  printHeader(`Listing: ${dir}`);

  let entries;
  try { entries = await fsp.readdir(dir, { withFileTypes: true }); }
  catch { printError(`Cannot read directory: ${dir}`); process.exit(1); }

  const files = [];
  for (const entry of entries) {
    if (IGNORE.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const meta = await getFileMeta(full).catch(() => null);
    if (!meta) continue;

    if (entry.isDirectory()) {
      files.push({ ...meta, isDir: true, size: 0, displayExt: "/" });
    } else {
      if (exts && !exts.includes(meta.ext)) continue;
      files.push({ ...meta, isDir: false, displayExt: meta.ext });
    }
  }

  // Sort
  const sorted = files.sort((a, b) => {
    if (sort === "size")  return b.size - a.size;
    if (sort === "date")  return b.modified - a.modified;
    // Sort dirs first, then by name
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  }).slice(0, limit);

  if (!sorted.length) { printInfo("No files found"); return; }

  const rows = sorted.map(f => [
    f.isDir ? color.blue(color.bold(f.name + "/")) : color.bold(f.stem) + colorExt(f.ext),
    f.isDir ? color.blue("dir") : colorExt(f.ext),
    f.isDir ? "—" : formatSize(f.size),
    formatAge(f.modified),
    f.isDir ? "" : color.gray(getCategory(f.ext)),
  ]);

  printTable(rows, ["Name", "Ext", "Size", "Modified", "Category"]);
  console.log(color.gray(`\n  ${sorted.length} items`));
}


// ── find command ──────────────────────────────────────

async function cmdFind(args) {
  const { flags, pos } = parseFlags(args);
  const dir   = path.resolve(pos[0] ?? ".");
  const exts  = flags.ext  ? flags.ext.split(",").map(e => e.startsWith(".") ? e : "." + e) : null;
  const cat   = flags.cat  ?? null;
  const nameP = flags.name ? new RegExp(escapeRegex(flags.name).replace(/\\\*/g, ".*"), "i") : null;
  const minSz = parseSize(flags.min);
  const maxSz = parseSize(flags.max);
  const newer = parseDays(flags.newer);

  printHeader(`Finding in: ${dir}`);

  const spinner = createSpinner("Scanning files...");
  const results = [];

  for await (const file of walk(dir, { ignore: IGNORE })) {
    const meta = await getFileMeta(file).catch(() => null);
    if (!meta) continue;

    if (exts  && !exts.includes(meta.ext))          continue;
    if (cat   && getCategory(meta.ext) !== cat)      continue;
    if (nameP && !nameP.test(meta.name))             continue;
    if (minSz !== null && meta.size < minSz)         continue;
    if (maxSz !== null && meta.size > maxSz)         continue;
    if (newer !== null) {
      const cutoff = Date.now() - newer * 86400000;
      if (meta.modified.getTime() < cutoff)          continue;
    }

    results.push(meta);
  }

  spinner.stop(`Found ${results.length} files`);

  if (!results.length) { printInfo("No files matched"); return; }

  const rows = results.slice(0, 100).map(f => [
    color.bold(f.name),
    colorExt(f.ext),
    formatSize(f.size),
    formatAge(f.modified),
    color.gray(f.dir),
  ]);

  printTable(rows, ["Name", "Ext", "Size", "Modified", "Directory"]);
  if (results.length > 100) printInfo(`Showing first 100 of ${results.length}`);
}


// ── search command ────────────────────────────────────

async function cmdSearch(args) {
  const { flags, pos } = parseFlags(args);
  const [pattern, dirArg] = pos;
  if (!pattern) { printError("Usage: search <pattern> [dir]"); process.exit(1); }

  const dir   = path.resolve(dirArg ?? ".");
  const exts  = flags.ext   ? flags.ext.split(",").map(e => e.startsWith(".") ? e : "." + e) : [".js",".ts",".jsx",".tsx",".md",".txt",".json",".py",".rb",".sh"];
  const re    = flags.case  ? new RegExp(pattern) : new RegExp(pattern, "i");

  printHeader(`Searching: "${pattern}" in ${dir}`);

  const spinner = createSpinner("Searching...");
  let total     = 0;
  let matches   = 0;
  const OUTPUT  = [];

  for await (const file of walk(dir, { ignore: IGNORE })) {
    const ext = path.extname(file).toLowerCase();
    if (!exts.includes(ext)) continue;
    total++;

    try {
      for await (const hit of grepFile(file, re)) {
        matches++;
        OUTPUT.push(hit);
        if (OUTPUT.length >= 200) break;
      }
    } catch { /* skip unreadable */ }
  }

  spinner.stop(`${matches} matches in ${total} files`);

  if (!OUTPUT.length) { printInfo("No matches found"); return; }

  let lastFile = "";
  for (const { file, line, text } of OUTPUT) {
    const rel = path.relative(process.cwd(), file);
    if (file !== lastFile) {
      console.log(`\n  ${color.bold(color.green(rel))}`);
      lastFile = file;
    }
    console.log(`    ${color.gray(String(line).padStart(4))}  ${highlight(text, re)}`);
  }
}


// ── tag commands ──────────────────────────────────────

async function cmdTag(args) {
  const [sub, ...rest2] = args;
  const db = await new TagDB().load();

  if (sub === "add") {
    const [file, ...tags] = rest2;
    if (!file || !tags.length) { printError("Usage: tag add <file> <tag...>"); process.exit(1); }
    const abs   = path.resolve(file);
    const added = db.add(abs, ...tags);
    await db.save();
    printSuccess(`Tagged ${color.bold(path.basename(file))}: ${printTags(added)}`);

  } else if (sub === "remove") {
    const [file, ...tags] = rest2;
    if (!file || !tags.length) { printError("Usage: tag remove <file> <tag...>"); process.exit(1); }
    const abs  = path.resolve(file);
    const left = db.remove(abs, ...tags);
    await db.save();
    printSuccess(`Updated ${color.bold(path.basename(file))}: ${printTags(left)}`);

  } else if (sub === "list") {
    const [fileArg] = rest2;
    if (fileArg) {
      const tags = db.get(path.resolve(fileArg));
      console.log(`\n  ${color.bold(path.basename(fileArg))}: ${printTags(tags)}`);
    } else {
      printHeader("All tags");
      const all = db.allTags();
      if (!all.length) { printInfo("No tags yet"); return; }
      all.forEach(t => printInfo(printTag(t)));
    }

  } else if (sub === "find") {
    const [tag] = rest2;
    if (!tag) { printError("Usage: tag find <tag>"); process.exit(1); }
    const files = db.findByTag(tag);
    printHeader(`Files tagged: ${printTag(tag)}`);
    if (!files.length) { printInfo("No files with this tag"); return; }
    files.forEach(f => printInfo(color.bold(f)));

  } else {
    printError(`Unknown tag subcommand: ${sub}`);
    printInfo("Usage: tag add|remove|list|find");
    process.exit(1);
  }
}


// ── stats command ─────────────────────────────────────

async function cmdStats(args) {
  const { pos } = parseFlags(args);
  const dir     = path.resolve(pos[0] ?? ".");

  printHeader(`Statistics: ${dir}`);

  const spinner  = createSpinner("Analyzing...");
  const stats    = {
    files: 0, dirs: 0, totalBytes: 0,
    byExt: {}, byCat: {}, newest: null, oldest: null, largest: null,
  };

  for await (const file of walk(dir, { ignore: IGNORE })) {
    const meta = await getFileMeta(file).catch(() => null);
    if (!meta) continue;

    stats.files++;
    stats.totalBytes += meta.size;

    const ext = meta.ext || "(none)";
    const cat = getCategory(meta.ext);
    stats.byExt[ext] = (stats.byExt[ext] ?? 0) + 1;
    stats.byCat[cat] = (stats.byCat[cat] ?? 0) + 1;

    if (!stats.newest || meta.modified > stats.newest.modified) stats.newest = meta;
    if (!stats.oldest || meta.modified < stats.oldest.modified) stats.oldest = meta;
    if (!stats.largest || meta.size > stats.largest.size) stats.largest = meta;
  }

  spinner.stop("Done");

  console.log(`\n  ${color.bold("Files")}:     ${stats.files}`);
  console.log(`  ${color.bold("Total size")}: ${formatSize(stats.totalBytes)}`);
  console.log(`  ${color.bold("Avg size")}:   ${stats.files ? formatSize(stats.totalBytes / stats.files) : "—"}`);

  if (stats.largest) {
    console.log(`  ${color.bold("Largest")}:   ${color.bold(stats.largest.name)} (${formatSize(stats.largest.size)})`);
  }
  if (stats.newest) {
    console.log(`  ${color.bold("Newest")}:    ${color.bold(stats.newest.name)} (${formatAge(stats.newest.modified)})`);
  }

  // Top extensions
  const topExts = Object.entries(stats.byExt)
    .sort(([,a],[,b]) => b - a).slice(0, 8);

  if (topExts.length) {
    console.log(`\n  ${color.bold("Top extensions:")}`);
    const maxCount = topExts[0][1];
    topExts.forEach(([ext, count]) => {
      const bar = "▓".repeat(Math.round(count / maxCount * 20));
      console.log(`    ${colorExt(ext).padEnd(10)}  ${bar} ${color.gray(count)}`);
    });
  }

  // By category
  const cats = Object.entries(stats.byCat).sort(([,a],[,b]) => b - a);
  if (cats.length) {
    console.log(`\n  ${color.bold("By category:")}`);
    cats.forEach(([cat, n]) => console.log(`    ${cat.padEnd(10)} ${color.cyan(n)}`));
  }
}


// ── Dispatch ──────────────────────────────────────────

if (!command || command === "--help" || command === "-h") {
  showHelp();
} else if (command === "ls") {
  await cmdLs(rest);
} else if (command === "find") {
  await cmdFind(rest);
} else if (command === "search") {
  await cmdSearch(rest);
} else if (command === "tag") {
  await cmdTag(rest);
} else if (command === "stats") {
  await cmdStats(rest);
} else {
  printError(`Unknown command: ${command}`);
  printInfo("Run with --help for usage");
  process.exit(1);
}
