import { NextResponse } from "next/server";
import { dbConnect } from "@/db.config/dbconnection";
import VentureModel from "@/models/venture.model";

import VcUserMonthlyModel from "@/models/vc-user-monthly";

/**
 * Cron API: Generate monthly user logs
 */
export async function POST(req: Request) {
  try {
    await dbConnect();

    // ✅ Verify cron secret
    const { searchParams } = new URL(req.url);
    const cronSecret = searchParams.get("secret");
    const authHeader = req.headers.get("authorization");

    const isValid =
      cronSecret === process.env.CRON_SECRET ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // ✅ Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // ✅ Get all active ventures
    const ventures = await VentureModel.find({ status: "active" });

    if (ventures.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active ventures found",
        created: 0,
      });
    }

    let totalCreated = 0;
    let totalSkipped = 0;
    const errors: string[] = [];

    // ✅ Loop through each venture
    for (const venture of ventures) {
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
          const previousYear =
            currentMonth === 1 ? currentYear - 1 : currentYear;

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

          let remainingLoan = 0;

          // If there was a loan from previous month, continue tracking it
          if (previousRecord && previousRecord.remaining_loan > 0) {
            remainingLoan = previousRecord.remaining_loan;
            loanAmount = remainingLoan;

            // Interest Calculation (Remaining Loan * Rate%)
            const interestAmount =
              (remainingLoan * (venture.interest_rate || 0)) / 100;
            const repaymentAmount =
              (remainingLoan * (venture.loan_repayment_percent || 0)) / 100;

            loanInterest = interestAmount;
            loanMonthlyEmi = interestAmount + repaymentAmount;
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

            remaining_loan: remainingLoan,
            total_payable: totalPayable,
          });

          totalCreated++;
        } catch (err) {
          errors.push(
            `Failed for user ${member.user_id} in venture ${venture._id}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Monthly logs generated for ${currentMonth}/${currentYear}`,
      created: totalCreated,
      skipped: totalSkipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("Cron error:", err);
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

// GET: Check stats
export async function GET(req: Request) {
  try {
    await dbConnect();

    // ✅ Verify cron secret
    const { searchParams } = new URL(req.url);
    const cronSecret = searchParams.get("secret");

    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const totalLogs = await VcUserMonthlyModel.countDocuments({
      month: currentMonth,
      year: currentYear,
    });

    return NextResponse.json({
      success: true,
      month: currentMonth,
      year: currentYear,
      stats: {
        total_logs: totalLogs,
      },
    });
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
