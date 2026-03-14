import fs      from "fs";
import fsp     from "fs/promises";
import path    from "path";
import { createReadStream, createWriteStream } from "fs";
import readline from "readline";


// ═══════════════════════════════════════════
// PATH MODULE
// ═══════════════════════════════════════════

const p = "/home/user/projects/app/src/index.js";

path.basename(p);            // "index.js"
path.basename(p, ".js");     // "index"
path.dirname(p);             // "/home/user/projects/app/src"
path.extname(p);             // ".js"

path.parse(p);
// { root: "/", dir: "/home/user/.../src", base: "index.js",
//   ext: ".js", name: "index" }

path.format({ dir: "/src", name: "app", ext: ".js" }); // "/src/app.js"

// Join — handles slashes correctly on all platforms
path.join("/home", "user", "..", "projects", "app"); // "/home/projects/app"
path.join("src", "utils", "helper.js");              // "src/utils/helper.js"

// Resolve — makes an absolute path from parts
path.resolve("src", "app.js");    // /cwd/src/app.js
path.resolve("/home", "user");    // "/home/user" — stops at absolute

// Normalize — clean up redundant separators
path.normalize("/home//user/./projects/../app"); // "/home/user/app"

// Relative path between two absolutes
path.relative("/home/user/a", "/home/user/b/c"); // "../b/c"

// Check if absolute
path.isAbsolute("/home/user"); // true
path.isAbsolute("./src");      // false

// Platform-aware separator
path.sep;       // "/" on Unix, "\\" on Windows
path.delimiter; // ":" on Unix, ";" on Windows (for PATH env var)

// Safe cross-platform join
const configPath = path.join(process.cwd(), "config", "app.json");


// ═══════════════════════════════════════════
// FS MODULE — promises API (recommended)
// ═══════════════════════════════════════════

// ── Reading files ──

// Read entire file into memory
const text = await fsp.readFile("./data.txt", "utf8");
const raw  = await fsp.readFile("./image.png");           // Buffer

// Read file as JSON
async function readJSON(filePath) {
  const text = await fsp.readFile(filePath, "utf8");
  return JSON.parse(text);
}

// ── Writing files ──

await fsp.writeFile("./out.txt", "Hello World\n", "utf8");  // overwrite
await fsp.appendFile("./log.txt", `${new Date().toISOString()} — event\n`);

// Write JSON pretty-printed
async function writeJSON(filePath, data) {
  await fsp.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

// Atomic write — write to temp, then rename (prevents corruption)
async function atomicWrite(filePath, data) {
  const tmp = filePath + ".tmp";
  await fsp.writeFile(tmp, data, "utf8");
  await fsp.rename(tmp, filePath);
}

// ── Directory operations ──

await fsp.mkdir("./new-dir");
await fsp.mkdir("./deep/nested/dir", { recursive: true }); // mkdir -p

const entries = await fsp.readdir("./src");                          // ["a.js","b.js"]
const detailed = await fsp.readdir("./src", { withFileTypes: true }); // Dirent[]

// Dirent has: .isFile(), .isDirectory(), .isSymbolicLink(), .name
const files = detailed.filter(e => e.isFile()).map(e => e.name);
const dirs  = detailed.filter(e => e.isDirectory()).map(e => e.name);

await fsp.rmdir("./empty-dir");
await fsp.rm("./dir", { recursive: true, force: true }); // rm -rf

// ── File metadata ──

const stat = await fsp.stat("./file.txt");
stat.size;          // bytes
stat.mtime;         // last modified Date
stat.birthtime;     // created Date
stat.isFile();      // true
stat.isDirectory(); // false

// stat throws if file doesn't exist — use this pattern to check:
async function exists(p) {
  try { await fsp.access(p); return true; }
  catch { return false; }
}

// ── Copy, move, delete ──

await fsp.copyFile("./src.txt", "./dst.txt");
await fsp.rename("./old.txt", "./new.txt");  // also works as move
await fsp.unlink("./file.txt");              // delete a file

// ── Walk a directory tree recursively ──

async function* walk(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

for await (const file of walk("./src")) {
  console.log(file); // prints every file path recursively
}

// ── Watching files ──

// fs.watch — fast, uses OS notifications, can be noisy
const watcher = fs.watch("./config.json", { encoding: "utf8" }, (eventType, filename) => {
  console.log(`${eventType}: ${filename}`); // "change" or "rename"
});
watcher.close(); // stop watching

// Watch a directory
const dirWatcher = fs.watch("./src", { recursive: true }, (type, filename) => {
  console.log(`${type}: ${filename}`);
});


// ═══════════════════════════════════════════
// STREAMS — for large files
// ═══════════════════════════════════════════

// Don't load a 2GB file into memory — stream it line by line

async function countLines(filePath) {
  const stream = createReadStream(filePath, { encoding: "utf8" });
  const rl     = readline.createInterface({ input: stream });
  let count    = 0;
  for await (const _ of rl) count++;
  return count;
}

// Process a large CSV without loading it all
async function processCSV(filePath, onRow) {
  const rl = readline.createInterface({
    input:     createReadStream(filePath, "utf8"),
    crlfDelay: Infinity,
  });

  let isHeader = true;
  let headers  = [];

  for await (const line of rl) {
    if (isHeader) { headers = line.split(","); isHeader = false; continue; }
    const values = line.split(",");
    const row    = Object.fromEntries(headers.map((h, i) => [h, values[i]]));
    await onRow(row);
  }
}

// Copy a file with streams (memory-efficient)
async function copyLargeFile(src, dst) {
  const read  = createReadStream(src);
  const write = createWriteStream(dst);

  return new Promise((resolve, reject) => {
    read.pipe(write);
    write.on("finish", resolve);
    read.on("error", reject);
    write.on("error", reject);
  });
}
