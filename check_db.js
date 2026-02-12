
const mongoose = require('mongoose');
const { Schema } = mongoose;

const VcUserMonthlySchema = new Schema({
    vc_id: { type: Schema.Types.ObjectId, ref: "Venture", required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
}, { strict: false });

const VcMonthlySchema = new Schema({
    vc_id: { type: String, required: true, index: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
}, { strict: false });

const dbConnect = async () => {
    if (mongoose.connection.readyState >= 1) return;
    return mongoose.connect(process.env.MONGO_URI || "mongodb+srv://doadmin:4803125p7M9wYrGC@db-mongodb-blr1-89736-fe06528d.mongo.ondigitalocean.com/admin?tls=true&authSource=admin");
};

async function checkData() {
    await dbConnect();
    
    const vcIdStr = "698c8643d1b33aca30563a38";
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    console.log(`Checking for VC: ${vcIdStr}, Month: ${currentMonth}, Year: ${currentYear}`);

    const VcUserMonthly = mongoose.models.vc_user_monthly || mongoose.model("vc_user_monthly", VcUserMonthlySchema);
    const VcMonthly = mongoose.models.VcMonthly || mongoose.model("VcMonthly", VcMonthlySchema);

    // Check VcUserMonthly
    const userRecords = await VcUserMonthly.find({
        vc_id: vcIdStr, // Mongoose should cast to ObjectId
        month: currentMonth,
        year: currentYear
    });
    console.log(`VcUserMonthly Records Found: ${userRecords.length}`);
    if (userRecords.length > 0) console.log("Sample:", userRecords[0]);

    // Check VcMonthly
    const monthlyRecords = await VcMonthly.find({
        vc_id: vcIdStr, // Mongoose should cast to String if schema is String
        month: currentMonth,
        year: currentYear
    });
    console.log(`VcMonthly Records Found: ${monthlyRecords.length}`);
    if (monthlyRecords.length > 0) console.log("Sample:", monthlyRecords[0]);

    if (userRecords.length === 0 && monthlyRecords.length === 0) {
        console.log("NO DATA FOUND IN DB EITHER!");
    } else {
        console.log("DATA EXISTS IN DB.");
    }
    process.exit();
}

checkData();
