module.exports.isLoggedIn = (req, res, next) => {
  if (!req.user) {
    // user is not logged in
    res.redirect("/identify");
  } else {
    // logged in and can create new ticket
    next();
  }
};
