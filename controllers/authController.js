const express = require("express");
const controller = express.Router();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/prod");

const { diner_user } = new PrismaClient()

controller.post("/auth/register", async (req, res) => {
    try {
        const { email, first_name, last_name, password } = req.body;
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
                const { id, email, first_name, last_name } = existingUser
    
                return res.json({
                    token,
                    user: { id, email, first_name, last_name }
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