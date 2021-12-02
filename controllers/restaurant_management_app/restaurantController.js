const express = require("express");
const controller = express.Router();
const passport = require("passport");
const { PrismaClient } = require("@prisma/client");
const moment = require("moment");

const { restaurant } = new PrismaClient()



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

             return res.json(restaurantCreated)

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