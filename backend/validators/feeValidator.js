import Joi from "joi";

export const feeStructureValidator = Joi.object({
  name: Joi.string().required(),
  feeType: Joi.string()
    .valid("tuition", "admission", "transport", "exam", "miscellaneous")
    .default("tuition"),
  amount: Joi.number().greater(0).required(),
  frequency: Joi.string()
    .valid("monthly", "quarterly", "term", "annually", "one-time")
    .default("monthly"),
  dueDate: Joi.date().optional().allow(null, ""),
  description: Joi.string().optional().allow(""),
  academicSession: Joi.string().optional().default("2025-2026"),
  isActive: Joi.boolean().optional(),
});

export const generateVouchersValidator = Joi.object({
  feeStructureId: Joi.string().optional().allow(null, ""),
  classId: Joi.string().optional().allow(null, ""),
  studentId: Joi.string().optional().allow(null, ""),
  title: Joi.string().required(),
  feeType: Joi.string()
    .valid("tuition", "admission", "transport", "exam", "miscellaneous")
    .default("tuition"),
  amount: Joi.number().greater(0).required(),
  dueDate: Joi.date().required(),
  remarks: Joi.string().optional().allow(""),
}).or("classId", "studentId");

export const recordPaymentValidator = Joi.object({
  amount: Joi.number().greater(0).required(),
  paymentDate: Joi.date().optional().default(Date.now),
  paymentMethod: Joi.string()
    .valid("cash", "bank_transfer", "cheque", "online")
    .default("cash"),
  transactionId: Joi.string().optional().allow(""),
  notes: Joi.string().optional().allow(""),
});
