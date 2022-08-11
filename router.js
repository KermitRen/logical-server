const express = require('express')
const {Worker} = require('worker_threads')
const Puzzle = require('./models/puzzleModel.js')

const router = express.Router()

//Routes
router.post('/mosaic', async (req, res) => {
    const puzzle = await Puzzle.findOneAndRemove({type:'mosaic', size:req.body.size, difficulty:req.body.difficulty});
    res.status(200).json(puzzle)
    refillDB('mosaic', req.body.size)
})

router.post('/nonogram', async (req, res) => {
    const puzzle = await Puzzle.findOneAndRemove({type:'nonogram', size:req.body.size, difficulty:req.body.difficulty});
    res.status(200).json(puzzle)
    refillDB('nonogram', req.body.size)
})

router.post('/nurikabe', async (req, res) => {
    const puzzle = await Puzzle.findOneAndRemove({type:'nurikabe', size:req.body.size, difficulty:req.body.difficulty});
    res.status(200).json(puzzle)
    refillDB('nurikabe', req.body.size)
})

router.post('/sudoku', async (req, res) => {
    const puzzle = await Puzzle.findOneAndRemove({type:'sudoku', difficulty:req.body.difficulty});
    res.status(200).json(puzzle)
    refillDB('sudoku')
})

//DB Controller
function refillDB(type, size = "standard") {
    const MAX_PUZZLE_AMOUNT = 100
    const worker = new Worker('./worker.js', {workerData: {type: type, size: size}})
    worker.on("message", async puzzles => {

        const amounts = {}
        amounts.easy = await Puzzle.countDocuments({type:type, size: size, difficulty: "easy"})
        amounts.medium = await Puzzle.countDocuments({type:type, size: size, difficulty: "medium"})
        amounts.hard = await Puzzle.countDocuments({type:type, size: size, difficulty: "hard"})
        console.log(amounts)
        puzzles.forEach(puzzle => {
            if(amounts[puzzle.difficulty] < MAX_PUZZLE_AMOUNT) {
                Puzzle.create(puzzle)  
            }
        })
    })
}

//Export
module.exports = router