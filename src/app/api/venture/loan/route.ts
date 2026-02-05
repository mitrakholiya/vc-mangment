import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import mongoose from "mongoose";
import { dbConnect } from "@/db.config/dbconnection";
import LoanModel, { LoanStatus, ApproveStatus } from "@/models/loan.model";
import VentureModel from "@/models/venture.model";
import VcMembershipModel from "@/models/vc-membership.model";

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
}

// POST: Create a loan request for user
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

    const { vc_id, principal, months } = await req.json();

    // ✅ Validate input
    if (!vc_id || !principal || !months) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
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
    const membership = await VcMembershipModel.findOne({
      vc_id: vc_id,
      user_id: decoded.userId,
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, message: "You are not a member of this venture" },
        { status: 403 },
      );
    }

    // ✅ Calculate max loan amount (based on fund_wallet and max_loan_percent)
    const maxLoanAmount =
      (venture.fund_wallet * venture.max_loan_percent) / 100;

    if (principal > maxLoanAmount) {
      return NextResponse.json(
        {
          success: false,
          message: `Loan amount exceeds maximum limit of ₹${maxLoanAmount.toFixed(2)}`,
        },
        { status: 400 },
      );
    }

    // ✅ Check if user already has an active loan in this venture
    const existingLoan = await LoanModel.findOne({
      vc_id: vc_id,
      user_id: decoded.userId,
      status: LoanStatus.ACTIVE,
    });

    if (existingLoan) {
      return NextResponse.json(
        {
          success: false,
          message: "You already have an active loan in this venture",
        },
        { status: 400 },
      );
    }

    // ✅ Create loan
    const loan = await LoanModel.create({
      vc_id: vc_id,
      user_id: decoded.userId,
      principal: principal,
      interest_rate: venture.loan_interest_percent,
      months: months,
      status: LoanStatus.ACTIVE,
      approve_status: ApproveStatus.PENDING,
    });

    // // ✅ Deduct from venture fund wallet
    // await VentureModel.findByIdAndUpdate(vc_id, {
    //   fund_wallet: venture.fund_wallet - principal,
    // });

    return NextResponse.json({
      success: true,
      message: "Loan request created successfully",
      data: loan,
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

// GET: Fetch user's loans by venture id for admin
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

    // ✅ Get query params
    const { searchParams } = new URL(req.url);
    const vc_id = searchParams.get("vc_id");

    // ✅ Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {
      user_id: decoded.userId,
    };

    if (vc_id) {
      query.vc_id = vc_id;
    }

    // ✅ Fetch loans
    const loans = await LoanModel.find(query).sort({ created_at: -1 });

    return NextResponse.json({
      success: true,
      data: loans,
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

// This is for admin to update loan status
export async function PUT(req: Request) {
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

    const { loanId, approve_status } = await req.json();
    console.log({ loanId, approve_status });

    if (!approve_status || !loanId) {
      return NextResponse.json({
        success: false,
        message: "Missing required fields",
      });
    }
    if(approve_status === "REJECTED"){
      const loan = await LoanModel.findByIdAndUpdate(loanId, {
        approve_status: approve_status,
        status: LoanStatus.CLOSED,
      });
      return NextResponse.json({
        success: true,
        data: loan,
        message: "Loan rejected successfully",
      });
    }

    const loan = await LoanModel.findByIdAndUpdate(loanId, {
      approve_status: approve_status,
    });

    if(loan){
      const venture = await VentureModel.findById(loan.vc_id);
      if(venture){
        await VentureModel.findByIdAndUpdate(loan.vc_id, {
          fund_wallet:venture.fund_wallet - loan.principal,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: loan,
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
