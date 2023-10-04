const express = require("express");
const router = express.Router();
const { userValidation } = require("../models/validation");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const catchAsyncError = require("../Error/catchAsyncError");
const TicketUser = require("../models/ticketuser");

const validateUser = (req, res, next) => {
  const { error } = userValidation.validate(req.body);
  if (error) {
    const message = error.details.map((el) => el.message).join(",");
    if (message.includes("confirmPassword")) {
      var errorMessage = "Password Mismatch";
    } else if (message.includes("pattern")) {
      errorMessage =
        "Password must be 8-16 characters containing uppercase, lowercase, numbers and NO SPECIAL CHARACTER";
    }
    req.flash("error", errorMessage);
    res.redirect("/identify");
  } else {
    next();
  }
};

// register user
router.get("/identify", (req, res) => {
  res.render("user/register");
});

router.post(
  "/register",
  validateUser,
  catchAsyncError(async (req, res) => {
    try {
      const { username, password } = req.body;
      const ticketUser = new TicketUser({ username });
      await TicketUser.register(ticketUser, password);
      // user is successfully registered.
      // do not sign them in automatically
      req.flash(
        "success",
        "Account successfully created. Please Login to proceed."
      );
      res.redirect("/identify");
    } catch (e) {
      // user already exist redirect to login.
      // console.log(e.message);
      req.flash("error", e.message);
      res.redirect("/identify");
    }
  })
);

router.post(
  "/login",
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/identify"
  }),
  (req, res) => {
    // user was successfully logged in
    req.flash("success", "Welcome to Virtual Access Ticket Tracker!");
    res.redirect("/");
  }
);

//logout
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success", "Successfully Logged Out!");
  res.redirect("/");
});

module.exports = router;
