import Joi from 'joi';

export const studentAssignmentSchema = Joi.object({
    classId: Joi.string().required(),
    records: Joi.array().items(Joi.object({
        rollNumber: Joi.string().required(),
        status: Joi.string().valid('present', 'absent', 'leave').required()
    })),
    term: Joi.string().required(),
    academicSession: Joi.string().required(),
    date: Joi.alternatives().try(Joi.date(), Joi.string()).optional(),
})