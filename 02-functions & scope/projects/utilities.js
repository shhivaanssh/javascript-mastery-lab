// once — runs only the first time
function once(fn) {
  let ran = false;
  let result;

  return function(...args) {
    if (!ran) {
      ran = true;
      result = fn(...args);
    }
    return result;
  };
}

// debounce — waits until calls stop for `delay` ms
function debounce(fn, delay) {
  let timer;

  function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }

  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

// throttle — fires at most once per `interval` ms
function throttle(fn, interval) {
  let lastCall = 0;
  let timer;

  return function(...args) {
    const now = Date.now();
    const remaining = interval - (now - lastCall);

    if (remaining <= 0) {
      clearTimeout(timer);
      lastCall = now;
      return fn(...args);
    }

    clearTimeout(timer);
    timer = setTimeout(() => {
      lastCall = Date.now();
      fn(...args);
    }, remaining);
  };
}

// partial — fix some arguments now
function partial(fn, ...preset) {
  return function(...rest) {
    return fn(...preset, ...rest);
  };
}

// curry — transform f(a,b,c) into f(a)(b)(c)
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn(...args);
    }
    return (...more) => curried(...args, ...more);
  };
}

// negate — flips a predicate
function negate(predicate) {
  return function(...args) {
    return !predicate(...args);
  };
}

const isEven = n => n % 2 === 0;
const isOdd  = negate(isEven);

module.exports = { once, debounce, throttle, partial, curry, negate };
