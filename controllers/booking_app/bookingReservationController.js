const express = require("express");
const controller = express.Router();
const passport = require("passport");
const { PrismaClient } = require("@prisma/client");

const { diner_user, restaurant, reservations } = new PrismaClient();

// Middleware to check whether accessor is logged in 
const authChecker = passport.authenticate("jwt", { session: false })




// POST a reservation
controller.post("/reservation/book", authChecker, async (req, res) => {
    try {
        const diner_id = req.user.id

        const { party_size, date, time, restaurant_id } = req.body

        if(!party_size || !date || !time || !restaurant_id) {
            return res.status(422).json({error: "Fields are missing. Cannot make booking."})
        }

        // JavaScript date is set as MM/DD/YYYY so we need to update that
        const dateArray = date.split("/")
        const newDate = dateArray[2] + "/" + dateArray[1] + "/" + dateArray[0]

        console.log(newDate)

        const makeReservation = await reservations.create({
            data: {
                party_size,
                date: new Date(newDate),
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

// GET all upcoming reservations
controller.get("/reservation/upcoming", authChecker, async (req, res) => {
    try {
        
        const currentDate = new Date()

        const diner_id = req.user.id

        const upcomingReservations = await reservations.findMany({
            where:{
                date: {
                    gte: currentDate
                },
                diner_id
            }
        })

        if(!upcomingReservations) {
            res.status(422).json({error: "Sorry, you have no upcoming reservations"})
        }

        res.json(upcomingReservations)

    } catch (e) {
        return res.status(400).json({
            name: e.name,
            message: e.message
        })
    }
})

// GET all past reservations

controller.get("/reservation/past", authChecker, async (req, res) => {
    try {
        
        const currentDate = new Date()

        const diner_id = req.user.id

        const upcomingReservations = await reservations.findMany({
            where:{
                date: {
                    lte: currentDate
                },
                diner_id
            }
        })

        if(!upcomingReservations) {
            res.status(422).json({error: "Sorry, you have no upcoming reservations"})
        }

        res.json(upcomingReservations)

    } catch (e) {
        return res.status(400).json({
            name: e.name,
            message: e.message
        })
    }
})

// GET reservation information: party_size, date and time to edit 
controller.get("/reservation/:reservation_id/edit", authChecker, async (req, res) => {
    try {

        const reservation_id = req.params.reservation_id

        const reservationDetails = await reservations.findUnique({
            where: {
                id: reservation_id
            }, 
            select: {
                party_size: true,
                date: true,
                time: true,
            }
        })

        if(!reservationDetails) {
            return res.status(422).json({error: "Entered reservation ID does not exist or is invalid"})
        }

        return res.json(reservationDetails)

    } catch (e) {
        return res.status(400).json({
            name: e.name,
            message: e.message
        })
    }
}) 

// PATCH edit reservation details
controller.patch("/reservation/:reservation_id", authChecker, async(req, res) => {
    try {
        const reservation_id = req.params.reservation_id

        const { party_size, date, time } = req.body

        if(!party_size || !date || !time){
            return res.status(422).json({error: "Reservation fields are missing!"})
        }

        // JavaScript default date is set in MM/DD/YYYY so we need to update that, need to explicitly break it down into this format
        const dateArray = date.split("/")
        const newDate = dateArray[2] + "/" + dateArray[1] + "/" + dateArray[0]

        const updateReservation = await reservations.update({
            where: {
                id: reservation_id
            }, 
            data: {
                party_size,
                date: new Date(newDate),
                time
            }
        })

        if(!updateReservation) {
            return res.status(422).json({error: "Unabled to update your reservation!"})
        }

        return res.send(updateReservation)

    } catch (e) {
        return res.status(400).json({
            name: e.name,
            message: e.message
        })
    }
})

// PATCH to cancel a reservation
controller.patch("/reservation/:reservation_id/cancel", authChecker, async (req, res) => {

    try {

        const reservation_id = req.params.reservation_id

        const cancelReservation = await reservations.update({
            where: {
                id: reservation_id
            }, 
            data: {
                reservation_status: "cancelled"
            }
        })

        if(!cancelReservation) {
            return res.status(422).json({error: "Unabled to update your reservation!"})
        }

        return res.send(cancelReservation)

    } catch (e) {
        return res.status(400).json({
            name: e.name,
            message: e.message
        })
    }
    

})



module.exports = controller