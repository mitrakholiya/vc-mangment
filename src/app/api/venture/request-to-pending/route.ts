import { NextResponse } from "next/server";
import { dbConnect } from "@/db.config/dbconnection";
import VentureModel from "@/models/venture.model";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import vc_user_monthly from "@/models/vc-user-monthly";
import UserModel from "@/models/user.model";
import mongoose from "mongoose";

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
}

// Admin
// FOR USER REQUEST TO PENDING
export async function PUT(req: Request) {
  try {
    const { vc_id } = await req.json();

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

    console.log(vc_id, decoded.userId);

    const user_vc = await vc_user_monthly
      .findOne({ vc_id, user_id: decoded.userId })
      .sort({ month: -1, year: -1 });

    if (!user_vc) {
      return NextResponse.json(
        { success: false, message: "No monthly record found for this venture" },
        { status: 404 },
      );
    }

    if (user_vc.status === "pending") {
      return NextResponse.json({
        success: false,
        message: "Your request is already in pending please wait for approval",
      });
    }

    if (user_vc.status === "approved" || user_vc.status === "paid") {
      return NextResponse.json({
        success: false,
        message: "Your payment is already approved/paid",
      });
    }

    const update_user_vc = await vc_user_monthly.findByIdAndUpdate(
      user_vc._id,
      { $set: { status: "pending" } },
      { new: true },
    );

    return NextResponse.json({
      success: true,
      message: "Request sent successfully. Admin will approve shortly.",
      data: update_user_vc,
    });
  } catch (error: any) {
    console.error("Error managing request:", error);
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 },
    );
  }
}

// FOR ADMIN GET ALL PENDING REQUESTS
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id: string = searchParams.get("vc_id") || "";

    const vc_id = new mongoose.Types.ObjectId(id);

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

    // IS ADMIN CHECK
    const venture = await VentureModel.findById(vc_id);
    if (!venture) {
      return NextResponse.json(
        { success: false, message: "Venture not found" },
        { status: 404 },
      );
    }

    if (venture.created_by.toString() !== decoded.userId.toString()) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to perform this action",
        },
        { status: 403 },
      );
    }

    // Ensure User model is loaded
    await UserModel.findOne();

    const pendingRequests = await vc_user_monthly
      .find({ vc_id, status: "pending" })
      .populate("user_id", "name email") // Optionally populate user details
      .sort({ month: -1, year: -1 });

    if (!pendingRequests) {
      return NextResponse.json(
        { success: false, message: "No pending requests found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pending requests fetched successfully",
      data: pendingRequests,
    });
  } catch (error: any) {
    console.error("Error managing request:", error);
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 },
    );
  }
}
