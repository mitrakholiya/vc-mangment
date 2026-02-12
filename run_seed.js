
const { exit } = require('process');

async function runSeed() {
  console.log("Starting seed request...");
  try {
    const response = await fetch('http://localhost:3000/api/test/seed-5-months', {
      method: 'POST',
    });
    
    console.log(`Response status: ${response.status}`);
    const text = await response.text();
    console.log("Body:", text);
    
  } catch (error) {
    console.error('Error running seed:', error);
  }
}

runSeed();
