# DishTable Backend
> This is the backend app for DishTable, you can find the GitHub for the Nextjs frontend app here: https://github.com/darrylwongqz/dishtable. 

The app link can be found here: 

## Table of Contents
* [General Info](#general-information)
* [Technologies Used](#technologies-used)
* [Features](#features)
* [Screenshots](#screenshots)
* [Project Status](#project-status)
* [Room for Improvement](#room-for-improvement)


## General Information
- The DishTable app is meant to allow diners to find and book at smaller up and coming restaurants in their city. 
- It combines elements from other popular restaurant booking apps to try to provide a seamless booking experience.
- Diners are able to also manage their bookings - with options to edit or cancel their bookings if needed. 

<!-- You don't have to answer all the questions - just the ones relevant to your project. -->


## Technologies Used
- Express: A Node.js web application framework to build robust APIs
- Prisma: An ORM used to interact with our Postgresql database
- Passport & Passport-JWT: Used for JWT authentication 
- Momentjs: For creating and managing dates and times for making bookings



## Features
Here are some of the features that we currently have:
- User Authentication
- User Profile Edit: Allows logged in users to edit profile picture, first name, last name and password
- Search Suggestions: Based on the query the user has typed, user will see suggestions for - Locations, Cuisines and Restaurants
- Availability Search: Ability to get back restaurants that are avialable for a give party size, date and time. Free text search supported as well
- Restaurant Booking: Allows logged in users to make bookings for their favourite restaurant 
- Booking Edit and Cancel: Allows logged in users to edit (party size, date or time) bookings or cancel them


## Screenshots
The following is simple Entity Relationship Diagram for our project:
![Entity Relationship Diagram](https://i.ibb.co/YNwxk2Y/Screenshot-2021-12-15-at-9-05-44-PM.png)
<!-- If you have screenshots you'd like to share, include them here. -->



## Project Status
Project is: _complete_ 


## Room for Improvement

Room for improvement:
- Switching out moment to use a more modern date library like Luxio 
- Create a more efficient way to check and store availability for restaurant tables
- Use a third party search engine like Elasticsearch or Algolia

Potential To do:
- Build a simple restaurant management app for restaurants to view reservations for the venue 