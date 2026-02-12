import { NextResponse } from "next/server";
import { dbConnect } from "@/db.config/dbconnection";
import VentureModel from "@/models/venture.model";

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import VcUserMonthlyModel from "@/models/vc-user-monthly";
import VcMonthlyModel from "@/models/vc_monthly.model";
import UserModel from "@/models/user.model"; // Ensure User model is registered
import mongoose from "mongoose";

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

    // Verify ownership/admin status
    // For simplicity, assuming venture creator can manage requests
    const venture = await VentureModel.findById(vc_id);

    if (!venture) {
      return NextResponse.json(
        { success: false, message: "Venture not found" },
        { status: 404 },
      );
    }

    // THis is check only created by only access this route
    
    // if (String(venture.created_by) !== String(decoded.userId)) {
    //   // Alternatively check VcMembership for ADMIN role
    //   return NextResponse.json(
    //     { success: false, message: "Unauthorized to manage this venture" },
    //     { status: 403 },
    //   );
    // }

    const isAdmin = venture.members.some((member) => {
      return (String(member.user_id) === String(decoded.userId) &&
        member.role === "ADMIN")
    })

     if (!isAdmin) {
      // Alternatively check venture members for ADMIN role
      return NextResponse.json(
        { success: false, message: "Unauthorized to manage this venture You Are Member" },
        { status: 403 },
      );
    }

    // Ensure User model is loaded
    await UserModel.findOne();

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // STRICTLY exclude future data
    // Data not come of next month
    // STRICTLY current month data only
    const dateQuery = {
      year: currentYear,
      month: currentMonth,
    };

    console.log(dateQuery);
    const user_vc_monthly = await VcUserMonthlyModel.find({
      vc_id: new mongoose.Types.ObjectId(vc_id),
      ...dateQuery,
    })
      .populate("user_id", "name email")
      .sort({ year: -1, month: -1 });

    const vc_monthly = await VcMonthlyModel.find({ vc_id, ...dateQuery }).sort({
      year: -1,
      month: -1,
    });

    if (user_vc_monthly.length === 0 && vc_monthly.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No data found",
        debug: {
          counts: {
            userMonthly: user_vc_monthly.length,
            vcMonthly: vc_monthly.length,
          },
          query: { vc_id, ...dateQuery },
        },
      });
    }
    return NextResponse.json({
      success: true,
      message: "data found successfully",
      data: { user_vc_monthly, vc_monthly },
    });
  } catch (error: any) {
    console.error("Error managing request:", error);
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 },
    );
  }
}
