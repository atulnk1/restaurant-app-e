const express = require("express");
const controller = express.Router();
const cors = require("cors");
const passport = require("passport");
// const { PrismaClient } = require("@prisma/client");
const prismaClient = require('../../controller_support/prisma');
const moment = require("moment")

const { reservations, availabilityDateTime, restaurant } = prismaClient

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

// Check if for the specific date & party size, what are the available time slots
controller.get("/reservation/time-list", cors(), async (req,res) => {
    const { party_size, date, restaurant_id } = req.body

    if(!party_size || !date || !restaurant_id){
        console.log(req.body)
        return res.status(422).json({error: "Reservation fields are missing!"})
    }

    const restaurantId = parseInt(restaurant_id)

    // 1 Find the start time, end time and restaurant max seating time for a given restaurant using the restaurant_id
    const resetaurantValues = await restaurant.findUnique({
        where: {
            id: restaurantId
        },
        select: {
            id: true, 
            restaurant_average_seating_time: true,
            restaurant_start_time: true,
            restaurant_end_time: true
        }
    })

    // 2 Create a time range based on the start and end time
    const restaurantStartTime = moment(resetaurantValues.restaurant_start_time, 'HH:mm')
    const restaurantEndTime = moment(resetaurantValues.restaurant_end_time, 'HH:mm')

    const fullRestaurantTimeList = timeRangeGenerator(restaurantStartTime, restaurantEndTime)

    
    const checkDateArray = date.split("-")
    const checkDate = checkDateArray[2] + "-" + checkDateArray[1] + "-" + checkDateArray[0]

    // Need this to find the window size for a restaurant that is being booked
    const checkWindowSize = parseInt(resetaurantValues.restaurant_average_seating_time) / 15

    let avialabaleTimeList = []
    let newAvailabilityCheck = false
    for(i = 0; i < fullRestaurantTimeList.length; i++){
        let timeWindow = fullRestaurantTimeList.slice(i, i+checkWindowSize)
        let unverifiedTimeList = []
        for(let indTime of timeWindow) {
            unverifiedTimeList.push(
                {
                    date_time: "" + moment(checkDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                    available_table_one: {
                        gt: 0
                    },
                    restaurant_id
                }
            )
        }

        // 3 For each time slot, see if there is any availability for that specific time for the time window 
        newAvailabilityCheck = await availabilityDateTime.findMany({
            where: {
                OR: unverifiedTimeList
            }
        })

        if(newAvailabilityCheck.length === timeWindow.length) {
            avialabaleTimeList.push(fullRestaurantTimeList[i])
        }

    }

    if(!avialabaleTimeList) {
        return res.status(422).json({error: "Sorry, none of the chosen times are avialable"})
    }

    // 4 Send back the updated list to the front end

    return res.json(avialabaleTimeList)
})

// Advanced version of the booking flow that takes into consideration availbility slots
controller.post("/v2/reservation/book", authChecker, async (req,res) => {
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
                restaurant_average_seating_time: true
            }
        })

        // console.log(restaurantValues)
        // 2 Create your intervals based on this and the the seating time
        const startBookingTime = moment(time, 'HH:mm')
        const tempTime = moment(time, 'HH:mm')
        const endBookingTime = tempTime.add(restaurantValues.restaurant_average_seating_time, 'minutes')
        const timeList = timeRangeGenerator(startBookingTime, endBookingTime)
        // console.log(endBookingTime)
        // console.log(timeList)
        const dateArray = date.split("-")
        const newDate = dateArray[2] + "-" + dateArray[1] + "-" + dateArray[0]
        const displayDate = "" + moment(newDate, 'YYYY-MM-DD').format('DD-MM-YYYY')

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
                    return res.status(404).json({error: "Sorry we are unable to book for this party size, date or time. Please try another combination!"})
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
                    return res.status(404).json({error: "Sorry we are unable to book for this party size, date or time. Please try another combination!"})
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
                break;
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
                    return res.status(404).json({error: "Sorry we are unable to book for this party size, date or time. Please try another combination!"})
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
                break;
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
                    return res.status(404).json({error: "Sorry we are unable to book for this party size, date or time. Please try another combination!"})
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
                break;
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
                    return res.status(404).json({error: "Sorry we are unable to book for this party size, date or time. Please try another combination!"})
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
                break;
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
            },
            select: {
                id: true,
                party_size: true,
                display_date: true,
                time: true,
                reservation_status: true,
                diner_id: true,
                restaurant_id: true
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
            },
            select: {
                id: true,
                party_size: true,
                display_date: true,
                time: true,
                reservation_status: true,
                diner_id: true,
                restaurant_id: true
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

// GET either upcoming or past reservation on user profile page to display to them
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
                },
                select: {
                    id: true,
                    party_size: true,
                    display_date: true,
                    time: true,
                    reservation_status: true,
                    diner_id: true,
                    restaurant_id: true
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
                },
                select: {
                    id: true,
                    party_size: true,
                    display_date: true,
                    time: true,
                    reservation_status: true,
                    diner_id: true,
                    restaurant_id: true
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


// GET reservation information: party_size, date and to edit. restaurant_id sent as well to find restaurant to edit later
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
                restaurant_id: true
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

// Advanced version of the edit flow that takes into consideration availbility slots
controller.patch("/v2/reservation/:reservation_id", authChecker, async(req, res ) => {
    try {
        const reservation_id = req.params.reservation_id

        const { party_size, date, time, restaurant_id } = req.body

        if(!party_size || !date || !time || !restaurant_id){
            return res.status(422).json({error: "Reservation fields are missing!"})
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

        // 2 [Current Booking]: Get the current reservation details that the user is trying to edit, store this to update later

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

        // 2A [Current Booking]:Get a list of time slots that are used for your current booking

        const currentStartBookingTime = moment(currentReservationAvailabilityDateTime.time, 'HH:mm')
        const currentTempTime = moment(currentReservationAvailabilityDateTime.time, 'HH:mm')
        const currentEndBookingTime = currentTempTime.add(restaurantValues.restaurant_average_seating_time, 'minutes')
        const currentTimeList = timeRangeGenerator(currentStartBookingTime, currentEndBookingTime)

        // 2B [Current Booking]:Set the current date in the right format for later
        const currentDateArray = currentReservationAvailabilityDateTime.display_date.split("-")
        const currentDate = currentDateArray[2] + "-" + currentDateArray[1] + "-" + currentDateArray[0]


        // 3A [New Booking]: Get a list of time slots that will be used for the new booking
        const newStartBookingTime = moment(time, 'HH:mm')
        const newTempTime = moment(time, 'HH:mm')
        const newEndBookingTime = newTempTime.add(restaurantValues.restaurant_average_seating_time, 'minutes')
        const newTimeList = timeRangeGenerator(newStartBookingTime, newEndBookingTime)
        // console.log(newEndBookingTime)

        // 3B [New Booking]: Set the current date in the right format to check availbility
        const newDateArray = date.split('-')
        const newDate = newDateArray[2] + "-" + newDateArray[1] + "-" + newDateArray[0]
        const displayDate = "" + moment(newDate, 'YYYY-MM-DD').format('DD-MM-YYYY')

       

        // 4 [New Booking]: Check availability and update the existing booking with new details 
        const newDateTimeList = []
        let newAvailabilityCheck = false
        let newAvailabilityUpdate = false

        

        switch(party_size) {
            case(1):
                // 4A [New Booking]: Generate list of date_time values to check if the new booking is possible
                for(let indTime of newTimeList) {
                    newDateTimeList.push(
                        {
                            date_time: "" + moment(newDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                            available_table_one: {
                                gt: 0
                            },
                            restaurant_id
                        }
                    )
                }
                // 4B [New Booking]: Find the list of next time slots that are available for the new booking
                newAvailabilityCheck = await availabilityDateTime.findMany({
                    where: {
                        OR: newDateTimeList
                    }
                })

                // 4B1 [New Booking]: If the number of time slots available is less than the number of times, throw error
                if(newAvailabilityCheck.length < newDateTimeList.length) {
                    return res.status(404).json({error: "Sorry we are unable to book for this party size, date or time. Please try another combination!"})
                }

                // 4B2 [New Booking]: If the number of time slots available is the same as the number of time slots, decrement the availbility window
                for(let indAvail of newAvailabilityCheck) {
                    newAvailabilityUpdate = await availabilityDateTime.update({
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
                break;
            case(2):
                // 4A [New Booking]: Generate list of date_time values to check if the new booking is possible
                for(let indTime of newTimeList) {
                    newDateTimeList.push(
                        {
                            date_time: "" + moment(newDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                            available_table_two: {
                                gt: 0
                            },
                            restaurant_id
                        }
                    )
                }

                // 4B [New Booking]: Find the list of next time slots that are available for the new booking
                newAvailabilityCheck = await availabilityDateTime.findMany({
                    where: {
                        OR: newDateTimeList
                    }
                })

                // 4B1 [New Booking]: If the number of time slots available is less than the number of times, throw error
                if(newAvailabilityCheck.length < newDateTimeList.length) {
                    return res.status(404).json({error: "Sorry we are unable to book for this party size, date or time. Please try another combination!"})
                }

                // 4B2 [New Booking]: If the number of time slots available is the same as the number of time slots, decrement the availbility window
                for(let indAvail of newAvailabilityCheck) {
                    newAvailabilityUpdate = await availabilityDateTime.update({
                        where: {
                            id: indAvail.id
                        },
                        data: {
                            available_table_two: {
                                decrement: 1
                            }
                        }
                    })
                    // console.log(indAvail)
                }
                break;
            case(3):
                // 4A [New Booking]: Generate list of date_time values to check if the new booking is possible
                for(let indTime of newTimeList) {
                    newDateTimeList.push(
                        {
                            date_time: "" + moment(newDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                            available_table_three: {
                                gt: 0
                            },
                            restaurant_id
                        }
                    )
                }
                // 4B [New Booking]: Find the list of next time slots that are available for the new booking
                newAvailabilityCheck = await availabilityDateTime.findMany({
                    where: {
                        OR: newDateTimeList
                    }
                })

                // 4B1 [New Booking]: If the number of time slots available is less than the number of times, throw error
                if(newAvailabilityCheck.length < newDateTimeList.length) {
                    return res.status(404).json({error: "Sorry we are unable to book for this party size, date or time. Please try another combination!"})
                }

                // 4B2 [New Booking]: If the number of time slots available is the same as the number of time slots, decrement the availbility window
                for(let indAvail of newAvailabilityCheck) {
                    newAvailabilityUpdate = await availabilityDateTime.update({
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
                break;
            case(4):
                // 4A [New Booking]: Generate list of date_time values to check if the new booking is possible
                for(let indTime of newTimeList) {
                    newDateTimeList.push(
                        {
                            date_time: "" + moment(newDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                            available_table_four: {
                                gt: 0
                            },
                            restaurant_id
                        }
                    )
                }
                // 4B [New Booking]: Find the list of next time slots that are available for the new booking
                newAvailabilityCheck = await availabilityDateTime.findMany({
                    where: {
                        OR: newDateTimeList
                    }
                })

                // 4B1 [New Booking]: If the number of time slots available is less than the number of times, throw error
                if(newAvailabilityCheck.length < newDateTimeList.length) {
                    return res.status(404).json({error: "Sorry we are unable to book for this party size, date or time. Please try another combination!"})
                }

                // 4B2 [New Booking]: If the number of time slots available is the same as the number of time slots, decrement the availbility window
                for(let indAvail of newAvailabilityCheck) {
                    newAvailabilityUpdate = await availabilityDateTime.update({
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
                break;
            case(5):
                // 4A [New Booking]: Generate list of date_time values to check if the new booking is possible
                for(let indTime of newTimeList) {
                    newDateTimeList.push(
                        {
                            date_time: "" + moment(newDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                            available_table_five: {
                                gt: 0
                            },
                            restaurant_id
                        }
                    )
                }
                // 4B [New Booking]: Find the list of next time slots that are available for the new booking
                newAvailabilityCheck = await availabilityDateTime.findMany({
                    where: {
                        OR: newDateTimeList
                    }
                })

                // 4B1 [New Booking]: If the number of time slots available is less than the number of times, throw error
                if(newAvailabilityCheck.length < newDateTimeList.length) {
                    return res.status(404).json({error: "Sorry we are unable to book for this party size, date or time. Please try another combination!"})
                }

                // 4B2 [New Booking]: If the number of time slots available is the same as the number of time slots, decrement the availbility window
                for(let indAvail of newAvailabilityCheck) {
                    newAvailabilityUpdate = await availabilityDateTime.update({
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
                break;
        }

        // 5 [New Booking]: Update the new booking for the reservation
        const updateReservation = await reservations.update({
            where: {
                id: reservation_id
            }, 
            data: {
                party_size,
                display_date: displayDate,
                system_date: new Date(newDate),
                time
            },
            select: {
                id: true,
                party_size: true,
                display_date: true,
                time: true,
                reservation_status: true,
                diner_id: true,
                restaurant_id: true
            }
        })

        if(!updateReservation) {
            return res.status(422).json({error: "Unable to update your reservation!"})
        }


        // 6 [Current Booking]: Find the current time slots that were reserved and increment them
        const currentDateTimeList = []
        let currentAvailabilityCheck = false
        let currentAvailbilityUpdate = false 

        switch(currentReservationAvailabilityDateTime.party_size) {
            case(1):
                // 6A [Current Booking]: Generate a list of availability ids that will now be available 
                for(let indTime of currentTimeList) {
                    currentDateTimeList.push(
                        {
                            date_time: "" + moment(currentDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                            restaurant_id
                        }
                    )
                }

                // 6B [Current Booking]: Find the list of availability date times that need to be updated
                currentAvailabilityCheck = await availabilityDateTime.findMany({
                    where: {
                        OR: currentDateTimeList
                    }
                })
                // 6C [Current Booking]: This check will most likely not be triggered but best to make sure 
                if(currentAvailabilityCheck.length < currentTimeList.length) {
                    return res.status(404).json({error: "Something went wrong when try to reset availability"})
                }

                // 6D [Current Booking]: Updating the availbility for the old timeslots, allowing them to be bookable
                for(let indAvail of currentAvailabilityCheck) {
                    if(indAvail.available_table_one < restaurantValues.restaurant_max_table_one) {
                        newAvailabilityUpdate = await availabilityDateTime.update({
                            where: {
                                id: indAvail.id
                            },
                            data: {
                                available_table_one: {
                                    increment: 1
                                }
                            }
                        })
                    }
                    
                }
                break;
            case(2):
                // 6A [Current Booking]: Generate a list of availability ids that will now be available 
                for(let indTime of currentTimeList) {
                    currentDateTimeList.push(
                        {
                            date_time: "" + moment(currentDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                            restaurant_id
                        }
                    )
                }

                // 6B [Current Booking]: Find the list of availability date times that need to be updated
                currentAvailabilityCheck = await availabilityDateTime.findMany({
                    where: {
                        OR: currentDateTimeList
                    }
                })
                // 6C [Current Booking]: This check will most likely not be triggered but best to make sure 
                if(currentAvailabilityCheck.length < currentTimeList.length) {
                    return res.status(404).json({error: "Something went wrong when try to reset availability"})
                }

                // 6D [Current Booking]: Updating the availbility for the old timeslots, allowing them to be bookable
                for(let indAvail of currentAvailabilityCheck) {
                    if(indAvail.available_table_two < restaurantValues.restaurant_max_table_two) {
                        newAvailabilityUpdate = await availabilityDateTime.update({
                            where: {
                                id: indAvail.id
                            },
                            data: {
                                available_table_two: {
                                    increment: 1
                                }
                            }
                        })
                    }
                    
                }
                break;
            case(3):
                // 6A [Current Booking]: Generate a list of availability ids that will now be available 
                for(let indTime of currentTimeList) {
                    currentDateTimeList.push(
                        {
                            date_time: "" + moment(currentDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                            restaurant_id
                        }
                    )
                }

                // 6B [Current Booking]: Find the list of availability date times that need to be updated
                currentAvailabilityCheck = await availabilityDateTime.findMany({
                    where: {
                        OR: currentDateTimeList
                    }
                })
                // 6C [Current Booking]: This check will most likely not be triggered but best to make sure 
                if(currentAvailabilityCheck.length < currentTimeList.length) {
                    return res.status(404).json({error: "Something went wrong when try to reset availability"})
                }

                // 6D [Current Booking]: Updating the availbility for the old timeslots, allowing them to be bookable
                for(let indAvail of currentAvailabilityCheck) {
                    if(indAvail.available_table_three < restaurantValues.restaurant_max_table_three) {
                        newAvailabilityUpdate = await availabilityDateTime.update({
                            where: {
                                id: indAvail.id
                            },
                            data: {
                                available_table_three: {
                                    increment: 1
                                }
                            }
                        })
                    }
                }
                break;
            case(4):
                // 6A [Current Booking]: Generate a list of availability ids that will now be available 
                for(let indTime of currentTimeList) {
                    currentDateTimeList.push(
                        {
                            date_time: "" + moment(currentDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                            restaurant_id
                        }
                    )
                }

                // 6B [Current Booking]: Find the list of availability date times that need to be updated
                currentAvailabilityCheck = await availabilityDateTime.findMany({
                    where: {
                        OR: currentDateTimeList
                    }
                })
                // 6C [Current Booking]: This check will most likely not be triggered but best to make sure 
                if(currentAvailabilityCheck.length < currentTimeList.length) {
                    return res.status(404).json({error: "Something went wrong when try to reset availability"})
                }

                // 6D [Current Booking]: Updating the availbility for the old timeslots, allowing them to be bookable
                for(let indAvail of currentAvailabilityCheck) {
                    if(indAvail.available_table_four < restaurantValues.restaurant_max_table_four) {
                        newAvailabilityUpdate = await availabilityDateTime.update({
                            where: {
                                id: indAvail.id
                            },
                            data: {
                                available_table_four: {
                                    increment: 1
                                }
                            }
                        })
                    }
                }
                break;
            case(5):
                // 6A [Current Booking]: Generate a list of availability ids that will now be available 
                for(let indTime of currentTimeList) {
                    currentDateTimeList.push(
                        {
                            date_time: "" + moment(currentDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                            restaurant_id
                        }
                    )
                }

                // 6B [Current Booking]: Find the list of availability date times that need to be updated
                currentAvailabilityCheck = await availabilityDateTime.findMany({
                    where: {
                        OR: currentDateTimeList
                    }
                })
                // 6C [Current Booking]: This check will most likely not be triggered but best to make sure 
                if(currentAvailabilityCheck.length < currentTimeList.length) {
                    return res.status(404).json({error: "Something went wrong when try to reset availability"})
                }

                // 6D [Current Booking]: Updating the availbility for the old timeslots, allowing them to be bookable
                for(let indAvail of currentAvailabilityCheck) {
                    if(indAvail.available_table_five < restaurantValues.restaurant_max_table_five) {
                        newAvailabilityUpdate = await availabilityDateTime.update({
                            where: {
                                id: indAvail.id
                            },
                            data: {
                                available_table_five: {
                                    increment: 1
                                }
                            }
                        })
                    }
                }
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
            },
            select: {
                id: true,
                party_size: true,
                display_date: true,
                time: true,
                reservation_status: true,
                diner_id: true,
                restaurant_id: true
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


controller.patch("/v2/reservation/:reservation_id/cancel", authChecker, async(req, res) => {
    try {
        const reservation_id = req.params.reservation_id

        // 1 Get the details of the existing booking: restaurant_id, date, time, party_size
        const currentReservationAvailabilityDateTime = await reservations.findUnique({
            where: {
                id: reservation_id
            }, 
            select: {
                party_size: true,
                display_date: true,
                time: true,
                restaurant_id: true,
                reservation_status: true
            }
        })

        if(currentReservationAvailabilityDateTime.reservation_status === 'cancelled') {
            return res.status(400).json({error: "Reservation is already cancelled!"})
        }
        // 2 Get information of the restaurant that is being called: average seating time, max seating capacity
        const restaurantValues = await restaurant.findUnique({
            where: {
                id: currentReservationAvailabilityDateTime.restaurant_id
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

        // 3 Get the list of date_times that need to be queried

        // console.log(currentReservationAvailabilityDateTime)

        const currentStartBookingTime = moment(currentReservationAvailabilityDateTime.time, 'HH:mm')
        const currentTempTime = moment(currentReservationAvailabilityDateTime.time, 'HH:mm')
        const currentEndBookingTime = currentTempTime.add(restaurantValues.restaurant_average_seating_time, 'minutes')
        const currentTimeList = timeRangeGenerator(currentStartBookingTime, currentEndBookingTime)

        const currentDateArray = currentReservationAvailabilityDateTime.display_date.split("-")
        const currentDate = currentDateArray[2] + "-" + currentDateArray[1] + "-" + currentDateArray[0]


        // 4 Update the list of date_times by incrementing them

        const currentDateTimeList = []
        let currentAvailabilityCheck = false
        let currentAvailbilityUpdate = false 

        switch(currentReservationAvailabilityDateTime.party_size) {
            case(1):
                // 4A [Current Booking]: Generate a list of availability ids that will now be available 
                for(let indTime of currentTimeList) {
                    currentDateTimeList.push(
                        {
                            date_time: "" + moment(currentDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                            restaurant_id: currentReservationAvailabilityDateTime.restaurant_id
                        }
                    )
                }

                // 4B [Current Booking]: Find the list of availability date times that need to be updated
                currentAvailabilityCheck = await availabilityDateTime.findMany({
                    where: {
                        OR: currentDateTimeList
                    }
                })
                // 4C [Current Booking]: This check will most likely not be triggered but best to make sure 
                if(currentAvailabilityCheck.length < currentTimeList.length) {
                    return res.status(404).json({error: "Something went wrong when try to reset availability"})
                }

                // 4D [Current Booking]: Updating the availbility for the old timeslots, allowing them to be bookable
                for(let indAvail of currentAvailabilityCheck) {
                    if(indAvail.available_table_one < restaurantValues.restaurant_max_table_one) {
                        newAvailabilityUpdate = await availabilityDateTime.update({
                            where: {
                                id: indAvail.id
                            },
                            data: {
                                available_table_one: {
                                    increment: 1
                                }
                            }
                        })
                    }
                    
                }
                break;
            case(2):
                // 4A [Current Booking]: Generate a list of availability ids that will now be available 
                for(let indTime of currentTimeList) {
                    currentDateTimeList.push(
                        {
                            date_time: "" + moment(currentDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                            restaurant_id: currentReservationAvailabilityDateTime.restaurant_id
                        }
                    )
                }

                // 4B [Current Booking]: Find the list of availability date times that need to be updated
                currentAvailabilityCheck = await availabilityDateTime.findMany({
                    where: {
                        OR: currentDateTimeList
                    }
                })
                // 4C [Current Booking]: This check will most likely not be triggered but best to make sure 
                if(currentAvailabilityCheck.length < currentTimeList.length) {
                    return res.status(404).json({error: "Something went wrong when try to reset availability"})
                }

                // 4D [Current Booking]: Updating the availbility for the old timeslots, allowing them to be bookable
                for(let indAvail of currentAvailabilityCheck) {
                    if(indAvail.available_table_two < restaurantValues.restaurant_max_table_two) {
                        newAvailabilityUpdate = await availabilityDateTime.update({
                            where: {
                                id: indAvail.id
                            },
                            data: {
                                available_table_two: {
                                    increment: 1
                                }
                            }
                        })
                    }
                    
                }
                break;
            case(3):
                // 4A [Current Booking]: Generate a list of availability ids that will now be available 
                for(let indTime of currentTimeList) {
                    currentDateTimeList.push(
                        {
                            date_time: "" + moment(currentDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                            restaurant_id: currentReservationAvailabilityDateTime.restaurant_id
                        }
                    )
                }

                // 4B [Current Booking]: Find the list of availability date times that need to be updated
                currentAvailabilityCheck = await availabilityDateTime.findMany({
                    where: {
                        OR: currentDateTimeList
                    }
                })
                // 4C [Current Booking]: This check will most likely not be triggered but best to make sure 
                if(currentAvailabilityCheck.length < currentTimeList.length) {
                    return res.status(404).json({error: "Something went wrong when try to reset availability"})
                }

                // 4D [Current Booking]: Updating the availbility for the old timeslots, allowing them to be bookable
                for(let indAvail of currentAvailabilityCheck) {
                    if(indAvail.available_table_three < restaurantValues.restaurant_max_table_three) {
                        newAvailabilityUpdate = await availabilityDateTime.update({
                            where: {
                                id: indAvail.id
                            },
                            data: {
                                available_table_three: {
                                    increment: 1
                                }
                            }
                        })
                    }
                }
                break;
            case(4):
                // 4A [Current Booking]: Generate a list of availability ids that will now be available 
                for(let indTime of currentTimeList) {
                    currentDateTimeList.push(
                        {
                            date_time: "" + moment(currentDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                            restaurant_id: currentReservationAvailabilityDateTime.restaurant_id
                        }
                    )
                }

                // 4B [Current Booking]: Find the list of availability date times that need to be updated
                currentAvailabilityCheck = await availabilityDateTime.findMany({
                    where: {
                        OR: currentDateTimeList
                    }
                })
                // 4C [Current Booking]: This check will most likely not be triggered but best to make sure 
                if(currentAvailabilityCheck.length < currentTimeList.length) {
                    return res.status(404).json({error: "Something went wrong when try to reset availability"})
                }

                // 4D [Current Booking]: Updating the availbility for the old timeslots, allowing them to be bookable
                for(let indAvail of currentAvailabilityCheck) {
                    if(indAvail.available_table_four < restaurantValues.restaurant_max_table_four) {
                        newAvailabilityUpdate = await availabilityDateTime.update({
                            where: {
                                id: indAvail.id
                            },
                            data: {
                                available_table_four: {
                                    increment: 1
                                }
                            }
                        })
                    }
                }
                break;
            case(5):
                // 4A [Current Booking]: Generate a list of availability ids that will now be available 
                for(let indTime of currentTimeList) {
                    currentDateTimeList.push(
                        {
                            date_time: "" + moment(currentDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(indTime, 'HH:mm').format('HH:mm'),
                            restaurant_id: currentReservationAvailabilityDateTime.restaurant_id
                        }
                    )
                }

                // 4B [Current Booking]: Find the list of availability date times that need to be updated
                currentAvailabilityCheck = await availabilityDateTime.findMany({
                    where: {
                        OR: currentDateTimeList
                    }
                })
                // 4C [Current Booking]: This check will most likely not be triggered but best to make sure 
                if(currentAvailabilityCheck.length < currentTimeList.length) {
                    return res.status(404).json({error: "Something went wrong when try to reset availability"})
                }

                // 4D [Current Booking]: Updating the availbility for the old timeslots, allowing them to be bookable
                for(let indAvail of currentAvailabilityCheck) {
                    if(indAvail.available_table_five < restaurantValues.restaurant_max_table_five) {
                        newAvailabilityUpdate = await availabilityDateTime.update({
                            where: {
                                id: indAvail.id
                            },
                            data: {
                                available_table_five: {
                                    increment: 1
                                }
                            }
                        })
                    }
                }
            break;
        }


        // 5 Update the reservation status to cancelled
        const cancelReservation = await reservations.update({
            where: {
                id: reservation_id
            }, 
            data: {
                reservation_status: "cancelled"
            },
            select: {
                id: true,
                party_size: true,
                display_date: true,
                time: true,
                reservation_status: true,
                diner_id: true,
                restaurant_id: true
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
            },
            select: {
                id: true,
                party_size: true,
                display_date: true,
                time: true,
                reservation_status: true,
                diner_id: true,
                restaurant_id: true
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