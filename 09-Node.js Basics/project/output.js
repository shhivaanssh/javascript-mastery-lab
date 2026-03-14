// ANSI color helpers
const c = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  red:    "\x1b[31m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  blue:   "\x1b[34m",
  magenta:"\x1b[35m",
  cyan:   "\x1b[36m",
  white:  "\x1b[37m",
  gray:   "\x1b[90m",
};

// Disable colors when not a TTY
const isTTY = process.stdout.isTTY;
const col = isTTY ? c : Object.fromEntries(Object.keys(c).map(k => [k, ""]));

export const color = {
  bold:    s => `${col.bold}${s}${col.reset}`,
  dim:     s => `${col.dim}${s}${col.reset}`,
  red:     s => `${col.red}${s}${col.reset}`,
  green:   s => `${col.green}${s}${col.reset}`,
  yellow:  s => `${col.yellow}${s}${col.reset}`,
  blue:    s => `${col.blue}${s}${col.reset}`,
  magenta: s => `${col.magenta}${s}${col.reset}`,
  cyan:    s => `${col.cyan}${s}${col.reset}`,
  gray:    s => `${col.gray}${s}${col.reset}`,
};

// Extension → color mapping
const EXT_COLORS = {
  ".js": "yellow", ".ts": "blue",  ".jsx": "cyan",   ".tsx": "cyan",
  ".py": "green",  ".rb": "red",   ".go":  "cyan",   ".rs":  "yellow",
  ".md": "white",  ".txt":"white", ".json":"magenta",".yaml":"magenta",
  ".jpg":"magenta",".png":"magenta",".svg": "magenta",
};

export function colorExt(ext) {
  const name = EXT_COLORS[ext.toLowerCase()] ?? "gray";
  return color[name] ? color[name](ext) : ext;
}

export function printRow(cols, widths) {
  const row = cols.map((col2, i) => {
    const clean = col2.replace(/\x1b\[[0-9;]*m/g, ""); // strip ANSI for measuring
    const pad   = Math.max(0, (widths[i] ?? 0) - clean.length);
    return col2 + " ".repeat(pad);
  }).join("  ");
  console.log(row);
}

export function printTable(rows, headers) {
  // Measure column widths (stripping ANSI)
  const clean  = s => s.replace(/\x1b\[[0-9;]*m/g, "");
  const widths = headers.map((h, i) =>
    Math.max(clean(h).length, ...rows.map(r => clean(String(r[i] ?? "")).length))
  );

  // Header
  printRow(headers.map(h => color.bold(h)), widths);
  console.log(widths.map(w => "─".repeat(w)).join("  "));

  // Rows
  rows.forEach(row => printRow(row.map(String), widths));
}

export function printHeader(title) {
  const line = "─".repeat(52);
  console.log(`\n${color.bold(line)}`);
  console.log(`  ${color.bold(color.cyan(title))}`);
  console.log(`${color.bold(line)}`);
}

export function printSuccess(msg) { console.log(`  ${color.green("✓")} ${msg}`); }
export function printError(msg)   { console.error(`  ${color.red("✗")} ${msg}`); }
export function printInfo(msg)    { console.log(`  ${color.blue("●")} ${msg}`); }
export function printWarn(msg)    { console.log(`  ${color.yellow("▲")} ${msg}`); }

export function printTag(tag) {
  return `${color.cyan("#")}${color.bold(tag)}`;
}

export function printTags(tags) {
  return tags.length ? tags.map(printTag).join(" ") : color.gray("(none)");
}

// Spinner for async operations
export function createSpinner(message) {
  if (!isTTY) { process.stdout.write(message + "...\n"); return { stop: () => {} }; }

  const frames = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
  let i        = 0;
  const id     = setInterval(() => {
    process.stdout.write(`\r  ${color.cyan(frames[i++ % frames.length])} ${message}`);
  }, 80);

  return {
    stop(final = "") {
      clearInterval(id);
      process.stdout.write(`\r  ${color.green("✓")} ${final || message}\n`);
    },
    fail(msg = "") {
      clearInterval(id);
      process.stdout.write(`\r  ${color.red("✗")} ${msg || message}\n`);
    },
  };
}
