// JS has one number type — all numbers are 64-bit floats
typeof 42;    // "number"
typeof 3.14;  // "number"

// Floating point quirk
0.1 + 0.2;             // 0.30000000000000004
(0.1 + 0.2).toFixed(1); // "0.3" — fixes display, returns string


// --- Number methods ---

const n = 3.14159;
n.toFixed(2);      // "3.14" — string
n.toPrecision(4);  // "3.142" — string
parseInt("42px");  // 42
parseFloat("3.5"); // 3.5
Number("99");      // 99
Number("abc");     // NaN


// --- NaN ---

NaN === NaN;       // false — NaN is not equal to itself
isNaN("hello");    // true — coerces then checks
Number.isNaN("hello"); // false — no coercion, strict check
Number.isNaN(NaN);     // true  — use this one


// --- Infinity ---

1 / 0;            // Infinity
-1 / 0;           // -Infinity
isFinite(1 / 0);  // false
isFinite(100);    // true


// --- Math ---

Math.round(4.6);  // 5
Math.floor(4.9);  // 4
Math.ceil(4.1);   // 5
Math.abs(-7);     // 7
Math.max(1, 5, 3);// 5
Math.min(1, 5, 3);// 1
Math.pow(2, 10);  // 1024
Math.sqrt(144);   // 12
Math.trunc(4.9);  // 4 — removes decimal, no rounding

Math.random();              // 0 to 0.999...
Math.floor(Math.random() * 6) + 1; // random 1–6 (dice roll)


// --- Number limits ---

Number.MAX_SAFE_INTEGER; // 9007199254740991
Number.MIN_SAFE_INTEGER; // -9007199254740991
Number.isInteger(4.0);   // true
Number.isInteger(4.5);   // false


// --- BigInt for large integers ---

const big = 9007199254740991n + 1n; // works correctly
// can't mix BigInt and Number: 10n + 5 → TypeError
