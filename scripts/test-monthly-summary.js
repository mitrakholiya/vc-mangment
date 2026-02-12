#!/usr/bin/env node

/**
 * Test script for Monthly VC Summary Cron Job
 * 
 * Usage:
 *   node test-monthly-summary.js [generate|stats]
 * 
 * Examples:
 *   node test-monthly-summary.js generate   # Generate summaries
 *   node test-monthly-summary.js stats      # View current stats
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error('❌ Error: CRON_SECRET environment variable is not set');
  console.log('\nPlease set CRON_SECRET in your .env file or run:');
  console.log('  CRON_SECRET=your-secret node test-monthly-summary.js [command]');
  process.exit(1);
}

const command = process.argv[2] || 'stats';

async function generateSummaries() {
  console.log('🚀 Generating monthly VC summaries...\n');
  
  try {
    const response = await fetch(
      `${BASE_URL}/api/cron/monthly-vc-summary?secret=${CRON_SECRET}`,
      { method: 'POST' }
    );
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Success!');
      console.log(`📊 Created: ${data.created}`);
      console.log(`⏭️  Skipped: ${data.skipped}`);
      console.log(`📅 Period: ${data.message}`);
      
      if (data.errors && data.errors.length > 0) {
        console.log('\n⚠️  Errors:');
        data.errors.forEach(err => console.log(`   - ${err}`));
      }
    } else {
      console.error('❌ Failed:', data.message);
      if (data.error) console.error('   Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function getStats() {
  console.log('📊 Fetching current month statistics...\n');
  
  try {
    const response = await fetch(
      `${BASE_URL}/api/cron/monthly-vc-summary?secret=${CRON_SECRET}`,
      { method: 'GET' }
    );
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Success!');
      console.log(`📅 Period: ${data.month}/${data.year}\n`);
      console.log('📈 Statistics:');
      console.log(`   Total VCs: ${data.stats.total_vcs}`);
      console.log(`   Total Contributions: ₹${data.stats.total_contributions.toLocaleString()}`);
      console.log(`   Total Loans Given: ₹${data.stats.total_loans_given.toLocaleString()}`);
      console.log(`   Total Remaining: ₹${data.stats.total_remaining.toLocaleString()}`);
      
      if (data.summaries && data.summaries.length > 0) {
        console.log('\n📋 Venture Summaries:');
        data.summaries.forEach((summary, index) => {
          console.log(`\n   ${index + 1}. VC ID: ${summary.vc_id}`);
          console.log(`      Last Month Remaining: ₹${summary.last_month_remaining_amount.toLocaleString()}`);
          console.log(`      Contributions: ₹${summary.total_monthly_contribution.toLocaleString()}`);
          console.log(`      Loan Repayments: ₹${summary.total_loan_repayment.toLocaleString()}`);
          console.log(`      Total: ₹${summary.total.toLocaleString()}`);
          console.log(`      Loans Disbursed: ${summary.loans.length}`);
          console.log(`      Remaining: ₹${summary.remaining_amount.toLocaleString()}`);
        });
      }
    } else {
      console.error('❌ Failed:', data.message);
      if (data.error) console.error('   Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Main execution
(async () => {
  console.log('═══════════════════════════════════════');
  console.log('  Monthly VC Summary Cron Test');
  console.log('═══════════════════════════════════════\n');
  
  switch (command) {
    case 'generate':
    case 'gen':
    case 'create':
      await generateSummaries();
      break;
    
    case 'stats':
    case 'view':
    case 'get':
      await getStats();
      break;
    
    default:
      console.log('❌ Unknown command:', command);
      console.log('\nAvailable commands:');
      console.log('  generate  - Generate monthly summaries');
      console.log('  stats     - View current month statistics');
      process.exit(1);
  }
  
  console.log('\n═══════════════════════════════════════\n');
})();
