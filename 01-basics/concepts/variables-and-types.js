/**
 * Module 01 — JavaScript Basics
 * Topic: Variables, Data Types, and Type Coercion
 *
 * These are not just syntax notes — they explain *why* JS behaves this way.
 * Each section ends with a practical takeaway.
 */

// =============================================================
// SECTION 1: Variable Declarations
// =============================================================

// var — function-scoped, hoisted, can be redeclared (avoid in modern JS)
var legacyVar = "I'm hoisted and function-scoped";

// let — block-scoped, not hoisted to usable state, cannot be redeclared
let blockScoped = "I only exist in my block {}";

// const — block-scoped, must be initialized, cannot be reassigned
// Note: const objects/arrays can still be mutated — const protects the binding, not the value
const CONFIG = { apiVersion: 1 };
CONFIG.apiVersion = 2; // ✅ allowed — mutating the object
// CONFIG = {};        // ❌ TypeError — reassigning the binding

// TAKEAWAY: Default to const. Use let when you need to reassign. Never use var.


// =============================================================
// SECTION 2: Primitive Data Types
// =============================================================

const stringType   = "Hello, JavaScript";          // string
const numberType   = 42;                            // number (all numbers are floats in JS)
const booleanType  = true;                          // boolean
const nullType     = null;                          // null — intentional absence of value
const undefinedType = undefined;                    // undefined — value not yet assigned
const symbolType   = Symbol("uniqueId");            // symbol — guaranteed unique
const bigIntType   = 9007199254740991n;             // bigint — integers beyond Number.MAX_SAFE_INTEGER

// Checking types
console.log(typeof stringType);    // "string"
console.log(typeof numberType);    // "number"
console.log(typeof null);          // "object" ← famous JS bug, null is NOT an object
console.log(typeof undefined);     // "undefined"
console.log(typeof symbolType);    // "symbol"

// TAKEAWAY: typeof null === "object" is a legacy bug. Use === null to check for null explicitly.


// =============================================================
// SECTION 3: Type Coercion — The Source of Many JS Bugs
// =============================================================

// IMPLICIT COERCION (JS converts types automatically)

// + with a string triggers string concatenation
console.log("5" + 3);      // "53"  — number 3 is coerced to string
console.log("5" - 3);      // 2     — string "5" is coerced to number (- doesn't concat)
console.log(true + 1);     // 2     — true coerces to 1
console.log(false + 1);    // 1     — false coerces to 0
console.log(null + 1);     // 1     — null coerces to 0
console.log(undefined + 1);// NaN  — undefined coerces to NaN

// EXPLICIT COERCION (you control the conversion)
console.log(Number("42"));      // 42
console.log(Number(""));        // 0
console.log(Number("hello"));   // NaN
console.log(String(42));        // "42"
console.log(Boolean(0));        // false
console.log(Boolean("hello"));  // true

// FALSY VALUES — these all coerce to false in a boolean context
// false, 0, "", null, undefined, NaN
// Everything else is truthy

// EQUALITY: == vs ===
console.log(0 == false);    // true  — type coercion happens
console.log(0 === false);   // false — strict equality, no coercion

// TAKEAWAY: Always use === and !== to avoid coercion surprises.


// =============================================================
// SECTION 4: Template Literals
// =============================================================

const name = "Alex";
const role = "JavaScript Engineer";

// Old way
const oldGreeting = "Hello, " + name + "! You are a " + role + ".";

// Modern way — backticks, ${expression}
const greeting = `Hello, ${name}! You are a ${role}.`;

// Multi-line strings
const multiLine = `
  Line one
  Line two
  Line three
`.trim();

// Expressions inside template literals
const a = 10;
const b = 20;
console.log(`${a} + ${b} = ${a + b}`);  // "10 + 20 = 30"

// TAKEAWAY: Template literals replace string concatenation entirely. Use them always.


// =============================================================
// SECTION 5: Practical Exercises
// See: ../exercises/type-coercion.js
// =============================================================
