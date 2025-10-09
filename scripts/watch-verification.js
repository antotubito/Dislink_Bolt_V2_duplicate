#!/usr/bin/env node

/**
 * 👁️ DISLINK FILE WATCHER & VERIFICATION
 * 
 * Continuously monitors file changes and runs verification
 * Alerts on regressions in real-time
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk').default || require('chalk');

// Import verification system
const { runContinuousVerification, AlertSystem } = require('./continuous-verification.js');

// Configuration
const WATCH_CONFIG = {
  // Directories to watch
  watchPaths: [
    './web/src',
    './shared/lib',
    './web/public',
    './web/vite.config.ts',
    './netlify.toml',
    './package.json'
  ],
  
  // File patterns to ignore
  ignorePatterns: [
    /node_modules/,
    /\.git/,
    /dist/,
    /\.DS_Store/,
    /\.log$/,
    /\.tmp$/,
    /\.cache/
  ],
  
  // Debounce delay (ms)
  debounceDelay: 2000,
  
  // Verification cooldown (ms) - minimum time between verifications
  verificationCooldown: 10000
};

class FileWatcher {
  constructor() {
    this.watchers = new Map();
    this.lastVerification = 0;
    this.pendingVerification = null;
    this.alertSystem = new AlertSystem();
    this.changeCount = 0;
  }

  start() {
    console.log(chalk.blue('👁️  Starting Dislink File Watcher...'));
    console.log(chalk.gray('Watching for changes in:'));
    WATCH_CONFIG.watchPaths.forEach(path => {
      console.log(chalk.gray(`  - ${path}`));
    });
    console.log('');

    // Set up watchers for each path
    WATCH_CONFIG.watchPaths.forEach(watchPath => {
      this.setupWatcher(watchPath);
    });

    // Initial verification
    console.log(chalk.yellow('🔍 Running initial verification...'));
    this.runVerification('initial');
  }

  setupWatcher(watchPath) {
    if (!fs.existsSync(watchPath)) {
      console.log(chalk.yellow(`⚠️  Path does not exist: ${watchPath}`));
      return;
    }

    const watcher = fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
      if (this.shouldIgnoreFile(filename)) {
        return;
      }

      this.handleFileChange(eventType, filename, watchPath);
    });

    this.watchers.set(watchPath, watcher);
    console.log(chalk.green(`✅ Watching: ${watchPath}`));
  }

  shouldIgnoreFile(filename) {
    if (!filename) return true;
    
    return WATCH_CONFIG.ignorePatterns.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(filename);
      }
      return filename.includes(pattern);
    });
  }

  handleFileChange(eventType, filename, watchPath) {
    this.changeCount++;
    
    const filePath = path.join(watchPath, filename);
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(chalk.cyan(`[${timestamp}] ${eventType}: ${filePath}`));
    
    // Debounce verification
    this.debounceVerification(eventType, filename, filePath);
  }

  debounceVerification(eventType, filename, filePath) {
    // Clear existing timeout
    if (this.pendingVerification) {
      clearTimeout(this.pendingVerification);
    }

    // Set new timeout
    this.pendingVerification = setTimeout(() => {
      this.runVerification('file_change', { eventType, filename, filePath });
      this.pendingVerification = null;
    }, WATCH_CONFIG.debounceDelay);
  }

  async runVerification(trigger, details = {}) {
    const now = Date.now();
    
    // Check cooldown
    if (now - this.lastVerification < WATCH_CONFIG.verificationCooldown) {
      console.log(chalk.gray('⏳ Verification cooldown active, skipping...'));
      return;
    }

    this.lastVerification = now;
    
    console.log(chalk.blue(`\n🔍 Running verification (trigger: ${trigger})...`));
    
    try {
      // Run the verification
      await runContinuousVerification();
      
      console.log(chalk.green('✅ Verification completed successfully!'));
      
      // Log change summary
      if (this.changeCount > 0) {
        console.log(chalk.gray(`📊 Total changes detected: ${this.changeCount}`));
        this.changeCount = 0;
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Verification failed: ${error.message}`));
      
      // Add to alert system
      this.alertSystem.addAlert(
        'verification_failure',
        `Verification failed after ${trigger}: ${error.message}`,
        'critical'
      );
      
      // Show critical alerts
      if (this.alertSystem.hasCriticalAlerts()) {
        console.log(chalk.red('\n🚨 CRITICAL ALERTS:'));
        this.alertSystem.criticalAlerts.forEach(alert => {
          console.log(chalk.red(`  - ${alert.type}: ${alert.message}`));
        });
      }
    }
  }

  stop() {
    console.log(chalk.yellow('\n🛑 Stopping file watcher...'));
    
    // Close all watchers
    this.watchers.forEach((watcher, path) => {
      watcher.close();
      console.log(chalk.gray(`  - Stopped watching: ${path}`));
    });
    
    this.watchers.clear();
    
    // Clear pending verification
    if (this.pendingVerification) {
      clearTimeout(this.pendingVerification);
    }
    
    console.log(chalk.green('✅ File watcher stopped.'));
  }
}

// CLI interface
class WatchCLI {
  constructor() {
    this.watcher = new FileWatcher();
    this.setupSignalHandlers();
  }

  setupSignalHandlers() {
    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n\n🛑 Received SIGINT, shutting down gracefully...'));
      this.watcher.stop();
      process.exit(0);
    });

    // Handle other termination signals
    process.on('SIGTERM', () => {
      console.log(chalk.yellow('\n\n🛑 Received SIGTERM, shutting down gracefully...'));
      this.watcher.stop();
      process.exit(0);
    });
  }

  start() {
    console.log(chalk.bold.blue('🔍 DISLINK CONTINUOUS VERIFICATION WATCHER'));
    console.log(chalk.gray('Press Ctrl+C to stop watching\n'));
    
    this.watcher.start();
  }
}

// Run if called directly
if (require.main === module) {
  const cli = new WatchCLI();
  cli.start();
}

module.exports = { FileWatcher, WatchCLI };
