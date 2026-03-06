// FizzBuzz
// Print 1–100. Multiples of 3 → "Fizz", multiples of 5 → "Buzz",
// multiples of both → "FizzBuzz"

function fizzBuzz(n) {
  for (let i = 1; i <= n; i++) {
    if (i % 15 === 0) console.log("FizzBuzz");
    else if (i % 3 === 0) console.log("Fizz");
    else if (i % 5 === 0) console.log("Buzz");
    else console.log(i);
  }
}

fizzBuzz(20);


// Variant — return array instead of printing
function fizzBuzzArray(n) {
  return Array.from({ length: n }, (_, i) => {
    const num = i + 1;
    if (num % 15 === 0) return "FizzBuzz";
    if (num % 3 === 0) return "Fizz";
    if (num % 5 === 0) return "Buzz";
    return num;
  });
}

console.log(fizzBuzzArray(15));
