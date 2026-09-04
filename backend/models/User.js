import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    gender: { type: String, enum: ["Male", "Female"], required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, min: 6 },
    contact: { type: String, required: true },
    address: { type: String },
    dob: { type: Date, required: true },
    role: {
      type: String,
      enum: ["super-admin", "campus-admin", "teacher", "student", "parent"],
      default: "student",
    },
    parentOf: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}

  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default model("User", userSchema);
