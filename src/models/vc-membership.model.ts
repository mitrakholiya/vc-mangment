import mongoose, { Schema, Document, Model } from 'mongoose';

export enum MembershipRole {
    ADMIN = 'ADMIN',
    INVESTOR = 'INVESTOR',
}

export interface IVcMembership extends Document {
    vc_id: Schema.Types.ObjectId | String;
    user_id: Schema.Types.ObjectId | String;
    role: MembershipRole;
    joined_at: Date;
    left_at?: Date;
}

const VcMembershipSchema: Schema = new Schema({
    vc_id: { type: Schema.Types.ObjectId || String, required: true, ref: 'Venture' },
    user_id: { type: Schema.Types.ObjectId || String, required: true, ref: 'User' },
    role: {
        type: String,
        enum: Object.values(MembershipRole),
        required: true,
        default: "INVESTOR"
    },
    joined_at: { type: Date, default: Date.now },
    left_at: { type: Date },
});

VcMembershipSchema.index(
    { user_id: 1, vc_id: 1 },
    { unique: true }
);

const VcMembershipModel: Model<IVcMembership> = mongoose.models.VcMembership || mongoose.model<IVcMembership>('VcMembership', VcMembershipSchema);

export default VcMembershipModel;
