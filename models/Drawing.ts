import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IDrawing {
  _id: string;
  userId: Types.ObjectId;
  title: string;
  /** Scene Excalidraw: { elements, appState, files } */
  data: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const DrawingSchema = new Schema<IDrawing>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "", trim: true },
    data: { type: Schema.Types.Mixed, default: { elements: [], appState: {}, files: {} } },
  },
  { timestamps: true }
);
DrawingSchema.index({ userId: 1, updatedAt: -1 });

export const Drawing: Model<IDrawing> =
  (models.Drawing as Model<IDrawing>) || model<IDrawing>("Drawing", DrawingSchema);
