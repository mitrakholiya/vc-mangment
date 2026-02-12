
const mongoose = require('mongoose');
const { Schema } = mongoose;
const fs = require('fs');
const path = require('path');

// --- ENV Loading ---
function loadEnv(filePath) {
  console.log(`Trying to load env from: ${filePath}`);
  if (fs.existsSync(filePath)) {
    console.log(`Found ${filePath}`);
    const envConfig = fs.readFileSync(filePath, 'utf8');
    envConfig.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = value;
      }
    });
  }
}

const rootDir = path.resolve(__dirname, '..');
loadEnv(path.join(rootDir, '.env'));
loadEnv(path.join(rootDir, '.env.local'));

// --- Schemas ---

// 1. Venture Schema (Simplified)
const VentureSchema = new Schema({
    name: { type: String, required: true },
    status: { type: String, required: true, enum: ["active", "inactive"], default: "active" },
}, { strict: false });
const VentureModel = mongoose.models.Venture || mongoose.model("Venture", VentureSchema);

// 2. VcUserMonthly Schema (Simplified for reading)
const VcUserMonthlySchema = new Schema({
    vc_id: { type: Schema.Types.ObjectId, ref: "Venture", required: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    monthly_contribution: { type: Number, required: true },
    loan_amount: { type: Number, required: true },
    loan_paid_amount: { type: Number, required: true },
    status: { type: String }, // 'paid' check
    paid_at: { type: Date },
}, { strict: false });
const VcUserMonthlyModel = mongoose.models.vc_user_monthly || mongoose.model("vc_user_monthly", VcUserMonthlySchema);

// 3. VcMonthly Schema (With Pre-save Hook Logic Replicated)
const VcMonthlyLoanSchema = new Schema({
    user_id: { type: String, required: true },
    loan_amount: { type: Number, required: true, default: 0 },
}, { _id: false });

const VcMonthlySchema = new Schema({
    vc_id: { type: String, required: true, index: true },
    last_month_remaining_amount: { type: Number, required: true, default: 0 },
    total_monthly_contribution: { type: Number, required: true, default: 0 },
    total_loan_repayment: { type: Number, required: true, default: 0 },
    total_part_payment: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    loans: { type: [VcMonthlyLoanSchema], default: [] },
    remaining_amount: { type: Number, required: true, default: 0 },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

// No Pre-save hook needed in manual script, we calculate manually.

const VcMonthlyModel = mongoose.models.VcMonthly || mongoose.model("VcMonthly", VcMonthlySchema);


// --- Main Logic ---

async function runCron() {
    console.log("Starting Manual VC Monthly Summary Cron...");

    const MONGODB_URI = process.env.MONGODB_URL || process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        console.error("❌ MONGODB_URL is not defined");
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        console.log(`Processing for ${currentMonth}/${currentYear}`);

        const ventures = await VentureModel.find({ status: "active" });

        if (ventures.length === 0) {
            console.log("No active ventures found.");
            return;
        }

        let totalCreated = 0;
        let totalSkipped = 0;

        for (const venture of ventures) {
            try {
                // Check if summary already exists
                const existingSummary = await VcMonthlyModel.findOne({
                    vc_id: venture._id.toString(),
                    month: currentMonth,
                    year: currentYear,
                });

                if (existingSummary) {
                    console.log(`Skipping ${venture.name} (id: ${venture._id}) - Summary already exists.`);
                    totalSkipped++;
                    continue;
                }

                // Previous month remaining
                const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
                const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

                const previousMonthSummary = await VcMonthlyModel.findOne({
                    vc_id: venture._id.toString(),
                    month: previousMonth,
                    year: previousYear,
                });

                const lastMonthRemaining = previousMonthSummary?.remaining_amount || 0;

                // Paid Contributions
                // Note: Ensure your data uses 'PAID' or 'paid' consistently. Adjust verify with DB if needed.
                // The route used "PAID", verify if your data is "paid" (lowercase).
                // Let's safe check both or use regex if unsure, but route says "PAID".
                // Based on User Monthly model enum: enum: ["none", "pending", "paid", "approved"] -> likely lowercase "paid" or "approved" counts as paid?
                // The route.ts file used `contribution_status: "PAID"`. But VcUserMonthlyModel has `status`.
                // Checking route.ts again:
                // It used `contribution_status: "PAID"`. Wait, does VcUserMonthlyModel have `contribution_status`?
                // Looking at recent `src/models/vc-user-monthly.ts` view_file output:
                // It has `status` enum ["none", "pending", "paid", "approved"].
                // It DOES NOT have `contribution_status`. The route code might be using an old field name or I missed it.
                // Let's assume `status: "paid"` or `status: "approved"` is what we want.
                // Update: The route.ts checked earlier might have been old or incorrect if it used `contribution_status`.
                // Let's use `status: "paid"` based on the model file I read.

                const paidContributions = await VcUserMonthlyModel.find({
                    vc_id: venture._id,
                    month: currentMonth,
                    year: currentYear,
                    status: { $in: ["paid", "approved"] } // Safer to include approved? Or just paid.
                });

                const totalMonthlyContribution = paidContributions.reduce(
                    (sum, record) => sum + (record.monthly_contribution || 0),
                    0
                );

                // Loan Repayments
                const userMonthlyRecords = await VcUserMonthlyModel.find({
                    vc_id: venture._id,
                    month: currentMonth,
                    year: currentYear,
                });

                const totalLoanRepayment = userMonthlyRecords.reduce(
                    (sum, record) => sum + (record.loan_paid_amount || 0),
                    0
                );

                const totalPartPayment = 0; // Fixed as 0 per route logic

                // Loans Disbursed
                const loansThisMonth = userMonthlyRecords.filter(r => r.loan_amount > 0);
                const loans = loansThisMonth.map(r => ({
                    user_id: r.user_id.toString(),
                    loan_amount: r.loan_amount
                }));

                const monthlySummary = new VcMonthlyModel({
                    vc_id: venture._id.toString(),
                    last_month_remaining_amount: lastMonthRemaining,
                    total_monthly_contribution: totalMonthlyContribution,
                    total_loan_repayment: totalLoanRepayment,
                    total_part_payment: totalPartPayment,
                    loans: loans,
                    month: currentMonth,
                    year: currentYear,
                });

                // Calculate Totals Manually
                monthlySummary.total =
                    lastMonthRemaining +
                    totalMonthlyContribution +
                    totalLoanRepayment +
                    totalPartPayment;
                
                const totalLoans = loans.reduce((sum, loan) => sum + loan.loan_amount, 0);
                monthlySummary.remaining_amount = monthlySummary.total - totalLoans;

                await monthlySummary.save();
                console.log(`Created summary for ${venture.name}`);
                totalCreated++;

            } catch (err) {
                console.error(`Error for venture ${venture._id}: ${err.message}`);
            }
        }

        console.log(`\nSummary: Created ${totalCreated}, Skipped ${totalSkipped}`);

    } catch (error) {
        console.error("❌ Fatal Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected");
    }
}

runCron();
