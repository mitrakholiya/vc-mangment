// import mongoose, { Schema, Document, Model } from 'mongoose';

// export interface IFundWallet extends Document {
//     vc_id: string;
//     balance: number;
//     last_updated: Date;
// }

// const FundWalletSchema: Schema = new Schema({
//     vc_id: { type: Schema.Types.ObjectId, required: true, ref: 'Venture' },
//     balance: { type: Number, default: 0, required: true },
//     last_updated: { type: Date, default: Date.now }
// });

// const FundWalletModel: Model<IFundWallet> = mongoose.models.FundWallet || mongoose.model<IFundWallet>('FundWallet', FundWalletSchema);

// export default FundWalletModel;
