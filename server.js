require("dotenv").config()
const express = require("express")
const PORT = process.env.PORT

// Passport set up for token verification
const passport = require("passport");
const strategy = require("./controller_support/passport");

passport.use(strategy)

// Required Booking App Controllers
const authController = require("./controllers/booking_app/authController")
const bookingRestaurantController = require("./controllers/booking_app/bookingRestaurantController")

// Required Restaurant Management App Controllers
const restaurantController = require("./controllers/restaurant_management_app/restaurantController")


// Express set up and middleware usage
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Linking to Booking App Controllers
app.use('/api', authController)
app.use('/api', bookingRestaurantController)

// Linking to Restaurant Management App Controllers
app.use('/api', restaurantController)

app.listen(PORT, () => {
    console.log(`server is running on PORT ${PORT}`);
});