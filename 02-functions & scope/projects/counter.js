function create(initial = 0, { min = -Infinity, max = Infinity } = {}) {
  let count = initial;

  const clamp = (n) => Math.min(Math.max(n, min), max);

  return {
    increment(step = 1) {
      count = clamp(count + step);
      return count;
    },
    decrement(step = 1) {
      count = clamp(count - step);
      return count;
    },
    add(n)   { return this.increment(n); },
    subtract(n) { return this.decrement(n); },
    reset()  { count = initial; return count; },
    value()  { return count; },
    toString() { return `Counter(${count})`; },
  };
}

module.exports = { create };
