const Ticket = require("./models/ticket");

module.exports.isLoggedIn = (req, res, next) => {  
  if (!req.user) {
    // user is not logged in
    res.redirect("/identify");
  } else {
    // logged in and can create new ticket
    next();
  }
};

module.exports.isAuthorized = async (req, res, next) => {
  // we get the id from the param
  const { id } = req.params;
  
  // we have to check the ticket owner if its same as the req.user.
  // the above id is the id for the ticket
  const ticket = await Ticket.findById(id);
  
  if (ticket) {
    // we were able to find the ticket.
    if(ticket.owner.equals(req.user._id)) {
      // this is the owner of the ticket.
      // futher action can be carried out.
      next();
    } else {
      // the user is not the owner of the ticket.
      req.flash("error", "You do not have the privilege to perform such operation");
    }
  } else {
    // we can't find the ticket.
    res.redirect("/tickets");
  }
}