const express = require("express");
const controller = express.Router();
const passport = require("passport");
// const { PrismaClient } = require("@prisma/client");
const prismaClient = require('../../controller_support/prisma');

const { restaurant } = prismaClient;

// GET all restaurants in the database
controller.get("/restaurant/list", async (req, res) => {
    
    try {
        const restaurants = await restaurant.findMany({
            where: {
                restaurant_status: "open"
            }
        })

        if(!restaurants) {
            return res.status(422).json({ error: "Sorry, no restaurants found!"})
        }
    
        return res.json(restaurants)
    } catch (e) {
        return res.status(400).json({
            name: e.name,
            message: e.message
        })
    }
    
})

// GET all restaurants in a particular city 
controller.get("/restaurant/:city", async(req, res) => {
    
    try {
        let requested_city = req.params.city

        // Capitalise the first letter of the city name as that is how it is store in the database
        requested_city = requested_city.charAt(0).toUpperCase() + requested_city.slice(1)

        const restaurants = await restaurant.findMany({
            where: {
                restaurant_location_city: requested_city
            }
        })

        if(!restaurants) {
            return res.status(422).json({ error: "Sorry, restaurants in the requested city do no exist."})
        }

        return res.json(restaurants)
    } catch (e) {
        return res.status(400).json({
            name: e.name,
            message: e.message
        })
    }
    
    
})

module.exports = controller;