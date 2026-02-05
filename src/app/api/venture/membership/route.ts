import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { dbConnect } from "@/db.config/dbconnection";
import VcMembershipModel from "@/models/vc-membership.model";
import MonthlyContributionModel, { ContributionStatus } from "@/models/monthly-contribution.model";
import VentureModel from "@/models/venture.model";

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    // ✅ Get token safely
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ Verify token
    let decoded: CustomJwtPayload;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as CustomJwtPayload;
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const { vc_id, role } = await req.json();

    // ✅ Basic validation
    if (!vc_id || !role) {
      return NextResponse.json(
        { success: false, message: "vc_id and role are required" },
        { status: 400 }
      );
    }

    // ✅ Prevent duplicate membership
    const existingMembership = await VcMembershipModel.findOne({
      vc_id,
      user_id: decoded.userId,
    });

    if (existingMembership) {
      return NextResponse.json(
        { success: false, message: "Already a member of this VC" },
        { status: 409 }
      );
    }

    // ✅ Create membership
    const membership = await VcMembershipModel.create({
      vc_id,
      user_id: decoded.userId,
      role,
    });

    // ✅ Create monthly contribution if needed
    const venture = await VentureModel.findById(vc_id);

    if (venture?.monthly_contribution) {
      await MonthlyContributionModel.create({
        vc_id,
        user_id: decoded.userId,
        amount: venture.monthly_contribution,
        month: new Date().getMonth() + 1, // ✅ 1–12
        year: new Date().getFullYear(),
        status: ContributionStatus.PENDING,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Membership created successfully",
      data: membership,
    });

  } catch (err) {
    console.error("Server error:", err);

    return NextResponse.json(
      { 
        success: false, 
        message: "Server error", 
        error: err instanceof Error ? err.message : String(err) 
      },
      { status: 500 }
    );
  }
}
