import { Schema, model, models, type Model, type Types } from "mongoose";

export interface ITopic {
  _id: string;
  userId: Types.ObjectId;
  name: string;
  icon: string;
  color: string;
  order: number;
  createdAt: Date;
}

const TopicSchema = new Schema<ITopic>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: "📁" },
    color: { type: String, default: "#6366f1" },
    order: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Topic: Model<ITopic> =
  (models.Topic as Model<ITopic>) || model<ITopic>("Topic", TopicSchema);
