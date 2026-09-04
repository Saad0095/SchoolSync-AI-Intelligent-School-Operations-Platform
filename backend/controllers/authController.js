import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Campus from "../models/Campus.js";
import StudentEnrollment from "../models/StudentEnrollment.js";
import Assignment from "../models/Assignment.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import { Parser } from "json2csv";
import nodemailer from "nodemailer";
import logger from "../utils/logger.js";

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const normalizeGender = (gender) => {
  if (!gender) return gender;

  const normalized = gender.trim().toLowerCase();
  if (normalized === "male") return "Male";
  if (normalized === "female") return "Female";

  return gender;
};

export const register = async (req, res) => {
  try {
    const { name, gender, email, password, contact, address, dob } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`Register failed: Email already exists (${email})`);
      return res.status(400).json({ message: "Email already registered!" });
    }

    const user = new User({
      name,
      gender: normalizeGender(gender),
      email,
      password,
      contact,
      address,
      dob,
      role: "super-admin",
    });

    await user.save();
    logger.info(`Super-admin registered: ${email}`);

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`Register error for ${req.body.email}: ${error.message}`);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const registerCampusAdmin = async (req, res) => {
  try {
    const { name, gender, email, password, contact, address, dob } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`Campus-admin registration failed: Email already exists (${email})`);
      return res.status(400).json({ message: "Email already registered!" });
    }

    if (req.user.role !== "super-admin") {
      logger.warn(`Unauthorized campus-admin registration attempt by ${req.user.email}`);
      return res.status(403).json({ error: "You dont have permission for this action" });
    }

    const user = new User({
      name,
      gender: normalizeGender(gender),
      email,
      password,
      contact,
      address,
      dob,
      role: "campus-admin",
      createdBy: req.user._id,
    });

    await user.save();
    logger.info(`Campus-admin registered: ${email} by ${req.user.email}`);

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`Campus-admin registration error: ${error.message}`);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const addTeacherStudent = async (req, res) => {
  try {
    const { name, gender, email, password, contact, address, role, dob, parentOf } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`Add teacher/student failed: Email already exists (${email})`);
      return res.status(400).json({ message: "Email already registered!" });
    }

    if (req.user.role !== "super-admin" && req.user.role !== "campus-admin") {
      logger.warn(`Unauthorized user creation attempt by ${req.user.email}`);
      return res.status(403).json({ error: "You dont have permission for this action" });
    }

    if (req.user.role === "campus-admin" && !["teacher", "student"].includes(role)) {
      logger.warn(`Campus-admin ${req.user.email} tried to create ${role}`);
      return res.status(403).json({ error: "Campus-admin can only create teacher or student" });
    }

    const userData = {
      name,
      gender: normalizeGender(gender),
      email,
      password,
      contact,
      address,
      dob,
      role,
      createdBy: req.user._id,
    };

    if (role === "parent" && parentOf?.length) {
      userData.parentOf = parentOf;
    }

    const user = new User(userData);

    await user.save();
    logger.info(`User (${role}) created: ${email} by ${req.user.email}`);

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`Add teacher/student error: ${error.message}`);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`Login failed: User not found (${email})`);
      return res.status(400).json({ message: "Invalid email or password!" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn(`Login failed: Wrong password for ${email}`);
      return res.status(400).json({ message: "Invalid email or password!" });
    }

    const token = generateToken(user._id, user.role);
    logger.info(`Login successful for ${email}`);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    logger.error(`Login error for ${req.body.email}: ${error.message}`);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      logger.warn(`getMe: User not found (${req.user._id})`);
      return res.status(404).json({ message: "User not found" });
    }

    logger.info(`Fetched profile for ${req.user.email}`);
    res.json(user);
  } catch (error) {
    logger.error(`getMe error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { role: userRole } = req.user;
    let filter = {};
    const {
      role,
      gender,
      isActive,
      search,
      pageNumber = 1,
      limit = 10,
      downloadCSV = "false",
    } = req.query;

    const skip = (parseInt(pageNumber) - 1) * parseInt(limit);

    if (userRole === "super-admin") {
      if (role) filter.role = role;
      if (gender) filter.gender = normalizeGender(gender);
      if (isActive) filter.isActive = isActive === "true";
    } else if (userRole === "campus-admin") {
      const adminCampus = await Campus.findOne({ campusAdmin: req.user._id });
      let allowedUserIds = [];
      if (adminCampus) {
        const studentIds = await StudentEnrollment.distinct("student", { campus: adminCampus._id });
        const campusAssignments = await Assignment.distinct("_id", { campus: adminCampus._id });
        const teacherAssigns = await TeacherAssignment.find({ assignments: { $in: campusAssignments } }).select("teacher");
        const teacherIds = teacherAssigns.map(t => t.teacher);
        allowedUserIds = [...studentIds, ...teacherIds];
      }

      filter.$or = [
        { createdBy: req.user._id },
        { _id: { $in: allowedUserIds } }
      ];
      filter.role = { $in: ["teacher", "student"] };
      if (gender) filter.gender = normalizeGender(gender);
      if (role) filter.role = role;
      if (isActive) filter.isActive = isActive === "true";
    } else {
      logger.warn(`Unauthorized access to getAllUsers by ${req.user.email}`);
      return res.status(403).json({ message: "Access denied" });
    }

    if (search) {
      const searchConditions = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
      if (filter.$or) {
        filter = {
          $and: [
            { $or: filter.$or },
            { $or: searchConditions }
          ],
          ...Object.fromEntries(Object.entries(filter).filter(([k]) => k !== "$or"))
        };
      } else {
        filter.$or = searchConditions;
      }
    }

    const usersQuery = User.find(filter)
      .select("name email role gender isActive createdAt")
      .sort({ createdAt: -1 });

    if (downloadCSV !== "true") {
      usersQuery.skip(skip).limit(parseInt(limit));
    }

    const users = await usersQuery;

    if (downloadCSV === "true") {
      const fields = ["name", "email", "role", "gender", "isActive", "createdAt"];
      const parser = new Parser({ fields });
      const csv = parser.parse(users);

      logger.info(`${req.user.email} downloaded user list as CSV`);
      res.header("Content-Type", "text/csv");
      res.attachment("users.csv");
      return res.send(csv);
    }

    const total = await User.countDocuments(filter);
    logger.info(`${req.user.email} fetched all users successfully`);

    res.json({
      pageNumber: parseInt(pageNumber),
      limit: parseInt(limit),
      total,
      users,
    });
  } catch (error) {
    logger.error(`getAllUsers error: ${error.message}`);
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const user = await User.findById(id)
      .select("name email role gender isActive createdBy")
      .populate("createdBy", "name email role");

    if (!user) {
      logger.warn(`User not found: ${id}`);
      return res.status(404).json({ message: "User not found" });
    }

    if (userRole === "super-admin") {
      logger.info(`Super-admin viewed user: ${user.email}`);
      return res.json(user);
    } else if (userRole === "campus-admin") {
      if (
        user.createdBy?._id.toString() === req.user._id.toString() &&
        ["teacher", "student"].includes(user.role)
      ) {
        logger.info(`Campus-admin viewed user: ${user.email}`);
        return res.json(user);
      } else {
        logger.warn(`Unauthorized access attempt by ${req.user.email} for user ${user.email}`);
        return res.status(403).json({ message: "Access denied" });
      }
    } else {
      logger.warn(`Unauthorized access attempt by ${req.user.email}`);
      return res.status(403).json({ message: "Access denied" });
    }
  } catch (error) {
    logger.error(`getUserById error: ${error.message}`);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      ...req.body,
      ...(req.body.gender ? { gender: normalizeGender(req.body.gender) } : {}),
    };
    const targetUser = await User.findById(id);

    if (!targetUser) {
      logger.warn(`Update failed: User not found (${id}) by ${req.user.email}`);
      return res.status(404).json({ message: "User not found" });
    }

    if (req.user.role === "super-admin") {
      const user = await User.findByIdAndUpdate(id, updates, { new: true }).select("-password");
      logger.info(`User (${user.email}) updated by super-admin: ${req.user.email}`);
      return res.json({ message: "User updated successfully (super-admin)" });
    }

    if (req.user.role === "campus-admin") {
      if (
        targetUser.createdBy?.toString() === req.user._id.toString() &&
        ["teacher", "student"].includes(targetUser.role)
      ) {
        const user = await User.findByIdAndUpdate(id, updates, { new: true }).select("-password");
        logger.info(`User (${user.email}) updated by campus-admin: ${req.user.email}`);
        return res.json({ message: "User updated successfully (campus-admin)" });
      } else {
        logger.warn(`Unauthorized update attempt by ${req.user.email} on ${targetUser.email}`);
        return res.status(403).json({ message: "Access denied" });
      }
    }

    logger.warn(`Unauthorized role (${req.user.role}) tried to update user`);
    return res.status(403).json({ message: "Access denied" });
  } catch (error) {
    logger.error(`Update user error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id);

    if (!targetUser) {
      logger.warn(`Delete failed: User not found (${id}) by ${req.user.email}`);
      return res.status(404).json({ message: "User not found" });
    }

    if (req.user.role === "super-admin") {
      await targetUser.deleteOne();
      logger.info(`User (${targetUser.email}) deleted by super-admin: ${req.user.email}`);
      return res.json({ message: "User deleted successfully (super-admin)" });
    }

    if (req.user.role === "campus-admin") {
      if (
        targetUser.createdBy?.toString() === req.user._id.toString() &&
        ["teacher", "student"].includes(targetUser.role)
      ) {
        await targetUser.deleteOne();
        logger.info(`User (${targetUser.email}) deleted by campus-admin: ${req.user.email}`);
        return res.json({ message: "User deleted successfully (campus-admin)" });
      } else {
        logger.warn(`Unauthorized delete attempt by ${req.user.email} on ${targetUser.email}`);
        return res.status(403).json({ message: "Access denied" });
      }
    }

    logger.warn(`Unauthorized delete by role (${req.user.role})`);
    return res.status(403).json({ message: "Access denied" });
  } catch (error) {
    logger.error(`Delete user error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      logger.warn(`Forgot password: Email missing`);
      return res.status(400).json({ error: "email is required" });
    }

    const emailExist = await User.findOne({ email: email });
    if (!emailExist) {
      logger.warn(`Forgot password failed: User not found (${email})`);
      return res.status(404).json({ error: "User not found" });
    }

    const resetToken = jwt.sign({ userId: emailExist._id }, process.env.JWT_SECRET, { expiresIn: "5m" });
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PW,
      },
    });

    const mailOptions = {
      from: `"School System" <${process.env.EMAIL_ID}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${emailExist.name || ""},</p>
        <p>You requested to reset your password. Click below to continue:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>This link will expire in 5 minutes.</p>
      `,
    };

    await transport.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}`);
    res.json({ message: "Password reset email sent successfully" });
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token) {
      logger.warn("Reset password failed: Missing token");
      return res.status(400).json({ error: "Token missing" });
    }

    if (!newPassword) {
      logger.warn("Reset password failed: Missing password field");
      return res.status(400).json({ error: "Password field required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      logger.warn(`Reset password failed: User not found for token`);
      return res.status(404).json({ error: "User not found" });
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Password reset successful for ${user.email}`);
    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, contact, address } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (contact) user.contact = contact;
    if (address) user.address = address;

    await user.save();
    res.status(200).json({ message: "Profile updated successfully", user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      contact: user.contact,
      address: user.address,
    }});
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: "Invalid current password" });

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Admin-initiated password reset for another user.
 * - super-admin can reset any user's password.
 * - campus-admin can reset passwords of teachers/students they created.
 */
export const adminResetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Authorization check
    if (req.user.role === "super-admin") {
      // super-admin can reset anyone except themselves (they should use updatePassword for self)
      if (targetUser._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: "Use 'Update Password' to change your own password" });
      }
    } else if (req.user.role === "campus-admin") {
      // campus-admin can only reset teachers/students they created
      if (
        targetUser.createdBy?.toString() !== req.user._id.toString() ||
        !["teacher", "student"].includes(targetUser.role)
      ) {
        logger.warn(`Unauthorized password reset attempt by ${req.user.email} on ${targetUser.email}`);
        return res.status(403).json({ message: "Access denied" });
      }
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    targetUser.password = newPassword;
    await targetUser.save();

    logger.info(`Password reset by ${req.user.role} (${req.user.email}) for ${targetUser.email}`);
    res.status(200).json({ message: `Password reset successfully for ${targetUser.name}` });
  } catch (error) {
    logger.error(`Admin reset password error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
