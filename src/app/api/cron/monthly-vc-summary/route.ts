import { NextResponse } from "next/server";
import { dbConnect } from "@/db.config/dbconnection";
import VentureModel from "@/models/venture.model";
import VcMonthlyModel from "@/models/vc_monthly.model";

import VcUserMonthlyModel from "@/models/vc-user-monthly";

/**
 * Cron API: Generate monthly VC summaries
 *
 * This API should be called at the end of each month (via Vercel Cron, external cron service, etc.)
 * It creates monthly summary records for all active ventures, aggregating:
 * - Total monthly contributions (paid only)
 * - Total loan repayments
 * - Total part payments
 * - Loans disbursed during the month
 * - Remaining amount calculation
 *
 * Security: Uses a secret key to prevent unauthorized access
 */
export async function POST(req: Request) {
  try {
    await dbConnect();

    // ✅ Verify cron secret (Supports both Vercel Cron Header and Query Param)
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

    // ✅ Loop through each venture to generate monthly summary
    for (const venture of ventures) {
      try {
        // Check if summary already exists for this month
        const existingSummary = await VcMonthlyModel.findOne({
          vc_id: venture._id.toString(),
          month: currentMonth,
          year: currentYear,
        });

        if (existingSummary) {
          totalSkipped++;
          continue; // Skip if already exists
        }

        // ✅ Get previous month's remaining amount
        const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

        const previousMonthSummary = await VcMonthlyModel.findOne({
          vc_id: venture._id.toString(),
          month: previousMonth,
          year: previousYear,
        });

        const lastMonthRemaining = previousMonthSummary?.remaining_amount || 0;

        // ✅ Calculate total monthly contributions (PAID only)
        const paidContributions = await VcUserMonthlyModel.find({
          vc_id: venture._id.toString(),
          month: currentMonth,
          year: currentYear,
          contribution_status: "PAID",
        });

        const totalMonthlyContribution = paidContributions.reduce(
          (sum: number, contribution: any) =>
            sum + contribution.monthly_contribution,
          0,
        );

        // ✅ Calculate total loan repayments for this month
        // Get all user monthly records for this VC and month
        const userMonthlyRecords = await VcUserMonthlyModel.find({
          vc_id: venture._id.toString(),
          month: currentMonth,
          year: currentYear,
        });

        // Sum up total loan repayments (loan_paid_amount) from all users
        const totalLoanRepayment = userMonthlyRecords.reduce(
          (sum: number, record: any) =>
            record.status === "paid" || record.status === "approved"
              ? sum + (record.loan_monthly_emi || 0)
              : sum,
          0,
        );

        // ✅ Calculate total part payments (if you have a part payment system)
        // For now, setting to 0 - update this if you have part payment tracking
        const totalPartPayment = 0;

        // ✅ Get all loans disbursed during this month
        // Loans are tracked in user monthly records with loan_amount > 0
        const loansThisMonth = userMonthlyRecords.filter(
          (record: (typeof userMonthlyRecords)[0]) => record.loan_amount > 0,
        );

        const loans = loansThisMonth.map(
          (record: (typeof loansThisMonth)[0]) => ({
            user_id: record.user_id,
            loan_amount: record.loan_amount,
          }),
        );

        // ✅ Create monthly summary
        // Note: total and remaining_amount will be calculated by the pre-save hook
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

        await monthlySummary.save();

        totalCreated++;
      } catch (err) {
        errors.push(
          `Failed for venture ${venture._id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Monthly VC summaries generated for ${currentMonth}/${currentYear}`,
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

// GET: Check cron status or view current month summary
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

    // Get current month stats
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const summaries = await VcMonthlyModel.find({
      month: currentMonth,
      year: currentYear,
    });

    const totalVCs = summaries.length;
    const totalContributions = summaries.reduce(
      (sum: number, s: (typeof summaries)[0]) =>
        sum + s.total_monthly_contribution,
      0,
    );
    const totalLoansGiven = summaries.reduce(
      (sum: number, s: (typeof summaries)[0]) =>
        sum +
        s.loans.reduce(
          (ls: number, l: (typeof s.loans)[0]) => ls + l.loan_amount,
          0,
        ),
      0,
    );
    const totalRemaining = summaries.reduce(
      (sum: number, s: (typeof summaries)[0]) => sum + s.remaining_amount,
      0,
    );

    return NextResponse.json({
      success: true,
      month: currentMonth,
      year: currentYear,
      stats: {
        total_vcs: totalVCs,
        total_contributions: totalContributions,
        total_loans_given: totalLoansGiven,
        total_remaining: totalRemaining,
      },
      summaries: summaries,
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
