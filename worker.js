const {type, size} = require('worker_threads').workerData
const {parentPort} = require('worker_threads')
const {generateMosaicPuzzles} = require('./puzzles/mosaicPuzzle.js')
const {generateSudokuPuzzles} = require('./puzzles/sudokuPuzzle.js')
const {generateNonogramPuzzles} = require('./puzzles/nonogramPuzzle.js')
const {generateNurikabePuzzles} = require('./puzzles/nurikabePuzzle.js')

let puzzles = []

switch (type) {
    case 'mosaic': puzzles = generateMosaicPuzzles(size, 5); break
    case 'nonogram': puzzles = generateNonogramPuzzles(size, 100); break
    case 'nurikabe': puzzles = generateNurikabePuzzles(size, 5); break
    case 'sudoku': puzzles = generateSudokuPuzzles(5); break
}

parentPort.postMessage(puzzles)