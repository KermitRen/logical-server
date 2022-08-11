const mongoose = require('mongoose')

const puzzleSchema = mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    size: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        required: true
    },
    width: {
        type: Number,
        required: true
    },
    height: {
        type: Number,
        required: true
    },
    layout: {
        type: Array,
        required: true
    },
    extra: {
        type: Object
    }
})

module.exports = mongoose.model('Puzzle', puzzleSchema)