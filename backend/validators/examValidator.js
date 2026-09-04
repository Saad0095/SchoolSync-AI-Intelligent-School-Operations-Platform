import Joi from 'joi'

export const examValidation = Joi.object({
    term: Joi.string().required(),
    academicSession: Joi.string().required(),
    classId: Joi.string().required(),
    campusId: Joi.string().allow('').optional(),
    subjectId: Joi.string().required(),
    totalMarks: Joi.number().required(),
    type: Joi.string().required()
})