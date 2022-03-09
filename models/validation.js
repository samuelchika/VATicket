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