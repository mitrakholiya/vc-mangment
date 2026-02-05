export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { dbConnect } from "@/db.config/dbconnection";
import VcMembershipModel from "@/models/vc-membership.model";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import VentureModel from "@/models/venture.model";
import MonthlyContributionModel, {
  ContributionStatus,
} from "@/models/monthly-contribution.model";
import mongoose from "mongoose";

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
}
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID param missing" },
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

    const isExist = await VcMembershipModel.findOne({
      vc_id: id,
      user_id: decoded.userId,
    });
    if (isExist) {
      return NextResponse.json(
        { success: false, message: "You are already a member" },
        { status: 200 },
      );
    }
    const membership = await VcMembershipModel.create({
      vc_id: id,
      user_id: decoded.userId,
    });

    const isMonthlyContributionExist = await MonthlyContributionModel.findOne({
      vc_id: id,
      user_id: decoded.userId,
    });
    if (isMonthlyContributionExist) {
      return NextResponse.json(
        { success: false, message: "You are already a member" },
        { status: 200 },
      );
    }
    const venture = await VentureModel.findById(id);

    if (venture?.monthly_contribution) {
      await MonthlyContributionModel.create({
        vc_id: id,
        user_id: decoded.userId,
        amount: venture.monthly_contribution,
        month: new Date().getMonth() + 1, // ✅ 1–12
        year: new Date().getFullYear(),
        status: ContributionStatus.PENDING,
      });
    }

    return NextResponse.json({
      success: true,
      message: "VC Created Successfully",
      data: membership,
    });
  } catch (err) {
    console.error("Server Error:", err);

    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 },
    );
  }
}
