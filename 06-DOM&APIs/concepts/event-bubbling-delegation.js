// --- Event propagation phases ---
//
// When an event fires on an element, it travels in 3 phases:
//
//  1. CAPTURE phase — document → ... → parent → target
//  2. TARGET phase  — the element itself
//  3. BUBBLE phase  — target → parent → ... → document
//
// By default, addEventListener listens in the BUBBLE phase.
// Pass { capture: true } to listen during CAPTURE.


// --- Bubbling ---
// Most events bubble up through ancestors after firing on the target.

// <div id="outer">
//   <div id="inner">
//     <button id="btn">Click me</button>
//   </div>
// </div>

document.querySelector("#btn").addEventListener("click", (e) => {
  console.log("button clicked");   // fires first
});

document.querySelector("#inner").addEventListener("click", (e) => {
  console.log("inner div");        // fires second
});

document.querySelector("#outer").addEventListener("click", (e) => {
  console.log("outer div");        // fires third
});

document.addEventListener("click", (e) => {
  console.log("document");         // fires last
});

// Clicking the button logs: button → inner → outer → document


// --- stopPropagation ---
// Stops the event from bubbling further up.

document.querySelector("#inner").addEventListener("click", (e) => {
  e.stopPropagation(); // outer and document listeners won't fire
});

// stopImmediatePropagation — also prevents other listeners on the SAME element
document.querySelector("#btn").addEventListener("click", (e) => {
  e.stopImmediatePropagation();
  // any other "click" listeners on #btn also won't fire
});


// --- Event delegation ---
// Attach ONE listener to a parent instead of many listeners to children.
// Works because events bubble up.
// Essential for dynamic content (elements added after page load).

// BAD — individual listeners on each item
document.querySelectorAll(".item").forEach(item => {
  item.addEventListener("click", handleItemClick);
});
// Problem: new items added to the list won't have listeners

// GOOD — one listener on the parent
document.querySelector(".list").addEventListener("click", (e) => {
  const item = e.target.closest(".item"); // handles clicks on child elements too
  if (!item) return; // click was on the list itself, not an item
  handleItemClick(item);
});

function handleItemClick(el) {
  console.log("item:", el.dataset.id);
}

// Pattern with multiple element types in one container
document.querySelector(".toolbar").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id     = btn.closest("[data-id]")?.dataset.id;

  switch (action) {
    case "edit":   openEditor(id);   break;
    case "delete": deleteItem(id);   break;
    case "share":  shareItem(id);    break;
  }
});


// --- Capturing phase ---
// Rarely needed. One use: intercepting events before they reach the target.

document.addEventListener("click", (e) => {
  console.log("capture phase — fires before any bubble listeners");
}, { capture: true });

// Practical example: a modal overlay that captures all clicks
// to prevent clicks from reaching elements behind it
document.querySelector(".modal-overlay").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeModal(); // click was on overlay, not modal content
}, { capture: false }); // bubble is fine here


// --- Which events don't bubble? ---
// focus / blur      — use focusin / focusout instead (they do bubble)
// mouseenter / mouseleave — use mouseover / mouseout instead (they do bubble)
// load / error on resources — don't bubble up from img, script, etc.
// scroll            — doesn't bubble from elements (does from window)


// --- Event target vs currentTarget ---
// target        — the element the event actually originated on (the clicked element)
// currentTarget — the element the listener is attached to (where you called addEventListener)

document.querySelector(".nav").addEventListener("click", (e) => {
  e.target;        // could be a <a>, <span>, or <li> inside .nav
  e.currentTarget; // always .nav
  console.log(e.target === e.currentTarget); // true only if .nav itself was clicked
});
