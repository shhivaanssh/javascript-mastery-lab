// 1. Grade calculator
// Input: score (0–100), output: "A" / "B" / "C" / "D" / "F"

function grade(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

console.log(grade(95)); // A
console.log(grade(73)); // C
console.log(grade(50)); // F


// 2. Leap year check
// Divisible by 4, but not 100, unless also divisible by 400

function isLeapYear(year) {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

console.log(isLeapYear(2000)); // true
console.log(isLeapYear(1900)); // false
console.log(isLeapYear(2024)); // true


// 3. Number describer
// Return a string describing the number: negative/zero/small/medium/large

function describe(n) {
  if (n < 0)    return "negative";
  if (n === 0)  return "zero";
  if (n < 10)   return "small";
  if (n < 100)  return "medium";
  return "large";
}


// 4. Day type
// Given a day name, return "weekday" or "weekend"

function dayType(day) {
  const weekend = ["Saturday", "Sunday"];
  return weekend.includes(day) ? "weekend" : "weekday";
}

console.log(dayType("Monday"));   // weekday
console.log(dayType("Saturday")); // weekend


// 5. Rock Paper Scissors
// Returns "win" / "lose" / "draw" from player1's perspective

function rps(p1, p2) {
  if (p1 === p2) return "draw";

  const wins = { rock: "scissors", scissors: "paper", paper: "rock" };
  return wins[p1] === p2 ? "win" : "lose";
}

console.log(rps("rock", "scissors")); // win
console.log(rps("paper", "rock"));    // win
console.log(rps("rock", "paper"));    // lose


// 6. BMI category
function bmiCategory(weight, height) {
  const bmi = weight / (height * height);
  if (bmi < 18.5) return "underweight";
  if (bmi < 25)   return "normal";
  if (bmi < 30)   return "overweight";
  return "obese";
}
