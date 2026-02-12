
const mongoose = require('mongoose');
const MONGODB_URL = "mongodb://meetrakholiya31_db_user:YvstIt9j7B4YRTAU@ac-ukqvh0p-shard-00-00.jocbtwe.mongodb.net:27017,ac-ukqvh0p-shard-00-01.jocbtwe.mongodb.net:27017,ac-ukqvh0p-shard-00-02.jocbtwe.mongodb.net:27017/VCmangment?ssl=true&authSource=admin";

async function verify() {
    try {
        await mongoose.connect(MONGODB_URL);
        const vcId = "698c880dd1b33aca30563b3f";
        
        console.log("Monthly data for Venture:", vcId);
        const records = await mongoose.connection.db.collection('vcmonthlies').find({ vc_id: vcId }).toArray();
        records.forEach(r => {
            console.log(`Month: ${r.month}, Year: ${r.year}`);
        });

        const userRecords = await mongoose.connection.db.collection('vc_user_monthlies').find({ vc_id: new mongoose.Types.ObjectId(vcId) }).toArray();
        console.log("User Monthly Data points:", userRecords.length);
        const months = [...new Set(userRecords.map(r => `${r.month}/${r.year}`))];
        console.log("Months covered:", months);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
verify();
