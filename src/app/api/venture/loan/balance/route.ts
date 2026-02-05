import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { dbConnect } from "@/db.config/dbconnection";
import LoanModel from "@/models/loan.model";
import LoanRepaymentModel from "@/models/loan-repayment.model";

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
}

// GET: Calculate loan balance details
export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const loan_id = searchParams.get("loan_id");

    if (!loan_id) {
      return NextResponse.json(
        { success: false, message: "Missing loan_id" },
        { status: 400 },
      );
    }

    // ✅ Find Loan
    const loan = await LoanModel.findById(loan_id);
    if (!loan) {
      return NextResponse.json(
        { success: false, message: "Loan not found" },
        { status: 404 },
      );
    }

    // ✅ Calculate Total Repaid Principal
    const repayments = await LoanRepaymentModel.find({ loan_id });

    // Sum of principal_amount from all repayments
    const totalPaidPrincipal = repayments.reduce(
      (sum, record) => sum + record.principal_amount,
      0,
    );

    // Sum of interest_amount from all repayments (optional, but good to know)
    const totalPaidInterest = repayments.reduce(
      (sum, record) => sum + record.interest_amount,
      0,
    );

    // Remaining Principal
    let remainingPrincipal = loan.principal - totalPaidPrincipal;
    if (remainingPrincipal < 0) remainingPrincipal = 0; // Should not happen ideally

    // ✅ Check if interest paid this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const interestPaidThisMonth = repayments.some((r) => {
      const paidDate = new Date(r.paid_at);
      return (
        r.interest_amount > 0 &&
        paidDate >= startOfMonth &&
        paidDate <= endOfMonth
      );
    });

    return NextResponse.json({
      success: true,
      data: {
        loan_id: loan._id,
        principal: loan.principal,
        total_paid_principal: totalPaidPrincipal,
        total_paid_interest: totalPaidInterest,
        remaining_principal: remainingPrincipal,
        status: loan.status,
        interest_paid_this_month: interestPaidThisMonth,
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
