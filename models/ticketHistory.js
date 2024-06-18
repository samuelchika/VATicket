const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TicketHistory = new Schema({
  ticketId: {
    type: Schema.Types.ObjectId,
    ref: "Ticket",
    required: true
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: "TicketOwner",
    required: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: "TicketOwner",
    required: true
  },
  reclaimed: {
    type: Number,
    enum: [0, 1],
    default: 0
  },
  dateAssigned: {
    type: Date,
    default: new Date()
  }
});

module.exports = new mongoose.model("TicketHistory", TicketHistory);
