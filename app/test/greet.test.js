const test = require('node:test');
const assert = require('node:assert');
const { greet, add } = require('../src/greet');

test('greet uses the name it is given', () => {
  assert.strictEqual(greet('Jenkins'), 'Hello, Jenkins!');
});

test('greet falls back to "world" for empty input', () => {
  assert.strictEqual(greet(''), 'Hello, world!');
  assert.strictEqual(greet(undefined), 'Hello, world!');
});

test('add sums two numbers', () => {
  assert.strictEqual(add(2, 3), 5);
});

test('add rejects non-numbers', () => {
  assert.throws(() => add('2', 3), TypeError);
});
