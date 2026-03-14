// ── What Node.js actually is ──
//
// Node.js = V8 (JS engine) + libuv (async I/O) + core modules
//
// V8        — compiles JS to machine code, manages the heap and call stack
// libuv     — C library that handles the event loop, thread pool,
//             async file I/O, networking, timers
// Thread pool — libuv uses 4 threads (configurable via UV_THREADPOOL_SIZE)
//              for operations that can't be done async by the OS
//              (fs.readFile, dns.lookup, crypto, zlib)
//
//                        ┌─────────────────────┐
//                        │      Your Code       │
//                        └──────────┬──────────┘
//                                   │
//                        ┌──────────▼──────────┐
//                        │    Node.js / V8      │  ← JS execution
//                        └──────────┬──────────┘
//                                   │
//                        ┌──────────▼──────────┐
//                        │       libuv          │  ← Event loop + I/O
//                        │  ┌───────────────┐  │
//                        │  │  Thread Pool  │  │  ← Blocking ops
//                        │  └───────────────┘  │
//                        └─────────────────────┘
//
// Key difference from browsers:
//   Browser: event loop is tied to the DOM, rendering, user input
//   Node:    event loop handles I/O — file system, network, child processes
//            No window, document, alert, localStorage
//            Has process, fs, path, os, net, http, crypto instead


// ── Node.js event loop phases ──
//
// Each "tick" of the loop goes through these phases in order:
//
//  1. timers         — execute setTimeout/setInterval callbacks
//  2. pending I/O    — I/O callbacks deferred from previous tick
//  3. idle/prepare   — internal libuv use
//  4. poll           — retrieve new I/O events; blocks if queue empty
//  5. check          — setImmediate callbacks
//  6. close          — close event callbacks (socket.destroy etc.)
//
// Between each phase: process.nextTick queue + Promise microtasks drain
//
// Priority order (highest to lowest):
//   process.nextTick > Promise.then > setImmediate > setTimeout

process.nextTick(()  => console.log("1 nextTick"));
Promise.resolve().then(() => console.log("2 promise"));
setImmediate(()      => console.log("3 setImmediate"));
setTimeout(()        => console.log("4 setTimeout 0"), 0);
console.log("0 sync");
// Output: 0 → 1 → 2 → 3 → 4


// ── CommonJS (CJS) ──
// The original Node.js module system. Synchronous. require() at runtime.

// math.js
const add      = (a, b) => a + b;
const subtract = (a, b) => a - b;
const PI       = 3.14159;

module.exports = { add, subtract, PI };
// or: exports.add = add;   (shorthand, but don't reassign exports itself)

// main.js
const { add: add2, PI: pi } = require("./math");
const path = require("path");          // built-in
const fs   = require("fs");            // built-in
const _    = require("lodash");        // node_modules

// CJS features
// require is synchronous — resolves immediately
// module.exports is cached after first require — singleton
// __dirname  — absolute path of current file's directory
// __filename — absolute path of current file

console.log(__dirname);   // /home/user/project
console.log(__filename);  // /home/user/project/index.js

// Dynamic require — can use variables
const moduleName = "path";
const m = require(moduleName); // works — runtime resolution


// ── ESM (ECMAScript Modules) ──
// Modern JS standard. Static. Tree-shakeable. Async-friendly.
// Enable in Node: "type": "module" in package.json, or use .mjs extension

// math.mjs
export const add3  = (a, b) => a + b;
export const sub3  = (a, b) => a - b;
export const PI3   = 3.14159;
export default function multiply(a, b) { return a * b; }

// main.mjs
import multiply3, { add3 as sumOf, PI3 } from "./math.mjs";
import path3  from "path";
import { readFile } from "fs/promises";

// ESM features
// import/export are static — resolved at parse time, not runtime
// import.meta.url  — URL of the current module (replaces __filename)
// import.meta.dirname — available in Node 21.2+ (replaces __dirname)
import { fileURLToPath } from "url";
import { dirname }       from "path";

const __filename2 = fileURLToPath(import.meta.url);
const __dirname2  = dirname(__filename2);

// Dynamic import — works in ESM too, returns a Promise
const mod = await import("./math.mjs");

// Top-level await — only in ESM
const config = JSON.parse(
  await readFile("./config.json", "utf8")
    .catch(() => "{}")
);


// ── CJS vs ESM comparison ──
//
// Feature              CJS                    ESM
// ──────────────────── ─────────────────────  ────────────────────────
// Syntax               require/module.exports import/export
// Loading              Synchronous            Asynchronous
// Evaluation           On require()           Pre-parse (static)
// Tree shaking         No                     Yes
// Top-level await      No                     Yes
// __dirname/__filename Available              Use import.meta.url
// Default in Node      Yes                    Opt-in (package.json)
// Browser compatible   No (without bundler)   Yes
// Circular deps        Partial support        Better handling
//
// Rule of thumb: use ESM for new projects, CJS when required by tools/packages


// ── Module resolution algorithm ──
//
// require("X") from /proj/src/app.js:
//
// 1. Is X a core module? → return it
// 2. Does X start with ./ or ../ or /?  → load as file/directory
//    → try X, X.js, X.json, X.node
//    → try X/index.js, X/index.json, X/index.node
// 3. Otherwise → load from node_modules
//    → /proj/src/node_modules/X
//    → /proj/node_modules/X
//    → /node_modules/X
//    → ... up to filesystem root
