import { NextResponse } from "next/server";
import { dbConnect } from "@/db.config/dbconnection";
import VentureModel from "@/models/venture.model";
import VcMembershipModel from "@/models/vc-membership.model";
import MonthlyContributionModel, {
  ContributionStatus,
} from "@/models/monthly-contribution.model";

/**
 * Cron API: Generate monthly contributions for all members
 *
 * This API should be called at the start of each month (via Vercel Cron, external cron service, etc.)
 * It creates PENDING contribution entries for all members of all active ventures
 *
 * Security: Uses a secret key to prevent unauthorized access
 */
export async function POST(req: Request) {
  try {
    await dbConnect();

    // ✅ Verify cron secret (to prevent unauthorized access)
    const { searchParams } = new URL(req.url);
    const cronSecret = searchParams.get("secret");

    if (cronSecret !== process.env.CRON_SECRET) {
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
      // Get all members of this venture
      const memberships = await VcMembershipModel.find({
        vc_id: venture._id.toString(),
      });

      // Create contribution entry for each member
      for (const membership of memberships) {
        try {
          // Check if contribution already exists for this month
          const existingContribution = await MonthlyContributionModel.findOne({
            vc_id: venture._id,
            user_id: membership.user_id,
            month: currentMonth,
            year: currentYear,
          });

          if (existingContribution) {
            totalSkipped++;
            continue; // Skip if already exists
          }

          // Create new contribution entry
          await MonthlyContributionModel.create({
            vc_id: venture._id,
            user_id: membership.user_id.toString(),
            amount: venture.monthly_contribution,
            month: currentMonth,
            year: currentYear,
            status: ContributionStatus.PENDING,
          });

          totalCreated++;
        } catch (err) {
          errors.push(
            `Failed for user ${membership.user_id} in venture ${venture._id}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Monthly contributions generated for ${currentMonth}/${currentYear}`,
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

// GET: Check cron status or manually trigger (for testing)
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

    const totalPending = await MonthlyContributionModel.countDocuments({
      month: currentMonth,
      year: currentYear,
      status: ContributionStatus.PENDING,
    });

    const totalPaid = await MonthlyContributionModel.countDocuments({
      month: currentMonth,
      year: currentYear,
      status: ContributionStatus.PAID,
    });

    return NextResponse.json({
      success: true,
      month: currentMonth,
      year: currentYear,
      stats: {
        pending: totalPending,
        paid: totalPaid,
        total: totalPending + totalPaid,
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
