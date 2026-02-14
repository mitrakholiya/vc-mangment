import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/db.config/dbconnection";
import VentureModel from "@/models/venture.model";
import VcMonthlyModel from "@/models/vc_monthly.model";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const { vc_id, user_id, paidAmount } = await req.json();

    if (!vc_id || !user_id || typeof paidAmount !== "number") {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields or invalid paidAmount",
        },
        { status: 400 },
      );
    }

    await dbConnect();

    const userObjectId = new mongoose.Types.ObjectId(user_id);
    const vcObjectId = new mongoose.Types.ObjectId(vc_id);

    // Find the venture and update the specific exiting member record
    // We use $[element] to update the specific item in the array
    const updatedVenture = await VentureModel.findOneAndUpdate(
      {
        _id: vcObjectId,
        "exiting_panding.user_id": userObjectId,
      } as any,
      {
        $push: {
          "exiting_panding.$.total_paid": {
            amount: paidAmount,
            date: new Date(),
          },
        },
        $inc: {
          "exiting_panding.$.unpaid_amount": -paidAmount,
          fund_wallet: paidAmount,
        },
      },
      { new: true },
    );

    if (!updatedVenture) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Venture or Exiting Member not found. Make sure the member has officially exited the venture.",
        },
        { status: 404 },
      );
    }

    const monthly_vc =await VcMonthlyModel.findOne({
      vc_id: vcObjectId,
    }).sort({month : -1, year : -1})

    if(!monthly_vc){
      return NextResponse.json({
        success: false,
        message: "Monthly VC not found",
      }, { status: 404 });
    }
    if(monthly_vc.remaining_amount < paidAmount){
      return NextResponse.json({
        success: false,
        message: "Insufficient balance",
      }, { status: 400 });
    }

    monthly_vc.remaining_amount = monthly_vc.remaining_amount - paidAmount

    await monthly_vc.save()
    
    

    return NextResponse.json({
      success: true,
      message: `Repayment of ₹${paidAmount} recorded successfully.`,
      data: updatedVenture,
    });
  } catch (error: any) {
    console.error("Error processing exiting member repayment:", error);
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const vc_id = req.nextUrl.searchParams.get("vc_id");

    if (!vc_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields or invalid paidAmount",
        },
        { status: 400 },
      );
    }

    await dbConnect();

    // Find the venture and update the specific exiting member record
    // We use $[element] to update the specific item in the array
    const vcData = await VentureModel.findById(vc_id).populate(
      "exiting_panding.user_id",
      "name email",
    );

    if (!vcData) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Venture or Exiting Member not found. Make sure the member has officially ex    ited the venture.",
        },
        { status: 404 },
      );
    }

    const exiting_panding = vcData.exiting_panding?.filter(
      (item: any) => item.unpaid_amount > 0,
    );

    return NextResponse.json({
      success: true,
      message: `done`,
      data: exiting_panding,
    });
  } catch (error: any) {
    console.error("Error processing exiting member repayment:", error);
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 },
    );
  }
}
