import mongoose, { Schema, Document, Model } from 'mongoose';

export enum PaymentMethod {
    BANK = 'BANK',
    WALLET = 'WALLET',
}

export interface ILoanRepayment extends Document {
    loan_id: string;
    amount: number;
    principal_amount: number;
    interest_amount: number;
    paid_at: Date;
    payment_method: PaymentMethod;
}

const LoanRepaymentSchema: Schema = new Schema({
    loan_id: { type: String, required: true, ref: 'Loan' },
    amount: { type: Number, required: true },
    principal_amount: { type: Number, required: true },
    interest_amount: { type: Number, required: true },
    paid_at: { type: Date, default: Date.now },
    payment_method: {
        type: String,
        enum: Object.values(PaymentMethod),
        required: true
    },
});

const LoanRepaymentModel: Model<ILoanRepayment> = mongoose.models.LoanRepayment || mongoose.model<ILoanRepayment>('LoanRepayment', LoanRepaymentSchema);

export default LoanRepaymentModel;
