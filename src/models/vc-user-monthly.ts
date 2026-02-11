import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVcUserMonthly extends Document {
  vc_id: mongoose.Types.ObjectId | string;
  user_id: mongoose.Types.ObjectId | string;
  month: number;
  year: number;
  monthly_contribution: number;
  loan_amount: number;
  last_month_remaining_loan: number;
  loan_interest: number;
  loan_monthly_emi: number;
  part_payment: number;
  
  remaining_loan: number;
  total_payable: number;
  created_at?: Date;
  updated_at?: Date;
  status: string;
  paid_at?: Date;
}

const VcUserMonthlySchema: Schema = new Schema(
  {
    vc_id: { type: Schema.Types.ObjectId, ref: "Venture", required: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    monthly_contribution: { type: Number, required: true },
    loan_amount: { type: Number, required: true },
    last_month_remaining_loan: { type: Number, required: true },
    loan_interest: { type: Number, required: true },
    loan_monthly_emi: { type: Number, required: true },
    part_payment: { type: Number, required: true, default: 0 },

    remaining_loan: { type: Number, required: true },
    total_payable: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      default: "none",
      enum: ["none", "pending", "paid", "approved"],
    },
    paid_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

VcUserMonthlySchema.index(
  { user_id: 1, vc_id: 1, month: 1, year: 1 },
  { unique: true },
);

const VcUserMonthlyModel: Model<IVcUserMonthly> =
  (mongoose.models.vc_user_monthly as Model<IVcUserMonthly>) ||
  mongoose.model<IVcUserMonthly>("vc_user_monthly", VcUserMonthlySchema);

export default VcUserMonthlyModel;
