import mongoose, { Schema, Document, Model } from 'mongoose';

// export enum UserRole {
//     ADMIN = 'ADMIN',
//     USER = 'USER',
// }

export interface IUser extends Document {
    name: string;
    email: string;
    password_hash: string;
    phone?: string;
    // role: UserRole;
    created_at: Date;
    updated_at: Date;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    phone: { type: String },
    // role: {
    //     type: String,
    //     enum: Object.values(UserRole),
    //     default: UserRole.USER,
    //     required: true
    // },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default UserModel;
