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
    const { id, part_payment } = await req.json(); // id is the VcUserMonthly record ID
    const partPaymentVal = Number(part_payment) || 0;

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
    if (contribution.status === "approved") {
      return NextResponse.json(
        { success: true, message: "Contribution is already approved" },
        { status: 200 },
      );
    }

    contribution.status = "approved";
    // Optional: Set paid_at date if schema supports it
    contribution.paid_at = new Date();

    // ✅ Update Loan Repayment Status if applicable
    // ✅ Update Loan Repayment Status if applicable
    const emiPaid = contribution.loan_monthly_emi || 0;
    const totalPaidNow = emiPaid + partPaymentVal;

    // Always update part_payment, even if 0, to ensure it's recorded
    contribution.part_payment = partPaymentVal;

    console.log(partPaymentVal, "partpayment");

    // Deduct EMI and Part Payment from Remaining Loan
    if (emiPaid > 0 || partPaymentVal > 0) {
      const totalDeduction = emiPaid + partPaymentVal;
      const currentRemaining = contribution.remaining_loan || 0;
      const newRemaining = currentRemaining - totalDeduction;
      contribution.remaining_loan = newRemaining > 0 ? newRemaining : 0;

      // Track part payment on the record directly? Schema might not have field.
      // Ensuring part_payment doesn't get lost?
      // Usually we should store it. For now updating aggregate.
    }

    await contribution.save();

    // ✅ Add contribution to Venture Wallet
    // Wallet += Monthly Contribution + EMI + Part Payment + Interest
    const interestPaid = contribution.loan_interest || 0;
    const totalToWallet =
      (contribution.monthly_contribution || 0) +
      emiPaid +
      partPaymentVal +
      interestPaid;
    venture.fund_wallet = (venture.fund_wallet || 0) + totalToWallet;

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
      vcMonthly.total_monthly_contribution =
        (vcMonthly.total_monthly_contribution || 0) +
        (contribution.monthly_contribution || 0);

      vcMonthly.total_loan_repayment =
        (vcMonthly.total_loan_repayment || 0) + emiPaid;

      vcMonthly.total_part_payment =
        (vcMonthly.total_part_payment || 0) + partPaymentVal;

      vcMonthly.total_loan_vyaj =
        (vcMonthly.total_loan_vyaj || 0) + interestPaid;

      await vcMonthly.save();
    } else {
      console.warn(
        `VcMonthly not found for VC ${contribution.vc_id} Month ${contribution.month}`,
      );
    }

    return NextResponse.json({
      success: true,
      message: "Contribution approved successfully",
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
