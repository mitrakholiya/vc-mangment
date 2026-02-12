
const mongoose = require('mongoose');

async function migrateIDs() {
  try {
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://meetrakholiya31_db_user:YvstIt9j7B4YRTAU@ac-ukqvh0p-shard-00-00.jocbtwe.mongodb.net:27017,ac-ukqvh0p-shard-00-01.jocbtwe.mongodb.net:27017,ac-ukqvh0p-shard-00-02.jocbtwe.mongodb.net:27017/VCmangment?ssl=true&authSource=admin';
    console.log('Connecting to:', mongoUrl);
    
    await mongoose.connect(mongoUrl);
    console.log('Connected.');

    const collection = mongoose.connection.db.collection('vc_user_monthlies');
    const cursor = collection.find({});
    
    let updatedCount = 0;
    
    while(await cursor.hasNext()) {
      const doc = await cursor.next();
      const updates = {};
      
      if (typeof doc.user_id === 'string') {
          try {
            updates.user_id = new mongoose.Types.ObjectId(doc.user_id);
          } catch (e) {
            console.error(`Invalid ObjectId for user_id: ${doc.user_id}`);
          }
      }
      
      if (typeof doc.vc_id === 'string') {
           try {
            updates.vc_id = new mongoose.Types.ObjectId(doc.vc_id);
          } catch (e) {
            console.error(`Invalid ObjectId for vc_id: ${doc.vc_id}`);
          }
      }
      
      if (Object.keys(updates).length > 0) {
          await collection.updateOne({ _id: doc._id }, { $set: updates });
          updatedCount++;
          console.log(`Updated doc ${doc._id}`);
      }
    }
    
    console.log(`\nMigration complete. Updated ${updatedCount} documents.`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

migrateIDs();
