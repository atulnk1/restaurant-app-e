// This is a helper function to invoke the prisma client only once rather than creating individual connections in the controller
const { PrismaClient } = require("@prisma/client");

let prisma

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient()
  }
  prisma = global.prisma
}

module.exports = prisma