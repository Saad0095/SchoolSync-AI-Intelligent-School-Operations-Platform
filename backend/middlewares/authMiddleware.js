import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Token is missing!" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Invalid token!" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized: Invalid Token!" });
  }
};

export const authRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized!" });
    }
    next();
  };
};
