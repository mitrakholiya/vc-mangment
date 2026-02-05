import mongoose, { Schema, Document, Model } from 'mongoose';

export enum ReferenceType {
    LOAN = 'LOAN',
    INVESTMENT = 'INVESTMENT',
    CONTRIBUTION = 'CONTRIBUTION',
}

export interface ILedger extends Document {
    vc_id: string;
    debit_account: string;
    credit_account: string;
    amount: number;
    reference_type: ReferenceType;
    reference_id: string;
    created_at: Date;
    note?: string;
}

const LedgerSchema: Schema = new Schema({
    vc_id: { type: String, required: true, ref: 'Venture' },
    debit_account: { type: String, required: true },
    credit_account: { type: String, required: true },
    amount: { type: Number, required: true },
    reference_type: {
        type: String,
        enum: Object.values(ReferenceType),
        required: true
    },
    reference_id: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    note: { type: String },
});

const LedgerModel: Model<ILedger> = mongoose.models.Ledger || mongoose.model<ILedger>('Ledger', LedgerSchema);

export default LedgerModel;
