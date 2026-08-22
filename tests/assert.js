// Simple assertion utility for red-light tests

class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AssertionError';
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new AssertionError(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new AssertionError(
      message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function assertDeepEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new AssertionError(
      message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function assertThrows(fn, expectedMessage, message) {
  try {
    fn();
    throw new AssertionError(message || 'Expected function to throw');
  } catch (err) {
    if (expectedMessage && !err.message.includes(expectedMessage)) {
      throw new AssertionError(
        message || `Expected error message to include "${expectedMessage}", got "${err.message}"`
      );
    }
  }
}

function assertFileExists(filePath, message) {
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    throw new AssertionError(message || `File does not exist: ${filePath}`);
  }
}

function assertFileDoesNotExist(filePath, message) {
  const fs = require('fs');
  if (fs.existsSync(filePath)) {
    throw new AssertionError(message || `File should not exist: ${filePath}`);
  }
}

module.exports = {
  assert,
  assertEqual,
  assertDeepEqual,
  assertThrows,
  assertFileExists,
  assertFileDoesNotExist,
  AssertionError
};
