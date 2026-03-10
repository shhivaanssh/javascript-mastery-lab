// Callbacks were the original async pattern in JavaScript.
// A callback is just a function passed as an argument, called when work completes.


// --- Synchronous callbacks ---
// Some callbacks run immediately — not async at all

[1, 2, 3].forEach(n => console.log(n));   // callback runs sync
[1, 2, 3].map(n => n * 2);                // also sync


// --- Asynchronous callbacks ---
// The callback is invoked later, by the runtime

setTimeout(() => console.log("1 second later"), 1000);

const fs = require("fs");
fs.readFile("./data.txt", "utf8", (err, data) => {
  if (err) {
    console.error("read failed:", err.message);
    return;
  }
  console.log(data);
});


// --- Node error-first callback convention ---
// callback(error, result) — error is always the first argument
// null means success

function readConfig(path, callback) {
  fs.readFile(path, "utf8", (err, raw) => {
    if (err) return callback(err, null);

    try {
      const parsed = JSON.parse(raw);
      callback(null, parsed);
    } catch (parseErr) {
      callback(parseErr, null);
    }
  });
}

readConfig("./config.json", (err, config) => {
  if (err) {
    console.error("Could not load config:", err.message);
    return;
  }
  console.log("Loaded:", config);
});


// --- Callback hell ---
// Real problem: nested async operations become a pyramid of doom

function getUser(id, cb) {
  setTimeout(() => cb(null, { id, name: "Alex", teamId: 10 }), 100);
}

function getTeam(teamId, cb) {
  setTimeout(() => cb(null, { id: teamId, name: "Engineering" }), 100);
}

function getTeamProjects(teamId, cb) {
  setTimeout(() => cb(null, [
    { id: 1, title: "Dashboard", teamId },
    { id: 2, title: "API",       teamId },
  ]), 100);
}

// Three sequential async calls — each depends on the previous result
getUser(1, (err, user) => {
  if (err) return console.error(err);

  getTeam(user.teamId, (err, team) => {
    if (err) return console.error(err);

    getTeamProjects(team.id, (err, projects) => {
      if (err) return console.error(err);

      // Finally have all three — but we're 3 levels deep
      console.log(`${user.name} is on ${team.name}`);
      console.log(`Projects: ${projects.map(p => p.title).join(", ")}`);
    });
  });
});

// Problems with this:
//   - Each level adds indentation
//   - Error handling is repeated at every level
//   - Hard to read, reuse, or test
//   - Parallel execution requires manual coordination


// --- Mitigating callback hell with named functions ---
// Pull each step into a named function — still callbacks, but flatter

function handleProjects(err, projects) {
  if (err) return console.error(err);
  console.log("Projects:", projects.map(p => p.title));
}

function handleTeam(err, team) {
  if (err) return console.error(err);
  getTeamProjects(team.id, handleProjects);
}

function handleUser(err, user) {
  if (err) return console.error(err);
  getTeam(user.teamId, handleTeam);
}

getUser(1, handleUser);
// Flatter visually, but the data flow is hard to follow


// --- Why Promises were invented ---
// Callbacks have no native composition, chaining, or error bubbling.
// Promises fix all three. See: promises.js
