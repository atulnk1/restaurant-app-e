const passportJwt = require('passport-jwt');
const { JWT_SECRET } = require('../config/keys')
// const { PrismaClient } = require("@prisma/client");
const prisma = require('./prisma');

const { diner_user, restaurant_user } = prisma


const { ExtractJwt, Strategy } = passportJwt;

const options = {
    secretOrKey: JWT_SECRET,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
}

const strategy = new Strategy(options, async (payload, callback) => {
    const user = await diner_user.findUnique({
        where: {
            id: payload.id
        }
    })

    const r_user = await restaurant_user.findUnique({
        where:{
            id: payload.id
        }
    })
    
    if((!user || r_user) && (user || !r_user)) {
        return callback(new Error("User not found!"), null)
    }

    if(user) return callback(null, user)
    if(r_user) return callback(null, r_user)
})

module.exports = strategy;