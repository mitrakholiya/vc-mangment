import { NextResponse } from "next/server";
import { dbConnect } from "@/db.config/dbconnection";
import VentureModel from "@/models/venture.model";
// import VcMembershipModel from "@/models/vc-membership.model";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
}

export async function POST(req: Request) {
  try {
    const { vc_id, user_id, action } = await req.json();

    if (!vc_id || !user_id || !action) {
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

    // Verify ownership/admin status
    // For simplicity, assuming venture creator can manage requests
    const venture = await VentureModel.findById(vc_id);

    if (!venture) {
      return NextResponse.json(
        { success: false, message: "Venture not found" },
        { status: 404 },
      );
    }

    if (venture.created_by.toString() !== decoded.userId.toString()) {
      // Alternatively check VcMembership for ADMIN role
      return NextResponse.json(
        { success: false, message: "Unauthorized to manage this venture" },
        { status: 403 },
      );
    }

    if (action === "accept") {
      // 1. Remove from requests
      // 2. Add to members
      // 3. Create Membership

      await VentureModel.findByIdAndUpdate(vc_id, {
        $pull: { requests: user_id },
        $addToSet: { members: { user_id, role: "MEMBER" } },
      });

      // Check if membership already exists (idempotency)
      // const existingMember = await VcMembershipModel.findOne({
      //   vc_id,
      //   user_id,
      // });
      // if (!existingMember) {
      //   await VcMembershipModel.create({
      //     vc_id,
      //     user_id,
      //     role: "INVESTOR", // Default role
      //   });
      // }

      // ✅ Create monthly records for the new member
      const { createUserMonthlyRecord, ensureVcMonthlyRecord } =
        await import("@/lib/createMonthlyRecords");

      try {
        // Ensure VcMonthly record exists for this venture
        await ensureVcMonthlyRecord(vc_id);

        // Create VcUserMonthly record for the new member
        await createUserMonthlyRecord({
          vc_id,
          user_id,
          monthly_contribution: venture.monthly_emi,
        });

        console.log(
          `Created monthly records for user ${user_id} joining venture ${vc_id}`,
        );
      } catch (monthlyRecordError) {
        console.error("Error creating monthly records:", monthlyRecordError);
        // Don't fail the acceptance, just log the error
      }

      return NextResponse.json({
        success: true,
        message: "User accepted into venture",
      });
    } else if (action === "reject") {
      // 1. Remove from requests
      await VentureModel.findByIdAndUpdate(vc_id, {
        $pull: { requests: user_id },
      });

      return NextResponse.json({
        success: true,
        message: "Request rejected",
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid action" },
        { status: 400 },
      );
    }
  } catch (error: any) {
    console.error("Error managing request:", error);
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 },
    );
  }
}
