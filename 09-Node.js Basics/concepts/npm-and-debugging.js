// ═══════════════════════════════════════════
// NPM AND PACKAGE.JSON
// ═══════════════════════════════════════════

// A well-structured package.json:
//
// {
//   "name":        "my-app",           // lowercase, no spaces
//   "version":     "1.0.0",            // semver: MAJOR.MINOR.PATCH
//   "description": "What it does",
//   "type":        "module",           // "module" for ESM, omit for CJS
//   "main":        "index.js",         // CJS entry point
//   "module":      "index.mjs",        // ESM entry point (for bundlers)
//   "exports": {                       // modern entry point map
//     ".":    "./index.js",
//     "./utils": "./utils.js"
//   },
//   "bin": {                           // CLI executables
//     "my-tool": "./bin/cli.js"
//   },
//   "scripts": {
//     "start":     "node index.js",
//     "dev":       "node --watch index.js",   // --watch: Node 18+
//     "test":      "node --test",             // Node 18+ built-in test runner
//     "lint":      "eslint src/",
//     "build":     "tsc",
//     "prepare":   "npm run build"            // runs on npm install
//   },
//   "dependencies": {                  // required at runtime
//     "express": "^4.18.0"
//   },
//   "devDependencies": {               // only needed during development
//     "eslint": "^8.0.0"
//   },
//   "peerDependencies": {              // must be installed by the consumer
//     "react": ">=18.0.0"
//   },
//   "engines": {
//     "node": ">=18.0.0"
//   },
//   "private": true,                   // prevent accidental npm publish
//   "keywords": ["node", "tool"],
//   "license": "MIT"
// }


// ── Semver — Semantic Versioning ──
//
// MAJOR.MINOR.PATCH
//   MAJOR — breaking API change
//   MINOR — new feature, backward compatible
//   PATCH — bug fix, backward compatible
//
// Range operators in package.json:
//   "^4.18.0"   — compatible with 4.x.x  (>=4.18.0 <5.0.0)
//   "~4.18.0"   — approximately 4.18.x   (>=4.18.0 <4.19.0)
//   "4.18.0"    — exact version
//   ">=4.0.0"   — any 4.0.0 or higher
//   "*"         — any version (dangerous)
//
// npm install saves ^ by default — usually safe
// Use exact pinning in production Docker images for reproducibility


// ── Essential npm commands ──
//
// npm init -y                    — create package.json with defaults
// npm install                    — install all deps from package.json
// npm install express            — add runtime dependency
// npm install -D eslint          — add devDependency
// npm install -g nodemon         — install globally (CLIs only)
// npm uninstall express          — remove package
// npm update                     — update packages within semver range
// npm outdated                   — list outdated packages
// npm audit                      — check for security vulnerabilities
// npm audit fix                  — auto-fix vulnerabilities
// npm run <script>               — run a package.json script
// npm list                       — list installed packages
// npm list --depth=0             — top-level only
// npm pack                       — create a tarball of the package
// npm publish                    — publish to npm registry
// npx <tool>                     — run a package without installing globally
//
// package-lock.json — exact resolved versions. COMMIT THIS FILE.
// node_modules/     — NEVER commit. Add to .gitignore.


// ── .npmrc — configuration ──
//
// save-exact=true            — pin exact versions
// engine-strict=true         — fail if Node version doesn't match "engines"


// ── npm scripts tricks ──
//
// "scripts": {
//   "start":   "node index.js",
//   "dev":     "node --watch --env-file=.env index.js",
//   "test":    "node --test **/*.test.js",
//   "test:watch": "node --test --watch",
//   "lint":    "eslint . --ext .js",
//   "lint:fix":"eslint . --ext .js --fix",
//   "clean":   "rm -rf dist",
//   "prebuild":"npm run clean",         // pre* runs before the script
//   "build":   "...",
//   "postbuild":"echo Build complete",  // post* runs after the script
//   "ci":      "npm run lint && npm test && npm run build"
// }


// ═══════════════════════════════════════════
// DEBUGGING NODE.JS
// ═══════════════════════════════════════════

// ── 1. console methods ──

console.log("basic log");
console.error("goes to stderr");
console.warn("warning");
console.info("informational");
console.dir({ deep: { object: true } }, { depth: null }); // full depth
console.table([{ name: "Alice", age: 30 }]);
console.time("operation");
// ... do work ...
console.timeEnd("operation");  // "operation: 12.345ms"
console.count("called");       // "called: 1", "called: 2", etc.
console.trace("where am I?");  // prints stack trace
console.group("Section");
console.log("indented");
console.groupEnd();


// ── 2. --inspect flag ──
// node --inspect index.js          → starts debugger on port 9229
// node --inspect-brk index.js      → pauses on first line
//
// Then open Chrome → chrome://inspect → click "Open dedicated DevTools for Node"
// or use VS Code's built-in Node debugger


// ── 3. VS Code launch.json ──
//
// {
//   "configurations": [
//     {
//       "type":    "node",
//       "request": "launch",
//       "name":    "Debug App",
//       "program": "${workspaceFolder}/index.js",
//       "runtimeArgs": ["--env-file=.env"],
//       "console": "integratedTerminal"
//     },
//     {
//       "type":    "node",
//       "request": "attach",
//       "name":    "Attach to running",
//       "port":    9229
//     }
//   ]
// }


// ── 4. Node built-in test runner (Node 18+) ──

import { test, describe, it, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

describe("Math utilities", () => {
  it("adds numbers", () => {
    assert.equal(1 + 1, 2);
  });

  it("throws on invalid input", () => {
    assert.throws(
      () => { if (isNaN("x")) throw new TypeError("Not a number"); },
      TypeError
    );
  });

  it("async test", async () => {
    const result = await Promise.resolve(42);
    assert.equal(result, 42);
  });
});

// Run: node --test
// Run specific file: node --test src/math.test.js
// Watch mode: node --test --watch


// ── 5. util.inspect and util.debuglog ──

import { inspect, debuglog } from "util";

const debug = debuglog("myapp"); // only logs when NODE_DEBUG=myapp
debug("Starting up with config: %j", { port: 3000 });
// NODE_DEBUG=myapp node app.js

console.log(inspect({ a: 1, b: { c: [1, 2, 3] } }, {
  depth:   null,
  colors:  true,
  compact: false,
}));


// ── 6. Useful debug patterns ──

// Conditional debug logging
const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";
const levels    = { debug: 0, info: 1, warn: 2, error: 3 };

const logger = {
  debug: (...args) => levels[LOG_LEVEL] <= 0 && console.log("[debug]", ...args),
  info:  (...args) => levels[LOG_LEVEL] <= 1 && console.log("[info] ", ...args),
  warn:  (...args) => levels[LOG_LEVEL] <= 2 && console.warn("[warn] ", ...args),
  error: (...args) => levels[LOG_LEVEL] <= 3 && console.error("[error]", ...args),
};

// Performance measurement
async function measure(label, fn) {
  const t = performance.now();
  const result = await fn();
  console.log(`[perf] ${label}: ${(performance.now() - t).toFixed(2)}ms`);
  return result;
}
