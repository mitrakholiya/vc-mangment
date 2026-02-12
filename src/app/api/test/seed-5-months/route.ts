import { NextResponse } from "next/server";
import { dbConnect } from "@/db.config/dbconnection";
import UserModel from "@/models/user.model";
import VentureModel from "@/models/venture.model";
import VcUserMonthlyModel from "@/models/vc-user-monthly";
import VcMonthlyModel from "@/models/vc_monthly.model";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const passwordHash = await bcrypt.hash("123456", 10);
    const users = [];

    // 1. Create/Update 5 Users with fixed emails
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
      } else {
        // Update existing user to ensure password is reset
        user.password_hash = passwordHash;
        await user.save();
      }
      users.push(user);
    }

    // 2. Create/Update Venture
    const ventureName = "Testing009";
    let venture = await VentureModel.findOne({ name: ventureName });

    const ventureData = {
      name: ventureName,
      monthly_emi: 10000,
      interest_rate: 2,
      start_date: new Date("2025-10-01"),
      collection_date: 5,
      max_loan_amount: 500000,
      loan_repayment_percent: 10,
      members: users.map((u) => ({
        user_id: u._id,
        role: "ADMIN", // Everyone is Admin as requested
      })),
      created_by: users[0]._id, // user1 is creator
      status: "active",
    };

    if (!venture) {
      venture = await VentureModel.create({ ...ventureData, fund_wallet: 0 });
    } else {
      await VentureModel.findByIdAndUpdate(venture._id, ventureData);
    }

    const vcId = venture._id;
    const now = new Date();
    // Start exactly 4 months ago to land on Feb 2026 if it's currently Feb
    // Fixed start for stability: Oct 2025
    const startYear = 2025;
    const startMonth = 10;
    const monthsToCreate = 5;

    let previousMonthRemaining = 0;

    // Track loan state for each user
    const userLoanState: {
      [key: string]: { remaining_loan: number; original_loan: number };
    } = {};
    users.forEach((u) => {
      userLoanState[u._id.toString()] = { remaining_loan: 0, original_loan: 0 };
    });

    // 3. Create/Update 5 Month Data
    for (let m = 0; m < monthsToCreate; m++) {
      const currentIterDate = new Date(startYear, startMonth - 1 + m, 1);
      const month = currentIterDate.getMonth() + 1;
      const year = currentIterDate.getFullYear();

      const loansThisMonth: any[] = [];
      const loanMapForMonth: { [key: string]: number } = {};

      // Prepare Loans (Fixed schedule)
      if (m === 0) loanMapForMonth[users[1]._id.toString()] = 50000; // user2
      if (m === 1) loanMapForMonth[users[2]._id.toString()] = 80000; // user3
      if (m === 2) loanMapForMonth[users[3]._id.toString()] = 30000; // user4
      if (m === 3) loanMapForMonth[users[4]._id.toString()] = 60000; // user5

      let totalMonthlyContribution = 0;
      let totalLoanRepayment = 0;
      let totalLoanVyaj = 0;
      let totalLoanGivenOut = 0;

      for (const user of users) {
        const userIdStr = user._id.toString();
        const newLoanAmount = loanMapForMonth[userIdStr] || 0;
        const isTakingLoan = newLoanAmount > 0;

        if (isTakingLoan) {
          userLoanState[userIdStr].original_loan = newLoanAmount;
          userLoanState[userIdStr].remaining_loan = newLoanAmount;
          loansThisMonth.push({
            user_id: userIdStr,
            loan_amount: newLoanAmount,
          });
          totalLoanGivenOut += newLoanAmount;
        }

        const startOfMonthDebt = isTakingLoan
          ? userLoanState[userIdStr].remaining_loan - newLoanAmount
          : userLoanState[userIdStr].remaining_loan;

        let loanInterest = 0;
        let loanEmi = 0;

        if (startOfMonthDebt > 0) {
          loanInterest = Math.round(startOfMonthDebt * 0.02);
          const standardEmi = Math.round(
            userLoanState[userIdStr].original_loan * 0.1,
          );
          loanEmi = Math.min(standardEmi, startOfMonthDebt);
        }

        const monthlyContribution = 10000;
        const totalPayable = monthlyContribution + loanInterest + loanEmi;

        userLoanState[userIdStr].remaining_loan -= loanEmi;
        const currentRemainingLoan = userLoanState[userIdStr].remaining_loan;

        totalMonthlyContribution += monthlyContribution;
        totalLoanRepayment += loanEmi;
        totalLoanVyaj += loanInterest;

        // Upsert VcUserMonthly
        await VcUserMonthlyModel.findOneAndUpdate(
          { vc_id: vcId, user_id: user._id, month, year },
          {
            monthly_contribution: monthlyContribution,
            loan_amount: newLoanAmount,
            last_month_remaining_loan: startOfMonthDebt,
            loan_interest: loanInterest,
            loan_monthly_emi: loanEmi,
            part_payment: 0,
            remaining_loan: currentRemainingLoan,
            total_payable: totalPayable,
            status: "approved",
            paid_at: new Date(year, month - 1, 5),
          },
          { upsert: true, new: true },
        );
      }

      // Upsert VcMonthly
      const vcMonthlyData = {
        last_month_remaining_amount: previousMonthRemaining,
        total_monthly_contribution: totalMonthlyContribution,
        total_loan_repayment: totalLoanRepayment,
        total_part_payment: 0,
        total_loan_vyaj: totalLoanVyaj,
        loans: loansThisMonth,
        exiting_members: [],
      };

      const existingVcMonthly = await VcMonthlyModel.findOne({
        vc_id: vcId.toString(),
        month,
        year,
      });
      if (existingVcMonthly) {
        Object.assign(existingVcMonthly, vcMonthlyData);
        await existingVcMonthly.save();
      } else {
        const newVcMonthly = new VcMonthlyModel({
          vc_id: vcId.toString(),
          month,
          year,
          ...vcMonthlyData,
        });
        await newVcMonthly.save();
      }

      const total =
        previousMonthRemaining +
        totalMonthlyContribution +
        totalLoanRepayment +
        totalLoanVyaj;
      previousMonthRemaining = total - totalLoanGivenOut;
    }

    await VentureModel.findByIdAndUpdate(vcId, {
      fund_wallet: previousMonthRemaining,
    });

    return NextResponse.json({
      success: true,
      message: "Seeding complete/updated",
      data: {
        ventureName: venture.name,
        vc_id: vcId,
        users: users.map((u) => ({ email: u.email, password: "123456" })),
      },
    });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json(
      { success: false, message: "Error seeding data", error: error.message },
      { status: 500 },
    );
  }
}
