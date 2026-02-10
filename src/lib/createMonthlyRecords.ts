import VcUserMonthlyModel from "@/models/vc-user-monthly";
import VcMonthlyModel from "@/models/vc_monthly.model";

interface CreateMonthlyRecordsParams {
  vc_id: string;
  user_id: string;
  monthly_contribution: number;
}

/**
 * Creates VcUserMonthly record for a user when they join a venture
 */
export async function createUserMonthlyRecord({
  vc_id,
  user_id,
  monthly_contribution,
}: CreateMonthlyRecordsParams) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  // Check if record already exists
  const existingRecord = await VcUserMonthlyModel.findOne({
    vc_id,
    user_id,
    month: currentMonth,
    year: currentYear,
  });

  if (existingRecord) {
    console.log(`VcUserMonthly record already exists for user ${user_id}`);
    return existingRecord;
  }

  // Create new record
  const userMonthlyRecord = await VcUserMonthlyModel.create({
    vc_id,
    user_id,
    month: currentMonth,
    year: currentYear,
    monthly_contribution,
    loan_amount: 0,
    loan_interest: 0,
    loan_monthly_emi: 0,
    part_payment: 0,
    remaining_loan: 0,
    total_payable: monthly_contribution,
    status: "none",
  });

  console.log(`Created VcUserMonthly record for user ${user_id}`);
  return userMonthlyRecord;
}

/**
 * Creates or updates VcMonthly record for a venture
 */
export async function ensureVcMonthlyRecord(vc_id: string) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Check if record already exists
  let vcMonthly = await VcMonthlyModel.findOne({
    vc_id,
    month: currentMonth,
    year: currentYear,
  });

  if (vcMonthly) {
    console.log(`VcMonthly record already exists for VC ${vc_id}`);
    return vcMonthly;
  }

  // Get previous month's record
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const previousMonthSummary = await VcMonthlyModel.findOne({
    vc_id,
    month: previousMonth,
    year: previousYear,
  });

  // Create new record
  vcMonthly = await VcMonthlyModel.create({
    vc_id,
    month: currentMonth,
    year: currentYear,
    last_month_remaining_amount: previousMonthSummary?.remaining_amount || 0,
    total_monthly_contribution: 0,
    total_loan_repayment: 0,
    total_part_payment: 0,
    loans: [],
  });

  console.log(`Created VcMonthly record for VC ${vc_id}`);
  return vcMonthly;
}
