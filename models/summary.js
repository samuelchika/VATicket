const { required } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SummarySchema = new Schema(
  {
    summary: {
      type: String,
      required: true
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "TicketOwner",
      required: true
    },
    dateAdded: {
      type: Date,
      default: new Date()
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Summary", SummarySchema);
