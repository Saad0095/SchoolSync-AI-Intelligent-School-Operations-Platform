import { model, Schema } from "mongoose";

const feeStructureSchema = new Schema(
  {
    campus: {
      type: Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    feeType: {
      type: String,
      enum: ["tuition", "admission", "transport", "exam", "miscellaneous"],
      default: "tuition",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },
    frequency: {
      type: String,
      enum: ["monthly", "quarterly", "term", "annually", "one-time"],
      default: "monthly",
    },
    dueDate: {
      type: Date,
    },
    description: {
      type: String,
      default: "",
    },
    academicSession: {
      type: String,
      default: "2025-2026",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

feeStructureSchema.index({ campus: 1, isActive: 1 });

const FeeStructure = model("FeeStructure", feeStructureSchema);
export default FeeStructure;
