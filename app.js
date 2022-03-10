require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const methodOverride = require("method-override");
const Ticket = require("./models/ticket");
const Summary = require("./models/summary");
const { ticketValidation, userValidation } = require("./models/validation");
const { isLoggedIn } = require("./middleware");
const catchAsyncError = require("./Error/catchAsyncError");
const ErrorHandler = require("./Error/ErrorHanlder");
const TicketUser = require("./models/ticketuser");

const app = express();
// connect to mongoose db

main()
  .then(() => console.log("Database Connected"))
  .catch((err) => console.log(err));
async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
}

app.set("view engine", "ejs");
//const path = require('path')
app.use(methodOverride("_method"));
app.use(express.static(path.join(path.resolve(), "public")));

const port = process.env.PORT || 5000;

// for form data
app.use(
  express.urlencoded({
    extended: true
  })
);

// session
const sessionConfig = {
  httpOnly: true,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expire: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};

app.use(session(sessionConfig));

app.use(flash());

// we start working on passport from here
app.use(passport.initialize());
app.use(passport.session()); // this is for the passport session

passport.use(new LocalStrategy(TicketUser.authenticate()));

// serialize and deserialize user
passport.serializeUser(TicketUser.serializeUser());
passport.deserializeUser(TicketUser.deserializeUser());

// making flash global.
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.warning = req.flash("warning");

  next();
});

const validateTicket = (req, res, next) => {
  // console.log("Error place");
  const { error } = ticketValidation.validate(req.body);
  if (error) {
    const message = error.details.map((el) => el.message).join(",");
    throw new ErrorHandler(message, 400);
  } else {
    next();
  }
};

const validateUser = (req, res, next) => {
  const { error } = userValidation.validate(req.body);
  if (error) {
    const message = error.details.map((el) => el.message).join(",");
    if (message.includes("confirmPassword")) {
      var errorMessage = "Password Mismatch";
    } else if (message.includes("pattern")) {
      errorMessage =
        "Password must be 8-16 characters containing uppercase, lowercase, numbers and special character";
    }
    req.flash("error", errorMessage);
    res.redirect("/identify");
  } else {
    next();
  }
};
app.get("/", (req, res) => {
  res.render("pages/index");
});

app.get("/tickets/create", isLoggedIn, (req, res) => {
  res.render("pages/new");
});
// create new ticket
app.post(
  "/tickets/new",
  isLoggedIn,
  validateTicket,
  catchAsyncError(async (req, res) => {
    // console.log(req.body);

    const checkTicket = await Ticket.findOne({
      ticketNumber: parseInt(req.body.ticketNumber)
    });

    if (checkTicket) {
      // ticket already exist
      req.flash("warning", `Ticket ${req.body.ticketNumber} already exist`);
      res.redirect(`/tickets/${checkTicket._id}`);
    } else {
      var ticket = req.body;
      if (ticket.summary !== "" && typeof ticket.summary !== undefined) {
        var summ = { summary: ticket.summary, dateCreated: new Date() };
        delete ticket.summary;
        var summary = new Summary(summ);
        ticket.summary = summary;
        // add the logged in person into the ticket
        ticket.owner = req.user;
      }
      const newTicket = new Ticket(ticket);
      // console.log(newTicket);
      // console.log(newTicket._id.getTimestamp());

      await summary.save();
      await newTicket.save();
      req.flash(
        "success",
        `Ticket - ${newTicket.ticketNumber} created successfully`
      );
      res.redirect(`/tickets/${newTicket._id}`);
    }
  })
);

// SHOW TICKETS.
app.get(
  "/tickets",
  isLoggedIn,
  catchAsyncError(async (req, res) => {
    const tickets = await Ticket.find().populate("summary");
    //console.log(tickets);
    res.render("pages/tickets", { tickets });
  })
);

// VIEW TICKET
app.get(
  "/tickets/:id",
  catchAsyncError(async (req, res) => {
    const { id } = req.params;
    const tickets = await Ticket.findById(id).populate("summary");
    // use an if statement to ensure error free program
    // console.log(tickets)
    res.render("pages/view", tickets);
  })
);

// EDIT TICKET
app.get(
  "/tickets/:id/edit",
  isLoggedIn,
  catchAsyncError(async (req, res) => {
    const { id } = req.params;
    const tickets = await Ticket.findById(id).populate("summary");
    // use an if statement to ensure error free program
    // console.log(tickets)
    res.render("pages/edit", tickets);
  })
);

// UPDATE TICKET
app.put(
  "/tickets/:id",
  isLoggedIn,
  catchAsyncError(async (req, res) => {
    const { id } = req.params;
    var ticket = req.body;
    if (ticket.summary !== "" && typeof ticket.summary !== undefined) {
      var summ = { summary: ticket.summary, dateCreated: new Date() };
      delete ticket.summary;
      var summary = new Summary(summ);
    }
    await summary.save();
    await Ticket.findByIdAndUpdate(id, ticket);
    await Ticket.findByIdAndUpdate(
      id,
      { $push: { summary: summary } },
      { new: true }
    );
    res.redirect(`/tickets/${id}`);
  })
);

// DELETE TICKET
app.delete(
  "/tickets/:id",
  isLoggedIn,
  catchAsyncError(async (req, res) => {
    const { id } = req.params;

    await Ticket.findByIdAndDelete(id);
    res.redirect("/tickets");
  })
);

// ADD SUMMARY
app.put(
  "/tickets/:id/summary",
  isLoggedIn,
  catchAsyncError(async (req, res) => {
    const { id } = req.params;

    if (req.body.summary !== "" && typeof req.body.summary !== undefined) {
      var summ = { summary: req.body.summary, dateCreated: new Date() };
      var summary = new Summary(summ);
    }
    await summary.save();
    //console.log(ticket);
    await Ticket.findByIdAndUpdate(id, { $push: { summary } }, { new: true });
    res.redirect(`/tickets/${id}`);
    console.log(req.body);
  })
);

// DELETE SUMMARY
app.delete(
  "/tickets/:id/summary",
  isLoggedIn,
  catchAsyncError(async (req, res) => {
    const { id } = req.params;
    const summaryId = req.body.summaryId;
    // summary should be deleted
    //console.log(req.body.summaryId);
    try {
      // remove the summary from the ticket array
      await Ticket.findByIdAndUpdate(id, {
        $pull: { summary: summaryId }
      });
      // delete from summary collection
      await Summary.findByIdAndDelete(summaryId);
    } catch (error) {
      console.log(error);
    }
    res.redirect(`/tickets/${id}`);
  })
);

// register user
app.get("/identify", (req, res) => {
  res.render("user/register");
});

app.post("/register", validateUser, async (req, res) => {
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
});

app.post(
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
app.get("/logout", (req, res) => {
  req.logout();
  req.flash("success", "Successfully Logged Out - We will miss you!");
  res.redirect("/");
});
// unknown pages redirect
app.all("*", (req, res, next) => {
  res.send(new ErrorHandler("Page Not found", 404));
});

// Error handler
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh No, Something went wrong";
  // err.message = "Oh No, Something went wrong";
  res.status(statusCode).render("pages/error", { err });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
