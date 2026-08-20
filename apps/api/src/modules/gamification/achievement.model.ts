import { Schema, model } from 'mongoose';

const achievementSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    icon: { type: String },
  },
  { timestamps: true },
);

export const Achievement = model('Achievement', achievementSchema);
