import { NextResponse } from "next/server";
import { dbConnect } from "@/db.config/dbconnection";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import VentureModel from "@/models/venture.model";

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

    const venture = await VentureModel.findById(id);
    if (!venture) {
      return NextResponse.json(
        { success: false, message: "Venture not found" },
        { status: 404 },
      );
    }

    // Check if user is already a member
    const isMember = venture.members?.some(
      (member: any) => member.user_id.toString() === decoded.userId,
    );

    if (isMember) {
      return NextResponse.json(
        { success: false, message: "You are already a member" },
        { status: 200 },
      );
    }

    // Check if request already exists
    const isRequested = venture.requests?.some(
      (requestId: any) => requestId.toString() === decoded.userId,
    );

    if (isRequested) {
      return NextResponse.json(
        { success: false, message: "Request already sent" },
        { status: 200 },
      );
    }

    // Add request
    await VentureModel.findByIdAndUpdate(id, {
      $addToSet: { requests: decoded.userId },
    });

    return NextResponse.json({
      success: true,
      message: "Request sent successfully",
    });
  } catch (err) {
    console.error("Server Error:", err);

    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 },
    );
  }
}
