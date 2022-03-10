const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");


const VAUserSchema = new Schema();

TicketOwner.plugin(passportLocalMongoose);

module.exports = mongoose.model('VAUser', VAUserSchema);