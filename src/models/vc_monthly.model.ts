import mongoose, { Schema, Document, Types } from "mongoose";

export interface IVcMonthlyLoan {
  user_id: string;
  loan_amount: number;
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
  remaining_amount: number;
  month: number;
  year: number;
  created_at: Date;
  updated_at: Date;
}

const VcMonthlyLoanSchema = new Schema<IVcMonthlyLoan>(
  {
    user_id: {
      type: String,
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

  // Calculate remaining_amount = total - total loans
  this.remaining_amount = this.total - totalLoans;
});

const VcMonthlyModel =
  mongoose.models.VcMonthly ||
  mongoose.model<IVcMonthly>("VcMonthly", VcMonthlySchema);

export default VcMonthlyModel;
