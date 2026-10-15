// Pure functions are easy to test, which makes them good pipeline practice.
function greet(name) {
  const clean = String(name ?? '').trim();
  return clean ? `Hello, ${clean}!` : 'Hello, world!';
}

function add(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('add() expects two numbers');
  }
  return a + b;
}

module.exports = { greet, add };
