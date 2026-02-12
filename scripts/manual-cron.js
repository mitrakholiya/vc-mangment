
const mongoose = require('mongoose');
const { Schema } = mongoose;


const fs = require('fs');
const path = require('path');

function loadEnv(filePath) {
  console.log(`Trying to load env from: ${filePath}`);
  if (fs.existsSync(filePath)) {
    console.log(`Found ${filePath}`);
    const envConfig = fs.readFileSync(filePath, 'utf8');
    envConfig.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return; // Ignore comments and empty lines
      
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
        if (!process.env[key]) {
          process.env[key] = value;
          // console.log(`Loaded ${key}`);
        }
      }
    });
  } else {
    console.log(`File not found: ${filePath}`);
  }
}

// Adjust path based on execution context
// If run from root: scripts/manual-cron.js -> __dirname is root/scripts
// .env is in root.
const rootDir = path.resolve(__dirname, '..');
console.log(`Root dir: ${rootDir}`);

loadEnv(path.join(rootDir, '.env'));
loadEnv(path.join(rootDir, '.env.local'));


// --- Schemas ---

const VentureSchema = new Schema(
  {
    name: { type: String, required: true },
    monthly_emi: { type: Number, required: true },
    interest_rate: { type: Number, required: true },
    start_date: { type: Date, required: true },
    collection_date: { type: Number, required: true }, 
    max_loan_amount: { type: Number, required: true },
    loan_repayment_percent: { type: Number, required: true },
    members: [
      {
        user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, enum: ["ADMIN", "MEMBER"], default: "MEMBER" },
      },
    ],
    requests: [{ type: Schema.Types.ObjectId, ref: "user" }],
    created_by: { type: String, required: true, ref: "user" },
    fund_wallet: { type: Number, required: true, default: 0 },
    status: { type: String, required: true, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const VentureModel = mongoose.models.Venture || mongoose.model("Venture", VentureSchema);

const VcUserMonthlySchema = new Schema(
  {
    vc_id: { type: Schema.Types.ObjectId, ref: "Venture", required: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    monthly_contribution: { type: Number, required: true },
    loan_amount: { type: Number, required: true },
    loan_interest: { type: Number, required: true },
    loan_monthly_emi: { type: Number, required: true },
    loan_paid_amount: { type: Number, required: true },
    remaining_loan: { type: Number, required: true },
    total_payable: { type: Number, required: true },
    status: { type: String, required: true, default: "none", enum: ["none", "pending", "paid", "approved"] },
    paid_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

VcUserMonthlySchema.index({ user_id: 1, vc_id: 1, month: 1, year: 1 }, { unique: true });

const VcUserMonthlyModel = mongoose.models.vc_user_monthly || mongoose.model("vc_user_monthly", VcUserMonthlySchema);

// --- Logic ---

async function runCron() {
  console.log("Starting Manual Cron Job...");

  const MONGODB_URI = process.env.MONGODB_URL || process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URL is not defined in .env or .env.local");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // ✅ Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    console.log(`Generating logs for ${currentMonth}/${currentYear}`);

    // ✅ Get all active ventures
    const ventures = await VentureModel.find({ status: "active" });

    if (ventures.length === 0) {
      console.log("No active ventures found.");
      return;
    }

    let totalCreated = 0;
    let totalSkipped = 0;
    const errors = [];

    // ✅ Loop through each venture
    for (const venture of ventures) {
      // ✅ Ensure VcMonthly record exists for this venture/month
      try {
        const existingVcMonthly = await mongoose.model("VcMonthly", new Schema({
          vc_id: { type: String, required: true },
          month: { type: Number, required: true },
          year: { type: Number, required: true },
          last_month_remaining_amount: { type: Number, default: 0 },
          total_monthly_contribution: { type: Number, default: 0 },
          total_loan_repayment: { type: Number, default: 0 },
          total_part_payment: { type: Number, default: 0 },
          total: { type: Number, default: 0 },
          loans: { type: Array, default: [] },
          remaining_amount: { type: Number, default: 0 }
        })).findOne({
          vc_id: String(venture._id),
          month: currentMonth,
          year: currentYear
        });

        if (!existingVcMonthly) {
          // Need to fetch previous month's remaining amount
           const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
           const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

           const previousVcMonthly = await mongoose.model("VcMonthly").findOne({
            vc_id: String(venture._id),
            month: previousMonth,
            year: previousYear
           });

           const lastMonthRemaining = previousVcMonthly ? previousVcMonthly.remaining_amount : 0;

           await mongoose.model("VcMonthly").create({
            vc_id: String(venture._id),
            month: currentMonth,
            year: currentYear,
            last_month_remaining_amount: lastMonthRemaining,
            total_monthly_contribution: 0,
            total_loan_repayment: 0,
            total_part_payment: 0,
            total: lastMonthRemaining, // Initial total is just last month's remaining
            remaining_amount: lastMonthRemaining // Initial remaining is same
           });
           console.log(`Created VcMonthly record for venture ${venture.name}`);
        }
      } catch (vcMonthlyErr) {
        console.error(`Error creating VcMonthly for ${venture.name}:`, vcMonthlyErr.message);
      }

      for (const member of venture.members) {
        try {
          // Check if already exists
          const existing = await VcUserMonthlyModel.findOne({
            vc_id: String(venture._id),
            user_id: member.user_id,
            month: currentMonth,
            year: currentYear,
          });

          if (existing) {
            totalSkipped++;
            continue;
          }

          // Get previous month's record for loan continuity
          const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
          const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

          const previousRecord = await VcUserMonthlyModel.findOne({
            vc_id: String(venture._id),
            user_id: member.user_id,
            month: previousMonth,
            year: previousYear,
          });

          // Calculations
          const monthlyContribution = venture.monthly_emi || 0;
          let loanAmount = 0;
          let loanInterest = 0;
          let loanMonthlyEmi = 0;
          let loanPaidAmount = 0;
          let remainingLoan = 0;

          // If there was a loan from previous month, continue tracking it
          if (previousRecord && previousRecord.remaining_loan > 0) {
            remainingLoan = previousRecord.remaining_loan;
            loanAmount = remainingLoan;

            // Interest Calculation (Remaining Loan * Rate%)
            const interestAmount = (remainingLoan * (venture.interest_rate || 0)) / 100;
            const repaymentAmount = (remainingLoan * (venture.loan_repayment_percent || 0)) / 100;

            loanInterest = interestAmount;
            loanMonthlyEmi = interestAmount + repaymentAmount;
            loanPaidAmount = previousRecord.loan_paid_amount || 0;
          }

          const totalPayable = monthlyContribution + loanMonthlyEmi;

          // Create Entry
          await VcUserMonthlyModel.create({
            vc_id: String(venture._id),
            user_id: member.user_id,
            month: currentMonth,
            year: currentYear,
            monthly_contribution: monthlyContribution,
            loan_amount: loanAmount,
            loan_interest: loanInterest,
            loan_monthly_emi: loanMonthlyEmi,
            loan_paid_amount: loanPaidAmount,
            remaining_loan: remainingLoan,
            total_payable: totalPayable,
          });

          console.log(`Created log for user ${member.user_id} in venture ${venture.name}`);
          totalCreated++;
        } catch (err) {
          console.error(`Error for user ${member.user_id}:`, err.message);
          errors.push(
            `Failed for user ${member.user_id} in venture ${venture._id}: ${err.message}`
          );
        }
      }
    }

    console.log(`\nSummary:`);
    console.log(`Total Created: ${totalCreated}`);
    console.log(`Total Skipped: ${totalSkipped}`);
    if (errors.length > 0) {
      console.log(`Errors: ${errors.length}`);
      console.log(errors);
    }

  } catch (error) {
    console.error("❌ Fatal Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

runCron();
