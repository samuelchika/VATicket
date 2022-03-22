const express = require("express");
const router = express.Router();
const Ticket = require("../models/ticket");
const Summary = require("../models/summary");
const TicketOwner = require("../models/ticketuser");
const { isLoggedIn, isAuthorized } = require("../middleware");
const catchAsyncError = require("../Error/catchAsyncError");
const { ticketValidation, searchValidation } = require("../models/validation");
const ticket = require("../models/ticket");
const TicketHistory = require("../models/ticketHistory");
const ErrorHandler = require("../Error/ErrorHanlder");

const validateTicket = (req, res, next) => {
  // console.log("Error place");
  const { error } = ticketValidation.validate(req.body);
  if (error) {
    const message = error.details.map((el) => el.message).join(",");
    //throw new ErrorHandler(message, 400);
    req.flash("error", message);
    return res.redirect("/tickets/create");
  } else {
    next();
  }
};

const validateSearch = (req, res, next) => {
  const { error } = searchValidation.validate(req.body);
  if (error) {
    const message = error.details.map((el) => el.message).join(",");
    //throw new ErrorHandler(message, 400);
    req.flash("error", message);
    return res.redirect("/tickets/history");
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
    try {
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
          var summ = {
            summary: ticket.summary,
            dateCreated: new Date(),
            author: req.user
          };
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
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/tickets/create");
    }
  })
);

// SHOW TICKETS.
router.get(
  "/",
  isLoggedIn,
  catchAsyncError(async (req, res) => {
    const tickets = await Ticket.find({
      $or: [{ owner: req.user }, { assignedTo: req.user }]
    })
      .populate({
        path: "summary",
        populate: {
          path: "author"
        }
      })
      .populate("owner");
    //console.log(tickets);
    res.render("pages/tickets", { tickets });
  })
);

router.post("/search", isLoggedIn, catchAsyncError(async(req, res) => {
  try {
    const ticket = await Ticket.findOne(req.body);
    if(ticket) {
      res.redirect(`/tickets/${ticket._id}`);
    } else {
      req.flash("error", "Ticket don't exist");
      res.redirect("/tickets")
    }
    console.log(req.body)
  } catch (error) {
    req.flash("error", error.message);
    res.redirect("/tickets");
  }
  }) 
);

// VIEW TICKET HISTORY
router.get(
  "/history",
  isLoggedIn,
  catchAsyncError(async (req, res) => {
    // we have to get the ticket history.
    res.render("pages/history");
  })
);

// TICKET SEARCH
router.post(
  "/searchHistory",
  isLoggedIn,
  validateSearch,
  catchAsyncError(async (req, res) => {
    // SEARCH IF THE TICKET EXIST
    const ticket = await Ticket.findOne(req.body);
    if (ticket) {
      // ticket exist
      // use the ticketID to search the ticket history
      res.redirect(`/tickets/${ticket._id}/history`);
    } else {
      req.flash("error", "Ticket does not exist");
      res.redirect("/tickets/history");
    }
    // CHECK IF THE USER IS AUTHORIZED TO ACCESS THE TICKET.
  })
);

// the history
router.get(
  "/:id/history",
  isLoggedIn,
  catchAsyncError(async (req, res) => {
    const { id } = req.params;

    const ticket = await Ticket.findById(id);
    if (
      (ticket.owner && ticket.owner.equals(req.user._id)) ||
      (ticket.assignedTo && ticket.assignedTo.equals(req.user._id))
    ) {
      const ticketHistory = await TicketHistory.find({ ticketId: ticket._id })
        .populate("assignedBy")
        .populate("assignedTo")
        .populate({
          path: "ticketId",
          populate: {
            path: "summary"
          }
        });
      res.render("pages/history", { ticketHistory });
    } else {
      req.flash(
        "error",
        "You don't have the privilege to access this ticket. Please contact the ticket owner. Thanks"
      );
      res.redirect("/tickets/history");
    }
  })
);

// VIEW TICKET
router.get(
  "/:id",
  isLoggedIn,
  isAuthorized,
  catchAsyncError(async (req, res) => {
    const { id } = req.params;
    const ticket = await Ticket.findById(id)
      .populate({
        path: "summary",
        populate: {
          path: "author"
        }
      })
      .populate("assignedTo")
      .populate("owner");
    const users = await TicketOwner.find();
    // use an if statement to ensure error free program
    if (ticket) {
      res.render("pages/view", { ticket: ticket, users: users });
    } else {
      req.flash("error", "The requested Ticket does not exist");
      res.redirect("/tickets");
    }
  })
);

// EDIT TICKET
router.get(
  "/:id/edit",
  isLoggedIn,
  isAuthorized,
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
  isAuthorized,
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

// assign ticket to another user.
router.put(
  "/:id/assign",
  isLoggedIn,
  isAuthorized,
  catchAsyncError(async (req, res) => {
    // we can now update the ticket.
    const { id } = req.params;
    //console.log(req.body.assignedTo)
    if (
      req.body.assignedTo ||
      !req.body.assignedTo.equals("Select Colleague")
    ) {
      // assigned to exists
      const user = await TicketOwner.findById(req.body.assignedTo);
      //console.log(user)
      if (user) {
        if (await Ticket.findByIdAndUpdate(id, req.body)) {
          // if ticket was successfully assigned to another person, we have to acoount for it.
          const ticketHistory = new TicketHistory({
            ticketId: id,
            assignedBy: req.user,
            assignedTo: req.body.assignedTo
          });
          await ticketHistory.save();
          req.flash("success", `Ticket is now assigned to ${user.username}`);
        } else {
          req.flash(
            "error",
            `Error assigning ticket to user - ${user.username}`
          );
        }
      } else {
        // the user don't exist
        req.flash("error", "The user you entered don't exist!");
      }
    } else {
      // assigned to is empty.
      req.flash("error", "Select who to assign ticket to");
    }
    res.redirect("/tickets");
  })
);

router.put(
  "/:id/reclaim",
  isLoggedIn,
  isAuthorized,
  catchAsyncError(async (req, res) => {
    // we can now update the ticket.
    const { id } = req.params;
    if (await Ticket.findByIdAndUpdate(id, { assignedTo: null })) {
      const ticketHistory = new TicketHistory({
        ticketId: id,
        assignedBy: req.user,
        assignedTo: req.user,
        reclaimed: 1
      });
      await ticketHistory.save();

      // erropr check for the history should be done later and should displayed based on the person priviledge
      req.flash(
        "success",
        `You have successfully reclaim ticket from ${req.body.assignedTo}`
      );
    } else {
      req.flash(
        "error",
        `Error reclaiming ticket from - ${req.body.assignedTo}`
      );
    }
    res.redirect(`/tickets/${id}`);
  })
);

module.exports = router;
