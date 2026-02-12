/**
 * Local Cron Scheduler for Development
 * 
 * This script runs alongside your Next.js dev server to simulate
 * scheduled tasks that would normally run via Vercel Cron in production.
 * 
 * Usage: node scripts/local-cron.js
 * 
 * Note: Make sure your Next.js dev server is running first!
 */

const cron = require('node-cron');
require('dotenv').config();

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'test-secret';

console.log('🕐 Local Cron Scheduler Started');
console.log(`📡 API Base URL: ${BASE_URL}`);
console.log('');

// Function to call the monthly contributions API
async function generateMonthlyContributions() {
  console.log(`[${new Date().toISOString()}] Running monthly contributions job...`);
  
  try {
    const response = await fetch(
      `${BASE_URL}/api/cron/monthly-contributions?secret=${CRON_SECRET}`,
      { method: 'POST' }
    );
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Success: Created ${data.created} contributions, Skipped ${data.skipped}`);
    } else {
      console.log(`❌ Failed: ${data.message}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// ============================================
// CRON SCHEDULES
// ============================================

// Monthly contributions - Runs at 00:00 on the 1st of every month
// For testing, you can change to run every minute: '* * * * *'
cron.schedule('0 0 1 * *', () => {
  generateMonthlyContributions();
}, {
  scheduled: true,
  timezone: "Asia/Kolkata" // Change to your timezone
});

console.log('📅 Scheduled Jobs:');
console.log('   - Monthly Contributions: 00:00 on 1st of every month');
console.log('');
console.log('💡 Tip: For testing, run manually:');
console.log(`   curl -X POST "${BASE_URL}/api/cron/monthly-contributions?secret=${CRON_SECRET}"`);
console.log('');
console.log('Press Ctrl+C to stop...');
