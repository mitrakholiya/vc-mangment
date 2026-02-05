import mongoose, { Schema, Document, Model } from 'mongoose';

export enum VoteType {
    YES = 'YES',
    NO = 'NO',
}

export interface IInvestmentApproval extends Document {
    investment_id: string;
    user_id: string;
    vote: VoteType;
    voted_at: Date;
}

const InvestmentApprovalSchema: Schema = new Schema({
    investment_id: { type: String, required: true, ref: 'Investment' },
    user_id: { type: String, required: true, ref: 'User' },
    vote: {
        type: String,
        enum: Object.values(VoteType),
        required: true
    },
    voted_at: { type: Date, default: Date.now },
});

const InvestmentApprovalModel: Model<IInvestmentApproval> = mongoose.models.InvestmentApproval || mongoose.model<IInvestmentApproval>('InvestmentApproval', InvestmentApprovalSchema);

export default InvestmentApprovalModel;
