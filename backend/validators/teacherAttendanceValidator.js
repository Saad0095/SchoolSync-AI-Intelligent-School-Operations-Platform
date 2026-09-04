import Joi from 'joi'

export const teacherAttendanceValidator = Joi.object({
    teacher: Joi.string().required(),
    status: Joi.string().valid('present', 'absent', 'leave').required(),
    campus: Joi.string().allow('').optional(),
    checkIn: Joi.date().optional(),
    checkOut: Joi.date().optional(),
    date: Joi.date().optional(),
    markedBy: Joi.string().optional()
})