// 1. Capitalize first letter of each word
function titleCase(str) {
  return str
    .split(" ")
    .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
console.log(titleCase("hello world from js")); // "Hello World From Js"


// 2. Count occurrences of a character
function countChar(str, char) {
  return str.split(char).length - 1;
}
console.log(countChar("mississippi", "s")); // 4


// 3. Truncate string with ellipsis
function truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}
console.log(truncate("Hello World", 8)); // "Hello..."


// 4. Check anagram
function isAnagram(a, b) {
  const sort = str => str.toLowerCase().replace(/\s/g, "").split("").sort().join("");
  return sort(a) === sort(b);
}
console.log(isAnagram("listen", "silent")); // true
console.log(isAnagram("hello", "world"));   // false


// 5. Caesar cipher (shift by n)
function caesar(str, shift) {
  return str.replace(/[a-z]/gi, char => {
    const base = char >= "a" ? 97 : 65;
    return String.fromCharCode(((char.charCodeAt(0) - base + shift) % 26) + base);
  });
}
console.log(caesar("Hello", 3));  // "Khoor"
console.log(caesar("Khoor", -3)); // "Hello"


// 6. Remove duplicate characters
function removeDuplicates(str) {
  return [...new Set(str)].join("");
}
console.log(removeDuplicates("aabbccdd")); // "abcd"


// 7. Longest word in a sentence
function longestWord(sentence) {
  return sentence
    .split(" ")
    .reduce((longest, word) => word.length > longest.length ? word : longest, "");
}
console.log(longestWord("The quick brown fox")); // "quick"


// 8. Mask sensitive data — show only last 4 chars
function mask(str) {
  return str.slice(-4).padStart(str.length, "*");
}
console.log(mask("1234567890")); // "******7890"


// 9. Convert camelCase to kebab-case
function toKebab(str) {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase();
}
console.log(toKebab("myVariableName")); // "my-variable-name"


// 10. Count words
function wordCount(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}
console.log(wordCount("  hello   world  ")); // 2
