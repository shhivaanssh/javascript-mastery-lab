const _caches = new WeakMap();

function create(fn) {
  const cache = new Map();
  _caches.set(wrapped, cache);

  function wrapped(...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }

  _caches.set(wrapped, cache);
  return wrapped;
}

function stats(memoizedFn) {
  const cache = _caches.get(memoizedFn);
  if (!cache) return "not a memoized function";
  return {
    cachedKeys: cache.size,
    keys: [...cache.keys()],
  };
}

function clear(memoizedFn) {
  const cache = _caches.get(memoizedFn);
  if (cache) cache.clear();
}

module.exports = { create, stats, clear };
