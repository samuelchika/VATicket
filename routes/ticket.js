const express = require("express");
const router = express.Router();
const Ticket = require("../models/ticket");
const Summary = require("../models/summary");
const { isLoggedIn } = require("../middleware");
const catchAsyncError = require("../Error/catchAsyncError");
const { ticketValidation } = require("../models/validation");


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
  

router.get("/create", isLoggedIn, (req, res) => {
    res.render("pages/new");
});

// create new ticket
router.post(
    "/new",
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
router.get(
    "/",
    isLoggedIn,
    catchAsyncError(async (req, res) => {
        const tickets = await Ticket.find().populate("summary");
        //console.log(tickets);
        res.render("pages/tickets", { tickets });
    })
);

// VIEW TICKET
router.get(
    "/:id",
    catchAsyncError(async (req, res) => {
        const { id } = req.params;
        const tickets = await Ticket.findById(id).populate("summary");
        // use an if statement to ensure error free program
        // console.log(tickets)
        res.render("pages/view", tickets);
    })
);

// EDIT TICKET
router.get(
    "/:id/edit",
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
router.put(
    "/:id",
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
router.delete(
    "/:id",
    isLoggedIn,
    catchAsyncError(async (req, res) => {
        const { id } = req.params;

        await Ticket.findByIdAndDelete(id);
        res.redirect("/tickets");
    })
);

module.exports = router;