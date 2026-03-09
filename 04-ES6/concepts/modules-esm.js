// ES Modules (ESM) — the native module system in modern JS.
// Node.js supports ESM in .mjs files or when "type": "module" is in package.json.
// Browsers support ESM natively via <script type="module">.


// --- Named exports ---

// math.js
export const PI = 3.14159265358979;

export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  length() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }
}


// --- Default export ---
// One per module. Imported without curly braces, named anything.

// logger.js
export default function log(message, level = "info") {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
}


// --- Named imports ---

// import { add, subtract, PI } from "./math.js";
// import { add as sum } from "./math.js"; // rename on import

// add(2, 3);   // 5
// sum(2, 3);   // 5


// --- Default import ---

// import log from "./logger.js";          // name it anything
// import logger from "./logger.js";       // same thing
// log("Server started");


// --- Import everything ---

// import * as Math from "./math.js";
// Math.add(2, 3);
// Math.PI;


// --- Mixed default and named ---

// utils.js
export default class EventEmitter { /* ... */ }
export const VERSION = "1.0.0";
export function noop() {}

// import EventEmitter, { VERSION, noop } from "./utils.js";


// --- Re-exports (barrel files) ---
// index.js that collects exports from multiple files into one entry point

// export { add, subtract } from "./math.js";
// export { default as log } from "./logger.js";
// export * from "./utils.js";

// Then consumers import from one place:
// import { add, log, VERSION } from "./lib/index.js";


// --- Dynamic imports ---
// Load a module on demand — returns a Promise

async function loadHeavyModule() {
  const { processImage } = await import("./image-processor.js");
  return processImage;
}

// Real use case: code splitting
async function onButtonClick() {
  const { renderChart } = await import("./chart.js");
  renderChart(data);
}

// Conditional loading
const locale = "fr";
const messages = await import(`./locales/${locale}.js`);


// --- ESM vs CommonJS ---

// CommonJS (Node.js default, .js files without "type": "module")
// const fs = require("fs");
// module.exports = { add, subtract };

// ESM
// import fs from "fs";
// export { add, subtract };

// Key differences:
// - ESM imports are static (analyzed at parse time), CJS is dynamic (runs at runtime)
// - ESM is always strict mode
// - ESM supports tree-shaking (bundlers can remove unused exports)
// - `__dirname` and `__filename` don't exist in ESM — use import.meta.url

// import { fileURLToPath } from "url";
// import { dirname } from "path";
// const __filename = fileURLToPath(import.meta.url);
// const __dirname  = dirname(__filename);
