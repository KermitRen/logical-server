function generateMosaicPuzzles(size, amount) {
    console.log("Request to generate " + amount + " " + size + " mosaic puzzles")

    const puzzles = []

    for(let i = 0; i < amount; i++) {
        puzzles.push(generatePuzzle(size))
    }

    return puzzles
}

module.exports = {
    generateMosaicPuzzles
}

function sizeConversion(size) {
    switch (size) {
        case "small": return 5
        case "medium": return 7
        case "large": return 9
        default: return 5
    }
}

function generatePuzzle(size) {

    const maxIterations = 100
    const width = sizeConversion(size)
    const height = sizeConversion(size)

    for(let i = 0; i < maxIterations; i++) {
        //Generate intial solution
        const puzzle = {type:'mosaic', size:size, height:height, width:width, layout: createPlainTemplate(height, width)}
        setSolution(puzzle)

        //Set base clues
        setAllClues(puzzle, true)
        const noOfTotalSolutions = solveMosaic(puzzle).length
        if(noOfTotalSolutions == 1) {
            setAllClues(puzzle, false)
            setBaseClues(puzzle)

            //Set more clues
            let solutionSet = solveMosaic(puzzle, null, true)
            while(solutionSet.length > 0) {
                fixMosaic(puzzle, solutionSet)
                solutionSet = solveMosaic(puzzle, null, true)
            }
            setDifficulty(puzzle)
            return puzzle
        }
    }
    console.log("No Puzzles found")
    return {msg: "error"}
}

function setDifficulty(puzzle) {
    let clues = 0
    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            clues += puzzle.layout[i][j].showClue ? 1: 0
        }
    }
    let clueFraction = clues/(puzzle.height*puzzle.width)

    if(clueFraction < 0.5) {
        puzzle.difficulty = "hard"
    } else if(clueFraction >= 0.5 && clueFraction < 0.56) {
        puzzle.difficulty = "medium"
    } else {
        puzzle.difficulty = "easy"
    }
}

function setSolution(puzzle) {
    const fillProbability = 0.5
    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            puzzle.layout[i][j].isFilled = Math.random() <= fillProbability
        }
    }

    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            const neighbors = getNeighbors(puzzle,j,i)
            puzzle.layout[i][j].neighborhoodFill = neighbors.reduce((prev, curr) => prev + curr.isFilled, 0)
        }
    }
}

function getNeighbors(puzzle, x, y) {
    let neighborList = []
    for(let i = y - 1; i <= y + 1; i++) {
        for(let j = x - 1; j <= x + 1; j++) {
            if(i >= 0 && j >= 0 && i < puzzle.height && j < puzzle.width) {
                neighborList.push(puzzle.layout[i][j])
            }
        }
    }
    return neighborList
}

function setBaseClues(puzzle) {
    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            const neighbors = getNeighbors(puzzle,j,i)
            const needClue = !neighbors.some(cell => cell.showClue)
            if(needClue) {
                const index = Math.floor(Math.random() * neighbors.length)
                neighbors[index].showClue = true
            }
        }
    }
}

function setAllClues(puzzle, state) {
    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            puzzle.layout[i][j].showClue = state
        }
    }
}

function createPlainTemplate(height, width) {
    let layout = []
    for(let i = 0; i < height; i++) {
        layout[i] = []
        for(let j = 0; j < width; j++) {
            layout[i][j] =  {isFilled: false, showClue: false, x:j, y:i}
        }
    }
    return layout
}

function createEmptySolution(height, width) {
    let solution = []
    for(let i = 0; i < height; i++) {
        solution[i] = []
        for(let j = 0; j < width; j++) {
            solution[i][j] =  {fill: -1, blackCells: 0, whiteCells: 0}
        }
    }
    return solution
}

function possiblePlacement(puzzle, solution, x, y, val) {
    const neighbors = getNeighbors(puzzle, x, y)
    let foundContradiction = false
    neighbors.forEach((neighbor) => {
        if(neighbor.showClue) {
            let solutionCell = solution[neighbor.y][neighbor.x]
            let totalCellCount = getNeighbors(puzzle, neighbor.y,neighbor.x).length
            if(val === 1 && solutionCell.blackCells >= neighbor.neighborhoodFill) {
                foundContradiction = true
            } else if(val === 0 && solutionCell.whiteCells >= (totalCellCount - neighbor.neighborhoodFill)) {
                foundContradiction = true
            }
        }
    })
    return !foundContradiction
}

function isTrueSolution(puzzle, solution) {
    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            const trueFill = puzzle.layout[i][j].isFilled ? 1 : 0
            if(trueFill != solution[i][j].fill) {
                return false
            }
        }
    }
    return true
}

function getRandomIndices(height, width) {
    let indiceList = []
    for(let i = 0; i < height; i++) {
        for(let j = 0; j < width; j++) {
            indiceList.push({i:i,j:j})
        }
    }
    indiceList = indiceList.sort((a,b) => 0.5 - Math.random())
    return indiceList
}

function fixMosaic(puzzle, solutionSet) {
    while(solutionSet.length > 0) {
        const badSolution = solutionSet[0]
        let badI = 0
        let badJ = 0
        let indiceList = getRandomIndices(puzzle.height, puzzle.width)
        indiceList.some(({i,j}) => {
            if(!puzzle.layout[i][j].showClue) {
                if(badSolution[i][j].blackCells != puzzle.layout[i][j].neighborhoodFill) {
                    puzzle.layout[i][j].showClue = true
                    badI = i
                    badJ = j
                    return true
                }
            }
            return false
        })
        solutionSet = solutionSet.filter((solution) => {
            return solution[badI][badJ].blackCells == puzzle.layout[badI][badJ].neighborhoodFill
        })
    }
}

function updateTempFill(puzzle, solution, x, y, val, update) {
    const neighbors = getNeighbors(puzzle, x, y)
    neighbors.forEach(neighbor => {
        let solutionCell = solution[neighbor.y][neighbor.x]
        if(val === 1) {
            solutionCell.blackCells += update
        } else {
            solutionCell.whiteCells += update
        }
    })
}

function solveMosaic(puzzle, prevSolution = null, removeTrueSolution = false, currentNoOfSolutions = 0) {

    const maximumSolutionDepth = 500
    let solution = (prevSolution == null) ? createEmptySolution(puzzle.height,puzzle.width) : prevSolution
    let solutionList = []

    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            if(solution[i][j].fill === -1) {
                for(let val = 1; val >= 0; val--) {

                    if(solutionList.length >= (maximumSolutionDepth-currentNoOfSolutions)) {
                        return solutionList
                    }

                    if(possiblePlacement(puzzle,solution,j,i,val)) {
                        solution[i][j].fill = val
                        updateTempFill(puzzle,solution,j,i,val,1)
                        solutionList = solutionList.concat(solveMosaic(puzzle, solution, removeTrueSolution, solutionList.length + currentNoOfSolutions))
                        solution[i][j].fill = -1
                        updateTempFill(puzzle,solution,j,i,val,-1)
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
