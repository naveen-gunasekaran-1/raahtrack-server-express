import mongoose, { Schema, Document } from "mongoose";

export interface IBus extends Document {
  busId: number;
  busRoute: string;
  busStartTime: Date;
}

const BusSchema: Schema = new Schema<IBus>(
  {
    busId: {
      type: Number,
      required: true,
      unique: true,
    },
    busRoute: {
      type: String,
      required: true,
      trim: true,
    },
    busStartTime: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IBus>("Bus", BusSchema);
