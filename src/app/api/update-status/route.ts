import { NextResponse } from "next/server";
import { dbConnect } from "@/db.config/dbconnection";
import VcUserMonthlyModel from "@/models/vc-user-monthly";
import VentureModel from "@/models/venture.model";

export async function GET() {
  await dbConnect();

  try {
    const venture = await VentureModel.findOne({ name: "MANDAL" });
    if (!venture) {
      return NextResponse.json({
        success: false,
        message: "Venture not found",
      });
    }

    const result = await VcUserMonthlyModel.updateMany(
      { vc_id: venture._id },
      { $set: { status: "approved" } },
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${result.modifiedCount} records to approved status`,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
