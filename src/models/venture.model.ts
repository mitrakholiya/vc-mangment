import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVenture extends Document {
    name: string;
    currency: string;
    monthly_contribution: number;
    loan_interest_percent: number;
    max_loan_percent: number;
    created_at: Date;
    updated_at: Date;
    created_by: string;
    fund_wallet: number;
    status: string;
}

const VentureSchema: Schema = new Schema({
    name: { type: String, required: true },
    currency: { type: String, required: true },
    monthly_contribution: { type: Number, required: true },
    loan_interest_percent: { type: Number, required: true },
    max_loan_percent: { type: Number, required: true },
    created_by: { type: String, required: true, ref: 'user' },
    fund_wallet: { type: Number, required: true, default: 0 },
    status: { type: String, required: true ,enum: ['active', 'inactive'], default: 'inactive' },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const VentureModel: Model<IVenture> = mongoose.models.Venture || mongoose.model<IVenture>('Venture', VentureSchema);

export default VentureModel;
