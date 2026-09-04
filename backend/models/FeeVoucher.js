import { model, Schema } from "mongoose";

const paymentSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Payment amount must be greater than zero"],
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "cheque", "online"],
      default: "cash",
    },
    transactionId: {
      type: String,
      default: "",
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const feeVoucherSchema = new Schema(
  {
    voucherNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    campus: {
      type: Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentEnrollment: {
      type: Schema.Types.ObjectId,
      ref: "StudentEnrollment",
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      index: true,
    },
    feeStructure: {
      type: Schema.Types.ObjectId,
      ref: "FeeStructure",
    },
    title: {
      type: String,
      required: true,
    },
    feeType: {
      type: String,
      enum: ["tuition", "admission", "transport", "exam", "miscellaneous"],
      default: "tuition",
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
    remainingBalance: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "partially_paid", "paid", "overdue"],
      default: "pending",
      index: true,
    },
    remarks: {
      type: String,
      default: "",
    },
    payments: [paymentSchema],
  },
  { timestamps: true }
);

feeVoucherSchema.index({ campus: 1, student: 1, status: 1 });

const FeeVoucher = model("FeeVoucher", feeVoucherSchema);
export default FeeVoucher;
