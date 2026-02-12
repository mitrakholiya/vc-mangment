import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVenture extends Document {
  name: string;
  monthly_emi: number; // Was monthly_contribution
  interest_rate: number; // Was loan_interest_percent
  start_date: Date;
  collection_date: number; // Monthly occurrence date (1-31)
  max_loan_amount: number; // Was max_loan_percent, now fixed amount
  loan_repayment_percent: number; // Fixed Monthly Loan Repayment percentage
  members: {
    user_id: string;
    role: "ADMIN" | "MEMBER";
  }[]; // Array of objects with user_id and role
  requests?: string[]; // Array of strings (Request IDs or User IDs?)

  // System fields kept for compatibility/logic
  created_at?: Date;
  updated_at?: Date;
  created_by: string;
  fund_wallet: number;
  status: string;
 
  exiting_panding?: {
    user_id: string;
    amount: number;
  }[];
}

const VentureSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    monthly_emi: { type: Number, required: true },
    interest_rate: { type: Number, required: true },
    start_date: { type: Date, required: true },
    collection_date: { type: Number, required: true }, // Day of the month
    max_loan_amount: { type: Number, required: true },
    loan_repayment_percent: { type: Number, required: true },

    members: [
      {
        user_id: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["ADMIN", "MEMBER"],
          default: "MEMBER",
        },
      },
    ],
    exiting_panding: [
      {
        user_id: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],
    requests: [{ type: Schema.Types.ObjectId, ref: "User" }], // Changed from "user" to "User"

    // Existing fields
    created_by: { type: String, required: true, ref: "User" },
    fund_wallet: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

// Force recompilation to pick up schema changes in development
if (mongoose.models.Venture) {
  delete mongoose.models.Venture;
}

const VentureModel: Model<IVenture> =
  mongoose.models.Venture || mongoose.model<IVenture>("Venture", VentureSchema);

export default VentureModel;
