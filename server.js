const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv').config()
const connectDB = require('./config.js')
const port = process.env.PORT || 5000

connectDB()
const app = express()

//Middelware
app.use(cors())
app.use(express.json())
app.use(require('./router.js'))

//Start server
app.listen(port, () => console.log("Server started on port " + port))