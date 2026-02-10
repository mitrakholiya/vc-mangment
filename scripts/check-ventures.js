
const mongoose = require('mongoose');

// Define minimal schema to avoid loading full application context
const VentureSchema = new mongoose.Schema({
  name: String,
  status: String,
  members: Array
}, { strict: false });

const VentureModel = mongoose.model('Venture', VentureSchema);

async function checkVentures() {
  try {
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/VCmangment'; // Fallback if env not set
    console.log('Connecting to:', mongoUrl);
    
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    const allVentures = await VentureModel.find({});
    console.log(`\nTotal Ventures: ${allVentures.length}`);

    const activeVentures = await VentureModel.find({ status: 'active' });
    console.log(`Active Ventures: ${activeVentures.length}`);

    if (allVentures.length > 0) {
      console.log('\nList of Ventures:');
      allVentures.forEach(v => {
        console.log(`- ${v.name} (ID: ${v._id}, Status: ${v.status}, Members: ${v.members?.length || 0})`);
      });
    }

    if (activeVentures.length === 0) {
      console.log('\n⚠️ No active ventures found. This explains why crons are skipping.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected');
  }
}

checkVentures();
