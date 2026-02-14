import { dbConnect } from "@/db.config/dbconnection";
import VentureModel from "@/models/venture.model";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const decode = jwt.verify(
      token!,
      process.env.JWT_SECRET!,
    ) as CustomJwtPayload;
    await dbConnect();
    const { id } = await context.params;
    const vc = await VentureModel.findById(id).populate(
      "members.user_id",
      "name email",
    );
    console.log(vc);
    if (vc === null) {
      return NextResponse.json({
        success: false,
        message: "VC Not Found",
      });
    }
    // cookieStore.set("haveVC", decode.userId, {
    //     httpOnly: true,
    //     sameSite: "strict",
    //     maxAge: 60 * 60 * 24 * 7,
    // })
    return NextResponse.json({
      success: true,
      message: "VC Found Successfully",
      data: vc,
    });
  } catch (error) {
    console.log("server Error", error);
    return NextResponse.json({
      success: false,
      message: "Server Error",
      error: error,
    });
  }
}

// For Update VC active status
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const decode = jwt.verify(
      token!,
      process.env.JWT_SECRET!,
    ) as CustomJwtPayload;
    await dbConnect();
    const { id } = await context.params;
    const vc = await VentureModel.findById(id);
    console.log(vc);
    if (vc === null) {
      return NextResponse.json({
        success: false,
        message: "VC Not Found",
      });
    }
    if (vc.created_by.toString() !== decode.userId.toString()) {
      return NextResponse.json({
        success: false,
        message: "You are not authorized to update this VC",
      });
    }
    const updateVC = await VentureModel.findByIdAndUpdate(id, {
      status: "active",
    });
    return NextResponse.json({
      success: true,
      message: "VC Found Successfully",
      data: updateVC,
    });
  } catch (error) {
    console.log("server Error", error);
    return NextResponse.json({
      success: false,
      message: "Server Error",
      error: error,
    });
  }
}
