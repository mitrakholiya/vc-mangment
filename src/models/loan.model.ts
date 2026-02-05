import mongoose, { Schema, Document, Model } from 'mongoose';

export enum LoanStatus {
    ACTIVE = 'ACTIVE',
    CLOSED = 'CLOSED',
}

export enum ApproveStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export interface ILoan extends Document {
    vc_id: string;
    user_id: string;
    principal: number;
    interest_rate: number;
    months: number;
    status: LoanStatus;
    approve_status: ApproveStatus;
    created_at: Date;
    closed_at?: Date;
}

const LoanSchema: Schema = new Schema({
    vc_id: { type: String, required: true, ref: 'Venture' },
    user_id: { type: String, required: true, ref: 'User' },
    principal: { type: Number, required: true },
    interest_rate: { type: Number, required: true },
    months: { type: Number, required: true },
    status: {
        type: String,
        enum: Object.values(LoanStatus),
        default: LoanStatus.ACTIVE,
        required: true
    },
    approve_status: { type: String, enum: Object.values(ApproveStatus), default: ApproveStatus.PENDING, required: true },
    created_at: { type: Date, default: Date.now },
    closed_at: { type: Date },
});

const LoanModel: Model<ILoan> = mongoose.models.Loan || mongoose.model<ILoan>('Loan', LoanSchema);

export default LoanModel;
