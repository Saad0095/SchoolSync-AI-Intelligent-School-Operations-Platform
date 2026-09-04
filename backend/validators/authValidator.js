import Joi from 'joi';

const normalizeGender = (value, helpers) => {
    const normalized = value?.trim().toLowerCase();

    if (normalized === 'male') return 'Male';
    if (normalized === 'female') return 'Female';

    return helpers.error('any.only');
};

export const registerSchema = Joi.object({
    name: Joi.string().required(),
    gender: Joi.string().custom(normalizeGender).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    contact: Joi.string().required(),
    address: Joi.string().allow('').optional(),
    dob: Joi.date().required(),
    role: Joi.string().valid('campus-admin', 'teacher', 'student', 'parent').optional(),
    isActive: Joi.boolean().optional(),
    createdBy: Joi.string().optional(),
    parentOf: Joi.array().items(Joi.string()).optional(),
})