const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        const MONGO_URI = "mongodb+srv://fredefrog123:fredefrog321@cluster0.ccmgbpe.mongodb.net/logical?retryWrites=true&w=majority"
        const conn = await mongoose.connect(MONGO_URI)
        console.log("Succesfully connected to database!")
    } catch(err) {
        console.log(err)
        process.exit(1)
    }
}

module.exports = connectDB