import mongoose, { Schema, Document, Types } from "mongoose";

export interface IVcMonthlyLoan {
  user_id: string | any;
  loan_amount: number;
}

export interface IVcMonthlyExiting {
  user_id: string | any;
  total_monthly_contribution: number;
  remaning_loan: number;
  total_vyaj: number;
  total: number;
  total_paid: number;
}

export interface IVcMonthly extends Document {
  vc_id: { type: Schema.Types.ObjectId; ref: "Venture"; required: true };
  last_month_remaining_amount: number;
  total_monthly_contribution: number;
  total_loan_repayment: number;
  total_part_payment: number;
  total: number;
  total_loan_vyaj: number;
  loans: IVcMonthlyLoan[];
  // New field to track exiting members and their amounts
  exiting_members: IVcMonthlyExiting[];
  remaining_amount: number;
  month: number;
  year: number;
  lock: boolean;
  created_at: Date;
  updated_at: Date;
}

const VcMonthlyLoanSchema = new Schema<IVcMonthlyLoan>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    loan_amount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false },
);

const VcMonthlyExitingSchema = new Schema<IVcMonthlyExiting>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    total_monthly_contribution: {
      type: Number,
      required: true,
    },
    remaning_loan: {
      type: Number,
      required: true,
    },
    total_vyaj: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    total_paid: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false },
);

const VcMonthlySchema = new Schema<IVcMonthly>(
  {
    vc_id: {
      type: String,
      required: true,
      index: true,
    },
    last_month_remaining_amount: {
      type: Number,
      required: true,
      default: 0,
    },
    total_monthly_contribution: {
      type: Number,
      required: true,
      default: 0,
    },
    total_loan_repayment: {
      type: Number,
      required: true,
      default: 0,
    },
    total_part_payment: {
      type: Number,
      required: true,
      default: 0,
    },
    total_loan_vyaj: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    loans: {
      type: [VcMonthlyLoanSchema],
      default: [],
    },

    exiting_members: {
      type: [VcMonthlyExitingSchema],
      default: [],
    },

    remaining_amount: {
      type: Number,
      required: true,
      default: 0,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    lock: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

// Create compound index for vc_id, month, and year to ensure uniqueness
VcMonthlySchema.index({ vc_id: 1, month: 1, year: 1 }, { unique: true });

// Pre-save hook to calculate total and remaining_amount
VcMonthlySchema.pre("save", async function (this: IVcMonthly) {
  // Calculate total from the five fields
  this.total =
    this.last_month_remaining_amount +
    this.total_monthly_contribution +
    this.total_loan_repayment +
    this.total_loan_vyaj +
    this.total_part_payment;

  // Calculate total loans
  const totalLoans = this.loans.reduce(
    (sum, loan) => sum + loan.loan_amount,
    0,
  );

  // Calculate total exiting amount
  const totalExiting = this.exiting_members.reduce(
    (sum, member) => sum + member.total_paid,
    0,
  );

  // Calculate remaining_amount = total - total loans - total exiting
  this.remaining_amount = this.total - totalLoans - totalExiting;
});

// Force recompilation to pick up schema changes in development
if (mongoose.models.VcMonthly) {
  delete mongoose.models.VcMonthly;
}

const VcMonthlyModel =
  mongoose.models.VcMonthly ||
  mongoose.model<IVcMonthly>("VcMonthly", VcMonthlySchema);

export default VcMonthlyModel;
