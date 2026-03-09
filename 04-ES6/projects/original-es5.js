// ============================================================
// ES5 CODE — DO NOT MODIFY THIS FILE
// This is the original codebase to refactor.
// See: refactored.js for the modern ES6+ version.
// See: diff.md for a breakdown of every change made.
// ============================================================


// 1. Variable declarations
var API_URL = "https://api.example.com";
var MAX_RETRIES = 3;
var appConfig = {
  debug: false,
  timeout: 5000,
  version: "1.0.0"
};


// 2. Utility functions
function getUserFullName(user) {
  return user.firstName + " " + user.lastName;
}

function formatCurrency(amount, symbol) {
  if (symbol === undefined) symbol = "$";
  return symbol + amount.toFixed(2);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}


// 3. Array processing
function getActiveUserNames(users) {
  var activeUsers = users.filter(function(user) {
    return user.active === true;
  });
  var names = activeUsers.map(function(user) {
    return user.firstName + " " + user.lastName;
  });
  return names;
}

function groupUsersByRole(users) {
  return users.reduce(function(groups, user) {
    var role = user.role;
    if (!groups[role]) {
      groups[role] = [];
    }
    groups[role].push(user);
    return groups;
  }, {});
}

function getTotalRevenue(orders) {
  return orders.reduce(function(total, order) {
    return total + (order.quantity * order.price);
  }, 0);
}


// 4. Object manipulation
function createUser(firstName, lastName, email, role) {
  if (role === undefined) role = "user";
  return {
    firstName: firstName,
    lastName: lastName,
    email: email,
    role: role,
    fullName: firstName + " " + lastName,
    createdAt: new Date().toISOString()
  };
}

function mergeSettings(defaults, overrides) {
  var result = {};
  var defaultKeys = Object.keys(defaults);
  for (var i = 0; i < defaultKeys.length; i++) {
    result[defaultKeys[i]] = defaults[defaultKeys[i]];
  }
  var overrideKeys = Object.keys(overrides);
  for (var j = 0; j < overrideKeys.length; j++) {
    result[overrideKeys[j]] = overrides[overrideKeys[j]];
  }
  return result;
}

function getNestedValue(obj, path) {
  var parts = path.split(".");
  var current = obj;
  for (var i = 0; i < parts.length; i++) {
    if (current === null || current === undefined) return undefined;
    current = current[parts[i]];
  }
  return current;
}


// 5. Class-like constructor
function EventEmitter() {
  this.listeners = {};
}

EventEmitter.prototype.on = function(event, fn) {
  if (!this.listeners[event]) {
    this.listeners[event] = [];
  }
  this.listeners[event].push(fn);
  return this;
};

EventEmitter.prototype.emit = function(event) {
  var args = Array.prototype.slice.call(arguments, 1);
  var fns  = this.listeners[event] || [];
  fns.forEach(function(fn) {
    fn.apply(null, args);
  });
  return this;
};

EventEmitter.prototype.off = function(event, fn) {
  if (!this.listeners[event]) return this;
  this.listeners[event] = this.listeners[event].filter(function(l) {
    return l !== fn;
  });
  return this;
};


// 6. Async (callback-style)
function fetchUser(id, callback) {
  setTimeout(function() {
    if (id <= 0) {
      callback(new Error("Invalid ID"), null);
    } else {
      callback(null, { id: id, name: "User " + id });
    }
  }, 100);
}

function fetchUserPosts(userId, callback) {
  setTimeout(function() {
    callback(null, [
      { id: 1, userId: userId, title: "Post 1" },
      { id: 2, userId: userId, title: "Post 2" }
    ]);
  }, 100);
}

function loadUserWithPosts(userId, callback) {
  fetchUser(userId, function(err, user) {
    if (err) return callback(err, null);
    fetchUserPosts(user.id, function(err2, posts) {
      if (err2) return callback(err2, null);
      callback(null, { user: user, posts: posts });
    });
  });
}


// 7. String building
function buildQueryString(params) {
  var parts = [];
  var keys = Object.keys(params);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    parts.push(key + "=" + encodeURIComponent(params[key]));
  }
  return "?" + parts.join("&");
}

function renderUserCard(user) {
  return "<div class=\"user-card\">" +
    "<h2>" + user.firstName + " " + user.lastName + "</h2>" +
    "<p>" + user.email + "</p>" +
    "<span class=\"role\">" + user.role + "</span>" +
    "</div>";
}


module.exports = {
  API_URL, MAX_RETRIES, appConfig,
  getUserFullName, formatCurrency, clamp,
  getActiveUserNames, groupUsersByRole, getTotalRevenue,
  createUser, mergeSettings, getNestedValue,
  EventEmitter,
  fetchUser, fetchUserPosts, loadUserWithPosts,
  buildQueryString, renderUserCard
};
