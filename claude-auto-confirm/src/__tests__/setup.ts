// Test setup file
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

// Create temporary test directory
const testDir = path.join(os.tmpdir(), 'claude-auto-confirm-test');

beforeEach(() => {
  // Clean up test directory
  if (fs.existsSync(testDir)) {
    fs.removeSync(testDir);
  }
  fs.ensureDirSync(testDir);
  
  // Set test environment variables
  process.env.CONFIG_FILE_PATH = path.join(testDir, 'test-config.json');
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error'; // Suppress logs during tests
});

afterEach(() => {
  // Clean up after each test
  if (fs.existsSync(testDir)) {
    fs.removeSync(testDir);
  }
});

// Global test timeout
jest.setTimeout(10000);