const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Load environment variables manually for standalone script
const envPath = path.join(__dirname, './.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const firstEq = trimmed.indexOf('=');
      if (firstEq !== -1) {
        const key = trimmed.substring(0, firstEq).trim();
        const value = trimmed.substring(firstEq + 1).trim();
        process.env[key] = value;
      }
    }
  });
}

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/VCmangment';
console.log(`Using MongoDB URL: ${MONGODB_URL.replace(/:([^@]+)@/, ':****@')}`);

// Minimal Schema Definitions for Seeding
const UserSchema = new mongoose.Schema({ 
  name: String, 
  email: { type: String, unique: true }, 
  password_hash: String, 
  phone: String 
}, { strict: false });

const VentureSchema = new mongoose.Schema({ 
  name: String, 
  monthly_emi: Number, 
  interest_rate: Number, 
  members: Array, 
  created_by: String, 
  fund_wallet: Number, 
  status: String 
}, { strict: false });

const VcUserMonthlySchema = new mongoose.Schema({ 
  vc_id: mongoose.Types.ObjectId, 
  user_id: mongoose.Types.ObjectId, 
  month: Number, 
  year: Number, 
  status: String, 
  total_payable: Number 
}, { strict: false });

const VcMonthlySchema = new mongoose.Schema({ 
  vc_id: String, 
  month: Number, 
  year: Number, 
  total: Number 
}, { strict: false });

const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
const VentureModel = mongoose.models.Venture || mongoose.model('Venture', VentureSchema);
const VcUserMonthlyModel = mongoose.models.vc_user_monthly || mongoose.model('vc_user_monthly', VcUserMonthlySchema);
const VcMonthlyModel = mongoose.models.VcMonthly || mongoose.model('VcMonthly', VcMonthlySchema);

async function seed() {
  try {
    // console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);
    // console.log('Connected.');

    const passwordHash = await bcrypt.hash("123456", 10);
    const ventureName = "testing data10";
    
    // 1. Create/Update 5 Users
    const users = [];
    for (let i = 1; i <= 5; i++) {
        const email = `user${i}@gmail.com`;
        let user = await UserModel.findOne({ email });
        if (!user) {
            user = await UserModel.create({
                name: `User ${i}`,
                email: email,
                password_hash: passwordHash,
                phone: `123456789${i}`,
            });
            // console.log(`Created user: ${email}`);
        } else {
            user.password_hash = passwordHash;
            await user.save();
            // console.log(`Updated user: ${email}`);
        }
        users.push(user);
    }

    // 2. Create/Update Venture
    let venture = await VentureModel.findOne({ name: ventureName });
    const ventureData = {
        name: ventureName,
        monthly_emi: 10000,
        interest_rate: 2,
        start_date: new Date("2025-10-01"),
        collection_date: 5,
        max_loan_amount: 500000,
        loan_repayment_percent: 10,
        members: users.map((u) => ({ user_id: u._id, role: "ADMIN" })),
        created_by: users[0]._id.toString(),
        status: "active",
    };

    if (!venture) {
        venture = await VentureModel.create({ ...ventureData, fund_wallet: 0 });
        // console.log(`Created venture: ${ventureName}`);
    } else {
        await VentureModel.findByIdAndUpdate(venture._id, ventureData);
        // console.log(`Updated venture: ${ventureName}`);
    }

    const vcId = venture._id;
    const startYear = 2025;
    const startMonth = 10;
    const monthsToCreate = 5;

    let previousMonthRemaining = 0;
    const userLoanState = {};
    users.forEach(u => userLoanState[u._id.toString()] = { remaining_loan: 0, original_loan: 0 });

    // 3. Clear existing data for these months to avoid duplicates or inconsistent states
    // console.log('Cleaning up existing monthly data...');
    for (let m = 0; m < monthsToCreate; m++) {
        const d = new Date(startYear, startMonth - 1 + m, 1);
        await VcUserMonthlyModel.deleteMany({ vc_id: vcId, month: d.getMonth() + 1, year: d.getFullYear() });
        await VcMonthlyModel.deleteMany({ vc_id: vcId.toString(), month: d.getMonth() + 1, year: d.getFullYear() });
    }

    // console.log('Seeding 5 months of records...');
    for (let m = 0; m < monthsToCreate; m++) {
        const currentIterDate = new Date(startYear, startMonth - 1 + m, 1);
        const month = currentIterDate.getMonth() + 1;
        const year = currentIterDate.getFullYear();

        const loansThisMonth = [];
        const loanMapForMonth = {};

        // Fixed Loan Schedule
        if (m === 0) loanMapForMonth[users[1]._id.toString()] = 50000; 
        if (m === 1) loanMapForMonth[users[2]._id.toString()] = 80000;
        if (m === 2) loanMapForMonth[users[3]._id.toString()] = 30000;
        if (m === 3) loanMapForMonth[users[4]._id.toString()] = 60000;

        let totalMonthlyContribution = 0;
        let totalLoanRepayment = 0;
        let totalLoanVyaj = 0;
        let totalLoanGivenOut = 0;

        for (const user of users) {
            const userIdStr = user._id.toString();
            const newLoanAmount = loanMapForMonth[userIdStr] || 0;
            
            if (newLoanAmount > 0) {
                userLoanState[userIdStr].original_loan = newLoanAmount;
                userLoanState[userIdStr].remaining_loan = newLoanAmount;
                loansThisMonth.push({ user_id: userIdStr, loan_amount: newLoanAmount });
                totalLoanGivenOut += newLoanAmount;
            }

            const startOfMonthDebt = newLoanAmount > 0 ? 0 : userLoanState[userIdStr].remaining_loan;

            let loanInterest = 0;
            let loanEmi = 0;

            if (startOfMonthDebt > 0) {
                loanInterest = Math.round(startOfMonthDebt * 0.02);
                const standardEmi = Math.round(userLoanState[userIdStr].original_loan * 0.1);
                loanEmi = Math.min(standardEmi, startOfMonthDebt);
            }

            const monthlyContribution = 10000;
            const totalPayable = monthlyContribution + loanInterest + loanEmi;

            userLoanState[userIdStr].remaining_loan -= loanEmi;
            
            await VcUserMonthlyModel.create({
                vc_id: vcId,
                user_id: user._id,
                month,
                year,
                monthly_contribution: monthlyContribution,
                loan_amount: newLoanAmount,
                last_month_remaining_loan: startOfMonthDebt,
                loan_interest: loanInterest,
                loan_monthly_emi: loanEmi,
                part_payment: 0,
                remaining_loan: userLoanState[userIdStr].remaining_loan,
                total_payable: totalPayable,
                status: "approved",
                paid_at: new Date(year, month - 1, 5)
            });

            // console.log(`  - Created UserMonthly for ${userIdStr}`);
            totalMonthlyContribution += monthlyContribution;
            totalLoanRepayment += loanEmi;
            totalLoanVyaj += loanInterest;
        }

        const totalCollections = totalMonthlyContribution + totalLoanRepayment + totalLoanVyaj;
        const monthEndBalance = Math.round((previousMonthRemaining + totalCollections - totalLoanGivenOut) * 100) / 100;

        // console.log(`  - Month ${month} totals: Contrib=${totalMonthlyContribution}, Repay=${totalLoanRepayment}, Vyaj=${totalLoanVyaj}, GivenOut=${totalLoanGivenOut}`);

        await VcMonthlyModel.create({
            vc_id: vcId.toString(),
            month,
            year,
            last_month_remaining_amount: previousMonthRemaining,
            total_monthly_contribution: totalMonthlyContribution,
            total_loan_repayment: totalLoanRepayment,
            total_part_payment: 0,
            total_loan_vyaj: totalLoanVyaj,
            loans: loansThisMonth,
            remaining_amount: monthEndBalance,
            total: previousMonthRemaining + totalCollections,
            lock: m === monthsToCreate - 1 ? false : true // Unlock only the last month
        });

        // console.log(`Seeded Month ${month}/${year} | Balance: ₹${monthEndBalance}`);
        previousMonthRemaining = monthEndBalance;
    }

    await VentureModel.findByIdAndUpdate(vcId, { fund_wallet: previousMonthRemaining });
    console.log('\nSeeding Successful!');
    console.log(`Venture ID: ${vcId}`);
    // console.log('Users: user1@gmail.com to user5@gmail.com (Pass: 123456)');

  } catch (err) {
    console.error('Seeding Failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

seed();
