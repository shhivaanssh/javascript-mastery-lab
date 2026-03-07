// Three types of scope: global, function, block


// --- Global scope ---
const appName = "MyApp"; // accessible everywhere

function showApp() {
  console.log(appName); // can read global
}


// --- Function scope ---
function processUser() {
  const userId = 42; // only exists inside this function
  console.log(userId);
}
// console.log(userId); // ReferenceError


// --- Block scope ---
{
  let blockVar = "only in this block";
  const alsoBlock = true;
  console.log(blockVar);
}
// console.log(blockVar); // ReferenceError

// var ignores block scope — this is why it causes bugs
{
  var leaky = "I escape the block";
}
console.log(leaky); // "I escape the block"


// --- The scope chain ---
// JS looks up from inner → outer until it finds the variable

const level1 = "global";

function outer() {
  const level2 = "outer";

  function middle() {
    const level3 = "middle";

    function inner() {
      // can see all three levels
      console.log(level1, level2, level3);
    }
    inner();
  }
  middle();
}
outer();

// inner can read outer variables, but outer cannot read inner's
function parent() {
  const secret = "parent only";

  function child() {
    console.log(secret); // works — child sees parent's scope
  }

  child();
}
// secret is not accessible here


// --- Variable shadowing ---
// An inner variable can shadow an outer one with the same name

const color = "blue";

function paintRoom() {
  const color = "red"; // shadows outer color
  console.log(color);  // "red"
}

paintRoom();
console.log(color); // "blue" — outer unchanged


// --- Scope and loops ---

// var in a loop leaks out
for (var i = 0; i < 3; i++) {}
console.log(i); // 3 — still accessible

// let stays inside the loop
for (let j = 0; j < 3; j++) {}
// console.log(j); // ReferenceError


// Classic closure-in-loop bug with var
const varFns = [];
for (var k = 0; k < 3; k++) {
  varFns.push(() => console.log(k));
}
varFns[0](); // 3 — all share the same k
varFns[1](); // 3
varFns[2](); // 3

// Fixed with let
const letFns = [];
for (let m = 0; m < 3; m++) {
  letFns.push(() => console.log(m));
}
letFns[0](); // 0
letFns[1](); // 1
letFns[2](); // 2
