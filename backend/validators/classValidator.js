import Joi from 'joi';

export const classValidationSchema = Joi.object({
    grade: Joi.number().required(),
    section: Joi.string().valid('A', 'B', 'C', 'D', 'E', 'F').required(),
    campus: Joi.string().allow('').optional(),
    subjects: Joi.array().items(Joi.string()).optional(),
    classTeacher: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
    createdBy: Joi.string().optional(),
})