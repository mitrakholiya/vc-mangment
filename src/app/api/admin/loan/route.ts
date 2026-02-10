import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { dbConnect } from "@/db.config/dbconnection";
import VentureModel from "@/models/venture.model";
import VcUserMonthlyModel from "@/models/vc-user-monthly";
import VcMonthlyModel, { IVcMonthlyLoan } from "@/models/vc_monthly.model";

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
}

interface Loan {
  id: string;
  amount: number;
}

// POST: Take a loan - updates vc-user-monthly and venture fund_wallet
export async function POST(req: Request) {
  try {
    await dbConnect();

    // ✅ Get token safely
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // ✅ Verify token
    let decoded: CustomJwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as CustomJwtPayload;
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 },
      );
    }

    const { loan, vc_id } = await req.json();

    // console.log(loan);

    // ✅ Validate input
    if (!loan) {
      return NextResponse.json(
        { success: false, message: "Missing or invalid required fields" },
        { status: 400 },
      );
    }

    // ✅ Check if venture exists
    const venture = await VentureModel.findById(vc_id);
    if (!venture) {
      return NextResponse.json(
        { success: false, message: "Venture not found" },
        { status: 404 },
      );
    }

    // Check Is Admin
    const isAdmin = venture.created_by.toString() === decoded.userId;
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "You are not authorized to take a loan" },
        { status: 403 },
      );
    }

    // ✅ Validate loan amount against max limit

    // ✅ Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // ✅ Find or create current month's user record

    // ✅ Iterate over loan object entries
    // loan is { "vcUserMonthlyId": "amount", ... }

    let totalDisbursed = 0;

    for (const [recordId, amountStr] of Object.entries(loan)) {
      const amount = Number(amountStr);
      if (isNaN(amount) || amount <= 0) continue;

      if (amount > venture.max_loan_amount) {
        return NextResponse.json(
          { success: false, message: "Insufficient funds" },
          { status: 200 },
        );
      }

      let userMonthlyRecord = await VcUserMonthlyModel.findById(recordId);

      if (!userMonthlyRecord) {
        console.warn(`User monthly record not found for ID: ${recordId}`);
        continue;
      }

      // 1. Update CURRENT Month Record (Disbursement)
      // Per request: Do NOT add to current month loan_amount or remaining_loan.
      // We skip updating userMonthlyRecord details for the loan.

      // 2. Update/Create NEXT Month Record (Repayment Schedule)
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

      let nextMonthRecord = await VcUserMonthlyModel.findOne({
        vc_id: userMonthlyRecord.vc_id,
        user_id: userMonthlyRecord.user_id,
        month: nextMonth,
        year: nextYear,
      });

      const interest = (amount * venture.interest_rate) / 100;
      const emi = (amount * venture.loan_repayment_percent) / 100;

      if (!nextMonthRecord) {
        // Create new record for next month
        // Balance = Current Remaining + New Loan Amount
        const openingBalance = userMonthlyRecord.remaining_loan || 0;
        const newBalance = openingBalance + amount;

        const newInterest = (newBalance * venture.interest_rate) / 100;
        const newEmi = (newBalance * venture.loan_repayment_percent) / 100;

        nextMonthRecord = new VcUserMonthlyModel({
          vc_id: userMonthlyRecord.vc_id,
          user_id: userMonthlyRecord.user_id,
          month: nextMonth,
          year: nextYear,
          monthly_contribution: userMonthlyRecord.monthly_contribution,
          loan_amount: newBalance, // Set total outstanding for next month
          loan_interest: newInterest,
          loan_monthly_emi: newEmi,

          remaining_loan: newBalance, // Set total outstanding
          total_payable:
            userMonthlyRecord.monthly_contribution + newEmi + newInterest,
          status: "none",
        });
      } else {
        // Update existing next month record by ADDING new loan
        // Since current month is not updated, we can't sync. We must add.
        nextMonthRecord.loan_amount =
          (nextMonthRecord.loan_amount || 0) + amount;
        nextMonthRecord.remaining_loan =
          (nextMonthRecord.remaining_loan || 0) + amount;

        nextMonthRecord.loan_interest =
          (nextMonthRecord.loan_interest || 0) + interest;
        nextMonthRecord.loan_monthly_emi =
          (nextMonthRecord.loan_monthly_emi || 0) + emi;
        nextMonthRecord.total_payable =
          (nextMonthRecord.total_payable || 0) + emi + interest;
      }

      await nextMonthRecord.save();
      totalDisbursed += amount;
    }

    // ✅ Deduct from venture fund wallet
    venture.fund_wallet = (venture.fund_wallet || 0) - totalDisbursed;
    await venture.save();

    // ✅ Update VcMonthly Entry
    let vcMonthly = await VcMonthlyModel.findOne({
      vc_id,
      month: currentMonth,
      year: currentYear,
    });

    if (!vcMonthly) {
      // Create new VcMonthly if it doesn't exist
      const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      const previousMonthSummary = await VcMonthlyModel.findOne({
        vc_id,
        month: previousMonth,
        year: previousYear,
      });

      vcMonthly = new VcMonthlyModel({
        vc_id,
        month: currentMonth,
        year: currentYear,
        last_month_remaining_amount:
          previousMonthSummary?.remaining_amount || 0,
        total_monthly_contribution: 0,
        total_loan_repayment: 0,
        total_part_payment: 0,
        total_loan_vyaj: 0,
        loans: [],
      });
    }

    // Update or add loans to the loans array (accumulate amounts)
    for (const [recordId, amountStr] of Object.entries(loan)) {
      const amount = Number(amountStr);
      if (isNaN(amount) || amount <= 0) continue;

      const userMonthlyRecord = await VcUserMonthlyModel.findById(recordId);
      if (userMonthlyRecord) {
        const userId = userMonthlyRecord.user_id.toString();

        // Find existing loan entry for this user
        const existingLoanIndex = vcMonthly.loans.findIndex(
          (l: any) => l.user_id.toString() === userId,
        );

        if (existingLoanIndex >= 0) {
          // Update existing loan amount (accumulate)
          vcMonthly.loans[existingLoanIndex].loan_amount += amount;
        } else {
          // Add new loan entry
          vcMonthly.loans.push({
            user_id: userMonthlyRecord.user_id,
            loan_amount: amount,
          });
        }
      }
    }

    // Recalculate totals from all user records
    const allUserRecords = await VcUserMonthlyModel.find({
      vc_id,
      month: currentMonth,
      year: currentYear,
    });

    // Calculate total monthly contributions from approved/paid records
    vcMonthly.total_monthly_contribution = allUserRecords
      .filter((r: any) => r.status === "approved" || r.status === "paid")
      .reduce((sum: number, r: any) => sum + (r.monthly_contribution || 0), 0);

    // Calculate total loan repayments (EMI paid)
    vcMonthly.total_loan_repayment = allUserRecords
      .filter((r: any) => r.status === "approved" || r.status === "paid")
      .reduce((sum: number, r: any) => sum + (r.loan_monthly_emi || 0), 0);

    // Calculate total loan interest (Interest paid)
    vcMonthly.total_loan_vyaj = allUserRecords
      .filter((r: any) => r.status === "approved" || r.status === "paid")
      .reduce((sum: number, r: any) => sum + (r.loan_interest || 0), 0);

    // Save VcMonthly (pre-save hook will calculate total and remaining_amount)
    await vcMonthly.save();

    return NextResponse.json(
      {
        success: true,
        message: "Loan disbursed successfully",
        data: {},
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Server error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
