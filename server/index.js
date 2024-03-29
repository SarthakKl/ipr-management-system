const express = require('express')
const app = express()
const env = require('dotenv')
const cors = require('cors')
const mongoose = require('mongoose')
const authRouter = require('./src/routes/authRoutes')
const clientRouter = require('./src/routes/clientRoutes')
const reviewerRouter = require('./src/routes/reviewerRoutes')
const adminRouter = require('./src/routes/adminRoutes')

//We can change the header of the preflight request in the cors
app.use(cors())
env.config()
app.use(express.json())

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {})
        console.log('Connected with database')
    } catch (error) {
        console.error(" ")
        console.error(error.message)
    }
}
connect()
const port = process.env.PORT || 3002

app.use('/', authRouter)
app.use('/client',clientRouter)
app.use('/reviewer', reviewerRouter)
app.use('/admin', adminRouter)
app.get('/', (req, res) => {
    res.send("Welcome to IPR Management System API")
})
app.listen(port, () => {
    // console.log(process.env.AWS_ACCESS_KEY)
    console.log(`Listening to port ${port}`)
})

module.exports = app;