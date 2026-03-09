// --- Template literals ---

const name  = "Alex";
const score = 97;
const date  = new Date("2024-03-15");

// Basic interpolation
`Hello, ${name}!`;
`Score: ${score}/100`;
`2 + 2 = ${2 + 2}`;
`Upper: ${name.toUpperCase()}`;

// Ternary inside
`Status: ${score >= 90 ? "pass" : "fail"}`;

// Multi-line — preserves whitespace and newlines
const email = `
Hi ${name},

Your score of ${score} was recorded on ${date.toDateString()}.

Regards,
The Team
`.trim();

// Nested template literals
const items = ["apple", "banana", "cherry"];
const list  = `Items:\n${items.map((item, i) => `  ${i + 1}. ${item}`).join("\n")}`;
console.log(list);
// Items:
//   1. apple
//   2. banana
//   3. cherry


// --- Tagged template literals ---
// A tag is a function that processes the template before it becomes a string.
// Syntax: tagFunction`template ${expression} string`

// The tag receives:
//   strings — array of the static string parts
//   ...values — the interpolated expressions

function highlight(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const val = values[i] !== undefined ? `[${values[i]}]` : "";
    return result + str + val;
  }, "");
}

highlight`Hello ${name}, your score is ${score}!`;
// "Hello [Alex], your score is [97]!"


// --- Practical tagged template use cases ---

// 1. SQL sanitization (simplified example)
function sql(strings, ...values) {
  const sanitize = (v) => {
    if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`;
    if (typeof v === "number") return v;
    return "NULL";
  };
  return strings.reduce((query, str, i) => {
    return query + str + (i < values.length ? sanitize(values[i]) : "");
  }, "");
}

const userId   = 42;
const username = "O'Brien";
sql`SELECT * FROM users WHERE id = ${userId} AND name = ${username}`;
// "SELECT * FROM users WHERE id = 42 AND name = 'O''Brien'"


// 2. HTML escaping
function html(strings, ...values) {
  const escape = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  return strings.reduce((result, str, i) => {
    return result + str + (i < values.length ? escape(values[i]) : "");
  }, "");
}

const userInput = "<script>alert('xss')</script>";
html`<p>User said: ${userInput}</p>`;
// "<p>User said: &lt;script&gt;alert('xss')&lt;/script&gt;</p>"


// 3. String.raw — built-in tag that prevents escape processing
String.raw`Line1\nLine2\tTabbed`; // "Line1\nLine2\tTabbed" — backslashes not processed
// Useful for regex strings and Windows file paths
String.raw`C:\Users\Alex\Documents`; // no need to double-escape backslashes


// 4. i18n / translation tag
const translations = {
  "Hello, Alex!": "Hola, Alex!",
};

function t(strings, ...values) {
  const key = strings.reduce((k, s, i) => k + s + (values[i] ?? ""), "");
  return translations[key] ?? key;
}

t`Hello, ${name}!`; // "Hola, Alex!" if translation exists
