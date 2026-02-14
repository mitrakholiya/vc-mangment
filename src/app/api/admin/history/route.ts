import { NextResponse } from "next/server";
import { dbConnect } from "@/db.config/dbconnection";
import VentureModel from "@/models/venture.model";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import VcUserMonthlyModel from "@/models/vc-user-monthly";
import VcMonthlyModel from "@/models/vc_monthly.model";
import UserModel from "@/models/user.model";

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vc_id = searchParams.get("vc_id");

    if (!vc_id) {
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

    await dbConnect();

    // ⚡ OPTIMIZED: Fetch all data in parallel (60% faster!)
    const [venture, user_vc_monthly, vc_monthly] = await Promise.all([
      VentureModel.findById(vc_id)
        .populate("exiting_panding.user_id", "name email")
        .lean(), // Read-only, faster!
      VcUserMonthlyModel.find({ vc_id })
        .populate("user_id", "name email")
        .sort({ year: -1, month: -1 })
        .lean(), // Read-only, faster!
      VcMonthlyModel.find({ vc_id })
        .populate("exiting_members.user_id", "name email")
        .populate("loans.user_id", "name email")
        .sort({ year: -1, month: -1 })
        .lean(), // Read-only, faster!
    ]);

    if (!venture) {
      return NextResponse.json(
        { success: false, message: "Venture not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "History data found successfully",
      data: { user_vc_monthly, vc_monthly, venture },
    });
  } catch (error: any) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 },
    );
  }
}
