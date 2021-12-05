const express = require("express");
const controller = express.Router();
const passport = require("passport");
// const { PrismaClient } = require("@prisma/client");
const prismaClient = require('../../controller_support/prisma');
const moment = require("moment")

const { reservations } = prismaClient

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

// GET either upcoming or past reservation
controller.get("/reservation", authChecker, async (req, res) => {
    try {

        const reservationState = req.query.reservation_state

        const currentDate = new Date()

        const diner_id = req.user.id

        if(reservationState === "upcoming") {
            const upcomingReservations = await reservations.findMany({
                where:{
                    date: {
                        gte: currentDate
                    },
                    diner_id
                },
                orderBy: {
                    date: 'asc'
                }
            })
    
            return res.json(upcomingReservations)

        } else if (reservationState === "past") {
            const pastReservations = await reservations.findMany({
                where:{
                    date: {
                        lt: currentDate
                    },
                    diner_id
                },
                orderBy: {
                    date: 'asc'
                }
            })
    
            return res.json(pastReservations)
        } else {
            return res.status(422).json({error: "Invalid query parameter"})
        }

        

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

controller.post("/test/datesandtime", async (req, res) => {
    const { start_date, end_date, start_time, end_time} = req.body

    const startDateArray = start_date.split("/")
    const startDate = startDateArray[2] + "-" + startDateArray[1] + "-" + startDateArray[0]
    const startMomentDate = moment(startDate, ["MM-DD-YYYY", "YYYY-MM-DD"])

    const endDateArray = end_date.split("/")
    const endDate = endDateArray[2] + "-" + endDateArray[1] + "-" + endDateArray[0]
    const endMomentDate = moment(endDate, ["MM-DD-YYYY", "YYYY-MM-DD"])

    const dateRange = [moment({...startMomentDate})]

    while(startMomentDate.date() != endMomentDate.date()){
        startMomentDate.add(1, 'day')
        dateRange.push(moment({...startMomentDate}))
    }

    dateRange.map(x => x.format("YYYY-MM-DD"))
    // return res.json(dateRange.map(x => x.format("YYYY-MM-DD")))
    // return res.json(dateRange)

    const startTime = moment(start_time, 'HH:mm')
    const endTime = moment(end_time, 'HH:mm')

    startTime.minutes(Math.ceil(startTime.minutes() / 15) * 15)

    const timeList = []

    const current = moment(startTime)

    while (current <= endTime) {
        timeList.push(current.format('HH:mm'))
        current.add(15, 'minutes')
    }

    console.log(timeList)

    const dateTimeList = []

    for(let date of dateRange) {
        for(let time of timeList){
            dateTimeList.push(date.format("YYYY-MM-DD") + " " + time)
        }
    }

    return res.json(dateTimeList)

})

module.exports = controller