#!/usr/bin/env node

/**
 * 📊 DISLINK VERIFICATION DASHBOARD
 * 
 * Real-time monitoring dashboard for all Dislink components
 * Provides visual status indicators and alert management
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk').default || require('chalk');

// Import verification modules
const {
  BuildVerifier,
  RoutingVerifier,
  AuthenticationVerifier,
  QRFlowVerifier,
  DataPersistenceVerifier,
  CachingVerifier,
  ResponsivenessVerifier,
  AlertSystem
} = require('./continuous-verification.js');

class VerificationDashboard {
  constructor() {
    this.verifiers = [
      { name: 'Build', verifier: BuildVerifier, status: 'PENDING', lastCheck: null },
      { name: 'Routing', verifier: RoutingVerifier, status: 'PENDING', lastCheck: null },
      { name: 'Authentication', verifier: AuthenticationVerifier, status: 'PENDING', lastCheck: null },
      { name: 'QR Flow', verifier: QRFlowVerifier, status: 'PENDING', lastCheck: null },
      { name: 'Data Persistence', verifier: DataPersistenceVerifier, status: 'PENDING', lastCheck: null },
      { name: 'Caching', verifier: CachingVerifier, status: 'PENDING', lastCheck: null },
      { name: 'Responsiveness', verifier: ResponsivenessVerifier, status: 'PENDING', lastCheck: null }
    ];
    
    this.alertSystem = new AlertSystem();
    this.isRunning = false;
    this.refreshInterval = 30000; // 30 seconds
    this.intervalId = null;
  }

  start() {
    console.clear();
    this.isRunning = true;
    
    console.log(chalk.bold.blue('📊 DISLINK VERIFICATION DASHBOARD'));
    console.log(chalk.gray('Real-time monitoring of all components'));
    console.log(chalk.gray('Press Ctrl+C to stop\n'));
    
    // Initial verification
    this.runAllVerifications();
    
    // Set up periodic refresh
    this.intervalId = setInterval(() => {
      this.runAllVerifications();
    }, this.refreshInterval);
    
    // Set up signal handlers
    this.setupSignalHandlers();
  }

  async runAllVerifications() {
    console.log(chalk.blue(`\n🔍 Running verification scan... (${new Date().toLocaleTimeString()})`));
    
    const promises = this.verifiers.map(async (verifier) => {
      try {
        const result = await verifier.verifier.verify();
        verifier.status = result.status;
        verifier.lastCheck = new Date();
        verifier.result = result;
        
        // Update alert system
        if (result.status === 'FAILED') {
          this.alertSystem.addAlert(
            verifier.name.toLowerCase().replace(' ', '_'),
            `${verifier.name} verification failed: ${result.error || 'Unknown error'}`,
            'critical'
          );
        }
        
      } catch (error) {
        verifier.status = 'ERROR';
        verifier.lastCheck = new Date();
        verifier.error = error.message;
        
        this.alertSystem.addAlert(
          verifier.name.toLowerCase().replace(' ', '_'),
          `${verifier.name} verification error: ${error.message}`,
          'critical'
        );
      }
    });
    
    await Promise.all(promises);
    this.displayDashboard();
  }

  displayDashboard() {
    console.clear();
    
    // Header
    console.log(chalk.bold.blue('📊 DISLINK VERIFICATION DASHBOARD'));
    console.log(chalk.gray(`Last updated: ${new Date().toLocaleString()}`));
    console.log(chalk.gray('Real-time monitoring of all components\n'));
    
    // Status grid
    console.log(chalk.bold('🔧 COMPONENT STATUS'));
    console.log('─'.repeat(60));
    
    this.verifiers.forEach(verifier => {
      const statusIcon = this.getStatusIcon(verifier.status);
      const statusColor = this.getStatusColor(verifier.status);
      const lastCheck = verifier.lastCheck ? verifier.lastCheck.toLocaleTimeString() : 'Never';
      
      console.log(
        `${statusIcon} ${verifier.name.padEnd(18)} ` +
        `${statusColor(verifier.status.padEnd(8))} ` +
        `${chalk.gray(`Last: ${lastCheck}`)}`
      );
    });
    
    // Overall status
    const overallStatus = this.getOverallStatus();
    console.log('\n' + '─'.repeat(60));
    console.log(chalk.bold(`🎯 OVERALL STATUS: ${overallStatus}`));
    
    // Alerts section
    this.displayAlerts();
    
    // Quick stats
    this.displayStats();
    
    // Footer
    console.log('\n' + '─'.repeat(60));
    console.log(chalk.gray('Press Ctrl+C to stop | Auto-refresh every 30s'));
  }

  getStatusIcon(status) {
    switch (status) {
      case 'PASSED': return chalk.green('✅');
      case 'FAILED': return chalk.red('❌');
      case 'ERROR': return chalk.red('💥');
      case 'PENDING': return chalk.yellow('⏳');
      default: return chalk.gray('❓');
    }
  }

  getStatusColor(status) {
    switch (status) {
      case 'PASSED': return chalk.green;
      case 'FAILED': return chalk.red;
      case 'ERROR': return chalk.red;
      case 'PENDING': return chalk.yellow;
      default: return chalk.gray;
    }
  }

  getOverallStatus() {
    const failedCount = this.verifiers.filter(v => v.status === 'FAILED' || v.status === 'ERROR').length;
    const passedCount = this.verifiers.filter(v => v.status === 'PASSED').length;
    
    if (failedCount > 0) {
      return chalk.red(`❌ FAILED (${failedCount} issues)`);
    } else if (passedCount === this.verifiers.length) {
      return chalk.green('✅ ALL SYSTEMS OPERATIONAL');
    } else {
      return chalk.yellow('⏳ PENDING VERIFICATION');
    }
  }

  displayAlerts() {
    const alertSummary = this.alertSystem.getSummary();
    
    if (alertSummary.total > 0) {
      console.log('\n' + chalk.bold('🚨 ALERTS'));
      console.log('─'.repeat(60));
      
      if (alertSummary.critical > 0) {
        console.log(chalk.red(`🚨 Critical Alerts: ${alertSummary.critical}`));
        this.alertSystem.criticalAlerts.slice(-3).forEach(alert => {
          console.log(chalk.red(`  • ${alert.type}: ${alert.message}`));
        });
      }
      
      if (alertSummary.warnings > 0) {
        console.log(chalk.yellow(`⚠️  Warnings: ${alertSummary.warnings}`));
        this.alertSystem.alerts.slice(-2).forEach(alert => {
          console.log(chalk.yellow(`  • ${alert.type}: ${alert.message}`));
        });
      }
    } else {
      console.log('\n' + chalk.green('✅ No alerts - All systems operational'));
    }
  }

  displayStats() {
    console.log('\n' + chalk.bold('📈 QUICK STATS'));
    console.log('─'.repeat(60));
    
    const passedCount = this.verifiers.filter(v => v.status === 'PASSED').length;
    const failedCount = this.verifiers.filter(v => v.status === 'FAILED' || v.status === 'ERROR').length;
    const pendingCount = this.verifiers.filter(v => v.status === 'PENDING').length;
    
    console.log(`✅ Passed: ${chalk.green(passedCount)}`);
    console.log(`❌ Failed: ${chalk.red(failedCount)}`);
    console.log(`⏳ Pending: ${chalk.yellow(pendingCount)}`);
    console.log(`📊 Total: ${this.verifiers.length}`);
    
    // Uptime
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    console.log(`⏱️  Uptime: ${hours}h ${minutes}m`);
  }

  setupSignalHandlers() {
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n\n🛑 Shutting down dashboard...'));
      this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log(chalk.yellow('\n\n🛑 Shutting down dashboard...'));
      this.stop();
      process.exit(0);
    });
  }

  stop() {
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log(chalk.green('✅ Dashboard stopped.'));
  }

  // Manual verification trigger
  async triggerVerification() {
    console.log(chalk.blue('\n🔄 Manual verification triggered...'));
    await this.runAllVerifications();
  }
}

// CLI interface
class DashboardCLI {
  constructor() {
    this.dashboard = new VerificationDashboard();
  }

  start() {
    this.dashboard.start();
  }

  stop() {
    this.dashboard.stop();
  }
}

// Run if called directly
if (require.main === module) {
  const cli = new DashboardCLI();
  cli.start();
}

module.exports = { VerificationDashboard, DashboardCLI };
