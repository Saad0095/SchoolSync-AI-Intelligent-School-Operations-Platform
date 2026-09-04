import Joi from 'joi'

export const teacherAssignmentSchema = Joi.object({
    teacherId: Joi.string().required(),
    subjectId: Joi.string().required(),
    classId: Joi.string().required(),
    campusId: Joi.string().allow('').optional(),
    action: Joi.string().valid('reassign', 'unassign').optional(),
})