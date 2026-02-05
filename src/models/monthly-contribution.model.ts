import mongoose, { Schema, Document, Model } from "mongoose";

export enum ContributionStatus {
  PAID = "PAID",
  PENDING = "PENDING",
}

export interface IMonthlyContribution extends Document {
  vc_id: mongoose.Types.ObjectId | string;
  user_id: mongoose.Types.ObjectId | string;
  amount: number;
  month: number;
  year: number;
  status: ContributionStatus;
  paid_at?: Date;
}

const MonthlyContributionSchema: Schema = new Schema({
  vc_id: { type: Schema.Types.ObjectId, required: true, ref: "Venture" },
  user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  amount: { type: Number, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  status: {
    type: String,
    enum: Object.values(ContributionStatus),
    default: ContributionStatus.PENDING,
    required: true,
  },
  paid_at: { type: Date },
});

// Unique index: one contribution per user per venture per month
MonthlyContributionSchema.index(
  { user_id: 1, vc_id: 1, month: 1, year: 1 },
  { unique: true },
);

const MonthlyContributionModel: Model<IMonthlyContribution> =
  mongoose.models.MonthlyContribution ||
  mongoose.model<IMonthlyContribution>(
    "MonthlyContribution",
    MonthlyContributionSchema,
  );

export default MonthlyContributionModel;
