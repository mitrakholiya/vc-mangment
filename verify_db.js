
const mongoose = require('mongoose');

const dbConnect = async () => {
    if (mongoose.connection.readyState >= 1) return;
    // Replace with your actual URI if environment variable is not picked up
    const uri = process.env.MONGO_URI || "mongodb+srv://doadmin:4803125p7M9wYrGC@db-mongodb-blr1-89736-fe06528d.mongo.ondigitalocean.com/admin?tls=true&authSource=admin";
    return mongoose.connect(uri);
};

async function checkCounts() {
    try {
        await dbConnect();
        console.log("Connected to DB.");

        const collections = ["users", "ventures", "vc_user_monthlies", "vc_monthlies"];
        
        // Dynamic check
        const userCount = await mongoose.connection.db.collection('users').countDocuments();
        const ventureCount = await mongoose.connection.db.collection('ventures').countDocuments();
        const vcUserMonthlyCount = await mongoose.connection.db.collection('vc_user_monthlies').countDocuments();
        const vcMonthlyCount = await mongoose.connection.db.collection('vc_monthlies').countDocuments();

        console.log(`Users: ${userCount}`);
        console.log(`Ventures: ${ventureCount}`);
        console.log(`VC User Monthlies: ${vcUserMonthlyCount}`);
        console.log(`VC Monthlies: ${vcMonthlyCount}`);

        const lastVenture = await mongoose.connection.db.collection('ventures').find().sort({created_at: -1}).limit(1).toArray();
        console.log("Latest Venture:", JSON.stringify(lastVenture, null, 2));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkCounts();
