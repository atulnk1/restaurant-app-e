const express = require("express");
const controller = express.Router();
const passport = require("passport");
// const { PrismaClient } = require("@prisma/client");
const prismaClient = require('../../controller_support/prisma');
const moment = require("moment");

const { restaurant, availabilityDateTime } = prismaClient

const dateRangeGenerator = (startDate, endDate) => {
    const dateRange = []
    const startMomentDate = moment(startDate, 'YYYY-MM-DD')
    const endMomentDate = moment(endDate, 'YYYY-MM-DD')
    dateRange.push(startMomentDate.clone().format('YYYY-MM-DD'))
    while(startMomentDate.add(1, 'days').diff(endMomentDate) <= 0){
        dateRange.push(startMomentDate.clone().format('YYYY-MM-DD'))
    }

    return dateRange

}

const timeRangeGenerator = (startTime, endTime) => {
    const startMomentTime = moment(startTime, 'HH:mm')
    const endMomentTime = moment(endTime, 'HH:mm')
    // This is to set the intervals of 15 minutes between each time slot
    startMomentTime.minutes(Math.ceil(startMomentTime.minutes() / 15) * 15)
    const timeList = []
    const current = moment(startMomentTime)
    while (current <= endMomentTime) {
        timeList.push(current.format('HH:mm'))
        current.add(15, 'minutes')
    }

    return timeList
}

// Helper function to get us a array of date, time and available tables for each table configuration type (i.e. table for 1 till table for 5)
const dateTimeGenerator = (startDate, endDate, startTime, endTime, tableForOne, tableForTwo, tableForThree, tableForFour, tableForFive, restaurantId) => {

    const dateRange = dateRangeGenerator(startDate, endDate)
    
    const timeList = timeRangeGenerator(startTime, endTime)

    const dateTimeList = []
    for(let date of dateRange) {
        for(let time of timeList){
            // dateTimeList.push(date.format("YYYY-MM-DD") + " " + time)
            dateTimeList.push({
                date_time: date + " " + time,
                available_table_one: tableForOne,
                available_table_two: tableForTwo,
                available_table_three: tableForThree,
                available_table_four: tableForFour,
                available_table_five: tableForFive,
                restaurant_id: restaurantId
            })
        }
    }

    return dateTimeList

}


controller.post("/restaurant_management/create", async(req, res) => {
    try {

        // restaurant_start_date and restaurant_end_date use the AMERICAN MM/DD/YYYY system
        const { 
            restaurant_name, 
            restaurant_location_address, 
            restaurant_location_city,
            restaurant_location_country,
            restaurant_location_lat,
            restaurant_location_long, 
            restaurant_image,
            restaurant_opening_hours,
            restaurant_facilities,
            restaurant_cuisine,
            restaurant_cost,
            restaurant_start_date,
            restaurant_end_date,
            restaurant_start_time,
            restaurant_end_time,
            restaurant_average_seating_time,
            restaurant_max_table_one,
            restaurant_max_table_two,
            restaurant_max_table_three,
            restaurant_max_table_four,
            restaurant_max_table_five
         } = req.body

         if(!restaurant_name ||
            !restaurant_location_address ||
            !restaurant_location_city ||
            !restaurant_location_country ||
            !restaurant_location_lat ||
            !restaurant_location_long ||
            !restaurant_image ||
            !restaurant_opening_hours ||
            !restaurant_facilities ||
            !restaurant_cuisine ||
            !restaurant_cost ||
            !restaurant_start_date ||
            !restaurant_end_date ||
            !restaurant_start_time ||
            !restaurant_end_time ||
            !restaurant_average_seating_time ||
            !restaurant_max_table_one ||
            !restaurant_max_table_two ||
            !restaurant_max_table_three ||
            !restaurant_max_table_four ||
            !restaurant_max_table_five){
                return res.status(422).json({error: "Fields are missing, please end necessary fields"})
            }

            // Correcting the format for the start and end date for when the restaurant will be operational
            const startDateArray = restaurant_start_date.split("-")
            const startDate = startDateArray[2] + "-" + startDateArray[1] + "-" + startDateArray[0]

            const endDateArray = restaurant_end_date.split("-")
            const endDate = endDateArray[2] + "-" + endDateArray[1] + "-" + endDateArray[0]

            const resetaurantCuisineSearch = restaurant_cuisine.join(", ")

            const restaurantCreated = await restaurant.create({
                data: {
                    restaurant_name, 
                    restaurant_location_address, 
                    restaurant_location_city,
                    restaurant_location_country,
                    restaurant_location_lat,
                    restaurant_location_long, 
                    restaurant_image,
                    restaurant_opening_hours,
                    restaurant_facilities,
                    restaurant_cuisine,
                    restaurant_cuisine_search: resetaurantCuisineSearch,
                    restaurant_cost,
                    restaurant_start_date: new Date(startDate),
                    restaurant_end_date: new Date(endDate),
                    restaurant_start_time,
                    restaurant_end_time,
                    restaurant_average_seating_time,
                    restaurant_max_table_one,
                    restaurant_max_table_two,
                    restaurant_max_table_three,
                    restaurant_max_table_four,
                    restaurant_max_table_five
                }
            })

            const dateTimeAvaibilityList = dateTimeGenerator(
                startDate, 
                endDate, 
                restaurant_start_time, 
                restaurant_end_time, 
                restaurant_max_table_one,
                restaurant_max_table_two,
                restaurant_max_table_three,
                restaurant_max_table_four,
                restaurant_max_table_five,
                restaurantCreated.id
            )

            const availabilityDateTimeSet = await availabilityDateTime.createMany({
                data: dateTimeAvaibilityList
            })   

            return res.json(availabilityDateTimeSet)
            // return res.json(restaurantCreated)

    } catch (e) {
        return res.status(400).json({
            name: e.name,
            message: e.message
        })
    }
})

controller.get("/restaurant_management/:id/edit", async(req, res) => {
    try {
        const restaurant_id = parseInt(req.params.id)
    
        const selectedRestaurant = await restaurant.findUnique({
            where: {
                id: restaurant_id
            }
        })

        if(!selectedRestaurant){
            return res.status(422).json({
                error: "Unknow restaurant, please try again"
            })
        }

        return res.status(200).json({
            selectedRestaurant
        })
    } catch (e) {
        return res.status(400).json({
            name: e.name,
            message: e.message
        })
    }
    
})

controller.put("/restaurant_management/:id", async(req, res) => {
    try {
        const restaurant_id = parseInt(req.params.id)

        const { 
            restaurant_name, 
            restaurant_location_address, 
            restaurant_location_city,
            restaurant_location_country,
            restaurant_location_lat,
            restaurant_location_long, 
            restaurant_image,
            restaurant_opening_hours,
            restaurant_facilities,
            restaurant_cuisine,
            restaurant_cost,
            restaurant_start_date,
            restaurant_end_date,
            restaurant_start_time,
            restaurant_end_time,
            restaurant_average_seating_time,
            restaurant_max_table_one,
            restaurant_max_table_two,
            restaurant_max_table_three,
            restaurant_max_table_four,
            restaurant_max_table_five
         } = req.body

        const selectedRestaurant = await restaurant.update({
            where: {
                id: restaurant_id
            },
            data: {
                restaurant_name, 
                restaurant_location_address, 
                restaurant_location_city,
                restaurant_location_country,
                restaurant_location_lat,
                restaurant_location_long, 
                restaurant_image,
                restaurant_opening_hours,
                restaurant_facilities,
                restaurant_cuisine,
                restaurant_cost,
                restaurant_start_date: new Date(restaurant_start_date),
                restaurant_end_date: new Date(restaurant_end_date),
                restaurant_start_time: restaurant_start_time,
                restaurant_end_time: restaurant_end_time,
                restaurant_average_seating_time,
                restaurant_max_table_one,
                restaurant_max_table_two,
                restaurant_max_table_three,
                restaurant_max_table_four,
                restaurant_max_table_five
            }
        })

        return res.status(200).json({
            selectedRestaurant
        })

    } catch (e) {
        return res.status(400).json({
            name: e.name,
            message: e.message
        })
    }
    
})

controller.delete("/restaurant_management/:id", async(req, res) => {
    try {
        const restaurant_id = parseInt(req.params.id)

        await restaurant.delete({
            where: {
                id: restaurant_id
            }
        })

        return res.status(203).json({ message:"Restaurant successfully deleted!" })
    } catch (e) {
        return res.status(400).json({
            name: e.name,
            message: e.message
        })
    }
})

module.exports = controller