#!/usr/bin/env node
/**
 * Tests for Auto-Confirm functionality
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEST_DIR = path.join(__dirname, 'test-workspace');
const CONFIG_FILE = path.join(TEST_DIR, '.claude', 'auto-confirm-config.json');

// Test utilities
function setup() {
    if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(path.join(TEST_DIR, '.claude'), { recursive: true });
}

function cleanup() {
    if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
}

function runTest(name, testFn) {
    try {
        console.log(`Running test: ${name}`);
        testFn();
        console.log(`✅ ${name} PASSED`);
        return true;
    } catch (error) {
        console.error(`❌ ${name} FAILED: ${error.message}`);
        return false;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

// Tests
function testConfigCreation() {
    // Create initial config
    const initialConfig = {
        enabled: false,
        agentName: 'auto-confirm',
        version: '1.0.0',
        lastModified: new Date().toISOString(),
        description: 'Configuration for Claude Code auto-confirmation behavior'
    };
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(initialConfig, null, 2));
    
    assert(fs.existsSync(CONFIG_FILE), 'Config file should be created');
    
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    assert(config.enabled === false, 'Initial state should be disabled');
    assert(config.agentName === 'auto-confirm', 'Agent name should be set');
}

function testConfigToggling() {
    // Test enabling
    const enabledConfig = {
        enabled: true,
        agentName: 'auto-confirm',
        version: '1.0.0',
        lastModified: new Date().toISOString(),
        description: 'Configuration for Claude Code auto-confirmation behavior'
    };
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(enabledConfig, null, 2));
    
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    assert(config.enabled === true, 'Should be enabled after toggle');
    
    // Test disabling
    const disabledConfig = {
        enabled: false,
        agentName: 'auto-confirm',
        version: '1.0.0',
        lastModified: new Date().toISOString(),
        description: 'Configuration for Claude Code auto-confirmation behavior'
    };
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(disabledConfig, null, 2));
    
    const config2 = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    assert(config2.enabled === false, 'Should be disabled after toggle');
}

function testUtilityScript() {
    const checkerScript = path.join(__dirname, '..', 'utils', 'auto-confirm-checker.js');
    
    // Test with disabled state
    const disabledConfig = {
        enabled: false,
        agentName: 'auto-confirm',
        version: '1.0.0',
        lastModified: new Date().toISOString(),
        description: 'Configuration for Claude Code auto-confirmation behavior'
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(disabledConfig, null, 2));
    
    try {
        const output = execSync(`cd "${TEST_DIR}" && node "${checkerScript}" status`, { 
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        assert(output.trim() === 'disabled', 'Should report disabled state');
    } catch (error) {
        // Exit code 1 is expected for disabled state
        assert(error.status === 1, 'Should exit with code 1 for disabled state');
    }
    
    // Test with enabled state
    const enabledConfig = {
        enabled: true,
        agentName: 'auto-confirm',
        version: '1.0.0',
        lastModified: new Date().toISOString(),
        description: 'Configuration for Claude Code auto-confirmation behavior'
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(enabledConfig, null, 2));
    
    const output2 = execSync(`cd "${TEST_DIR}" && node "${checkerScript}" status`, { 
        encoding: 'utf8' 
    });
    assert(output2.trim() === 'enabled', 'Should report enabled state');
}

function testAgentFile() {
    const agentFile = path.join(__dirname, '..', 'agents', 'auto-confirm.md');
    assert(fs.existsSync(agentFile), 'Agent file should exist');
    
    const content = fs.readFileSync(agentFile, 'utf8');
    assert(content.includes('Auto-Confirm Agent'), 'Should contain agent title');
    assert(content.includes('NEVER ask for user confirmation'), 'Should contain auto-confirm behavior');
    assert(content.includes('System Prompt'), 'Should contain system prompt section');
}

function testCommandFile() {
    const commandFile = path.join(__dirname, '..', 'commands', 'auto-confirm.md');
    assert(fs.existsSync(commandFile), 'Command file should exist');
    
    const content = fs.readFileSync(commandFile, 'utf8');
    assert(content.includes('/auto-confirm'), 'Should contain command usage');
    assert(content.includes('on|off|status'), 'Should contain command arguments');
}

// Run all tests
function runAllTests() {
    console.log('🧪 Running Auto-Confirm Tests\n');
    
    let passed = 0;
    let failed = 0;
    
    const tests = [
        ['Config Creation', testConfigCreation],
        ['Config Toggling', testConfigToggling],
        ['Utility Script', testUtilityScript],
        ['Agent File', testAgentFile],
        ['Command File', testCommandFile]
    ];
    
    for (const [name, testFn] of tests) {
        setup();
        if (runTest(name, testFn)) {
            passed++;
        } else {
            failed++;
        }
        cleanup();
        console.log();
    }
    
    console.log(`📊 Test Results:`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Total: ${passed + failed}`);
    
    if (failed > 0) {
        process.exit(1);
    } else {
        console.log(`\n🎉 All tests passed!`);
    }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests();
}

export { runAllTests };