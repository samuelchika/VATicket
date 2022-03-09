const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const Ticket = require('./models/ticket');
const { ticketValidation } = require('./models/validation');
const catchAsyncError = require('./Error/catchAsyncError');
const ErrorHandler = require('./Error/ErrorHanlder');

const app = express();
// connect to mongoose db

main().then(() => console.log("Database Connected")).catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb://localhost:27017/tickets');
}

app.set('view engine', 'ejs');
//const path = require('path')
app.use(methodOverride('_method'));
app.use(express.static(path.join(path.resolve(), 'public')));

const port = 5000;

// for form data
app.use(express.urlencoded({
  extended: true
}));

const validateTicket = (req, res, next) => {
    // console.log("Error place");
    const { error } = ticketValidation.validate(req.body);
    if(error) {
        const message = error.details.map(el=> el.message).join(',');
        throw new ErrorHandler(message, 400);
    } else {
        next();
    }
}

app.get('/', (req, res) => {
    res.render('pages/index');
});

app.get('/tickets/create', (req, res) => {
    res.render('pages/new');
});

app.post('/tickets/new', validateTicket, catchAsyncError(async (req, res) => {
    // console.log(req.body);
    
    const checkTicket = await Ticket.findOne({ ticketNumber: parseInt(req.body.ticketNumber) });

    if (checkTicket) {
        res.redirect(`/tickets/${checkTicket._id}`);
    } else {
        var ticket = req.body;
        if((ticket.summary != "") && (typeof ticket.summary != undefined)) {
            var summary = { summary: ticket.summary, dateCreated: new Date() };
            delete ticket.summary;
            ticket.summary = summary;
        }
        const newTicket = new Ticket(ticket);
        // console.log(newTicket);
        // console.log(newTicket._id.getTimestamp());
        await newTicket.save();
        res.redirect(`/tickets/${newTicket._id}`);
    } 
}));

// SHOW TICKETS.
app.get('/tickets', catchAsyncError(async (req, res) => {
    const tickets = await Ticket.find();
    // console.log(tickets)
    res.render('pages/tickets', { tickets });
}));

// VIEW TICKETS
app.get('/tickets/:id', catchAsyncError(async (req, res) => {
    const { id } = req.params
    const tickets = await Ticket.findById(id);
    // use an if statement to ensure error free program
    // console.log(tickets)
    res.render('pages/view', tickets);
}));

// EDIT TICKET
app.get('/tickets/:id/edit', catchAsyncError(async (req, res) => {
    const { id } = req.params
    const tickets = await Ticket.findById(id);
    // use an if statement to ensure error free program
    // console.log(tickets)
    res.render('pages/edit', tickets);
}));

// UPDATE TICKET
app.put('/tickets/:id', catchAsyncError(async(req, res) => {
    const { id } = req.params;
    var ticket = req.body;
    if((ticket.summary != "") && (typeof ticket.summary != undefined)) {
        var summary = { summary: ticket.summary, dateCreated: new Date() };
        delete ticket.summary;    
    }

    await Ticket.findByIdAndUpdate(id, ticket );
    await Ticket.findByIdAndUpdate(id, { $push: { summary: summary } }, { new: true });
    res.redirect(`/tickets/${id}`);
}));

app.delete('/tickets/:id', catchAsyncError(async (req, res) => {
    const { id } = req.params;

    await Ticket.findByIdAndDelete(id);
    res.redirect('/tickets');

}));

// ADD SUMMARY
app.put('/tickets/:id/summary', catchAsyncError(async (req, res) => {
    const { id } = req.params;
    var ticket = req.body;
    if((ticket.summary != "") && (typeof ticket.summary != undefined)) {
        var summary = { summary: ticket.summary, dateCreated: new Date() };
        delete ticket.summary;
        ticket = summary;
    }
    //console.log(ticket);
    const updatedTicket = await Ticket.findByIdAndUpdate(id, { $push: { summary: ticket } }, { new: true });
    res.redirect(`/tickets/${id}`);
    // console.log(req.body);
}));

// DELETE SUMMARY
app.delete('/tickets/:id/summary', catchAsyncError(async(req, res) => {
    const { id } = req.params;

    if (req.body.summary != "") {
        // summary should be deleted
        try {
            await Ticket.findByIdAndUpdate(id, {$pull: { summary: {summary: req.body.summary} }});
        } catch (error) {
            console.log(error)
        }
    }
    res.redirect(`/tickets/${id}`)
}));


// unknown pages redirect
app.all('*', (req, res, next) => {
    res.send(new ErrorHandler('Page Not found', 404));
});

// Error handler
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if(!err.message) err.message = "Oh No, Something went wrong";
    // err.message = "Oh No, Something went wrong";
    res.status(statusCode).render('pages/error', { err })
})
  
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});