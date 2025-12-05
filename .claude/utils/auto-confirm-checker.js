#!/usr/bin/env node
/**
 * Auto-Confirm Configuration Checker
 * Utility to check if auto-confirm mode is enabled
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG_FILE = path.join(process.cwd(), '.claude', 'auto-confirm-config.json');

function checkAutoConfirmStatus() {
    try {
        if (!fs.existsSync(CONFIG_FILE)) {
            return false;
        }
        
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        return config.enabled === true;
    } catch (error) {
        console.error('Error reading auto-confirm config:', error.message);
        return false;
    }
}

function getAutoConfirmConfig() {
    try {
        if (!fs.existsSync(CONFIG_FILE)) {
            return null;
        }
        
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (error) {
        console.error('Error reading auto-confirm config:', error.message);
        return null;
    }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
    const command = process.argv[2];
    
    switch (command) {
        case 'status':
        case 'check':
            const isEnabled = checkAutoConfirmStatus();
            console.log(isEnabled ? 'enabled' : 'disabled');
            process.exit(isEnabled ? 0 : 1);
            break;
        
        case 'config':
            const config = getAutoConfirmConfig();
            if (config) {
                console.log(JSON.stringify(config, null, 2));
            } else {
                console.log('{}');
            }
            break;
            
        default:
            console.log('Usage: node auto-confirm-checker.js [status|config]');
            console.log('  status - Check if auto-confirm is enabled (exit 0 if enabled)');
            console.log('  config - Show full configuration');
            break;
    }
}

export {
    checkAutoConfirmStatus,
    getAutoConfirmConfig,
    CONFIG_FILE
};