// --- Accessing form data ---

const form = document.querySelector("#signup");

// By name — direct property access
form.email.value;    // works if input has name="email"
form.password.value;

// FormData — cleanest for POST requests
form.addEventListener("submit", (e) => {
  e.preventDefault(); // stop page reload

  const data = new FormData(form);
  data.get("email");
  data.get("password");
  data.getAll("tags");    // for multi-select or multiple inputs with same name
  [...data.entries()];    // all fields as [key, value] pairs
  Object.fromEntries(data); // { email: "...", password: "..." }
});


// --- Input types and reading values ---

// text, email, password, number, url
document.querySelector("[name='email']").value; // string

// checkbox
document.querySelector("[name='agree']").checked; // boolean
document.querySelector("[name='agree']").value;   // "on" by default unless overridden

// radio — get the checked one
document.querySelector("[name='plan']:checked")?.value; // "free" | "pro" | null

// select
document.querySelector("select").value;               // selected option value
document.querySelector("select").selectedOptions;      // HTMLCollection
[...document.querySelector("select[multiple]").selectedOptions].map(o => o.value);

// file
const fileInput = document.querySelector("[type='file']");
fileInput.files;        // FileList
fileInput.files[0];     // first File object
fileInput.files[0].name;
fileInput.files[0].size;
fileInput.files[0].type; // "image/jpeg"


// --- Constraint validation API ---

const emailInput = document.querySelector("[type='email']");

emailInput.validity.valid;       // true if all constraints pass
emailInput.validity.valueMissing; // true if required and empty
emailInput.validity.typeMismatch; // true if not a valid email
emailInput.validity.tooShort;
emailInput.validity.tooLong;
emailInput.validity.patternMismatch;
emailInput.validity.rangeUnderflow;
emailInput.validity.rangeOverflow;

emailInput.validationMessage; // browser's default error message
emailInput.checkValidity();   // returns boolean, fires invalid event if false
emailInput.setCustomValidity("Username already taken"); // custom error
emailInput.setCustomValidity(""); // clear custom error


// --- Custom validation ---

function validateField(input, rules) {
  const value = input.value.trim();
  const errors = [];

  if (rules.required && !value) {
    errors.push("This field is required");
  }
  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`Minimum ${rules.minLength} characters`);
  }
  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push(rules.message || "Invalid format");
  }
  if (rules.custom) {
    const result = rules.custom(value);
    if (result) errors.push(result); // return error message or null
  }

  return errors;
}

function showErrors(input, errors) {
  const container = input.closest(".field");
  container.querySelectorAll(".error").forEach(e => e.remove());
  input.classList.toggle("invalid", errors.length > 0);

  errors.forEach(msg => {
    const el = document.createElement("span");
    el.className = "error";
    el.textContent = msg;
    container.append(el);
  });
}


// --- Real-time validation on input ---

const passwordInput = document.querySelector("[name='password']");

passwordInput.addEventListener("input", () => {
  const val    = passwordInput.value;
  const errors = validateField(passwordInput, {
    required:  true,
    minLength: 8,
    custom: (v) => {
      if (!/[A-Z]/.test(v)) return "Must contain an uppercase letter";
      if (!/[0-9]/.test(v)) return "Must contain a number";
      return null;
    },
  });
  showErrors(passwordInput, errors);
});


// --- Prevent form submit if invalid ---

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const fields = form.querySelectorAll("[data-required]");
  let valid = true;

  fields.forEach(field => {
    const errors = validateField(field, { required: true });
    showErrors(field, errors);
    if (errors.length) valid = false;
  });

  if (!valid) return;

  // All valid — submit
  const data = Object.fromEntries(new FormData(form));
  console.log("submitting:", data);
});


// --- History and URL APIs ---

// Current URL info
window.location.href;       // full URL string
window.location.origin;     // "https://example.com"
window.location.pathname;   // "/products/shoes"
window.location.search;     // "?category=boots&sort=price"
window.location.hash;       // "#reviews"
window.location.host;       // "example.com:8080"

// Parse query params
const params = new URLSearchParams(window.location.search);
params.get("category");     // "boots"
params.get("sort");         // "price"
params.has("filter");       // false
[...params.entries()];      // all params

// Build a URL
const url = new URL("https://api.example.com/search");
url.searchParams.set("q", "javascript");
url.searchParams.set("page", 2);
url.href; // "https://api.example.com/search?q=javascript&page=2"

// History API — navigate without page reload
history.pushState({ page: 2 }, "", "/products?page=2");   // add to history
history.replaceState({ page: 2 }, "", "/products?page=2"); // replace current
history.back();
history.forward();
history.go(-2);   // go 2 steps back

// Handle back/forward button
window.addEventListener("popstate", (e) => {
  const state = e.state; // { page: 2 }
  renderPage(state);
});
