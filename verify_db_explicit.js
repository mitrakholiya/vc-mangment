
const mongoose = require('mongoose');

const MONGODB_URL = "mongodb://meetrakholiya31_db_user:YvstIt9j7B4YRTAU@ac-ukqvh0p-shard-00-00.jocbtwe.mongodb.net:27017,ac-ukqvh0p-shard-00-01.jocbtwe.mongodb.net:27017,ac-ukqvh0p-shard-00-02.jocbtwe.mongodb.net:27017/VCmangment?ssl=true&authSource=admin";

async function verify() {
    try {
        await mongoose.connect(MONGODB_URL);
        console.log("Connected to DB:", mongoose.connection.name);

        const latestVenture = await mongoose.connection.db.collection('ventures').find().sort({created_at: -1}).limit(1).next();
        if (!latestVenture) {
            console.log("No ventures found.");
        } else {
            console.log("Latest Venture:", latestVenture.name, "ID:", latestVenture._id);
            
            const vcId = latestVenture._id;
            // Note: vc_id in vc_user_monthlies is an ObjectId, but in vcmonthlies it might be a String depending on the code.
            // Let's check both for vc_id
            
            const userMonthlyCountObj = await mongoose.connection.db.collection('vc_user_monthlies').countDocuments({ vc_id: vcId });
            const userMonthlyCountStr = await mongoose.connection.db.collection('vc_user_monthlies').countDocuments({ vc_id: vcId.toString() });

            const vcMonthlyCountObj = await mongoose.connection.db.collection('vcmonthlies').countDocuments({ vc_id: vcId });
            const vcMonthlyCountStr = await mongoose.connection.db.collection('vcmonthlies').countDocuments({ vc_id: vcId.toString() });

            console.log(`For Venture ${vcId}:`);
            console.log(`  vc_user_monthlies (as ObjId): ${userMonthlyCountObj}`);
            console.log(`  vc_user_monthlies (as String): ${userMonthlyCountStr}`);
            console.log(`  vcmonthlies (as ObjId): ${vcMonthlyCountObj}`);
            console.log(`  vcmonthlies (as String): ${vcMonthlyCountStr}`);
            
            if (vcMonthlyCountStr > 0) {
                const sample = await mongoose.connection.db.collection('vcmonthlies').findOne({ vc_id: vcId.toString() });
                console.log("Sample vcmonthly:", JSON.stringify(sample, null, 2));
            }
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

verify();
