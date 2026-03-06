// 1. Sum 1 to N
function sumToN(n) {
  let total = 0;
  for (let i = 1; i <= n; i++) total += i;
  return total;
}
// Math shortcut: n * (n + 1) / 2
console.log(sumToN(10)); // 55


// 2. Factorial
function factorial(n) {
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}
console.log(factorial(5)); // 120


// 3. Reverse a string without .reverse()
function reverseStr(str) {
  let result = "";
  for (let i = str.length - 1; i >= 0; i--) {
    result += str[i];
  }
  return result;
}
console.log(reverseStr("hello")); // "olleh"


// 4. Count vowels
function countVowels(str) {
  let count = 0;
  for (const char of str.toLowerCase()) {
    if ("aeiou".includes(char)) count++;
  }
  return count;
}
console.log(countVowels("JavaScript")); // 3


// 5. Multiplication table
function multiTable(n) {
  for (let i = 1; i <= 10; i++) {
    console.log(`${n} x ${i} = ${n * i}`);
  }
}
multiTable(7);


// 6. Find largest in array (without Math.max)
function findMax(arr) {
  let max = arr[0];
  for (const n of arr) {
    if (n > max) max = n;
  }
  return max;
}
console.log(findMax([3, 7, 1, 9, 4])); // 9


// 7. Check palindrome
function isPalindrome(str) {
  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, "");
  let left = 0;
  let right = clean.length - 1;
  while (left < right) {
    if (clean[left] !== clean[right]) return false;
    left++;
    right--;
  }
  return true;
}
console.log(isPalindrome("racecar"));     // true
console.log(isPalindrome("A man a plan a canal Panama")); // true


// 8. Pattern — right triangle
function triangle(rows) {
  for (let i = 1; i <= rows; i++) {
    console.log("*".repeat(i));
  }
}
triangle(4);
// *
// **
// ***
// ****


// 9. Fibonacci sequence
function fibonacci(n) {
  const seq = [0, 1];
  for (let i = 2; i < n; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
  }
  return seq.slice(0, n);
}
console.log(fibonacci(8)); // [0, 1, 1, 2, 3, 5, 8, 13]


// 10. Number to binary (without .toString(2))
function toBinary(n) {
  if (n === 0) return "0";
  let bits = "";
  while (n > 0) {
    bits = (n % 2) + bits;
    n = Math.floor(n / 2);
  }
  return bits;
}
console.log(toBinary(10)); // "1010"
