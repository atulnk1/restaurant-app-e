const express = require("express");
const controller = express.Router();
const passport = require("passport");
const { PrismaClient } = require("@prisma/client");

const { diner_user, restaurant, reservations } = new PrismaClient();

// Middleware to check whether accessor is logged in 
const authChecker = passport.authenticate("jwt", { session: false })

controller.post("/reservation/book", authChecker, async (req, res) => {
    try {
        const diner_id = req.user.id

        const { party_size, date, time, restaurant_id } = req.body

        if(!party_size || !date || !time || !restaurant_id) {
            return res.status(422).json({error: "Fields are missing. Cannot make booking."})
        }

        const makeReservation = await reservations.create({
            data: {
                party_size,
                date: new Date(date),
                time,
                diner_id,
                restaurant_id
            }
        })

        return res.json(makeReservation)
    } catch (e) {
        return res.status(400).json({
            name: e.name,
            message: e.message
        })
    }
})

module.exports = controller