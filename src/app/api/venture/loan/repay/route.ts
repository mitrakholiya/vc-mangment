import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { dbConnect } from "@/db.config/dbconnection";
import LoanModel, { LoanStatus } from "@/models/loan.model";
import VentureModel from "@/models/venture.model";
import LoanRepaymentModel, {
  PaymentMethod,
} from "@/models/loan-repayment.model";

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
}

// POST: Make a repayment
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

    const body = await req.json();
    const loan_id = body.loan_id;
    const payment_method = body.payment_method;

    // Ensure Integers (Round to nearest whole number) - Enforcing INT constraint
    const amount = Math.round(Number(body.amount));
    const principal_amount = Math.round(Number(body.principal_amount));
    const interest_amount = Math.round(Number(body.interest_amount));

    // ✅ Validate input
    if (
      !loan_id ||
      isNaN(amount) ||
      isNaN(principal_amount) ||
      isNaN(interest_amount)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields or invalid numbers",
        },
        { status: 400 },
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Amount must be greater than 0" },
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

    // ✅ Check ownership
    // Allow admin to pay? For now assume only user pays their own loan
    if (loan.user_id !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to repay this loan" },
        { status: 403 },
      );
    }

    if (loan.status !== LoanStatus.ACTIVE) {
      return NextResponse.json(
        { success: false, message: "Loan is not active" },
        { status: 400 },
      );
    }

    // ✅ Create Repayment Record
    const repayment = await LoanRepaymentModel.create({
      loan_id,
      amount,
      principal_amount,
      interest_amount,
      payment_method: payment_method || PaymentMethod.WALLET,
      paid_at: new Date(),
    });

    // ✅ Update Venture Fund Wallet
    // Money goes back to the venture fund
    const venture = await VentureModel.findById(loan.vc_id);
    if (venture) {
      await VentureModel.findByIdAndUpdate(loan.vc_id, {
        $inc: { fund_wallet: amount },
      });
    }

    // ✅ Check if Loan is Fully Paid
    // Calculate total principal repaid so far
    const allRepayments = await LoanRepaymentModel.find({ loan_id });
    const totalPrincipalRepaid = allRepayments.reduce(
      (sum, r) => sum + r.principal_amount,
      0,
    );

    // If total repaid principal >= loan principal, close the loan
    // We use a small epsilon for float comparison just in case, though converting to int makes this safer
    if (totalPrincipalRepaid >= loan.principal) {
      await LoanModel.findByIdAndUpdate(loan_id, {
        status: LoanStatus.CLOSED,
        closed_at: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Repayment successful",
      data: repayment,
      loanStatus:
        totalPrincipalRepaid >= loan.principal
          ? LoanStatus.CLOSED
          : LoanStatus.ACTIVE,
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

// GET: Get repayments for a loan
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

    const { searchParams } = new URL(req.url);
    const loan_id = searchParams.get("loan_id");

    if (!loan_id) {
      return NextResponse.json(
        { success: false, message: "Missing loan_id" },
        { status: 400 },
      );
    }

    // Check permission (User owns loan or Admin?)
    // For simplicity, checking if user owns loan
    const loan = await LoanModel.findById(loan_id);
    if (!loan) {
      return NextResponse.json(
        { success: false, message: "Loan not found" },
        { status: 404 },
      );
    }

    if (loan.user_id !== decoded.userId) {
      // If not owner, maybe check if admin?
      // Not implementing full role check here yet, restricting to owner
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );
    }

    const repayments = await LoanRepaymentModel.find({ loan_id }).sort({
      paid_at: -1,
    });

    return NextResponse.json({
      success: true,
      data: repayments,
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
