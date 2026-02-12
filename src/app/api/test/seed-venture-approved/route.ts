import { NextResponse } from "next/server";
import { dbConnect } from "@/db.config/dbconnection";
import UserModel from "@/models/user.model";
import VentureModel from "@/models/venture.model";
import VcUserMonthlyModel from "@/models/vc-user-monthly";
import VcMonthlyModel from "@/models/vc_monthly.model";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export async function GET() {
  await dbConnect();

  try {
    // 1. Data Source
    interface SeedDataRow {
      name: string;
      monthly_hapto: number;
      total_loan: number;
      last_pending_loan: number;
      loan_hapto: number;
      loan_vyaj: number;
      part_payment: number;
      baki_loan: number;
      round_off: number;
      total_hapto: number;
      userObjectId?: mongoose.Types.ObjectId;
    }

    const tableData: SeedDataRow[] = [
      {
        name: "MEET KAKADIYA",
        monthly_hapto: 10000,
        total_loan: 985125,
        last_pending_loan: 847015,
        loan_hapto: 24628.13,
        loan_vyaj: 8470.15,
        part_payment: 0,
        baki_loan: 822386.9,
        round_off: 2,
        total_hapto: 43100,
      },
      {
        name: "MAYUR KATHIRIYA",
        monthly_hapto: 10000,
        total_loan: 185000,
        last_pending_loan: 106375,
        loan_hapto: 4625,
        loan_vyaj: 1063.75,
        part_payment: 0,
        baki_loan: 101750,
        round_off: 1,
        total_hapto: 15690,
      },
      {
        name: "DHARMESH DOBARIYA",
        monthly_hapto: 10000,
        total_loan: 295000,
        last_pending_loan: 187275,
        loan_hapto: 7375,
        loan_vyaj: 1872.75,
        part_payment: 0,
        baki_loan: 179900,
        round_off: 2,
        total_hapto: 19250,
      },
      {
        name: "SAVAN KARKAR",
        monthly_hapto: 10000,
        total_loan: 654200,
        last_pending_loan: 542940,
        loan_hapto: 16355,
        loan_vyaj: 5429.4,
        part_payment: 0,
        baki_loan: 526585,
        round_off: 1,
        total_hapto: 31785,
      },
      {
        name: "YASH HIRAPARA",
        monthly_hapto: 10000,
        total_loan: 0,
        last_pending_loan: 0,
        loan_hapto: 0,
        loan_vyaj: 0,
        part_payment: 0,
        baki_loan: 0,
        round_off: 0,
        total_hapto: 10000,
      },
      {
        name: "HEMANSHU BAVASHIYA",
        monthly_hapto: 10000,
        total_loan: 624000,
        last_pending_loan: 431900,
        loan_hapto: 15600,
        loan_vyaj: 4319,
        part_payment: 0,
        baki_loan: 416300,
        round_off: 1,
        total_hapto: 29920,
      },
      {
        name: "NILESHBHAI VASTANI",
        monthly_hapto: 10000,
        total_loan: 200000,
        last_pending_loan: 90000,
        loan_hapto: 5000,
        loan_vyaj: 900,
        part_payment: 50000,
        baki_loan: 35000,
        round_off: 0,
        total_hapto: 65900,
      },
      {
        name: "KRUNALBHAI RADADIYA",
        monthly_hapto: 10000,
        total_loan: 350000,
        last_pending_loan: 191250,
        loan_hapto: 8750,
        loan_vyaj: 1912.5,
        part_payment: 0,
        baki_loan: 182500,
        round_off: 2,
        total_hapto: 20665,
      },
      {
        name: "JIGAR SHIROYA",
        monthly_hapto: 10000,
        total_loan: 0,
        last_pending_loan: 0,
        loan_hapto: 0,
        loan_vyaj: 0,
        part_payment: 0,
        baki_loan: 0,
        round_off: 0,
        total_hapto: 10000,
      },
      {
        name: "HARESH KUMAR",
        monthly_hapto: 10000,
        total_loan: 736700,
        last_pending_loan: 559407,
        loan_hapto: 18417.5,
        loan_vyaj: 5594.07,
        part_payment: 0,
        baki_loan: 540989.5,
        round_off: -2,
        total_hapto: 34010,
      },
      {
        name: "PIYUSHBHAI +MEET",
        monthly_hapto: 10000,
        total_loan: 0,
        last_pending_loan: 0,
        loan_hapto: 0,
        loan_vyaj: 0,
        part_payment: 0,
        baki_loan: 0,
        round_off: 0,
        total_hapto: 10000,
      },
      {
        name: "CHIRAG SANGANI",
        monthly_hapto: 10000,
        total_loan: 500000,
        last_pending_loan: 437500,
        loan_hapto: 12500,
        loan_vyaj: 4375,
        part_payment: 0,
        baki_loan: 425000,
        round_off: 0,
        total_hapto: 26875,
      },
      {
        name: "PANTHAK HIRPARA",
        monthly_hapto: 10000,
        total_loan: 0,
        last_pending_loan: 0,
        loan_hapto: 0,
        loan_vyaj: 0,
        part_payment: 0,
        baki_loan: 0,
        round_off: 0,
        total_hapto: 10000,
      },
    ];

    const adminName = "KRUNALBHAI RADADIYA";
    const passwordHash = await bcrypt.hash("admin", 10);
    const commonPhone = "1231231231";

    // 2. Process Users (ensure unique email/phone per user)
    const members: { user_id: string; role: "ADMIN" | "MEMBER" }[] = [];
    let creatorUserIdString = "";

    console.log("Processing Users...");
    for (const row of tableData) {
      const emailPrefix = row.name
        .toLowerCase()
        .replace(/\+/g, "")
        .replace(/\s+/g, "");
      const email = `${emailPrefix}@gmail.com`;

      let user = await UserModel.findOne({ email });
      if (!user) {
        user = await UserModel.create({
          name: row.name,
          email,
          password_hash: passwordHash,
          phone: commonPhone,
        });
      }

      const role: "ADMIN" | "MEMBER" =
        row.name === adminName ? "ADMIN" : "MEMBER";
      members.push({ user_id: user._id.toString(), role });

      if (row.name === adminName) {
        creatorUserIdString = user._id.toString();
      }

      row.userObjectId = user._id;
    }

    // 3. Create Venture
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    console.log("Creating/Finding Venture...");
    let venture = await VentureModel.findOne({ name: "MANDAL" });
    if (!venture) {
      venture = new VentureModel({
        name: "MANDAL",
        monthly_emi: 10000,
        interest_rate: 1,
        start_date: currentDate,
        collection_date: 1,
        max_loan_amount: 1000000,
        loan_repayment_percent: 2.5,
        created_by: creatorUserIdString,
        members: members,
        status: "active",
        fund_wallet: 0,
      });
      await venture.save();
    } else {
      // If it exists, update members and creator just in case
      venture.members = members;
      venture.created_by = creatorUserIdString;
      await venture.save();
    }

    const ventureId = venture._id;

    // 4. Create VcUserMonthly Records
    let sumMonthlyContribution = 0;
    let sumPartPayment = 0;
    let sumLoanRepayment = 0;
    let sumInterest = 0;

    await VcUserMonthlyModel.deleteMany({
      vc_id: ventureId,
      month: currentMonth,
      year: currentYear,
    });

    console.log("Creating User Monthly Records...");
    const userMonthlyDocs = [];
    for (const row of tableData) {
      if (row.name === "MEET KAKADIYA") {
        console.log(
          `Processing MEET: last_pending_loan=${row.last_pending_loan}`,
        );
      }
      userMonthlyDocs.push({
        vc_id: ventureId,
        user_id: row.userObjectId!,
        year: currentYear,
        month: currentMonth,
        monthly_contribution: row.monthly_hapto,

        loan_amount: row.total_loan,
        last_month_remaining_loan: row.last_pending_loan,
        loan_interest: row.loan_vyaj,
        loan_monthly_emi: row.loan_hapto,
        part_payment: row.part_payment,

        remaining_loan: row.baki_loan,
        total_payable: row.total_hapto,

        // 🔥 CHANGED: Default status to "approved" as requested
        status: "approved",
      });

      sumMonthlyContribution += row.monthly_hapto;
      sumPartPayment += row.part_payment;
      // Total Payable = Contribution + PartPayment + LoanRepayment(EMI) + Interest.
      // sumLoanRepayment (EMI) = loan_monthly_emi
      sumLoanRepayment += row.loan_hapto;
      sumInterest += row.loan_vyaj;
    }

    await VcUserMonthlyModel.insertMany(userMonthlyDocs);

    // 5. Create VcMonthly Record
    const lastMonthRemaining = 19090;

    await VcMonthlyModel.deleteMany({
      vc_id: ventureId,
      month: currentMonth,
      year: currentYear,
    });

    // Create new VcMonthly
    const vcMonthly = await VcMonthlyModel.create({
      vc_id: ventureId,
      month: currentMonth,
      year: currentYear,
      last_month_remaining_amount: lastMonthRemaining,
      total_monthly_contribution: sumMonthlyContribution,
      total_loan_repayment: sumLoanRepayment,
      total_part_payment: sumPartPayment,
      total_loan_vyaj: sumInterest,
      loans: [],
    });

    // 6. Update Venture Fund Wallet
    // Since everything is approved/paid, the wallet should reflect full collection.
    // Total = LastMonth + All User Payments (Total Hapto Sum)
    const finalWalletBalance =
      lastMonthRemaining +
      tableData.reduce((acc, curr) => acc + curr.total_hapto, 0);

    venture.fund_wallet = finalWalletBalance;
    await venture.save();

    return NextResponse.json({
      success: true,
      message: "Seeding Completed (All Approved)",
      data: {
        ventureName: "MANDAL",
        users: members.length,
        finalWalletBalance,
        vcMonthlyTotal: vcMonthly.total,
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
