const  mongoose   = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketNumber: {
        type: Number,
        unique: true,
        required: true,
        validate: {
            validator: function(num) {
                return num.toString().length == 6;
            },
            message: "Ticket number length must be greater 6 digits)"
        }
    },
    customer: {
        type: String,
        required: true
    },
    numberDevices: {
        type: Number
    },
    request: {
        type: String
    },
    warranty: {
        type: Boolean
    },
    summary: [{
        summary: {
            type: String,
            required: true
        },
        dateAdded: {
            type: Date,
            default: new Date()
        },
        _id : false
    }]
     
}, { timestamps: true });

// the { timestamps: true } will create 2 fields for us: 
// createdAt and updatedAt.

     
module.exports = mongoose.model('Ticket', ticketSchema);