#!/usr/bin/env node
// DevNotes CLI — dn
// Usage: node bin/dn.js <command> [options]
//
// Commands:
//   add  "title" [--lang js] [--tag t1] [--tag t2] [--body "text"] [--source url]
//   list [--tag t] [--lang js] [--pinned] [--limit 20]
//   search <keyword>
//   view <id>
//   edit <id> [--title "..."] [--lang js] [--tag t1] [--body "text"]
//   delete <id>
//   tags
//   open [id]          open in browser

import http from "http";
import { exec } from "child_process";
import { config } from "../src/config.js";

const BASE = `http://localhost:${config.port}/api`;

// ── ANSI colours ─────────────────────────────────
const c = {
  reset:   "\x1b[0m",
  bold:    "\x1b[1m",
  dim:     "\x1b[2m",
  yellow:  "\x1b[33m",
  green:   "\x1b[32m",
  blue:    "\x1b[34m",
  cyan:    "\x1b[36m",
  red:     "\x1b[31m",
  gray:    "\x1b[90m",
};

const col = process.stdout.isTTY ? c : Object.fromEntries(Object.keys(c).map(k => [k, ""]));
const bold    = s => `${col.bold}${s}${col.reset}`;
const dim     = s => `${col.dim}${s}${col.reset}`;
const yellow  = s => `${col.yellow}${s}${col.reset}`;
const green   = s => `${col.green}${s}${col.reset}`;
const blue    = s => `${col.blue}${s}${col.reset}`;
const cyan    = s => `${col.cyan}${s}${col.reset}`;
const red     = s => `${col.red}${s}${col.reset}`;
const gray    = s => `${col.gray}${s}${col.reset}`;

// ── HTTP helper ───────────────────────────────────
function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload  = body ? JSON.stringify(body) : null;
    const options  = {
      hostname: "localhost",
      port:     config.port,
      path:     `/api${path}`,
      method,
      headers:  {
        "Content-Type": "application/json",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    };

    const req = http.request(options, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        if (res.statusCode === 204) { resolve(null); return; }
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });

    req.on("error", err => {
      if (err.code === "ECONNREFUSED") {
        console.error(red("✗  Server not running. Start with: node src/server.js"));
        process.exit(1);
      }
      reject(err);
    });

    if (payload) req.write(payload);
    req.end();
  });
}

// ── Parse CLI args ────────────────────────────────
function parseArgs(argv) {
  const positional = [];
  const flags      = {};
  const multi      = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) { positional.push(arg); continue; }

    const key  = arg.slice(2);
    const next = argv[i + 1];
    const val  = next && !next.startsWith("--") ? (i++, next) : true;

    // Collect repeated flags as arrays (e.g. --tag a --tag b)
    if (flags[key] !== undefined) {
      multi[key] = multi[key] ?? [flags[key]];
      multi[key].push(val);
    } else {
      flags[key] = val;
    }
  }

  // Merge single into multi where applicable
  for (const key of Object.keys(multi)) {
    multi[key] = [...new Set([flags[key], ...multi[key].filter(v => v !== flags[key])])];
  }

  return { positional, flags, multi };
}

// ── Rendering helpers ─────────────────────────────
function relTime(dateStr) {
  const diff = Date.now() - new Date(dateStr + "Z").getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function printNote(n, compact = false) {
  const tags  = (n.tags ?? []).map(t => cyan(`#${t}`)).join(" ");
  const lang  = n.language ? blue(`[${n.language}]`) : "";
  const pin   = n.pinned   ? yellow("★ ") : "";

  console.log(`\n${gray("┌")} ${pin}${bold(n.title)} ${lang}`);
  console.log(`${gray("│")} ${gray("id:")} ${n.id}  ${gray("updated:")} ${relTime(n.updated_at)}  ${tags}`);

  if (!compact && n.body) {
    console.log(gray("│"));
    const lines = n.body.split("\n").slice(0, 12);
    lines.forEach(line => console.log(`${gray("│")} ${dim(line)}`));
    if (n.body.split("\n").length > 12) console.log(`${gray("│")} ${gray("... (truncated)")}`);
  }

  if (n.source) console.log(`${gray("│")} ${gray("source:")} ${dim(n.source)}`);
  console.log(gray("└"));
}

function divider(label = "") {
  const line = "─".repeat(label ? 48 - label.length - 2 : 50);
  console.log(label ? `${gray("─")} ${bold(label)} ${gray(line)}` : gray("─".repeat(50)));
}

// ── Commands ──────────────────────────────────────

async function cmdAdd({ positional, flags, multi }) {
  const title = positional[0];
  if (!title) {
    console.error(red('✗  Title required:') + '  dn add "My note title"');
    process.exit(1);
  }

  const tags = multi.tag
    ?? (flags.tag ? [flags.tag] : []);

  const payload = {
    title,
    body:     flags.body    ?? "",
    language: flags.lang    ?? flags.language ?? "",
    source:   flags.source  ?? "",
    pinned:   flags.pinned  === true || flags.pinned === "true",
    tags,
  };

  const res = await request("POST", "/notes", payload);

  if (!res?.body?.ok) {
    console.error(red("✗  Failed to create note:"), res?.body?.error ?? "unknown error");
    if (res?.body?.details) {
      res.body.details.forEach(d => console.error(`   ${d.field}: ${d.message}`));
    }
    process.exit(1);
  }

  const note = res.body.data;
  console.log(green("✓") + `  Created note ${bold("#" + note.id)}: ${note.title}`);
  if (note.tags.length) console.log(`   Tags: ${note.tags.map(t => cyan("#" + t)).join(" ")}`);
}

async function cmdList({ flags }) {
  const params = new URLSearchParams();
  if (flags.tag)    params.set("tag",    flags.tag);
  if (flags.lang)   params.set("lang",   flags.lang);
  if (flags.pinned) params.set("pinned", "1");
  params.set("limit", flags.limit ?? 30);

  const res = await request("GET", `/notes?${params}`);
  if (!res?.body?.ok) { console.error(red("✗  Could not fetch notes")); process.exit(1); }

  const { data: notes, meta } = res.body;

  if (!notes.length) {
    console.log(gray("\n  No notes found.\n"));
    return;
  }

  const label = [
    flags.tag    ? `#${flags.tag}`   : "",
    flags.lang   ? flags.lang        : "",
    flags.pinned ? "pinned"          : "",
  ].filter(Boolean).join(", ") || "All notes";

  divider(label);
  console.log(dim(`  ${meta.total} note${meta.total !== 1 ? "s" : ""}\n`));

  notes.forEach(n => printNote(n, true));
  console.log();
}

async function cmdSearch({ positional }) {
  const q = positional[0];
  if (!q) { console.error(red("✗  Search term required")); process.exit(1); }

  const res = await request("GET", `/notes?q=${encodeURIComponent(q)}&limit=20`);
  if (!res?.body?.ok) { console.error(red("✗  Search failed")); process.exit(1); }

  const { data: notes, meta } = res.body;

  divider(`search: "${q}"`);

  if (!notes.length) {
    console.log(gray("\n  No matches found.\n"));
    return;
  }

  console.log(dim(`  ${meta.total} result${meta.total !== 1 ? "s" : ""}\n`));
  notes.forEach(n => printNote(n, true));
  console.log();
}

async function cmdView({ positional }) {
  const id = Number(positional[0]);
  if (!id) { console.error(red("✗  Note ID required:") + "  dn view <id>"); process.exit(1); }

  const res = await request("GET", `/notes/${id}`);
  if (res?.body?.error) {
    console.error(red("✗ ") + res.body.error);
    process.exit(1);
  }

  printNote(res.body.data, false);
  console.log();
}

async function cmdEdit({ positional, flags, multi }) {
  const id = Number(positional[0]);
  if (!id) { console.error(red("✗  Note ID required:") + "  dn edit <id> [--title ...] [--body ...]"); process.exit(1); }

  const payload = {};
  if (flags.title)                      payload.title    = flags.title;
  if (flags.body)                       payload.body     = flags.body;
  if (flags.lang ?? flags.language)     payload.language = flags.lang ?? flags.language;
  if (flags.source)                     payload.source   = flags.source;
  if (flags.tag || multi.tag)           payload.tags     = multi.tag ?? [flags.tag];
  if (flags.pinned !== undefined)       payload.pinned   = flags.pinned === "true" || flags.pinned === true;
  if (flags.unpin)                      payload.pinned   = false;

  if (!Object.keys(payload).length) {
    console.error(red("✗  No fields to update. Use --title, --body, --lang, --tag, --source"));
    process.exit(1);
  }

  const res = await request("PUT", `/notes/${id}`, payload);
  if (!res?.body?.ok) {
    console.error(red("✗  Update failed:"), res?.body?.error ?? "unknown");
    process.exit(1);
  }

  console.log(green("✓") + `  Updated note ${bold("#" + id)}`);
  printNote(res.body.data, true);
}

async function cmdDelete({ positional }) {
  const id = Number(positional[0]);
  if (!id) { console.error(red("✗  Note ID required:") + "  dn delete <id>"); process.exit(1); }

  // Read note first so we can print its title
  const noteRes = await request("GET", `/notes/${id}`);
  if (noteRes?.body?.error) { console.error(red("✗ ") + noteRes.body.error); process.exit(1); }

  const title = noteRes.body.data.title;
  const res   = await request("DELETE", `/notes/${id}`);

  if (res !== null && !res?.body?.ok) {
    console.error(red("✗  Delete failed:"), res?.body?.error ?? "unknown");
    process.exit(1);
  }

  console.log(green("✓") + `  Deleted note ${bold("#" + id)}: ${dim(title)}`);
}

async function cmdTags() {
  const res = await request("GET", "/tags");
  if (!res?.body?.ok) { console.error(red("✗  Could not fetch tags")); process.exit(1); }

  const tags = res.body.data;
  if (!tags.length) { console.log(gray("\n  No tags yet.\n")); return; }

  divider("Tags");
  const maxCount = tags[0].count;
  tags.forEach(t => {
    const bar = "▓".repeat(Math.round(t.count / maxCount * 16));
    const pad = String(t.count).padStart(3);
    console.log(`  ${cyan("#" + t.name.padEnd(22))} ${gray(bar)} ${gray(pad)}`);
  });
  console.log();
}

function cmdOpen({ positional }) {
  const id   = positional[0];
  const url  = id ? `http://localhost:${config.port}/#note-${id}` : `http://localhost:${config.port}`;
  const open = process.platform === "darwin" ? "open" :
               process.platform === "win32"  ? "start" : "xdg-open";
  exec(`${open} "${url}"`);
  console.log(green("✓") + `  Opening ${cyan(url)}`);
}

function showHelp() {
  console.log(`
${bold("dn")} — DevNotes CLI

${bold("USAGE")}
  node bin/dn.js <command> [options]

${bold("COMMANDS")}
  ${cyan("add")} "title" [options]        Create a new note
    ${gray("--lang javascript")}            Programming language
    ${gray("--tag arrays")} ${gray("--tag fn")}       One or more tags
    ${gray("--body")} ${gray('"text or markdown"')}   Note body
    ${gray("--source https://...")}         Reference URL
    ${gray("--pinned")}                     Pin the note

  ${cyan("list")} [options]               List notes
    ${gray("--tag arrays")}                 Filter by tag
    ${gray("--lang javascript")}            Filter by language
    ${gray("--pinned")}                     Pinned only
    ${gray("--limit 20")}                   Max results

  ${cyan("search")} <query>              Full-text search

  ${cyan("view")} <id>                   Show full note

  ${cyan("edit")} <id> [options]         Update a note
    ${gray("--title --body --lang --tag --source")}

  ${cyan("delete")} <id>                 Delete a note

  ${cyan("tags")}                        List all tags with counts

  ${cyan("open")} [id]                   Open in browser

${bold("EXAMPLES")}
  node bin/dn.js add "Array reduce" --lang js --tag arrays --tag functional
  node bin/dn.js list --tag js
  node bin/dn.js search "closure"
  node bin/dn.js view 3
  node bin/dn.js edit 3 --tag arrays --tag must-know
  node bin/dn.js delete 3
  node bin/dn.js tags
  node bin/dn.js open
`);
}

// ── Dispatch ──────────────────────────────────────
const argv    = process.argv.slice(2);
const command = argv[0];
const parsed  = parseArgs(argv.slice(1));

switch (command) {
  case "add":    await cmdAdd(parsed);    break;
  case "list":   await cmdList(parsed);   break;
  case "search": await cmdSearch(parsed); break;
  case "view":   await cmdView(parsed);   break;
  case "edit":   await cmdEdit(parsed);   break;
  case "delete": await cmdDelete(parsed); break;
  case "tags":   await cmdTags();         break;
  case "open":   cmdOpen(parsed);         break;
  case "--help":
  case "-h":
  case "help":
  case undefined: showHelp(); break;
  default:
    console.error(red(`✗  Unknown command: ${command}`));
    console.error(`   Run ${bold("node bin/dn.js --help")} for usage`);
    process.exit(1);
}
