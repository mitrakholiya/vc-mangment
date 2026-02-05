import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import mongoose from "mongoose";
import { dbConnect } from "@/db.config/dbconnection";
import VcMembershipModel from "@/models/vc-membership.model";
import MonthlyContributionModel, {
  ContributionStatus,
} from "@/models/monthly-contribution.model";
import VentureModel from "@/models/venture.model";

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
}

// GET: Fetch monthly contributions
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
      user_id: new mongoose.Types.ObjectId(decoded.userId),
    };

    if (vc_id) {
      query.vc_id = new mongoose.Types.ObjectId(vc_id);
    }

    // ✅ Fetch contributions
    const contributions = await MonthlyContributionModel.find(query)
      .populate("vc_id", "name monthly_contribution")
      .sort({ year: -1, month: -1 });

    return NextResponse.json({
      success: true,
      data: contributions,
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

    const { vc_id } = await req.json();

    console.log(vc_id);
    

    const venture = await VentureModel.findById(vc_id);

    if (!venture) {
      return NextResponse.json(
        { success: false, message: "Venture not found" },
        { status: 404 },
      );
    }

    if (venture.monthly_contribution) {
      const existingContribution = await MonthlyContributionModel.findOne({
        vc_id: new mongoose.Types.ObjectId(vc_id),
        user_id: new mongoose.Types.ObjectId(decoded.userId),
      });

      if (existingContribution?.status === ContributionStatus.PAID) {
        return NextResponse.json(
          { success: true, message: "Already paid" },
          { status: 200 },
        );
      } 

      const res = await MonthlyContributionModel.findOneAndUpdate(
        {
          vc_id: new mongoose.Types.ObjectId(vc_id),
          user_id: new mongoose.Types.ObjectId(decoded.userId),
        },
        {
          status: ContributionStatus.PAID,
        },
      );
      if (res) {
        await VentureModel.findByIdAndUpdate(vc_id, {
          fund_wallet: venture.fund_wallet + venture.monthly_contribution,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Paid successfully",
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
