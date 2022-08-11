
function generateSudokuPuzzles(amount) {
    console.log("Request to generate " + amount + " sudoku puzzles")

    const puzzles = []

    for(let i = 0; i < amount; i++) {
        puzzles.push(generatePuzzle())
    }

    return puzzles
}

module.exports = {
    generateSudokuPuzzles
}

function generatePuzzle() {

    //Generate intial solution
    const puzzle = {type:'sudoku', size:"standard", height:9, width:9, layout: createPlainTemplate()}
    setSolution(puzzle)
    addRandomClues(puzzle, 15)

    //Set clues
    let solutionSet = solveSudoku(puzzle, null, true)
    while(solutionSet.length > 0) {
        fixSudoku(puzzle, solutionSet)
        solutionSet = solveSudoku(puzzle, null, true)
    }
    setDifficulty(puzzle)

    return puzzle
}

function setDifficulty(puzzle) {
    let clues = 0
    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            clues += puzzle.layout[i][j].showClue ? 1: 0
        }
    }

    if(clues < 31) {
        puzzle.difficulty = "hard"
    } else if(clues >= 31 && clues < 33) {
        puzzle.difficulty = "medium"
    } else {
        puzzle.difficulty = "easy"
    }
}

function getRandomIndices() {
    let indiceList = []
    for(let i = 0; i < 9; i++) {
        for(let j = 0; j < 9; j++) {
            indiceList.push({i:i,j:j})
        }
    }
    indiceList = indiceList.sort((a,b) => 0.5 - Math.random())
    return indiceList
}

function getRandomDigits() {
    let digits = []
    for(let i = 1; i <= 9; i++) {
        digits.push(i)
    }
    digits = digits.sort((a,b) => 0.5 - Math.random())
    return digits
}

function getNeighbors(layout, x, y) {
    const neighbors = []

    //Same Column
    for(let i = 0; i < 9; i++) {
        if(i == y) {continue}
        let sameColumnCell = layout[i][x]
        neighbors.push(sameColumnCell)
    }

    //Same Row
    for(let i = 0; i < 9; i++) {
        if(i == x) {continue}
        let sameRowCell = layout[y][i]
        neighbors.push(sameRowCell)
    }

    //Same Box
    const boxX = Math.floor(x/3)
    const boxY = Math.floor(y/3)
    for(let i = 0 + (boxY*3); i < 3 + (boxY*3); i++) {
        for(let j = 0 + (boxX*3); j < 3 + (boxX*3); j++) {
            if(i == y || j == x) {continue}
            let sameBoxCell = layout[i][j]
            neighbors.push(sameBoxCell)
        }
    }
    return neighbors
}

function possiblePlacement(puzzle, x, y, val) {
    const neighbors = getNeighbors(puzzle.layout, x, y)
    return !neighbors.some(cell => cell.number == val)
}

function possiblePlacementSolution(solution, x, y, val) {
    const neighbors = getNeighbors(solution, x, y)
    return !neighbors.some(cell => cell.number == val)
}

function setSolution(puzzle) {
    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            if(puzzle.layout[i][j].number === -1) {
                const digits = getRandomDigits()
                for(let dIndex = 0; dIndex < 9; dIndex++) {
                    let val = digits[dIndex]
                    if(possiblePlacement(puzzle,j,i,val)) {
                        puzzle.layout[i][j].number = val
                        let foundSolution = setSolution(puzzle)
                        if(foundSolution) {return true}
                        puzzle.layout[i][j].number = -1
                    }
                }
                return false
            }
        }
    }

    return true
}

function createPlainTemplate() {
    let layout = []
    for(let i = 0; i < 9; i++) {
        layout[i] = []
        for(let j = 0; j < 9; j++) {
            layout[i][j] =  {number: -1, showClue: false, x:j, y:i}
        }
    }
    return layout
}

function createEmptySolution(puzzle) {
    let solution = []
    for(let i = 0; i < 9; i++) {
        solution[i] = []
        for(let j = 0; j < 9; j++) {
            if(puzzle.layout[i][j].showClue) {
                solution[i][j] = {number: puzzle.layout[i][j].number}
            } else {
                solution[i][j] =  {number: -1}
            }
        }
    }
    return solution
}

function isTrueSolution(puzzle, solution) {
    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            if(puzzle.layout[i][j].number != solution[i][j].number) {
                return false
            }
        }
    }
    return true
}

function solveSudoku(puzzle, prevSolution = null, removeTrueSolution = false, currentNoOfSolutions = 0) {

    const maximumSolutionDepth = 500
    let solution = (prevSolution == null) ? createEmptySolution(puzzle) : prevSolution
    let solutionList = []

    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            if(solution[i][j].number === -1) {
                for(let val = 1; val <= 9; val++) {

                    if(solutionList.length >= (maximumSolutionDepth-currentNoOfSolutions)) {
                        return solutionList
                    }

                    if(possiblePlacementSolution(solution,j,i,val)) {
                        solution[i][j].number = val
                        solutionList = solutionList.concat(solveSudoku(puzzle, solution, removeTrueSolution, solutionList.length + currentNoOfSolutions))
                        solution[i][j].number = -1
                    }
                }
                return solutionList
            }
        }
    }

    if(removeTrueSolution && isTrueSolution(puzzle, solution)) {
        return solutionList
    }

    solutionList.push(JSON.parse(JSON.stringify(solution)))
    return solutionList
}

function fixSudoku(puzzle, solutionSet) {
    while(solutionSet.length > 0) {
        const badSolution = solutionSet[0]
        let badI = 0
        let badJ = 0
        let indiceList = getRandomIndices()
        indiceList.some(({i,j}) => {
            if(!puzzle.layout[i][j].showClue) {
                if(badSolution[i][j].number != puzzle.layout[i][j].number) {
                    puzzle.layout[i][j].showClue = true
                    badI = i
                    badJ = j
                    return true
                }
            }
            return false
        })
        solutionSet = solutionSet.filter((solution) => {
            return solution[badI][badJ].number == puzzle.layout[badI][badJ].number
        })
    }
}

function addRandomClues(puzzle, noOfClues) {

    const indiceList = getRandomIndices()
    let cluesSet = 0

    indiceList.forEach(({i,j}) => {
        if(cluesSet < noOfClues) {
            if(!puzzle.layout[i][j].showClue) {
                puzzle.layout[i][j].showClue = true
                cluesSet++
            }
        }
    })
}
