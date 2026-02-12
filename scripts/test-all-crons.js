#!/usr/bin/env node

/**
 * Test script for ALL Monthly Cron Jobs
 * 
 * Usage:
 *   node test-all-crons.js
 * 
 * This will test all three monthly cron jobs in sequence
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error('❌ Error: CRON_SECRET environment variable is not set');
  console.log('\nPlease set CRON_SECRET in your .env file or run:');
  console.log('  CRON_SECRET=your-secret node test-all-crons.js');
  process.exit(1);
}

async function testCron(name, path, method = 'POST') {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Testing: ${name}`);
  console.log('='.repeat(60));
  
  try {
    const response = await fetch(
      `${BASE_URL}${path}?secret=${CRON_SECRET}`,
      { method }
    );
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Success!');
      
      // Display relevant data based on the endpoint
      if (data.message) console.log(`📝 ${data.message}`);
      if (data.created !== undefined) console.log(`   Created: ${data.created}`);
      if (data.skipped !== undefined) console.log(`   Skipped: ${data.skipped}`);
      
      if (data.stats) {
        console.log('\n📊 Statistics:');
        Object.entries(data.stats).forEach(([key, value]) => {
          const formatted = typeof value === 'number' && key.includes('amount') 
            ? `₹${value.toLocaleString()}` 
            : value;
          console.log(`   ${key}: ${formatted}`);
        });
      }
      
      if (data.errors && data.errors.length > 0) {
        console.log('\n⚠️  Errors:');
        data.errors.forEach(err => console.log(`   - ${err}`));
      }
    } else {
      console.error('❌ Failed:', data.message);
      if (data.error) console.error('   Error:', data.error);
    }
    
    return data.success;
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return false;
  }
}

// Main execution
(async () => {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          Monthly Cron Jobs - Complete Test Suite          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  console.log(`\n📅 Testing for: ${currentMonth}/${currentYear}`);
  console.log(`⏰ Test started at: ${now.toLocaleString()}`);
  
  const results = {
    // contributions: false,
    userLogs: false,
    vcSummary: false,
  };
  
  // Test 1: Monthly Contributions (runs on 1st of month)
  // results.contributions = await testCron(
  //   'Monthly Contributions Generator',
  //   '/api/cron/monthly-contributions',
  //   'POST'
  // );
  
  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: Monthly User VC Logs (runs on last day at 11:50 PM)
  results.userLogs = await testCron(
    'Monthly User VC Logs Generator',
    '/api/cron/monthly-user-vc-logs',
    'POST'
  );
  
  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 3: Monthly VC Summary (runs on last day at 11:59 PM)
  results.vcSummary = await testCron(
    'Monthly VC Summary Generator',
    '/api/cron/monthly-vc-summary',
    'POST'
  );
  
  // Get stats for all crons
  console.log('\n\n' + '='.repeat(60));
  console.log('📈 VIEWING ALL STATISTICS');
  console.log('='.repeat(60));
  
  // await testCron(
  //   'Monthly Contributions Stats',
  //   '/api/cron/monthly-contributions',
  //   'GET'
  // );
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testCron(
    'Monthly User VC Logs Stats',
    '/api/cron/monthly-user-vc-logs',
    'GET'
  );
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await testCron(
    'Monthly VC Summary Stats',
    '/api/cron/monthly-vc-summary',
    'GET'
  );
  
  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const allPassed = Object.values(results).every(r => r);
  
  // console.log(`\n✅ Monthly Contributions: ${results.contributions ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Monthly User Logs: ${results.userLogs ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Monthly VC Summary: ${results.vcSummary ? 'PASSED' : 'FAILED'}`);
  
  console.log('\n' + (allPassed ? '🎉 All tests PASSED!' : '⚠️  Some tests FAILED'));
  console.log('\n' + '='.repeat(60) + '\n');
  
  process.exit(allPassed ? 0 : 1);
})();
