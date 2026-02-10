
const mongoose = require('mongoose');

async function checkTypes() {
  try {
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://meetrakholiya31_db_user:YvstIt9j7B4YRTAU@ac-ukqvh0p-shard-00-00.jocbtwe.mongodb.net:27017,ac-ukqvh0p-shard-00-01.jocbtwe.mongodb.net:27017,ac-ukqvh0p-shard-00-02.jocbtwe.mongodb.net:27017/VCmangment?ssl=true&authSource=admin';
    console.log('Connecting to:', mongoUrl);
    
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    // Check likely candidates
    const likelyNames = ['vc_user_monthly', 'vc_user_monthlies', 'vcusermonthlies', 'vcusermonthly'];
    for (const name of likelyNames) {
        const count = await mongoose.connection.db.collection(name).countDocuments();
        console.log(`Collection '${name}': ${count} documents`);
        
        if (count > 0) {
            const records = await mongoose.connection.db.collection(name).find({}).limit(5).toArray();
             console.log(`\nChecking ${records.length} records in '${name}':`);
            records.forEach((doc, i) => {
                console.log(`Record ${i + 1}: _id=${doc._id}`);
                console.log(`  user_id: ${doc.user_id} (${typeof doc.user_id})`);
                console.log(`  vc_id: ${doc.vc_id} (${typeof doc.vc_id})`);
            });
        }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

checkTypes();
