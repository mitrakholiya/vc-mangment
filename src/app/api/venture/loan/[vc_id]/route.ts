import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import mongoose from "mongoose";
import { dbConnect } from "@/db.config/dbconnection";
import LoanModel from "@/models/loan.model";
import VentureModel from "@/models/venture.model";
import UserModel from "@/models/user.model";

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
}

// GET: Fetch all loans for a venture (Admin only)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ vc_id: string }> },
) {
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

    const { vc_id } = await params;

    // ✅ Validate vc_id
    if (!vc_id || !mongoose.Types.ObjectId.isValid(vc_id)) {
      return NextResponse.json(
        { success: false, message: "Invalid venture ID" },
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

    // ✅ Check if user is the admin (creator) of this venture
    if (venture.created_by.toString() !== decoded.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Only the venture admin can view all loans",
        },
        { status: 403 },
      );
    }

    // ✅ Fetch all loans for this venture with user details
    const loans = await LoanModel.find({ vc_id: vc_id }).sort({
      created_at: -1,
    });

    // ✅ Get user details for each loan
    const loansWithUser = await Promise.all(
      loans.map(async (loan) => {
        const user = await UserModel.findById(loan.user_id).select(
          "name email phone",
        );
        return {
          ...loan.toObject(),
          user: user
            ? { name: user.name, email: user.email, phone: user.phone }
            : null,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      data: loansWithUser,
      venture: {
        name: venture.name,
        fund_wallet: venture.fund_wallet,
        loan_interest_percent: venture.loan_interest_percent,
        max_loan_percent: venture.max_loan_percent,
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
