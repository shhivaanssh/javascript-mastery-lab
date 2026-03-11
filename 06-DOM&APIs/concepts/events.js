// --- addEventListener ---

const btn = document.querySelector("#submit");

// addEventListener(type, handler, options)
btn.addEventListener("click", handleClick);
btn.addEventListener("click", handleClick, { once: true });    // auto-removes after first fire
btn.addEventListener("click", handleClick, { passive: true }); // promise not to call preventDefault
btn.addEventListener("click", handleClick, { capture: true }); // capture phase (see bubbling.js)

function handleClick(event) {
  console.log(event.type);    // "click"
  console.log(event.target);  // element that was clicked
  console.log(event.currentTarget); // element the listener is on
  event.preventDefault();     // stop default browser action
  event.stopPropagation();    // stop event from bubbling up
}

// Remove a listener — must pass the same function reference
btn.removeEventListener("click", handleClick);
// Anonymous functions can NOT be removed — keep named references


// --- The event object ---

document.addEventListener("keydown", (e) => {
  e.key;          // "Enter", "Escape", "a", "ArrowLeft"
  e.code;         // "Enter", "KeyA", "Space" — physical key, layout-independent
  e.ctrlKey;      // true if Ctrl held
  e.shiftKey;
  e.altKey;
  e.metaKey;      // Cmd on Mac
  e.repeat;       // true if key held down
});

document.addEventListener("mousemove", (e) => {
  e.clientX; e.clientY;   // relative to viewport
  e.pageX;   e.pageY;     // relative to document
  e.offsetX; e.offsetY;   // relative to target element
  e.buttons;              // bitmask of which mouse buttons are held
});

document.addEventListener("click", (e) => {
  e.button;       // 0=left, 1=middle, 2=right
  e.detail;       // click count (1, 2, 3 for double/triple)
});


// --- Common event types ---

// Mouse
// click, dblclick, mousedown, mouseup, mousemove, mouseenter, mouseleave
// mouseover, mouseout (bubble), contextmenu

// Keyboard
// keydown, keyup, keypress (deprecated)

// Form
// submit, change, input, focus, blur, focusin, focusout, reset, select

// Input
// input    — fires on every keystroke/paste/cut (use this for live updates)
// change   — fires when value changes AND element loses focus

// Drag
// drag, dragstart, dragend, dragenter, dragover, dragleave, drop

// Touch
// touchstart, touchmove, touchend, touchcancel

// Window / Document
// load, DOMContentLoaded, resize, scroll, beforeunload, unload, error, online, offline

// Pointer (unified mouse + touch + pen)
// pointerdown, pointermove, pointerup, pointerenter, pointerleave, pointercancel


// --- DOMContentLoaded vs load ---

// DOMContentLoaded — HTML parsed, DOM ready, external resources may still be loading
document.addEventListener("DOMContentLoaded", () => {
  // safe to query DOM here
});

// load — everything loaded: images, stylesheets, scripts
window.addEventListener("load", () => {
  // safe to measure image dimensions here
});


// --- input event for live updates ---

const input = document.querySelector("#search");

input.addEventListener("input", (e) => {
  const value = e.target.value;
  console.log("live:", value); // fires on every character
});

input.addEventListener("change", (e) => {
  console.log("committed:", e.target.value); // fires only when focus leaves
});


// --- Custom events ---

const myEvent = new CustomEvent("userLoggedIn", {
  detail:  { userId: 42, role: "admin" },
  bubbles: true,
  cancelable: true,
});

document.dispatchEvent(myEvent);

document.addEventListener("userLoggedIn", (e) => {
  console.log(e.detail.userId); // 42
});

// Useful for decoupled communication between components
function emitEvent(name, detail) {
  document.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
}
