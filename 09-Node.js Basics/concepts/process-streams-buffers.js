// ═══════════════════════════════════════════
// PROCESS OBJECT
// ═══════════════════════════════════════════

// process is a global — no import needed

process.pid;          // current process ID
process.ppid;         // parent process ID
process.platform;     // "linux", "darwin", "win32"
process.arch;         // "x64", "arm64"
process.version;      // "v22.0.0"
process.versions;     // { node, v8, uv, openssl, ... }
process.cwd();        // current working directory
process.execPath;     // path to the node binary
process.argv;         // ["node", "script.js", ...args]
process.uptime();     // seconds since process started
process.memoryUsage();// { rss, heapTotal, heapUsed, external, arrayBuffers }
process.cpuUsage();   // { user, system } in microseconds

// ── argv — command-line arguments ──
// node script.js --name Alex --port 3000 --debug

const args = process.argv.slice(2); // drop "node" and script path

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        result[key] = next;
        i++;
      } else {
        result[key] = true; // flag with no value
      }
    }
  }
  return result;
}

const opts = parseArgs(process.argv.slice(2));
// node script.js --name Alex --debug
// opts = { name: "Alex", debug: true }


// ── Environment variables ──

process.env.NODE_ENV;          // "development" | "production" | "test"
process.env.PORT;              // "3000" — always strings!
process.env.DATABASE_URL;

// Safe reading with defaults
const PORT      = Number(process.env.PORT ?? 3000);
const NODE_ENV  = process.env.NODE_ENV ?? "development";
const isProd    = NODE_ENV === "production";
const LOG_LEVEL = process.env.LOG_LEVEL ?? (isProd ? "warn" : "debug");

// Set an env var (this process only — not the shell)
process.env.MY_VAR = "value";

// .env files — use dotenv package in real projects
// In Node 20.6+ there's a built-in: node --env-file=.env script.js


// ── Exit codes ──

process.exit(0);  // success
process.exit(1);  // generic error — most CLI tools use this

// Exit gracefully — let async work finish first
process.on("SIGTERM", () => {
  console.log("Shutting down...");
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("\nCtrl+C — cleaning up...");
  process.exit(0);
});

// Catch unhandled errors — last resort, log and exit
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  process.exit(1);
});


// ── stdin / stdout / stderr ──

process.stdout.write("no newline");
process.stderr.write("error message\n");
console.log("→ stdout with newline");
console.error("→ stderr with newline");

// Read from stdin
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  process.stdout.write(`You typed: ${chunk}`);
});


// ═══════════════════════════════════════════
// BUFFERS
// ═══════════════════════════════════════════

// A Buffer is a fixed-size chunk of memory outside the V8 heap.
// Used for binary data — files, network packets, streams.
// Buffers are Uint8Arrays.

// Creating buffers
const buf1 = Buffer.alloc(10);              // 10 zero bytes
const buf2 = Buffer.alloc(10, 0xff);        // 10 bytes filled with 0xff
const buf3 = Buffer.from([0x48, 0x65, 0x6c]); // from byte array
const buf4 = Buffer.from("Hello World", "utf8");
const buf5 = Buffer.from("SGVsbG8=", "base64");

// Reading from buffers
buf4.toString("utf8");       // "Hello World"
buf4.toString("base64");     // "SGVsbG8gV29ybGQ="
buf4.toString("hex");        // "48656c6c6f..."
buf4.length;                 // byte length — NOT character count for UTF-8
buf4[0];                     // 72 — byte value of 'H'

// Writing to buffers
const buf6 = Buffer.alloc(4);
buf6.writeUInt32BE(0xDEADBEEF, 0); // write 32-bit big-endian int
buf6.readUInt32BE(0);              // 3735928559

// Copying and slicing (slicing shares memory!)
const slice = buf4.slice(0, 5);     // shares memory — mutation affects original
const copy  = Buffer.from(buf4);    // independent copy

// Concatenating
const combined = Buffer.concat([buf1, buf4]);

// Comparing
Buffer.compare(buf4, buf4); // 0 (equal)
buf4.equals(buf4);          // true

// Common encoding conversions
function base64Encode(str)  { return Buffer.from(str, "utf8").toString("base64"); }
function base64Decode(b64)  { return Buffer.from(b64, "base64").toString("utf8"); }
function hexEncode(str)     { return Buffer.from(str, "utf8").toString("hex"); }
function hexDecode(hex)     { return Buffer.from(hex, "hex").toString("utf8"); }

base64Encode("Hello"); // "SGVsbG8="
base64Decode("SGVsbG8="); // "Hello"


// ═══════════════════════════════════════════
// STREAMS
// ═══════════════════════════════════════════

import { Readable, Writable, Transform, pipeline } from "stream";
import { promisify } from "util";

const pipelineAsync = promisify(pipeline);

// ── Readable stream ──

// From existing data
const readable = Readable.from(["chunk1", " ", "chunk2"]);
const readable2 = Readable.from(async function* () {
  for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, 100));
    yield `item ${i}\n`;
  }
}());

// Custom readable
class CountStream extends Readable {
  #current;
  #max;
  constructor(max) {
    super();
    this.#current = 0;
    this.#max     = max;
  }
  _read() {
    if (this.#current >= this.#max) { this.push(null); return; } // null = EOF
    this.push(`${this.#current++}\n`);
  }
}

// ── Transform stream ──

class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
}

class LineCounter extends Transform {
  #count = 0;
  _transform(chunk, _, cb) { this.#count += chunk.toString().split("\n").length - 1; cb(null, chunk); }
  _flush(cb) { console.log(`Lines: ${this.#count}`); cb(); }
}

// ── Pipeline — connect streams with proper error handling ──

import { createReadStream, createWriteStream } from "fs";

await pipelineAsync(
  createReadStream("./input.txt"),
  new UpperCaseTransform(),
  createWriteStream("./output.txt")
);
// Automatically handles errors and cleans up all streams

// Readable stream events
readable.on("data",  chunk => process.stdout.write(chunk));
readable.on("end",   ()    => console.log("done"));
readable.on("error", err   => console.error(err));
