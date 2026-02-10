import { NextResponse } from "next/server";
import { dbConnect } from "@/db.config/dbconnection";
import VentureModel from "@/models/venture.model";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import vc_user_monthly from "@/models/vc-user-monthly";

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { vc_id } = await req.json();
    const { id } = await context.params;

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

    if (venture.created_by !== decoded.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to perform this action",
        },
        { status: 403 },
      );
    }

    const user_vc = await vc_user_monthly.findById(id);

    if (!user_vc) {
      return NextResponse.json(
        { success: false, message: "Request record not found" },
        { status: 404 },
      );
    }

    if (user_vc.status === "approved" || user_vc.status === "paid") {
      return NextResponse.json({
        success: false,
        message: "This request is already approved or paid",
      });
    }

    const update_user_vc = await vc_user_monthly.findByIdAndUpdate(
      user_vc._id,
      { $set: { status: "approved" } },
      { new: true },
    );

    return NextResponse.json({
      success: true,
      message: "Request approved successfully",
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
