const express = require("express");
const controller = express.Router();
const passport = require("passport");
// const { PrismaClient } = require("@prisma/client");
const prismaClient = require('../../controller_support/prisma');

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../../config/prod");

const { diner_user } = prismaClient

const authChecker = passport.authenticate("jwt", { session: false })

controller.post("/auth/register", async (req, res) => {
    try {
        const { email, first_name, last_name, password, profile_picture } = req.body;
        const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10))

        if(!email || !first_name || !last_name || !password){
            return res.status(422).json({error: "Fields are missing."})
        } 

        const existingUser = await diner_user.findUnique({
            where: {
                email: email
            }
        })

        if(existingUser) {
            return res.status(422).json({
                error: "User already exists. Please register wither another email!"
            })
        } else {

            await diner_user.create({
                data: {
                    email: email,
                    first_name: first_name,
                    last_name: last_name,
                    password: hashedPassword,
                    profile_picture: profile_picture
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

controller.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body 

        if(!email || !password){
            return res.status(422).json({ error: "Fields are missing."})
        }

        const existingUser = await diner_user.findUnique({
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
                const { id, email, first_name, last_name, profile_picture } = existingUser
    
                return res.json({
                    token,
                    user: { id, email, first_name, last_name, profile_picture }
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

controller.get("/auth/edit", authChecker, async (req, res) => {
    try {
        const userId = req.user.id

        const existingUser = await diner_user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                profile_picture: true
            }
        }

        )

        if(!existingUser) {
            return res.status(404).json({error: "Invalid user id!"})
        } 

        return res.json(existingUser)

    } catch (e) {
        return res.status(400).json({
            name: e.name,
            message: e.message
        })
    }
})

controller.patch("/auth", authChecker, async(req, res) => {
    try {
        
        const userId = req.user.id

        const { first_name, last_name, password, profile_picture } = req.body

        const existingUser = await diner_user.findUnique({
            where: {
                id: userId
            }
        })

        if(!existingUser) {
            return res.status(404).json({error: "Invalid user id!"})
        } 

        let editPayload = {}
        if(!password || password === "") {
            editPayload = {
                first_name,
                last_name,
                profile_picture
            }
        } else {
            const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10))
            editPayload = {
                first_name,
                last_name,
                profile_picture,
                password: hashedPassword
            }
        }

        const updateUser = await diner_user.update({
            where: {
                id: userId
            },
            data: editPayload,
            select: {
                id: true,
                first_name: true,
                last_name: true,
                profile_picture: true,
                email: true,
                password: true
            }
        })

        if(!updateUser) {
            res.status(422).json({error: "Sorry, unable to update you account info, please try again later"})
        }

        return res.json(updateUser)

    } catch (e) {
        return res.status(400).json({
            name: e.name,
            message: e.message
        })
    }
})
module.exports = controller;