import { NextResponse } from "next/server";
import { dbConnect } from "../../../db.config/dbconnection";
import VentureModel from "@/models/venture.model";
import jwt from "jsonwebtoken";

import { cookies } from "next/headers";

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const cookieStore = await cookies();

    const token = cookieStore.get("token")?.value;

    const decode = jwt.verify(
      token!,
      process.env.JWT_SECRET!,
    ) as CustomJwtPayload;

    await dbConnect();

    const {
      name,
      monthly_emi,
      interest_rate,
      max_loan_amount,
      start_date,
      collection_date,
      loan_repayment_percent,
    } = body;

    // Validate basic fields (though Mongoose will validate too)
    // Ensure numbers are numbers and date is date

    const newVC = await VentureModel.create({
      created_by: decode.userId,
      name,
      monthly_emi,
      interest_rate,
      max_loan_amount,
      start_date: new Date(start_date),
      collection_date,
      loan_repayment_percent,
      fund_wallet: 0,
      members: [{ user_id: decode.userId, role: "ADMIN" as const }],
      status: "active",
    });

    // ✅ Create monthly records for the venture and admin
    const { createUserMonthlyRecord, ensureVcMonthlyRecord } =
      await import("@/lib/createMonthlyRecords");

    try {
      // Create VcMonthly record for the venture
      await ensureVcMonthlyRecord(newVC._id.toString());

      // Create VcUserMonthly record for the admin/creator
      await createUserMonthlyRecord({
        vc_id: newVC._id.toString(),
        user_id: decode.userId,
        monthly_contribution: monthly_emi,
      });

      // console.log(
      //   `Created monthly records for new venture ${newVC._id} and admin ${decode.userId}`,
      // );
    } catch (monthlyRecordError) {
      console.error("Error creating monthly records:", monthlyRecordError);
      // Don't fail the venture creation, just log the error
    }

    return NextResponse.json({
      success: true,
      message: "VC Created Successfully",
      data: newVC,
    });
  } catch (err) {
    console.log("server Error", err);

    return NextResponse.json({
      success: false,
      message: "Server Error",
      error: err,
    });
  }
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const decode = jwt.verify(
      token!,
      process.env.JWT_SECRET!,
    ) as CustomJwtPayload;
    await dbConnect();
    const vc = await VentureModel.find({ created_by: decode.userId });
    // .populate(
    //   "requests",
    //   "name email",
    // );
    console.log(vc);
    if (vc === null) {
      return NextResponse.json({
        success: false,
        message: "VC Not Found",
      });
    }

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
