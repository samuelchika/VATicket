const express = require("express");
const router = express.Router({ mergeParams: true });
const Ticket = require("../models/ticket");
const Summary = require("../models/summary");
const { isLoggedIn } = require("../middleware");
const catchAsyncError = require("../Error/catchAsyncError");

// ADD SUMMARY
router.put(
    "/",
    isLoggedIn,
    catchAsyncError(async (req, res) => {
        const { id } = req.params;
        if (req.body.summary !== "" && typeof req.body.summary !== undefined) {
            var summ = { summary: req.body.summary, author: req.user, dateCreated: new Date() };
            var summary = new Summary(summ);
        }
        await summary.save();
        //console.log(ticket);
        await Ticket.findByIdAndUpdate(id, { $push: { summary } }, { new: true });
        req.flash("success", "Ticket summary inserted successfully. Verify it below.")
        res.redirect(`/tickets/${id}`);
        
    })
);

// DELETE SUMMARY
router.delete(
    "/",
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
            req.flash("success", "Summary deleted successfully!")
        } catch (error) {
            req.flash("error", e.message)
        }
        res.redirect(`/tickets/${id}`);
    })
);

module.exports = router;