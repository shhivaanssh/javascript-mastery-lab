const s = "Hello, World!";

// Length and access
s.length;     // 13
s[0];         // "H"
s.at(-1);     // "!" — negative index from end

// Case
s.toLowerCase(); // "hello, world!"
s.toUpperCase(); // "HELLO, WORLD!"

// Search
s.includes("World");     // true
s.startsWith("Hello");   // true
s.endsWith("!");         // true
s.indexOf("o");          // 4  — first occurrence
s.lastIndexOf("o");      // 8  — last occurrence

// Slicing
s.slice(7, 12);   // "World"
s.slice(-6);      // "orld!"
s.slice(0, 5);    // "Hello"

// Replace
s.replace("World", "JS");          // "Hello, JS!"
s.replaceAll("l", "L");            // "HeLLo, WorLd!"
s.replace(/[aeiou]/gi, "*");       // regex replace

// Split and join
"a,b,c".split(",");        // ["a", "b", "c"]
["a", "b", "c"].join("-"); // "a-b-c"

// Trim
"  hello  ".trim();        // "hello"
"  hello  ".trimStart();   // "hello  "
"  hello  ".trimEnd();     // "  hello"

// Pad
"5".padStart(3, "0");  // "005"
"hi".padEnd(5, ".");   // "hi..."

// Repeat
"ha".repeat(3); // "hahaha"

// Template literals
const name = "Alex";
const score = 98;
`${name} scored ${score}/100`; // "Alex scored 98/100"

// Multi-line
const html = `
  <div>
    <p>${name}</p>
  </div>
`.trim();

// Useful conversions
"42abc".match(/\d+/)?.[0]; // "42" — extract number from string
[..."hello"];               // ["h","e","l","l","o"] — spread into array

// String is immutable — methods return new strings, never mutate
let word = "hello";
word.toUpperCase();   // returns "HELLO"
console.log(word);    // still "hello"
