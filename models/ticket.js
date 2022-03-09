const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Summary = require("./summary");

const TicketSchema = new Schema(
  {
    ticketNumber: {
      type: Number,
      unique: true,
      required: true,
      validate: {
        validator: function (num) {
          return num.toString().length == 6;
        },
        message: "Ticket number length must be greater than 6 digits)"
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
    summary: [
      {
        type: Schema.Types.ObjectId,
        ref: "Summary"
      }
    ]
  },
  { timestamps: true }
);

TicketSchema.post("findOneAndDelete", async function (data) {
  if (data) {
    await Summary.deleteMany({
      _id: { $in: data.summary }
    });
  }
});

// the { timestamps: true } will create 2 fields for us:
// createdAt and updatedAt.

module.exports = mongoose.model("Ticket", TicketSchema);
