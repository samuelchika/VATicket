const BaseJoi = require("joi");
const sanitizeHtml = require("sanitize-html");


const extension = (joi) => ({
  type: "string",
  base: joi.string(),
  messages: {
    "string.escapeHTML": "{{#label}} must not include HTML!",
    "string.passwordError": "{{#label}} length must be 8 - 16 character long",
    "string:validateTicketNumber": "Ticket must be a number"
  },
  rules: {
    escapeHTML: {
      validate(value, helpers) {
        const clean = sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {}
        });
        if (clean !== value)
          return helpers.error("string.escapeHTML", { value });
        return clean;
      }
    },
    checkPasswordLenghth:{
      validate(value, helpers) {
        const length = value.length;
        if((length < 8) && (length >= 16)) 
          return helpers.error("string.passwordError", { value });
        
        return value
      }
    },
    verifyTicketNumber: {
      validate(value, helpers) {
        if(!isNaN(value) && value.toString().length >= 6)
          return parseInt(value)
        return helpers.error("string:validateTicketNumber", { value })
      }
    }
  }
});

const Joi = BaseJoi.extend(extension);

module.exports.ticketValidation = Joi.object({
  ticketNumber: Joi.string().required().escapeHTML().min(6).max(11),
  customer: Joi.string().required().escapeHTML(),
  numberDevices: Joi.number(),
  request: Joi.string().escapeHTML(),
  warranty: Joi.boolean(),
  summary: Joi.string().required().escapeHTML()
});

module.exports.userValidation = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  //password: Joi.string().regex(/[a-zA-Z0-9]{2,5}$/),
  password: Joi.string().pattern(new RegExp(/^[a-zA-Z0-9]{8,16}$/)).checkPasswordLenghth(),
  confirmPassword: Joi.string().required().valid(Joi.ref("password")).checkPasswordLenghth()
});

module.exports.searchValidation = Joi.object({
  ticketNumber: Joi.string().required().escapeHTML().min(6).max(8).verifyTicketNumber()
})