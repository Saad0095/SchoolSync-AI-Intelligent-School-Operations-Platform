import Joi from 'joi'

export const scoreValidation = Joi.object({
    campusId: Joi.string().allow('').optional(),
    classId: Joi.string().required(),
    subjectId: Joi.string().required(),
    examId: Joi.string().required(),
    scores: Joi.array().items(
        Joi.object({
            studentId: Joi.string().required(),
            marksObtained: Joi.number().min(0).required()
        })
    ).min(1).required()
})