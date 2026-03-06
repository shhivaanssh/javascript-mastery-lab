// Module 01 Capstone — CLI Calculator
// Run: node calculator.js
// Uses: variables, types, control flow, loops, functions, string methods

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const history = [];

function calculate(a, op, b) {
  const x = parseFloat(a);
  const y = parseFloat(b);

  if (isNaN(x) || isNaN(y)) return { error: "Invalid numbers" };

  switch (op) {
    case "+": return { result: x + y };
    case "-": return { result: x - y };
    case "*": return { result: x * y };
    case "/":
      if (y === 0) return { error: "Cannot divide by zero" };
      return { result: x / y };
    case "%": return { result: x % y };
    case "**": return { result: x ** y };
    default:
      return { error: `Unknown operator: ${op}` };
  }
}

function parseInput(input) {
  const parts = input.trim().split(/\s+/);
  if (parts.length !== 3) return null;
  return { a: parts[0], op: parts[1], b: parts[2] };
}

function formatResult(n) {
  // avoid floating point display like 0.30000000000000004
  return parseFloat(n.toPrecision(10)).toString();
}

function showHistory() {
  if (history.length === 0) {
    console.log("No history yet.");
    return;
  }
  console.log("\n--- History ---");
  history.forEach((entry, i) => {
    console.log(`${i + 1}. ${entry}`);
  });
  console.log("---------------\n");
}

function prompt() {
  rl.question("> ", (input) => {
    const trimmed = input.trim().toLowerCase();

    if (trimmed === "exit" || trimmed === "quit") {
      console.log("Goodbye.");
      rl.close();
      return;
    }

    if (trimmed === "history") {
      showHistory();
      prompt();
      return;
    }

    if (trimmed === "clear") {
      history.length = 0;
      console.log("History cleared.");
      prompt();
      return;
    }

    if (trimmed === "help") {
      console.log("\nOperators: + - * / % **");
      console.log("Commands:  history, clear, exit\n");
      prompt();
      return;
    }

    const parsed = parseInput(input);
    if (!parsed) {
      console.log("Format: <number> <operator> <number>  e.g. 5 + 3");
      prompt();
      return;
    }

    const { result, error } = calculate(parsed.a, parsed.op, parsed.b);

    if (error) {
      console.log(`Error: ${error}`);
    } else {
      const formatted = formatResult(result);
      const entry = `${parsed.a} ${parsed.op} ${parsed.b} = ${formatted}`;
      console.log(`= ${formatted}`);
      history.push(entry);
    }

    prompt();
  });
}

console.log("Calculator — type 'help' for commands");
prompt();
