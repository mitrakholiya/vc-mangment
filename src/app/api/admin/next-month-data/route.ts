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

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!,
    ) as CustomJwtPayload;

    await dbConnect();

    const venture = await VentureModel.findById(vc_id);

    if (!venture) {
      return NextResponse.json(
        { success: false, message: "Venture not found" },
        { status: 404 },
      );
    }

    // Ensure User model is loaded
    await UserModel.findOne();

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Determine Next Month
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    const user_vc_monthly = await VcUserMonthlyModel.find({
      vc_id,
      month: nextMonth,
      year: nextYear,
    })
      .populate("user_id", "name email")
      .sort({ user_id: 1 });

    const vc_monthly = await VcMonthlyModel.findOne({
      vc_id,
      month: nextMonth,
      year: nextYear,
    });

    if (user_vc_monthly.length === 0 && !vc_monthly) {
      // If next month data doesn't exist, we can return empty or null
      // Currently the frontend might expect something or handle empty
      return NextResponse.json({
        success: false,
        message: "No data found for next month",
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Next month data found successfully",
      data: { user_vc_monthly, vc_monthly },
    });
  } catch (error: any) {
    console.error("Error fetching next month data:", error);
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 },
    );
  }
}
