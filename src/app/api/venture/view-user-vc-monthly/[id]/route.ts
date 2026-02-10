import { dbConnect } from "@/db.config/dbconnection";
import VentureModel from "@/models/venture.model";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import vc_user_monthly from "@/models/vc-user-monthly";
import mongoose from "mongoose";

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

    const vc = await VentureModel.findById(id);
    if (vc === null) {
      return NextResponse.json({
        success: false,
        message: "VC Not Found",
      });
    }

    const isAdmin = vc.members.some(
      (member: any) =>
        String(member.user_id) === String(decode.userId) &&
        member.role === "ADMIN",
    );

    const loan_repayment_percent = vc.loan_repayment_percent;
    const interest_rate = vc.interest_rate;
    const requests = vc.requests;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const monthlyUserVcData = await vc_user_monthly
      .find({
        vc_id: new mongoose.Types.ObjectId(id),
        user_id: new mongoose.Types.ObjectId(decode.userId),
        month: currentMonth,
        year: currentYear,
      })
      .sort({ year: 1, month: 1 });

    let total_loan_amount = 0;
    let total_interest_amount = 0;
    let total_repayment_amount = 0;
    let monthly_hapto = vc.monthly_emi;
    let total_remaining_amount = 0;
    let loan_part_payment = 0;

    let status = "none";

    if (monthlyUserVcData && monthlyUserVcData.length > 0) {
      monthlyUserVcData.forEach((record) => {
        total_interest_amount += record.loan_interest || 0;
        total_repayment_amount += record.total_payable || 0;
        loan_part_payment += record.part_payment || 0;
        // monthly_hapto += record.monthly_contribution || 0;
      });

      const lastRecord = monthlyUserVcData[monthlyUserVcData.length - 1];
      total_loan_amount = lastRecord.loan_amount || 0;
      total_remaining_amount = lastRecord.remaining_loan || 0;
      status = lastRecord.status || "none";
    }

    return NextResponse.json({
      success: true,
      message: "VC Found Successfully",
      data: {
        vc_id: id,
        name: vc.name,
        user_id: decode.userId,
        loan_repayment_percent,
        month: monthlyUserVcData[0]?.month,
        year: monthlyUserVcData[0]?.year,
        interest_rate,
        total_loan_amount,
        monthly_hapto,
        loan_part_payment,
        total_interest_amount,
        total_repayment_amount,
        total_remaining_amount,
        status,
        isAdmin,
        requests,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Server Error",
      error: error,
    });
  }
}
