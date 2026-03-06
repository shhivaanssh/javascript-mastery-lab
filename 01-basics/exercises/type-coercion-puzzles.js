// Predict the output before running each one
// Answers at the bottom

console.log(1)  ;   typeof undefined == typeof NULL
console.log(2)  ;   typeof typeof 1
console.log(3)  ;   "5" - - "3"
console.log(4)  ;   null + 1
console.log(5)  ;   undefined + 1
console.log(6)  ;   +"3"
console.log(7)  ;   !!"false"
console.log(8)  ;   [] + []
console.log(9)  ;   {} + []
console.log(10) ;   [1,2] + [3,4]


// Run them properly
const puzzles = [
  () => typeof undefined == typeof null,   // typeof null is "object"
  () => typeof typeof 1,                   // typeof always returns a string
  () => "5" - -"3",                        // double negative, both coerce to number
  () => null + 1,
  () => undefined + 1,
  () => +"3",                              // unary + converts to number
  () => !!"false",                         // non-empty string is truthy
  () => [] + [],
  () => [] + {},
  () => [1, 2] + [3, 4],
];

puzzles.forEach((fn, i) => {
  console.log(`${i + 1}: ${fn()}`);
});


/*
Answers:
1.  true        — typeof undefined is "undefined", typeof null is "object" — false, wait:
                  null vs NULL — NULL is not defined → ReferenceError actually
                  use typeof null: "object" vs typeof undefined: "undefined" → false
2.  "string"    — typeof 1 → "number", typeof "number" → "string"
3.  8           — "5" - (-"3") → 5 - (-3) → 8
4.  1           — null coerces to 0
5.  NaN         — undefined coerces to NaN
6.  3           — unary + on string
7.  true        — "false" is a non-empty string, truthy
8.  ""          — [] converts to "", "" + "" → ""
9.  "[object Object]" — [] → "", {} → "[object Object]"
10. "1,23,4"    — arrays stringify via .join(",") then concatenate
*/
