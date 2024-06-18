const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const TicketOwner = new Schema();

TicketOwner.plugin(passportLocalMongoose);

module.exports = mongoose.model("TicketOwner", TicketOwner);
