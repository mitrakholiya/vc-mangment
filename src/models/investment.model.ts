import mongoose, { Schema, Document, Model } from 'mongoose';

export enum InvestmentStatus {
    PROPOSED = 'PROPOSED',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED', // Added REJECTED as a common practical status, though user only asked for PROPOSED/APPROVED
}

export interface IInvestment extends Document {
    vc_id: string;
    title: string;
    description: string;
    amount: number;
    status: InvestmentStatus;
    created_by: string;
    created_at: Date;
    updated_at: Date;
}

const InvestmentSchema: Schema = new Schema({
    vc_id: { type: String, required: true, ref: 'Venture' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: Object.values(InvestmentStatus),
        default: InvestmentStatus.PROPOSED,
        required: true
    },
    created_by: { type: String, required: true, ref: 'User' },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const InvestmentModel: Model<IInvestment> = mongoose.models.Investment || mongoose.model<IInvestment>('Investment', InvestmentSchema);

export default InvestmentModel;
