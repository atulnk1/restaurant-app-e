const express = require("express");
const controller = express.Router();
const passport = require("passport");
// const { PrismaClient } = require("@prisma/client");
const prismaClient = require('../../controller_support/prisma');
const moment = require("moment");

const { restaurant, availabilityDateTime } = prismaClient;

// GET all restaurants in the database
controller.get("/restaurant/list", async (req, res) => {
    
    const { city } = req.body

    try {
        const restaurants = await restaurant.findMany({
            where: {
                restaurant_status: "open",
                restaurant_location_city: city
            },
            select: {
                restaurant_name: true,
                restaurant_description: true,
                restaurant_image: true,
                restaurant_cost: true
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

// GET suggested search takes in the search_term and the user's current city. 
// For the location search, it does not apply the current city as the user may or may not be searching for the same location they are in
// For the cuisine search, it does apply the curret city as the user is finding cuisines in their city
// For the restaurant search, it does apply the current city as the user is finding cuisines in their city

controller.get("/restaurant/suggested", async(req, res) => {
    try {

        const {search_term, city} = req.body

        // Find a list of distinct locations: cities and country combinations 
        const locationList = await restaurant.findMany({
            where: {
                OR: [
                    {
                        restaurant_location_city: {
                            contains: search_term,
                            mode: 'insensitive'
                        },
                    }, 
                    {
                        restaurant_location_country: {
                            contains: search_term,
                            mode: 'insensitive'
                        }
                    }
                ],
                AND: {
                    restaurant_status: "open",
                }
            },
            select: {
                restaurant_location_city: true,
                restaurant_location_country: true,
                id: true
            },
            distinct: ['restaurant_location_city', 'restaurant_location_country']
        })

        // Finds the list of distinct cuisine combinations that mention the cuisine that you are searching for
        const cuisineList = await restaurant.findMany({
            where: {
                restaurant_cuisine_search: {
                    contains: search_term,
                    mode: 'insensitive'
                },
                restaurant_status: "open",
                restaurant_location_city: city
            },
            select: {
                restaurant_cuisine: true,
                id: true
            },
            distinct: ['restaurant_cuisine_search']
        })

        const restaurantNameList = await restaurant.findMany({
            where: {
                restaurant_name: {
                    contains: search_term,
                    mode: 'insensitive'
                },
                restaurant_status: "open",
                restaurant_location_city: city
            },
            select: {
                restaurant_name: true,
                id: true
            }
        })

        return res.json({locationList, cuisineList, restaurantNameList})

    } catch (e) {
        return res.status(400).json({
            name: e.name,
            message: e.message
        })
    }
    
})

// Search endpoint
controller.get("/restaurant/search", async(req, res) => {
    try {

        const { party_size, date, time, search_term, city, search_flag } = req.body

        // Need to modify search to take in a flag
        // If the search_flag is location, that means user chose a location so you need to seach only by location that may or may not be users local location
        // If the search_flag is cuisine, that means user chose a cuisine and the city will be the local location
        // If the search_flag is restaurant, that means user chose a restaurant based on local location and will show all the restaurants that match the string as well
        // If the search_flag is empty, that means user hit enter on the search query 

        let restaurantsFinder = {}
        switch(search_flag){
            case "location":
                restaurantsFinder = {
                    OR: [
                        {
                            restaurant_location_city: {
                                contains: search_term,
                                mode: 'insensitive'
                            },
                        }, 
                        {
                            restaurant_location_country: {
                                contains: search_term,
                                mode: 'insensitive'
                            }
                        }
                    ],
                    AND: {
                        restaurant_status: "open",
                    }
                }
                break;
            case "cuisine":
                restaurantsFinder = {
                    restaurant_cuisine_search: {
                        contains: search_term,
                        mode: 'insensitive'
                    },
                    restaurant_status: "open",
                    restaurant_location_city: city
                }
                break;
            case "restaurant":
                restaurantsFinder = {
                    restaurant_name: {
                        contains: search_term,
                        mode: 'insensitive'
                    },
                    restaurant_status: "open",
                    restaurant_location_city: city
                }
                break;
            default:
                restaurantsFinder = {
                    OR: [
                        {
                            restaurant_name: {
                                contains: search_term,
                                mode: 'insensitive'
                            }
                        },
                        // {
                        //     restaurant_location_city: {
                        //         contains: search_term,
                        //         mode: 'insensitive'
                        //     }
                        // },
                        // {
                        //     restaurant_location_country: {
                        //         contains: search_term,
                        //         mode: 'insensitive'
                        //     }
                        // },
                        {
                            restaurant_cuisine_search: {
                                contains: search_term,
                                mode: 'insensitive'
                            }
                        }
                        
                    ], 
                    AND: {
                        restaurant_status: "open",
                        restaurant_location_city: city
                    }
                }
                break;

        }

        // return res.send(restaurantsFinder)

        // 1 Find a list of restaurants based on the search_term using: restaurant_name, restaurant_location_city, restaurant_location_country, restaurant_cuisine
        const initialRestaurantList = await restaurant.findMany({
            where: restaurantsFinder,
            select: {
                id: true,
                restaurant_name: true,
                restaurant_description: true,
                restaurant_cuisine: true,
                restaurant_location_city: true,
                restaurant_location_country: true,
                restaurant_location_lat: true,
                restaurant_location_long: true,
                restaurant_cost: true,
                restaurant_image: true,
                restaurant_average_seating_time: true,
                restaurant_status: true
            }
        })

        if(!initialRestaurantList) {
            return res.status(404).json({error: "Sorry, no search results found for your search term."})
        }

        // return res.json(initialRestaurantList)

        // 2 For each restaurant search if this restaurant is available for a give date_time combination, push into a new list if they are 
        const dateArray = date.split("-")
        const newDate = dateArray[2] + "-" + dateArray[1] + "-" + dateArray[0]
        // const displayDate = "" + moment(newDate, 'YYYY-MM-DD').format('DD-MM-YYYY')

        const availabilityCheckDateTime = "" + moment(newDate, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + moment(time, 'HH:mm').format('HH:mm')

        const availableRestaurantList = []
        

        for(let indRest of initialRestaurantList) {

            let availabilityCheck = false
            switch(party_size) {
                case(1):
                    availabilityCheck = await availabilityDateTime.findFirst({
                        where: {
                            date_time: availabilityCheckDateTime,
                            available_table_one: {
                                    gt: 0
                            },
                            restaurant_id: indRest.id
                        }
                    })

                    if(availabilityCheck){
                        availableRestaurantList.push(indRest)
                    }
                    
                    break;
                case(2):
                    availabilityCheck = await availabilityDateTime.findFirst({
                        where: {
                            date_time: availabilityCheckDateTime,
                            available_table_two: {
                                    gt: 0
                            },
                            restaurant_id: indRest.id
                        }
                    })

                    if(availabilityCheck){
                        availableRestaurantList.push(indRest)
                    }
                    break;
                case(3):
                    availabilityCheck = await availabilityDateTime.findFirst({
                        where: {
                            date_time: availabilityCheckDateTime,
                            available_table_three: {
                                    gt: 0
                            },
                            restaurant_id: indRest.id
                        }
                    })

                    if(availabilityCheck){
                        availableRestaurantList.push(indRest)
                    }
                    break;
                case(4):
                    availabilityCheck = await availabilityDateTime.findFirst({
                        where: {
                            date_time: availabilityCheckDateTime,
                            available_table_four: {
                                    gt: 0
                            },
                            restaurant_id: indRest.id
                        }
                    })

                    if(availabilityCheck){
                        availableRestaurantList.push(indRest)
                    }
                    break;
                case(5):
                    availabilityCheck = await availabilityDateTime.findFirst({
                        where: {
                            date_time: availabilityCheckDateTime,
                            available_table_five: {
                                    gt: 0
                            },
                            restaurant_id: indRest.id
                        }
                    })

                    if(availabilityCheck){
                        availableRestaurantList.push(indRest)
                    }
                    
                    break;
            }
        }

        return res.send(availableRestaurantList)


    } catch (e) {
        return res.status(400).json({
            name: e.name,
            message: e.message
        })
    }
})

// Get featured restaurants

controller.get("/restaurant/featured", async(req, res) => {
    try {
        
        const { city } = req.body

        const featuredList = await restaurant.findMany({
            where: {
                restauarant_featured: true,
                restaurant_location_city: city
            },
            orderBy: {
                updated_at: 'desc'
            },
            select: {
                restaurant_name: true,
                restaurant_description: true,
                restaurant_image: true,
                restaurant_cost: true
            }
        })

        if(!featuredList) {
            return res.status(404).json({error: "No featured restaurants!"})
        }

        return res.json(featuredList)

    } catch (e) {
        return res.status(400).json({
            name: e.name,
            message: e.message
        })
    }
})

controller.get("/restaurant/:id", async(req, res) => {
    try {

        const restaurant_id  = req.params.id

        const restaurantInfo = await restaurant.findUnique({
            where: {
                id: restaurant_id
            },
            select: {
                id: true,
                restaurant_name: true,
                restaurant_description: true,
                restaurant_cuisine: true,
                restaurant_location_city: true,
                restaurant_location_country: true,
                restaurant_location_lat: true,
                restaurant_location_long: true,
                restaurant_cost: true,
                restaurant_image: true,
                restaurant_opening_hours: true,
                restaurant_facilities: true
            }
        })

        if(!restaurantInfo) {
            return res.status(404).json({error: "Sorry, the restaurant you are looking for does not exist."})
        }

        return res.json(restaurantInfo)

    } catch (e) {
        return res.status(400).json({
            name: e.name,
            message: e.message
        })
    }
})

// GET all restaurants in a particular city 
// controller.get("/restaurant/:city", async(req, res) => {
    
//     try {
//         let requested_city = req.params.city

//         // Capitalise the first letter of the city name as that is how it is store in the database
//         requested_city = requested_city.charAt(0).toUpperCase() + requested_city.slice(1)

//         const restaurants = await restaurant.findMany({
//             where: {
//                 restaurant_location_city: requested_city
//             }
//         })

//         if(!restaurants) {
//             return res.status(422).json({ error: "Sorry, restaurants in the requested city do no exist."})
//         }

//         return res.json(restaurants)
//     } catch (e) {
//         return res.status(400).json({
//             name: e.name,
//             message: e.message
//         })
//     }

    
// })



module.exports = controller;