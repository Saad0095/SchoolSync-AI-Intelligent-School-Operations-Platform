import mongoose from "mongoose";
import User from "../models/User.js";

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/school-management-system";

const [,, emailArg, passwordArg] = process.argv;

const usage = () => {
  console.log("Usage: node seed/reset-password.js <email> <newPassword>");
  console.log("Example: node seed/reset-password.js teacher@gmail.com teacher123");
};

if (!emailArg || !passwordArg) {
  usage();
  process.exit(1);
}

const reset = async (email, newPassword) => {
  try {
    await mongoose.connect(MONGODB_URI, { autoIndex: true });
    console.log(`Connected to MongoDB -> ${MONGODB_URI}`);

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.error(`User with email '${email}' not found.`);
      process.exit(2);
    }

    user.password = newPassword;
    await user.save();

    console.log(`Password for '${email}' has been reset successfully.`);
    process.exit(0);
  } catch (err) {
    console.error("Error while resetting password:", err);
    process.exit(3);
  }
};

reset(emailArg, passwordArg);
