const Joi = require('joi');

module.exports.ticketValidation = Joi.object({
    ticketNumber: Joi.number()
                    .integer()
                    .required(),
    customer: Joi.string()
                .required(),
    numberDevices: Joi.number(),
    request: Joi.string(),
    warranty: Joi.boolean(),
    summary: Joi.string()
                .required()
});

module.exports.userValidation = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required(),
    password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
    confirmPassword: Joi.string().required().valid(Joi.ref('password'))
});