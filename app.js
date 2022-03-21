require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const methodOverride = require("method-override");
const ErrorHandler = require("./Error/ErrorHanlder");
const MongoDBSession = require("connect-mongodb-session")(session);
const mongoSanitize = require("express-mongo-sanitize");
// model for mongoose
const TicketUser = require("./models/ticketuser");
// importing routes
const ticketsRoute = require("./routes/ticket");
const summaryRoute = require("./routes/summary");
const userRoute = require("./routes/user");
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
// To remove data using these defaults:
app.use(
  mongoSanitize({
    replaceWith: "_"
  })
); 
app.use(express.static(path.join(path.resolve(), "public")));
const port = process.env.PORT || 5000;
// for form data
app.use(
  express.urlencoded({
    extended: true
  })
);

// mongodb session store
const store = new MongoDBSession({
  uri: process.env.MONGODB_URL,
  secret: process.env.SESSION_SECRET,
  touchAfter: 24 * 60 * 60
});

// check for error
store.on("error", function (e) {
  console.log("SESSION ERROR", e);
});

// session
const sessionConfig = {
  store,
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
// routes
app.use("/", userRoute);
app.use('/tickets', ticketsRoute);
app.use('/tickets/:id/summary', summaryRoute);
app.get("/", (req, res) => {
  res.render("pages/index");
});
// unknown pages redirect
app.all("*", (req, res, next) => {
  //res.send();
  next(new ErrorHandler("Page Not found", 404));
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
