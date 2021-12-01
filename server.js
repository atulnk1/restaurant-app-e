require("dotenv").config()
const express = require("express")
const PORT = process.env.PORT

// Passport set up for token verification
const passport = require("passport");
const strategy = require("./passport");

passport.use(strategy)

// Required Controllers
const authController = require("./controllers/authController")

// Express set up and middleware usage
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Linking to controllers
app.use('/api', authController)

app.listen(PORT, () => {
    console.log(`server is running on PORT ${PORT}`);
});