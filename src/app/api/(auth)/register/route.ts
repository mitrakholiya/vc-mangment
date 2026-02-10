import { NextResponse } from "next/server";
import UserModel from "@/models/user.model";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/db.config/dbconnection";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, phone } = body;
    await dbConnect();
    const hashedpass = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
      name,
      email,
      password_hash: hashedpass,
      phone,
    });

    return NextResponse.json({
      success: true,
      user: { email },
    });
  } catch (err: any) {
    console.log("server Error", err);

    return NextResponse.json(
      {
        success: false,
        message: "Server Error",
        error: err.message,
      },
      { status: 500 },
    );
  }
}
