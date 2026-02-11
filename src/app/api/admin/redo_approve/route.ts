import { NextResponse } from "next/server";
import { dbConnect } from "@/db.config/dbconnection";
import VcUserMonthlyModel from "@/models/vc-user-monthly";
import VentureModel from "@/models/venture.model";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
}

export async function PUT(req: Request) {
  try {
    const { id } = await req.json(); // id is the VcUserMonthly record ID

    if (!id) {
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

    // 1. Find the Contribution Record
    const contribution = await VcUserMonthlyModel.findById(id);

    if (!contribution) {
      return NextResponse.json(
        { success: false, message: "Contribution record not found" },
        { status: 404 },
      );
    }

    // 2. Verify that the Requestor is the Admin of the Venture
    const venture = await VentureModel.findById(contribution.vc_id);

    if (!venture) {
      return NextResponse.json(
        { success: false, message: "Venture not found" },
        { status: 404 },
      );
    }

    if (String(venture.created_by) !== String(decoded.userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to approve this contribution",
        },
        { status: 403 },
      );
    }

    // 3. Update the status
    if (contribution.status === "pending" || contribution.status === "none") {
      return NextResponse.json(
        { success: true, message: "Contribution is already in pending" },
        { status: 200 },
      );
    }
    // ✅ Update Loan Repayment Status if applicable
    contribution.status = "none";

    contribution.remaining_loan +=
      contribution.part_payment + contribution.loan_monthly_emi;
    const partPayment = contribution.part_payment;
    contribution.part_payment = 0;
    contribution.total_payable =
      contribution.monthly_contribution +
      contribution.loan_monthly_emi +
      contribution.loan_interest;

    await contribution.save();

    // ✅ Add contribution to Venture Wallet
    // Wallet += Monthly Contribution + EMI + Part Payment + Interest
    venture.fund_wallet =
      (venture.fund_wallet || 0) - partPayment - contribution.total_payable;

    await venture.save();

    // ✅ Update VcMonthly Aggregate
    const VcMonthlyModel = require("@/models/vc_monthly.model").default; // Dynamic import if needed

    // Find VcMonthly for this venture and month
    const vcMonthly = await VcMonthlyModel.findOne({
      vc_id: contribution.vc_id,
      month: contribution.month,
      year: contribution.year,
    });

    if (vcMonthly) {
      vcMonthly.total_part_payment =
        (vcMonthly.total_part_payment || 0) - partPayment;
      vcMonthly.total_monthly_contribution =
        (vcMonthly.total_monthly_contribution || 0) -
        (contribution.monthly_contribution || 0);

      vcMonthly.total_loan_repayment =
        (vcMonthly.total_loan_repayment || 0) -
        (contribution.loan_monthly_emi || 0);

      vcMonthly.total_loan_vyaj =
        (vcMonthly.total_loan_vyaj || 0) - (contribution.loan_interest || 0);

      await vcMonthly.save();
    } else {
      console.warn(
        `VcMonthly not found for VC ${contribution.vc_id} Month ${contribution.month}`,
      );
    }

    return NextResponse.json({
      success: true,
      message: "Contribution Rejected successfully",
      data: contribution,
    });
  } catch (error: any) {
    console.error("Error approving contribution:", error);
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 },
    );
  }
}
