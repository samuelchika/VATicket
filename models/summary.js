const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SummarySchema = new Schema(
  {
    summary: {
      type: String,
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
