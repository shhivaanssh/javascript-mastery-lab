// pipe: left to right
function pipe(...fns) {
  if (fns.length === 0) return x => x;
  if (fns.length === 1) return fns[0];

  return function(value) {
    return fns.reduce((acc, fn) => fn(acc), value);
  };
}

// compose: right to left
function compose(...fns) {
  return pipe(...fns.reverse());
}

// pipeAsync: same as pipe but handles async functions
function pipeAsync(...fns) {
  return async function(value) {
    let result = value;
    for (const fn of fns) {
      result = await fn(result);
    }
    return result;
  };
}

// tap: run a side effect in the middle of a pipe without changing the value
function tap(fn) {
  return function(value) {
    fn(value);
    return value;
  };
}

module.exports = { pipe, compose, pipeAsync, tap };
