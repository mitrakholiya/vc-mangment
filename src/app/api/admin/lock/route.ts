import { NextResponse } from "next/server";
import { dbConnect } from "@/db.config/dbconnection";
import VentureModel from "@/models/venture.model";

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import VcUserMonthlyModel from "@/models/vc-user-monthly";
import VcMonthlyModel from "@/models/vc_monthly.model";
import UserModel from "@/models/user.model"; // Ensure User model is registered

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
}

export async function PUT(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!,
    ) as CustomJwtPayload;

    await dbConnect();

    // Verify ownership/admin status
    // Lock the current month
    const vcMonthly = await VcMonthlyModel.findByIdAndUpdate(
      id,
      { lock: true },
      { new: true },
    );

    if (!vcMonthly) {
      return NextResponse.json(
        { success: false, message: "vcMonthly not found" },
        { status: 404 },
      );
    }

    // Fetch Venture Details
    const venture = await VentureModel.findById(vcMonthly.vc_id);
    if (!venture) {
      return NextResponse.json(
        { success: false, message: "Venture not found" },
        { status: 404 },
      );
    }

    // Ensure User model is loaded
    await UserModel.findOne();

    // Determine Next Month
    const currentMonth = vcMonthly.month;
    const currentYear = vcMonthly.year;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    // Fetch current and next month data in parallel (faster!)
    let [currentVcMonthly, nextVcMonthly] = await Promise.all([
      VcMonthlyModel.findOne({
        vc_id: venture._id,
        month: currentMonth,
        year: currentYear,
      }),
      VcMonthlyModel.findOne({
        vc_id: venture._id,
        month: nextMonth,
        year: nextYear,
      }),
    ]);

    if (!nextVcMonthly) {
      nextVcMonthly = await VcMonthlyModel.create({
        vc_id: venture._id,
        month: nextMonth,
        year: nextYear,
        last_month_remaining_amount: vcMonthly.remaining_amount,
        total_monthly_contribution: 0,
        total_loan_repayment: 0,
        total_part_payment: 0,
        total_loan_vyaj: 0,
        lock: false,
        loans: [],
      });
    }

    // Create Next User Records
    for (const member of venture.members) {
      // Find current month user record to get remaining balance
      const currentRecord = await VcUserMonthlyModel.findOne({
        vc_id: venture._id,
        user_id: member.user_id,
        month: currentMonth,
        year: currentYear,
      });

      // If user take loan in current month

      let totalLoanAmount = currentRecord ? currentRecord.loan_amount : 0;

      console.log("totalLoanAmount", totalLoanAmount);
      // it add in total loan amount
      let loan = currentVcMonthly?.loans.find(
        (loan: { user_id: any; loan_amount: number }) =>
          loan.user_id.toString() === member.user_id.toString(),
      );

      totalLoanAmount += loan ? loan.loan_amount : 0;

      console.log("After New Loan Added", totalLoanAmount);

      const remainingLoan = currentRecord ? currentRecord.remaining_loan : 0;

      // Calculate Next Month Interest/EMI
      // Interest is on Remaining Loan
      const newInterest = (remainingLoan * venture.interest_rate) / 100;
      const newEmi = (remainingLoan * venture.loan_repayment_percent) / 100;

      // Ensure specific fields
      const monthlyContribution = venture.monthly_emi || 0;
      const totalPayable = monthlyContribution + newEmi + newInterest;

      // Check if next record exists
      const nextUserRecord = await VcUserMonthlyModel.findOne({
        vc_id: venture._id,
        user_id: member.user_id,
        month: nextMonth,
        year: nextYear,
      });

      if (!nextUserRecord) {
        await VcUserMonthlyModel.create({
          vc_id: venture._id,
          user_id: member.user_id,
          month: nextMonth,
          year: nextYear,
          monthly_contribution: monthlyContribution,
          loan_amount: totalLoanAmount || 0, // Persist Total Loan Amount
          loan_interest: newInterest,
          loan_monthly_emi: newEmi,
          remaining_loan: remainingLoan, // Opens with this balance
          last_month_remaining_loan: remainingLoan, // Balance from previous month
          total_payable: totalPayable,
          status: "none",
          part_payment: 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Month locked and next month data generated successfully",
      data: { vcMonthly, nextVcMonthly },
    });
  } catch (error: any) {
    console.error("Error managing request:", error);
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 },
    );
  }
}
