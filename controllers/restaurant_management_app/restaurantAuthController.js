const express = require("express");
const controller = express.Router();
// const { PrismaClient } = require("@prisma/client");
const prismaClient = require('../../controller_support/prisma');

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../../config/prod");

const { restaurant_user } = prismaClient

controller.post("/restaurant_management/auth/register", async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10))

        if(!email || !password){
            return res.status(422).json({error: "Fields are missing."})
        } 

        const existingUser = await restaurant_user.findUnique({
            where: {
                email: email
            }
        })

        if(existingUser) {
            return res.status(422).json({
                error: "User already exists. Please register wither another email!"
            })
        } else {

            await restaurant_user.create({
                data: {
                    email: email,
                    password: hashedPassword
                }
            })

            return res.status(200).json({message: "User successfully created!"})
        }
    } catch (e) {
        return res.status(400).json({
            name: e.name,
            message: e.message
        })
    }
})

controller.post("/restaurant_management/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body 

        if(!email || !password){
            return res.status(422).json({ error: "Fields are missing."})
        }

        const existingUser = await restaurant_user.findUnique({
            where: {
                email: email
            }
        })

        if(!existingUser) {
            return res.status(401).json({error: "Invalid email or password. Please try again."})
        } else {
            const isCorrectPassword = bcrypt.compareSync(password, existingUser.password)

            if(!isCorrectPassword) {
                return res.status(401).json({error: "Invalid email or password. Please try again."})
            } else {
                const token = jwt.sign({ id: existingUser.id }, JWT_SECRET)
                const { id, email } = existingUser
    
                return res.json({
                    token,
                    user: { id, email }
                })
            }
        }

        
    } catch (e) {
        return res.status(400).json({
            name: e.name,
            message: e.message
        })
    }
})
module.exports = controller;