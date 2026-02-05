import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import mongoose from "mongoose";
import { dbConnect } from "@/db.config/dbconnection";
import LoanModel from "@/models/loan.model";

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
}

// GET: Fetch the latest loan for a user id and venture id
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

    // ✅ Find the latest loan (active, pending, or closed)
    // We want to show the user their current status, whatever it is.
    const loans = await LoanModel.find({
      vc_id: vc_id,
      user_id: decoded.userId,
    })
      .sort({ created_at: -1 })
      .limit(1);

    const loan = loans[0];

    if (!loan) {
      return NextResponse.json({
        success: true,
        data: null, // No loan found is a valid state (User hasn't applied)
        message: "No loan record found",
      });
    }
    if (loan.approve_status === "APPROVED" && loan.status === "ACTIVE") {
      return NextResponse.json({
        success: true,
        data: loan,
      });
    }
    return NextResponse.json({
      success: false,
      data: null,
      message: "Loan is not Active",
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
