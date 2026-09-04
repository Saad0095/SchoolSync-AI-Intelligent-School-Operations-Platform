import Joi from 'joi';

export const campusValidator = Joi.object({
    name: Joi.string().required(),
    code: Joi.string().required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    location: Joi.object({
        type: Joi.string().valid('Point').required(),
        coordinates: Joi.array().items(Joi.number()).length(2).required()
    }).required(),
    contact: Joi.object({
        phone: Joi.string().required(),
        email: Joi.string().email().required()
    }).required(),
    campusAdmin: Joi.string().required(),
    isActive: Joi.boolean().optional()
})