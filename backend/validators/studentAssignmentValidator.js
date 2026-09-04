import Joi from 'joi';

export const studentAssignmentSchema = Joi.object({
    studentId: Joi.string().required(),
    classId: Joi.string().required(),
    campusId: Joi.string().allow('').optional(),
    rollNumber: Joi.string().min(5).max(5).required(),
    academicSession: Joi.string().required(),
})