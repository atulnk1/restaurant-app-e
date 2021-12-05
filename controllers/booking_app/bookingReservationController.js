const express = require("express");
const controller = express.Router();
const passport = require("passport");
// const { PrismaClient } = require("@prisma/client");
const prismaClient = require('../../controller_support/prisma');
const moment = require("moment")

const { reservations, availabilityDateTime, restaurant, Prisma } = prismaClient

// Middleware to check whether accessor is logged in 
const authChecker = passport.authenticate("jwt", { session: false })

const timeRangeGenerator = (startMomentTime, endMomentTime) => {
    // const startMomentTime = moment(startTime, 'HH:mm')
    // const endMomentTime = moment(endTime, 'HH:mm')
    // This is to set the intervals of 15 minutes between each time slot
    startMomentTime.minutes(Math.ceil(startMomentTime.minutes() / 15) * 15)
    const timeList = []
    const current = moment(startMomentTime)
    while (current < endMomentTime) {
        timeList.push(current.format('HH:mm'))
        current.add(15, 'minutes')
    }

    return timeList
}

controller.post("/reservation/book2", authChecker, async (req,res) => {
    try {

        const diner_id = req.user.id

        const { party_size, date, time, restaurant_id } = req.body

        if(!party_size || !date || !time || !restaurant_id) {
            return res.status(422).json({error: "Fields are missing. Cannot make booking."})
        }
        

        // 1 Find the restaurants information: restaurant_average_seating_time
        const restaurantValues = await restaurant.findUnique({
            where: {
                id: restaurant_id
            },
            select: {
                restaurant_average_seating_time: true,
                restaurant_max_table_one: true,
                restaurant_max_table_two: true,
                restaurant_max_table_three: true,
                restaurant_max_table_four: true,
                restaurant_max_table_five: true,
            }
        })

        console.log(restaurantValues)
        // 2 Create your intervals based on this and the the seating time
        const startBookingTime = moment(time, 'HH:mm')
        const tempTime = moment(time, 'HH:mm')
        const endBookingTime = tempTime.add(restaurantValues.restaurant_average_seating_time, 'minutes')
        const timeList = timeRangeGenerator(startBookingTime, endBookingTime)
        // console.log(endBookingTime)
        // console.log(timeList)
        const dateArray = date.split("-")
        const newDate = dateArray[2] + "-" + dateArray[1] + "-" + dateArray[0]

        const dateTimeList = []
        let availabilityCheck = false
        let availabilityUpdate = false
        switch(party_size){
            case(1):
                for(let indTime of timeList) {
                    dateTimeList.push(
                        {
                            date_time: "" + moment(newDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                            available_table_one: {
                                gt: 0
                            },
                            restaurant_id
                        }
                    )
                }

                // console.log(dateTimeList)

                availabilityCheck = await availabilityDateTime.findMany({
                    where: {
                        OR: dateTimeList
                    }
                })

                // As long as even one of the times slots is not available, user will not be able to book
                if(availabilityCheck.length < dateTimeList.length) {
                    return res.status(404).json({error: "Sorry not slots available"})
                }

                // Updates the available tables for the said booking time and for X time slots after that
                for(let indAvail of availabilityCheck) {
                    availabilityUpdate = await availabilityDateTime.update({
                        where: {
                            id: indAvail.id
                        },
                        data: {
                            available_table_one: {
                                decrement: 1
                            }
                        }
                    })
                }
                // return res.json(availabilityCheck)
                break;

            case(2):
                for(let indTime of timeList) {
                    dateTimeList.push(
                        {
                            date_time: "" + moment(newDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                            available_table_two: {
                                gt: 0
                            },
                            restaurant_id
                        }
                    )
                }
                availabilityCheck = await availabilityDateTime.findMany({
                    where: {
                        OR: dateTimeList
                    }
                })
                if(availabilityCheck.length < dateTimeList.length) {
                    return res.status(404).json({error: "Sorry not slots available"})
                }
                for(let indAvail of availabilityCheck) {
                    availabilityUpdate = await availabilityDateTime.update({
                        where: {
                            id: indAvail.id
                        },
                        data: {
                            available_table_two: {
                                decrement: 1
                            }
                        }
                    })
                }
            case(3):
                for(let indTime of timeList) {
                    dateTimeList.push(
                        {
                            date_time: "" + moment(newDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                            available_table_three: {
                                gt: 0
                            },
                            restaurant_id
                        }
                    )
                }
                availabilityCheck = await availabilityDateTime.findMany({
                    where: {
                        OR: dateTimeList
                    }
                })
                if(availabilityCheck.length < dateTimeList.length) {
                    return res.status(404).json({error: "Sorry not slots available"})
                }
                for(let indAvail of availabilityCheck) {
                    availabilityUpdate = await availabilityDateTime.update({
                        where: {
                            id: indAvail.id
                        },
                        data: {
                            available_table_three: {
                                decrement: 1
                            }
                        }
                    })
                }
            case(4):
                for(let indTime of timeList) {
                    dateTimeList.push(
                        {
                            date_time: "" + moment(newDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                            available_table_four: {
                                gt: 0
                            },
                            restaurant_id
                        }
                    )
                }
                availabilityCheck = await availabilityDateTime.findMany({
                    where: {
                        OR: dateTimeList
                    }
                })
                if(availabilityCheck.length < dateTimeList.length) {
                    return res.status(404).json({error: "Sorry not slots available"})
                }
                for(let indAvail of availabilityCheck) {
                    availabilityUpdate = await availabilityDateTime.update({
                        where: {
                            id: indAvail.id
                        },
                        data: {
                            available_table_four: {
                                decrement: 1
                            }
                        }
                    })
                }
            case(5):
                for(let indTime of timeList) {
                    dateTimeList.push(
                        {
                            date_time: "" + moment(newDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                            available_table_five: {
                                gt: 0
                            },
                            restaurant_id
                        }
                    )
                }
                availabilityCheck = await availabilityDateTime.findMany({
                    where: {
                        OR: dateTimeList
                    }
                })
                if(availabilityCheck.length < dateTimeList.length) {
                    return res.status(404).json({error: "Sorry not slots available"})
                }
                for(let indAvail of availabilityCheck) {
                    availabilityUpdate = await availabilityDateTime.update({
                        where: {
                            id: indAvail.id
                        },
                        data: {
                            available_table_five: {
                                decrement: 1
                            }
                        }
                    })
                }
        }

        // Add the reservation to the reservation table
        const makeReservation = await reservations.create({
            data: {
                party_size,
                display_date: displayDate,
                system_date: new Date(newDate),
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


// POST a reservation
controller.post("/reservation/book", authChecker, async (req, res) => {
    try {
        const diner_id = req.user.id

        const { party_size, date, time, restaurant_id } = req.body

        if(!party_size || !date || !time || !restaurant_id) {
            return res.status(422).json({error: "Fields are missing. Cannot make booking."})
        }

        // JavaScript date is set as MM-DD-YYYY so we need to update that
        const dateArray = date.split("-")
        const newDate = dateArray[2] + "-" + dateArray[1] + "-" + dateArray[0]
        const displayDate = "" + moment(newDate, 'YYYY-MM-DD').format('DD-MM-YYYY')

        const availabilityCheckDateTime = "" + moment(newDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(time, 'HH:mm').format('HH:mm')

        let availabilityCheck = false
        let availabilityUpdate = false
        switch(party_size) {
            case(1):
                availabilityCheck = await availabilityDateTime.findFirst({
                    where: {
                        date_time: availabilityCheckDateTime,
                        available_table_one: {
                                gt: 0
                        },
                        restaurant_id
                    }
                })

                if(!availabilityCheck){
                    return res.status(422).json({error: "Unable to book for this party size, date and time. Please try another timing!"})
                }
                
                availabilityUpdate = await availabilityDateTime.update({
                    where: {
                        id: availabilityCheck.id
                    },
                    data: {
                        available_table_one: {
                            decrement: 1
                        }
                    }
                })
                break;
            case(2):
                availabilityCheck = await availabilityDateTime.findFirst({
                    where: {
                        date_time: availabilityCheckDateTime,
                        available_table_two: {
                                gt: 0
                        },
                        restaurant_id
                    }
                })

                if(!availabilityCheck){
                    return res.status(422).json({error: "Unable to book for this party size, date and time. Please try another timing!"})
                }
                
                availabilityUpdate = await availabilityDateTime.update({
                    where: {
                        id: availabilityCheck.id
                    },
                    data: {
                        available_table_two: {
                            decrement: 1
                        }
                    }
                })

                // console.log(availabilityUpdate)
                break;
            case(3):
                availabilityCheck = await availabilityDateTime.findFirst({
                    where: {
                        date_time: availabilityCheckDateTime,
                        available_table_three: {
                                gt: 0
                        },
                        restaurant_id
                    }
                })

                if(!availabilityCheck){
                    return res.status(422).json({error: "Unable to book for this party size, date and time. Please try another timing!"})
                }
                
                availabilityUpdate = await availabilityDateTime.update({
                    where: {
                        id: availabilityCheck.id
                    },
                    data: {
                        available_table_three: {
                            decrement: 1
                        }
                    }
                })

                // console.log(availabilityUpdate)
                break;
            case(4):
                availabilityCheck = await availabilityDateTime.findFirst({
                    where: {
                        date_time: availabilityCheckDateTime,
                        available_table_four: {
                                gt: 0
                        },
                        restaurant_id
                    }
                })

                if(!availabilityCheck){
                    return res.status(422).json({error: "Unable to book for this party size, date and time. Please try another timing!"})
                }
                
                availabilityUpdate = await availabilityDateTime.update({
                    where: {
                        id: availabilityCheck.id
                    },
                    data: {
                        available_table_four: {
                            decrement: 1
                        }
                    }
                })
                break;
            case(5):
                availabilityCheck = await availabilityDateTime.findFirst({
                    where: {
                        date_time: availabilityCheckDateTime,
                        available_table_five: {
                                gt: 0
                        },
                        restaurant_id
                    }
                })

                if(!availabilityCheck){
                    return res.status(422).json({error: "Unable to book for this party size, date and time. Please try another timing!"})
                }
                
                availabilityUpdate = await availabilityDateTime.update({
                    where: {
                        id: availabilityCheck.id
                    },
                    data: {
                        available_table_five: {
                            decrement: 1
                        }
                    }
                })
                break;
        }

        // console.log(availabilityCheck)

        const makeReservation = await reservations.create({
            data: {
                party_size,
                display_date: displayDate,
                system_date: new Date(newDate),
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
                    system_date: {
                        gte: currentDate
                    },
                    diner_id
                },
                orderBy: {
                    system_date: 'asc'
                }
            })
    
            return res.json(upcomingReservations)

        } else if (reservationState === "past") {
            const pastReservations = await reservations.findMany({
                where:{
                    system_date: {
                        lt: currentDate
                    },
                    diner_id
                },
                orderBy: {
                    system_date: 'asc'
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
                display_date: true,
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

        // 1 Get the current reservation details that the user is trying to edit, store this to update later

        const currentReservationAvailabilityDateTime = await reservations.findUnique({
            where: {
                id: reservation_id
            }, 
            select: {
                party_size: true,
                display_date: true,
                time: true,
                restaurant_id: true
            }
        })

        const currentDateArray = currentReservationAvailabilityDateTime.display_date.split("-")
        const currentDate = currentDateArray[2] + "-" + currentDateArray[1] + "-" + currentDateArray[0]
        const currentAvailbilityDateTime = "" + moment(currentDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(currentReservationAvailabilityDateTime.time, 'HH:mm').format('HH:mm')

        // JavaScript default date is set in MM/DD/YYYY so we need to update that, need to explicitly break it down into this format
        const dateArray = date.split("-")
        const newDate = dateArray[2] + "-" + dateArray[1] + "-" + dateArray[0]
        const displayDate = "" + moment(newDate, 'YYYY-MM-DD').format('DD-MM-YYYY')

        // 1 Check if the new reservation details that they have supplied has availability
        const availabilityCheckDateTime = "" + moment(newDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(time, 'HH:mm').format('HH:mm')
        let availabilityCheck = false
        let availabilityUpdate = false

        // 2a If no availibility, throw an error
        // 2b If there is avaibility, update the availability to take the new reservation slot
        switch(party_size) {
            case(1):
                availabilityCheck = await availabilityDateTime.findFirst({
                    where: {
                        date_time: availabilityCheckDateTime,
                        available_table_one: {
                                gt: 0
                        },
                        restaurant_id: currentReservationAvailabilityDateTime.restaurant_id
                    }
                })

                if(!availabilityCheck){
                    return res.status(422).json({error: "Unable to change booking for this party size, date and time. Please try another timing!"})
                }
                
                availabilityUpdate = await availabilityDateTime.update({
                    where: {
                        id: availabilityCheck.id
                    },
                    data: {
                        available_table_one: {
                            decrement: 1
                        }
                    }
                })
                break;
            case(2):
                availabilityCheck = await availabilityDateTime.findFirst({
                    where: {
                        date_time: availabilityCheckDateTime,
                        available_table_two: {
                                gt: 0
                        },
                        restaurant_id: currentReservationAvailabilityDateTime.restaurant_id
                    }
                })

                if(!availabilityCheck){
                    return res.status(422).json({error: "Unable to change booking for this party size, date and time. Please try another timing!"})
                }
                
                availabilityUpdate = await availabilityDateTime.update({
                    where: {
                        id: availabilityCheck.id
                    },
                    data: {
                        available_table_two: {
                            decrement: 1
                        }
                    }
                })

                // console.log(availabilityUpdate)
                break;
            case(3):
                availabilityCheck = await availabilityDateTime.findFirst({
                    where: {
                        date_time: availabilityCheckDateTime,
                        available_table_three: {
                                gt: 0
                        },
                        restaurant_id: currentReservationAvailabilityDateTime.restaurant_id

                    }
                })

                if(!availabilityCheck){
                    return res.status(422).json({error: "Unable to change booking for this party size, date and time. Please try another timing!"})
                }
                
                availabilityUpdate = await availabilityDateTime.update({
                    where: {
                        id: availabilityCheck.id
                    },
                    data: {
                        available_table_three: {
                            decrement: 1
                        }
                    }
                })

                // console.log(availabilityUpdate)
                break;
            case(4):
                availabilityCheck = await availabilityDateTime.findFirst({
                    where: {
                        date_time: availabilityCheckDateTime,
                        available_table_four: {
                                gt: 0
                        },
                        restaurant_id: currentReservationAvailabilityDateTime.restaurant_id
                    }
                })

                if(!availabilityCheck){
                    return res.status(422).json({error: "Unable to change booking for this party size, date and time. Please try another timing!"})
                }
                
                availabilityUpdate = await availabilityDateTime.update({
                    where: {
                        id: availabilityCheck.id
                    },
                    data: {
                        available_table_four: {
                            decrement: 1
                        }
                    }
                })
                break;
            case(5):
                availabilityCheck = await availabilityDateTime.findFirst({
                    where: {
                        date_time: availabilityCheckDateTime,
                        available_table_five: {
                                gt: 0
                        },
                        restaurant_id: currentReservationAvailabilityDateTime.restaurant_id
                    }
                })

                if(!availabilityCheck){
                    return res.status(422).json({error: "Unable to change booking for this party size, date and time. Please try another timing!"})
                }
                
                availabilityUpdate = await availabilityDateTime.update({
                    where: {
                        id: availabilityCheck.id
                    },
                    data: {
                        available_table_five: {
                            decrement: 1
                        }
                    }
                })
                break;
        }


        
        // 3 Update the reservation table with the new values [Done]

        const updateReservation = await reservations.update({
            where: {
                id: reservation_id
            }, 
            data: {
                party_size,
                display_date: displayDate,
                system_date: new Date(newDate),
                time
            }
        })

        if(!updateReservation) {
            return res.status(422).json({error: "Unabled to update your reservation!"})
        }
        
        // 5 For the old reservation that you had, update the availibility back up
        let currentAvailabilityCheck = false
        let currentAvailbilityUpdate = false 
        switch(currentReservationAvailabilityDateTime.party_size) {
            case(1):
                currentAvailabilityCheck = await availabilityDateTime.findFirst({
                    where: {
                        date_time: currentAvailbilityDateTime,
                        restaurant_id: currentReservationAvailabilityDateTime.restaurant_id
                    }
                })

                if(!currentAvailabilityCheck){
                    return res.status(422).json({error: "Something when wrong when trying to update"})
                }
                
                currentAvailbilityUpdate = await availabilityDateTime.update({
                    where: {
                        id: currentAvailabilityCheck.id
                    },
                    data: {
                        available_table_one: {
                            increment: 1
                        }
                    }
                })
                break;
            case(2):
                currentAvailabilityCheck = await availabilityDateTime.findFirst({
                    where: {
                        date_time: currentAvailbilityDateTime,
                        restaurant_id: currentReservationAvailabilityDateTime.restaurant_id
                    }
                })

                if(!currentAvailabilityCheck){
                    return res.status(422).json({error: "Something when wrong when trying to update"})
                }
                
                currentAvailbilityUpdate = await availabilityDateTime.update({
                    where: {
                        id: currentAvailabilityCheck.id
                    },
                    data: {
                        available_table_two: {
                            increment: 1
                        }
                    }
                })
                break;
            case(3):
                currentAvailabilityCheck = await availabilityDateTime.findFirst({
                    where: {
                        date_time: currentAvailbilityDateTime,
                        restaurant_id: currentReservationAvailabilityDateTime.restaurant_id
                    }
                })

                if(!currentAvailabilityCheck){
                    return res.status(422).json({error: "Something when wrong when trying to update"})
                }
                
                currentAvailbilityUpdate = await availabilityDateTime.update({
                    where: {
                        id: currentAvailabilityCheck.id
                    },
                    data: {
                        available_table_three: {
                            increment: 1
                        }
                    }
                })
                break;
            case(4):
                currentAvailabilityCheck = await availabilityDateTime.findFirst({
                    where: {
                        date_time: currentAvailbilityDateTime,
                        restaurant_id: currentReservationAvailabilityDateTime.restaurant_id
                    }
                })

                if(!currentAvailabilityCheck){
                    return res.status(422).json({error: "Something when wrong when trying to update"})
                }
                
                currentAvailbilityUpdate = await availabilityDateTime.update({
                    where: {
                        id: currentAvailabilityCheck.id
                    },
                    data: {
                        available_table_four: {
                            increment: 1
                        }
                    }
                })
                break;
            case(5):
                currentAvailabilityCheck = await availabilityDateTime.findFirst({
                    where: {
                        date_time: currentAvailbilityDateTime,
                        restaurant_id: currentReservationAvailabilityDateTime.restaurant_id
                    }
                })

                if(!currentAvailabilityCheck){
                    return res.status(422).json({error: "Something when wrong when trying to update"})
                }
                
                currentAvailbilityUpdate = await availabilityDateTime.update({
                    where: {
                        id: currentAvailabilityCheck.id
                    },
                    data: {
                        available_table_five: {
                            increment: 1
                        }
                    }
                })
                break;
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

    const dateRange = []
    const startDateArray = start_date.split("/")
    const startDate = startDateArray[2] + "-" + startDateArray[1] + "-" + startDateArray[0]
    const startMomentDate = moment(startDate, 'YYYY-MM-DD')
    console.log(startMomentDate)
    // const startMomentDate = moment(startDate, "YYYY-MM-DD")
    // console.log(startMomentDate)

    const endDateArray = end_date.split("/")
    const endDate = endDateArray[2] + "-" + endDateArray[1] + "-" + endDateArray[0]
    const endMomentDate = moment(endDate, 'YYYY-MM-DD')
    console.log(endMomentDate)
    // const endMomentDate = moment(endDate, "YYYY-MM-DD")
    // console.log(endMomentDate)
    dateRange.push(startMomentDate.clone().format('YYYY-MM-DD'))
    while(startMomentDate.add(1, 'days').diff(endMomentDate) <= 0){
        // console.log(startMomentDate.toDate())
        dateRange.push(startMomentDate.clone().format('YYYY-MM-DD'))
    }
    // const dateRange = [moment({...startMomentDate})]

    // while(startMomentDate.date() < endMomentDate.date()){
    //     startMomentDate.add(1, 'day')
    //     console.log(startMomentDate)
    //     dateRange.push(moment({...startMomentDate}))
    // }

    // dateRange.map(x => x.format("YYYY-MM-DD"))
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

    // console.log(timeList)

    const dateTimeList = []

    for(let date of dateRange) {
        for(let time of timeList){
            dateTimeList.push(date + " " + time)
        }
    }

    return res.json(dateTimeList)

})

module.exports = controller