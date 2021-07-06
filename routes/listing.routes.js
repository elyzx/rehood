// Require express
const router = require("express").Router();
// Require listing model
const ListingModel = require("../models/Listing.model");
// Require User model
const UserModel = require("../models/User.model");
// Require Neighbourhood model
const NeighbourhoodModel = require("../models/Neighbourhood.model");
const Listing = require("../models/Listing.model");
// Require nodemailer
const nodemailer = require('nodemailer')

//----------  MIDDLEWARE FOR PERMISSIONS ---------------
function checkLoggedIn(req, res, next) {
    if (req.session.loggedInUser) {
        console.log(`User '${req.session.loggedInUser._id}' is logged in`)
        req.app.locals.isLoggedIn = true;
        next()
    }
    else {
        req.app.locals.isLoggedIn = false;
        res.redirect('/login')
    }
  }

// ---------- VIEW/READ LISTINGS ---------- //
// Handle GET request to /listings and redirect to homepage
router.get('/listings', checkLoggedIn, (req, res, next) => {
    res.redirect('/')
});

// Handle GET request to /listings:id
router.get('/listings/:id', checkLoggedIn, (req, res, next) => {
    let dynamicListingId = req.params.id
    ListingModel.findById(dynamicListingId)
        .then((listing) => {
            res.render('listings/viewListing.hbs', {listing})
        })
        .catch(() => {
            next('Failed to find listing details')
        })
})

router.post('/send-email/:title', (req, res, next) => {
    let userObj = req.session.loggedInUser
    let dynamicListingTitle = req.params.title
    console.log(dynamicListingTitle)
    let { name, email, subject, message } = req.body;

    UserModel.findById(userObj)
    .then(() => {
        let transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
              user: 'freecycle.ironhack@gmail.com',
              pass: process.env.EMAIL_PASSWORD
            }
          });
          transporter.sendMail({
            from: '"Freecycle - Item Request" <freecycle.ironhack@gmail.com}>',
            to: userObj.email,
            subject: `RE: ${dynamicListingTitle}`,
            text: `From: ${name}<b></b>Email: ${email}<b></b>Message: ${message}`,
            html: `From: ${name} <b></b>Email: ${email} <b></b>Message: ${message}`
          })
          .then(() => {
            res.render('listings/emailConfirmation.hbs', {email, subject, message})
          })
          .catch((err => {
              next(err)
          }))
    })
    .catch((err) => {
        next(err)
    })
});


// ---------- CREATE LISTINGS ---------- //
// Handle GET requests to /create listings page
router.get('/create', checkLoggedIn, (req, res, next) => {
    
    NeighbourhoodModel.find({})
    .then((neighbourhood) => {
        res.render('listings/createListing.hbs', {neighbourhood})
    })
     .catch((err) => {
        next(err)
     })
})

// Add form submissions to DB & redirect user to Manage page
// Handle POST requests to /create listings page 
router.post('/create', (req, res, next) => {
    let userObj = req.session.loggedInUser
    const {title, description, neighbourhood} = req.body

    // Add the listing to our DB
    ListingModel.create({title, description, neighbourhood, user: userObj._id})
        .then((listing) => {
                console.log(listing._id)

                UserModel.findByIdAndUpdate(userObj._id, { $push: {list: listing._id} }, {new: true})
                    .then(() => {
                        res.redirect('/manage')
                    })
                    .catch(() => {
                        next('Failed to add listing to user')
                    })
        })
        .catch(() => {
            next('Failed to create new listing')
        })
})
// ------------------------------------- //


// ---------- UPDATE LISTINGS ---------- //
// Show the user all their active listings
// Handle GET request to /manage listings page
router.get('/manage', checkLoggedIn, (req, res, next) => {
    let userId = req.session.loggedInUser

    UserModel.findById(userId)
        .populate('list')
        .then((user) => {
            console.log(userId)
            res.render('listings/manageListings.hbs', {user})
        })
        .catch(() => {
            next('Failed to find user details')
        })

})


// Enable the user to edit an existing listing
router.get('/edit/:id', checkLoggedIn, (req, res, next) => {
    let userId = req.session.loggedInUser
    let dynamicListingId = req.params.id

    ListingModel.findById(dynamicListingId)
        .then((listing) => {

            if (listing.user == userId._id) {
                console.log(listing)
                res.render('listings/editListing.hbs', {listing})
            } else {
                next(`User ${userId._id} tried to edit another user's listing`)
            }
            
        })
        .catch(() => {
            next('Failed to find listing details')
        })
})
// Handles POST request to edit a listing
router.post('/edit/:id', checkLoggedIn, (req, res, next) => {
    let dynamicListingId = req.params.id
    let userId = req.session.loggedInUser
    const {title, description} = req.body

    // first find the listing and check ownership
    ListingModel.findById(dynamicListingId)
        .then((listing) => {
            if (listing.user == userId._id) {
                console.log(listing)
                // if allowed, find and update listing
                ListingModel.findByIdAndUpdate(dynamicListingId, {title, description}, {new: true})
                    .then((data) => {
                        console.log(data)
                        res.redirect('/manage')
                    })
                    .catch((err) => {
                        next(err)
                    })
            } else {
                next(`User ${userId._id} tried to edit another user's listing`)
            }
        })
        .catch(() => {
            next('Failed to find listing details')
        })
})

// ------------------------------------- //

// ---------- DELETE LISTING ----------- //
// Enable the user to delete an existing listing
router.get('/delete/:id', checkLoggedIn, (req, res, next) => {
    let dynamicListingId = req.params.id
    let userId = req.session.loggedInUser
    console.log('hello' + dynamicListingId + userId)

   // first find the listing and check ownership
   ListingModel.findById(dynamicListingId)
   .then((listing) => {
       if (listing.user == userId._id) {
           console.log(listing)
           // if allowed, find and delete listing
           ListingModel.findByIdAndDelete(dynamicListingId)
               .then(() => {
                   res.redirect('/manage')
               })
               .catch((err) => {
                   next('Failed to delete this listing.')
               })
       } else {
           next(`User ${userId._id} tried to delete another user's listing`)
       }
   })
   .catch(() => {
       next('Failed to find listing details')
   })
})

// ------------------------------------- //
module.exports = router;