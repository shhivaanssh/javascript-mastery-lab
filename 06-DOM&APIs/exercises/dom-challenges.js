// These exercises are meant to run in the browser console or in an HTML file.
// Each one is a self-contained function demonstrating a DOM pattern.
// Paste into browser console or create a test HTML file to run them.


// --- 1. Build a todo list with event delegation ---

function createTodoApp(container) {
  container.innerHTML = `
    <div class="todo-app">
      <form class="todo-form">
        <input type="text" placeholder="New task..." required>
        <button type="submit">Add</button>
      </form>
      <ul class="todo-list"></ul>
      <p class="count">0 tasks</p>
    </div>
  `;

  const form  = container.querySelector(".todo-form");
  const input = form.querySelector("input");
  const list  = container.querySelector(".todo-list");
  const count = container.querySelector(".count");
  let todos   = [];

  function render() {
    list.innerHTML = "";
    const frag = document.createDocumentFragment();

    todos.forEach(({ id, text, done }) => {
      const li = document.createElement("li");
      li.dataset.id = id;
      li.className  = done ? "done" : "";
      li.innerHTML  = `
        <span class="text">${text}</span>
        <button data-action="toggle">✓</button>
        <button data-action="delete">✕</button>
      `;
      frag.appendChild(li);
    });

    list.appendChild(frag);
    count.textContent = `${todos.filter(t => !t.done).length} remaining`;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    todos.push({ id: Date.now(), text, done: false });
    input.value = "";
    render();
  });

  // Single delegated listener for all item actions
  list.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = Number(btn.closest("li").dataset.id);

    if (btn.dataset.action === "toggle") {
      todos = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
    } else if (btn.dataset.action === "delete") {
      todos = todos.filter(t => t.id !== id);
    }
    render();
  });
}


// --- 2. Debounced search with live DOM update ---

function createSearch(container, items) {
  container.innerHTML = `
    <input type="search" placeholder="Search..." id="search">
    <ul id="results"></ul>
  `;

  const input   = container.querySelector("#search");
  const results = container.querySelector("#results");

  function renderResults(filtered) {
    results.innerHTML = "";
    if (filtered.length === 0) {
      results.innerHTML = "<li>No results</li>";
      return;
    }
    const frag = document.createDocumentFragment();
    filtered.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      frag.appendChild(li);
    });
    results.appendChild(frag);
  }

  function debounce(fn, ms) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }

  const handleSearch = debounce((query) => {
    const q = query.toLowerCase();
    renderResults(items.filter(item => item.toLowerCase().includes(q)));
  }, 250);

  input.addEventListener("input", (e) => handleSearch(e.target.value));
  renderResults(items); // show all initially
}


// --- 3. Accordion with event delegation ---

function createAccordion(container, sections) {
  container.innerHTML = sections.map(({ title, content }, i) => `
    <div class="section" data-index="${i}">
      <button class="title">${title}</button>
      <div class="content" hidden>${content}</div>
    </div>
  `).join("");

  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".title");
    if (!btn) return;

    const section = btn.closest(".section");
    const content = section.querySelector(".content");
    const isOpen  = !content.hidden;

    // Close all
    container.querySelectorAll(".content").forEach(c => { c.hidden = true; });
    container.querySelectorAll(".section").forEach(s => s.classList.remove("open"));

    // Open clicked (unless it was already open)
    if (!isOpen) {
      content.hidden = false;
      section.classList.add("open");
    }
  });
}


// --- 4. Drag-to-reorder list ---

function makeSortable(list) {
  let dragging = null;

  list.addEventListener("dragstart", (e) => {
    dragging = e.target.closest("li");
    dragging.classList.add("dragging");
  });

  list.addEventListener("dragend", () => {
    dragging?.classList.remove("dragging");
    dragging = null;
  });

  list.addEventListener("dragover", (e) => {
    e.preventDefault();
    const item = e.target.closest("li");
    if (!item || item === dragging) return;

    const rect     = item.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    if (e.clientY < midpoint) {
      list.insertBefore(dragging, item);
    } else {
      list.insertBefore(dragging, item.nextSibling);
    }
  });

  list.querySelectorAll("li").forEach(li => {
    li.draggable = true;
  });
}


// --- 5. Intersection Observer — lazy load / animate on scroll ---

function observeElements(selector, className = "visible") {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add(className);
        observer.unobserve(entry.target); // once is enough
      }
    });
  }, {
    threshold:  0.15, // trigger when 15% visible
    rootMargin: "0px 0px -50px 0px", // slightly before entering viewport
  });

  document.querySelectorAll(selector).forEach(el => observer.observe(el));
  return observer;
}


// --- 6. Local storage cart ---

function createCart() {
  const KEY = "shopping-cart";

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }

  function save(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
  }

  let items = load();

  return {
    add(product) {
      const existing = items.find(i => i.id === product.id);
      if (existing) existing.qty++;
      else items.push({ ...product, qty: 1 });
      save(items);
    },
    remove(id) {
      items = items.filter(i => i.id !== id);
      save(items);
    },
    total() {
      return items.reduce((sum, i) => sum + i.price * i.qty, 0);
    },
    items() { return [...items]; },
    clear() { items = []; save(items); },
  };
}
