import { Schema, model, models, type Model } from "mongoose";

export interface IUser {
  _id: string;
  username: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const User: Model<IUser> = (models.User as Model<IUser>) || model<IUser>("User", UserSchema);
