// The DOM (Document Object Model) is a tree representation of an HTML document.
// The browser parses HTML and builds this tree — each tag becomes a node.
// JavaScript interacts with the page by reading and mutating this tree.


// --- The tree structure ---
//
// document
// └── html
//     ├── head
//     │   ├── title
//     │   └── meta
//     └── body
//         ├── header
//         │   └── h1 ("text node")
//         └── main
//             ├── p
//             └── ul
//                 ├── li
//                 └── li


// --- Node types ---
// Everything in the DOM is a Node. The most common types:

// Element nodes   — <div>, <p>, <input> etc.         nodeType = 1
// Text nodes      — the actual text inside elements   nodeType = 3
// Comment nodes   — <!-- comments -->                 nodeType = 8
// Document node   — the root `document` object        nodeType = 9

// Most of the time you work with Element nodes.
// Elements are Nodes, but not all Nodes are Elements.


// --- Traversing the DOM ---

const body = document.body;

body.parentNode;          // <html>
body.parentElement;       // <html> — same for elements, null for document

body.children;            // HTMLCollection — only element children
body.childNodes;          // NodeList — includes text nodes, comments
body.firstElementChild;   // first child that is an element
body.lastElementChild;    // last child that is an element
body.nextElementSibling;  // next sibling element
body.previousElementSibling;

// Converting HTMLCollection/NodeList to array
const items = [...document.querySelectorAll("li")];
const divs  = Array.from(document.getElementsByTagName("div"));


// --- Element properties ---

const el = document.querySelector(".card");

el.tagName;           // "DIV"
el.id;                // "my-card"
el.className;         // "card featured"
el.classList;         // DOMTokenList ["card", "featured"]
el.innerHTML;         // HTML string of contents
el.textContent;       // text content, all HTML stripped
el.outerHTML;         // HTML including the element itself
el.attributes;        // NamedNodeMap of all attributes
el.dataset;           // object of data-* attributes

// textContent vs innerHTML
// textContent is safer — it escapes HTML, preventing XSS
el.textContent = "<script>alert('xss')</script>"; // shown as literal text
el.innerHTML   = "<strong>bold</strong>";          // renders as HTML — be careful


// --- Checking and comparing nodes ---

el.contains(child);         // true if child is a descendant
el.isEqualNode(other);      // same structure and content
el.isSameNode(other);       // identical object reference (el === other)
el.matches(".card.featured"); // true if el matches the CSS selector
el.closest(".container");   // walks up the tree, returns first ancestor matching selector


// --- The document object ---

document.title;
document.URL;
document.domain;
document.referrer;
document.readyState;   // "loading" | "interactive" | "complete"

document.head;
document.body;
document.documentElement; // <html>

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  // safe to access DOM here
});
