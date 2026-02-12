import { NextResponse } from "next/server";
import { dbConnect } from "@/db.config/dbconnection";
import VentureModel from "@/models/venture.model";
import VcUserMonthlyModel from "@/models/vc-user-monthly";
import VcMonthlyModel from "@/models/vc_monthly.model";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const { vc_id, user_id } = await req.json();

    if (!vc_id || !user_id) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    await dbConnect();

    const venture = await VentureModel.findById(vc_id);
    if (!venture) {
      return NextResponse.json(
        { success: false, message: "Venture not found" },
        { status: 404 },
      );
    }

    // 1. Get all monthly records for this user in this venture
    //done
    const userMonthlyRecords = await VcUserMonthlyModel.find({
      vc_id,
      user_id,
    });

    if (!userMonthlyRecords.length) {
      return NextResponse.json(
        { success: false, message: "No records found for this user" },
        { status: 404 },
      );
    }

    // 2. Calculate Total Contribution (Hapto) by User
    // done
    let totalContribution = 0;

    userMonthlyRecords.forEach((record) => {
      if (record.status === "approved") {
        totalContribution += record.monthly_contribution || 0;
      }
    });

    console.log(totalContribution, "totalContribution");
    // 3. Calculate Share of Interest (Vyaj)
    // Formula: Sum of (Monthly Total Loan Vyaj / Total Members) for each month user was active
    let totalInterestShare = 0;

    // To optimize, fetch all relevant VcMonthly records in one go
    // We need records matching the months/years where user contributed
    const monthlyQuery = userMonthlyRecords.map((r) => ({
      vc_id: r.vc_id,
      month: r.month,
      year: r.year,
    }));

    // Or simply fetch all monthly summaries for this VC, filtering in memory might be acceptable if not huge
    // Better to query specifically if possible, but $or query can get large.
    // Let's fetch all VC monthly records to be safe and accurate with month matching.
    const allVcMonthlyRecords = await VcMonthlyModel.find({
      $or: monthlyQuery,
    });

    console.log(allVcMonthlyRecords);

    // Map for quick lookup: "year-month" -> total_loan_vyaj
    const vcMonthlyMap = new Map<string, number>();
    allVcMonthlyRecords.forEach((m) => {
      vcMonthlyMap.set(`${m.year}-${m.month}`, m.total_loan_vyaj || 0);
    });

    const activeMemberCount = venture.members.length;
    // Note: Ideally, member count should be historical per month, but assuming current count for simplicity
    // or if the logic implies "current members share historical profit".
    // User requested logic: vyaj / vc.member.size

    userMonthlyRecords.forEach((record) => {
      const key = `${record.year}-${record.month}`;
      const monthlyVyaj = vcMonthlyMap.get(key) || 0;

      // Preventing division by zero
      if (activeMemberCount > 0) {
        totalInterestShare += monthlyVyaj / activeMemberCount;
      }
    });

    // 4. Get Current Remaining Loan (Debt)
    // The user's debt is the remaining_loan from their LAST record
    // We sort records to find the latest one, just in case they aren't sorted
    userMonthlyRecords.sort((a, b) => {
      // Sort by Year then Month ascending
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    // Last record holds the current status
    const lastRecord = userMonthlyRecords[userMonthlyRecords.length - 1];
    const currentRemainingLoan = lastRecord.remaining_loan || 0;

    // 5. Final Calculation
    // Amount = Total Contribution + Share of Interest - Remaining Loan
    const payableAmount =
      totalContribution + totalInterestShare - currentRemainingLoan;

    // Round to 2 decimal places
    const finalAmount = Math.round(payableAmount * 100) / 100;

    // ----------------------------done ------------------------------------------------------------------------------
    // 6. Update Venture Model with Exit Pending Status
    // Defined in previous user step: Exit_Pending array in VentureModel

    // 6. Check Funds and Process Exit

    // Unified Exit Processing Logic
    // We now handle both Positive (VC pays User) and Negative (User owes VC) flows together below.

    // Get latest monthly record to process funds
    const latestVcMonthly = await VcMonthlyModel.findOne({ vc_id }).sort({
      year: -1,
      month: -1,
    });

    if (!latestVcMonthly) {
      return NextResponse.json(
        {
          success: false,
          message: "No monthly record found to process funds.",
        },
        { status: 400 },
      );
    }

    // Calculate what can be paid immediately
    const availableFunds = latestVcMonthly.remaining_amount || 0;

    // Determine payment and pending amounts
    let paymentAmount = 0;
    let pendingAmount = 0;

    if (finalAmount < 0) {
      // User owes money to VC
      paymentAmount = finalAmount; // Negative amount
      pendingAmount = 0; // Or whatever logic you have for pending debt
    } else {
      // VC pays User (positive finalAmount)
      if (availableFunds >= finalAmount) {
        // Sufficient funds
        paymentAmount = finalAmount;
        pendingAmount = 0;
      } else {
        // Insufficient funds - Pay what is available, rest is pending
        paymentAmount = availableFunds; // Deplete wallet (positive amount)
        pendingAmount = Math.round((finalAmount - availableFunds) * 100) / 100;
      }
    }

    // 7. Execute Updates

    // A. Update Monthly Record (Deduct Money)
    // We treat the exit payment as a "loan" (money out) in the current month to balance the books
    // A. Update Monthly Record (Deduct Money)
    // We treat the exit payment as a "loan" (money out) in the current month to balance the books
    let shouldSaveMonthly = false;
    latestVcMonthly.exiting_members.push({
      user_id: user_id,
      total_monthly_contribution: totalContribution,
      remaning_loan: currentRemainingLoan,
      total_vyaj: Math.round(totalInterestShare * 100) / 100,
      total: finalAmount,
      total_paid: paymentAmount,
    });
    shouldSaveMonthly = true;

    if (shouldSaveMonthly) {
      await latestVcMonthly.save(); // This triggers pre-save hook to update remaining_amount
    }

    // B. Update Venture (Remove Member and Add Pending if needed)
    console.log(`Processing Venture Update for VC: ${vc_id}, User: ${user_id}`);

    // Explicitly convert user_id to ObjectId for accurate array operations
    const userObjectId = new mongoose.Types.ObjectId(user_id);

    const updateQuery: any = {
      $pull: { members: { user_id: userObjectId } },
    };

    if (finalAmount < 0) {
      // User owes money - add full debt to pending
      console.log(
        `Triggering $push to Exit_Pending for user ${user_id} with DEBT amount: ${Math.abs(finalAmount)}`,
      );
      updateQuery.$push = {
        exiting_panding: {
          user_id: userObjectId,
          amount: Math.abs(finalAmount), // Store as positive debt value
        },
      };
    } else if (pendingAmount > 0) {
      // VC owes User - add remaining unpaid amount to pending
      console.log(
        `Triggering $push to Exit_Pending for user ${user_id} with PENDING amount: ${pendingAmount}`,
      );
      updateQuery.$push = {
        exiting_panding: {
          user_id: userObjectId,
          amount: pendingAmount,
        },
      };
    }

    const updatedVenture = await VentureModel.findByIdAndUpdate(
      vc_id,
      updateQuery,
      { new: true },
    );

    console.log(
      "Update Result - exiting_panding count:",
      updatedVenture?.exiting_panding?.length,
    );
    console.log(
      "Update Result - exiting_panding data:",
      JSON.stringify(updatedVenture?.exiting_panding),
    );

    return NextResponse.json({
      success: true,
      message:
        pendingAmount > 0
          ? `Exit processed. Paid ₹${paymentAmount}. ₹${pendingAmount} added to pending list.`
          : `Exit processed successfully. Paid full amount ₹${paymentAmount}.`,
      data: {
        totalContribution,
        totalInterestShare: Math.round(totalInterestShare * 100) / 100,
        currentRemainingLoan,
        payableAmount: finalAmount,
        paidAmount: paymentAmount,
        pendingAmount: pendingAmount,
        walletBalance: availableFunds,
        status: pendingAmount > 0 ? "PARTIALLY_PAID" : "COMPLETED",
      },
    });
  } catch (error: any) {
    console.error("Error processing exit:", error);
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vc_id = searchParams.get("vc_id");
    const user_id = searchParams.get("user_id");

    if (!vc_id || !user_id) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    await dbConnect();

    // 1. Get Venture
    const venture = await VentureModel.findById(vc_id);
    if (!venture) {
      return NextResponse.json(
        { success: false, message: "Venture not found" },
        { status: 404 },
      );
    }

    // 2. Get all monthly records for this user
    const userMonthlyRecords = await VcUserMonthlyModel.find({
      vc_id,
      user_id,
    });

    if (!userMonthlyRecords.length) {
      // If user joined recently and has no records, everything is 0
      return NextResponse.json({
        success: true,
        message: "No financial records found, possibly a new member.",
        data: {
          totalContribution: 0,
          totalInterestShare: 0,
          currentRemainingLoan: 0,
          payableAmount: 0,
          walletBalance: 0,
          canPayImmediately: false,
          userRecords: [],
        },
      });
    }

    // 3. Calculate Total Contribution (Hapto)
    let totalContribution = 0;

    userMonthlyRecords.forEach((record) => {
      if (record.status === "approved") {
        totalContribution += record.monthly_contribution || 0;
      }
    });

    // 4. Calculate Share of Interest (Vyaj)
    let totalInterestShare = 0;

    const monthlyQuery = userMonthlyRecords.map((r) => ({
      vc_id: r.vc_id,
      month: r.month,
      year: r.year,
    }));

    const allVcMonthlyRecords = await VcMonthlyModel.find({
      $or: monthlyQuery,
    });

    const vcMonthlyMap = new Map<string, number>();

    allVcMonthlyRecords.forEach((m) => {
      vcMonthlyMap.set(`${m.year}-${m.month}`, m.total_loan_vyaj || 0);
    });

    //  ALL Month total Vyaj is fetcheing Perfectly
    // ----------------------------done ----------------------------

    const activeMemberCount = venture.members.length;

    userMonthlyRecords.forEach((record) => {
      const key = `${record.year}-${record.month}`;
      const monthlyVyaj = vcMonthlyMap.get(key) || 0;
      if (activeMemberCount > 0) {
        totalInterestShare += monthlyVyaj / activeMemberCount;
      }
    });

    // ----------------------------done ----------------------------

    // 5. Get Current Remaining Loan
    userMonthlyRecords.sort((a, b) => {
      // Sort Year/Month asc
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    const lastRecord = userMonthlyRecords[userMonthlyRecords.length - 1];
    const currentRemainingLoan = lastRecord.remaining_loan || 0;

    // 6. Final Calculation
    const payableAmount =
      totalContribution + totalInterestShare - currentRemainingLoan;
    const finalAmount = Math.round(payableAmount * 100) / 100;

    // 7. Check Funds
    const latestVcMonthly = await VcMonthlyModel.findOne({ vc_id }).sort({
      year: -1,
      month: -1,
    });

    const currentRemainingAmount = latestVcMonthly?.remaining_amount || 0;
    const hasEnoughFunds = currentRemainingAmount >= finalAmount;

    return NextResponse.json({
      success: true,
      message: "Exit calculation retrieved successfully",
      data: {
        totalContribution,
        totalInterestShare: Math.round(totalInterestShare * 100) / 100,
        currentRemainingLoan,
        payableAmount: finalAmount,
        walletBalance: currentRemainingAmount,
        canPayImmediately: hasEnoughFunds,
        // Optionally send back simplified history for display
        // userRecords: userMonthlyRecords
      },
    });
  } catch (error: any) {
    console.error("Error fetching exit calculation:", error);
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 },
    );
  }
}
