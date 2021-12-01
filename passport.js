const passportJwt = require('passport-jwt');
const { JWT_SECRET } = require('./config/keys')
const { PrismaClient } = require("@prisma/client");

const { diner_user } = new PrismaClient()


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

    if(!user) {
        return callback(new Error("User not found!"), null)
    }

    return callback(null, user)
})

module.exports = strategy;