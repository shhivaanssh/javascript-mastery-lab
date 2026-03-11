// --- Selecting elements ---

// Modern — use these
document.querySelector(".card");           // first match, any CSS selector
document.querySelector("#nav a.active");   // complex selectors work
document.querySelectorAll(".item");        // NodeList of ALL matches
document.querySelectorAll("p, li, span");  // multiple selectors

// Older APIs — still fast, still used
document.getElementById("main");
document.getElementsByClassName("card");  // live HTMLCollection
document.getElementsByTagName("input");   // live HTMLCollection
document.getElementsByName("email");      // live NodeList (forms)

// Scoped to an element — not just document
const form = document.querySelector("#signup");
form.querySelector("input[type='email']"); // search inside form only

// Live vs static
// getElementsBy* returns LIVE collections — auto-update as DOM changes
// querySelectorAll returns STATIC NodeList — snapshot at query time
const live   = document.getElementsByTagName("li");
const static_ = document.querySelectorAll("li");
// Add a new <li> — live.length grows, static_.length stays the same


// --- Reading and writing attributes ---

const img = document.querySelector("img");

img.getAttribute("src");          // read any attribute
img.setAttribute("alt", "A cat"); // set any attribute
img.removeAttribute("alt");
img.hasAttribute("data-id");      // boolean check

// Some attributes have direct DOM properties (mirrored)
img.src;       // full resolved URL
img.alt;       // attribute value
img.id;
img.href;      // (on <a>) full URL

// data-* attributes via dataset
// <div data-user-id="42" data-role="admin">
const el = document.querySelector("[data-user-id]");
el.dataset.userId;  // "42"    — camelCase access
el.dataset.role;    // "admin"
el.dataset.newKey = "value"; // creates data-new-key attribute


// --- Classes ---

el.classList.add("active");
el.classList.remove("hidden");
el.classList.toggle("open");           // add if absent, remove if present
el.classList.toggle("open", condition);// force add/remove based on boolean
el.classList.contains("active");       // true/false
el.classList.replace("old", "new");
[...el.classList];                     // array of class names


// --- Styles ---

// Inline styles (avoid when possible — prefer classes)
el.style.color       = "red";
el.style.fontSize    = "16px";
el.style.display     = "none";
el.style.cssText     = "color: red; font-size: 16px;"; // set multiple at once

// Reading computed styles (includes CSS, not just inline)
const styles = window.getComputedStyle(el);
styles.getPropertyValue("font-size"); // "16px"
styles.color;                         // "rgb(0, 0, 0)"


// --- Creating elements ---

const card = document.createElement("div");
card.className = "card";
card.id = "featured-card";
card.textContent = "Hello";

const link = document.createElement("a");
link.href = "https://example.com";
link.textContent = "Visit";
link.setAttribute("target", "_blank");
link.setAttribute("rel", "noopener noreferrer");

// DocumentFragment — batch DOM updates off-screen, then insert once
const frag = document.createDocumentFragment();
["Alice", "Bob", "Carol"].forEach(name => {
  const li = document.createElement("li");
  li.textContent = name;
  frag.appendChild(li);
});
document.querySelector("ul").appendChild(frag); // single reflow


// --- Inserting elements ---

const parent = document.querySelector(".container");
const child  = document.createElement("p");

parent.appendChild(child);           // add at end
parent.prepend(child);               // add at start (also accepts strings)
parent.append(child, "some text");   // end, multiple args, strings ok
parent.insertBefore(child, sibling); // before a specific child

// insertAdjacentElement / insertAdjacentHTML — relative to any element
el.insertAdjacentElement("beforebegin", newEl); // before el
el.insertAdjacentElement("afterbegin", newEl);  // first child of el
el.insertAdjacentElement("beforeend", newEl);   // last child of el
el.insertAdjacentElement("afterend", newEl);    // after el

el.insertAdjacentHTML("beforeend", "<span>appended</span>"); // parse + insert


// --- Removing and replacing elements ---

el.remove();                          // remove from DOM
parent.removeChild(child);            // old way
parent.replaceChild(newChild, oldChild);
el.replaceWith(newEl);                // modern, replaces el itself
el.replaceWith("plain text");         // can use string too


// --- Cloning ---

const clone        = el.cloneNode(false); // shallow — element only, no children
const deepClone    = el.cloneNode(true);  // deep — element + all descendants
