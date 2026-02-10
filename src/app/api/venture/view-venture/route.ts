import { dbConnect } from "@/db.config/dbconnection";
// import VcMembershipModel from "@/models/vc-membership.model";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import VentureModel from "@/models/venture.model";
import "@/models/user.model"; // Ensure User model is registered

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
}

export const GET = async () => {
  try {
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

    const ventures = await VentureModel.find({
      "members.user_id": decoded.userId,
    }).populate({
      path: "requests",
      model: "User", // Explicitly specify the model name
      select: "name email phone",
    });

    // if (!membership.length) {
    //     return NextResponse.json(
    //         { success: false, message: "No VC Found" },
    //         { status: 404 }
    //     );
    // }

    // extract VC ids (IMPORTANT: vc_id, not user_id)
    // const vcIds = membership.map((member) => member.vc_id);

    // fetch all ventures in ONE query
    // const data = await VentureModel.find({
    //     _id: { $in: vcIds },
    // });

    // if (!data.length) {
    //     return NextResponse.json(
    //         { success: false, message: "No VC Found" },
    //         { status: 404 }
    //     );
    // }

    return NextResponse.json({
      success: true,
      message: "VC Viewed Successfully",
      data: ventures,
    });
  } catch (error: any) {
    console.error("Server Error:", error);

    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 },
    );
  }
};
