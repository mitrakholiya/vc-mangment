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

    const { vc_id, loan_amount } = await req.json();

    // ✅ Validate input
    if (!vc_id || !loan_amount || loan_amount <= 0) {
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

    // ✅ Check if user is a member of this venture
    const isMember = venture.members.some(
      (member) => member.user_id.toString() === decoded.userId,
    );

    if (!isMember) {
      return NextResponse.json(
        { success: false, message: "You are not a member of this venture" },
        { status: 403 },
      );
    }

    // ✅ Validate loan amount against max limit
    if (loan_amount > venture.max_loan_amount) {
      return NextResponse.json(
        {
          success: false,
          message: `Loan amount exceeds maximum limit of ₹${venture.max_loan_amount.toLocaleString()}`,
        },
        { status: 400 },
      );
    }

    // ✅ Check if venture has sufficient funds
    if (loan_amount > venture.fund_wallet) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient funds in venture wallet. Available: ₹${venture.fund_wallet.toLocaleString()}`,
        },
        { status: 400 },
      );
    }

    // ✅ Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // ✅ Find or create current month's user record
    let userMonthlyRecord = await VcUserMonthlyModel.findOne({
      vc_id: vc_id,
      user_id: decoded.userId,
      month: currentMonth,
      year: currentYear,
    });

    if (!userMonthlyRecord) {
      // Create a new record for this month
      userMonthlyRecord = await VcUserMonthlyModel.create({
        vc_id: vc_id,
        user_id: decoded.userId,
        month: currentMonth,
        year: currentYear,
        monthly_contribution: venture.monthly_emi,
        loan_amount: loan_amount,
        loan_interest: (loan_amount * venture.interest_rate) / 100,
        loan_monthly_emi:
          (loan_amount * venture.interest_rate) / 100 +
          (loan_amount * venture.loan_repayment_percent) / 100,
        loan_paid_amount: 0,
        remaining_loan: loan_amount,
        total_payable:
          venture.monthly_emi +
          (loan_amount * venture.interest_rate) / 100 +
          (loan_amount * venture.loan_repayment_percent) / 100,
      });
    } else {
      // ✅ User exists: Increment loan amount (Top-up Loan)

      // Update existing record with new loan logic:
      // 1. Increase Principal (loan_amount)
      // 2. Increase Remaining Loan
      // 3. Recalculate Interest & EMI based on new Principal

      userMonthlyRecord.loan_amount += loan_amount;
      userMonthlyRecord.remaining_loan += loan_amount;

      // Recalculate derived fields based on new Total Principal
      const newPrincipal = userMonthlyRecord.loan_amount;

      userMonthlyRecord.loan_interest =
        (newPrincipal * venture.interest_rate) / 100;

      // EMI = Interest + Repayment Part (Fixed % of Principal)
      userMonthlyRecord.loan_monthly_emi =
        userMonthlyRecord.loan_interest +
        (newPrincipal * venture.loan_repayment_percent) / 100;

      userMonthlyRecord.total_payable =
        userMonthlyRecord.monthly_contribution +
        userMonthlyRecord.loan_monthly_emi;

      await userMonthlyRecord.save();
    }

    // ✅ Deduct from venture fund wallet
    venture.fund_wallet -= loan_amount;
    await venture.save();

    // ✅ Update VcMonthly (Venture's Monthly Summary)
    // We need to record this loan in the venture's monthly record
    let vcMonthlyRecord = await VcMonthlyModel.findOne({
      vc_id: vc_id,
      month: currentMonth,
      year: currentYear,
    });

    if (!vcMonthlyRecord) {
      // Create new monthly record if it doesn't exist
      // Note: Other fields safely default to 0
      vcMonthlyRecord = new VcMonthlyModel({
        vc_id: vc_id,
        month: currentMonth,
        year: currentYear,
        loans: [],
      });

      // If previous month exists, bring forward remaining amount
      const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const previousSummary = await VcMonthlyModel.findOne({
        vc_id: vc_id,
        month: previousMonth,
        year: previousYear,
      });

      if (previousSummary) {
        vcMonthlyRecord.last_month_remaining_amount =
          previousSummary.remaining_amount;
      }
    }

    // Check if user already has a loan entry in VcMonthly for this month
    const existingLoanIndex = vcMonthlyRecord.loans.findIndex(
      (l: IVcMonthlyLoan) => l.user_id === decoded.userId,
    );

    if (existingLoanIndex >= 0) {
      // ✅ User exists: Only increment amount
      vcMonthlyRecord.loans[existingLoanIndex].loan_amount += loan_amount;
    } else {
      // User doesn't exist: Push new object
      vcMonthlyRecord.loans.push({
        user_id: decoded.userId,
        loan_amount: loan_amount,
      });
    }

    // Save triggers pre-save hook which recalculates remaining_amount
    await vcMonthlyRecord.save();

    return NextResponse.json({
      success: true,
      message: `Loan of ₹${loan_amount.toLocaleString()} disbursed successfully`,
      data: {
        loan_amount: userMonthlyRecord.loan_amount,
        remaining_loan: userMonthlyRecord.remaining_loan,
        venture_fund_wallet: venture.fund_wallet,
        vc_monthly_remaining: vcMonthlyRecord.remaining_amount,
      },
      updated_models: ["Venture", "VcUserMonthly", "VcMonthly"],
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
