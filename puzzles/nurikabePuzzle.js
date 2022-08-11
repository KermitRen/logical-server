function generateNurikabePuzzles(size, amount) {
    console.log("Request to generate " + amount + " " + size + " nurikabe puzzles")

    const puzzles = []

    for(let i = 0; i < amount; i++) {
        puzzles.push(generatePuzzle(size))
    }

    return puzzles
}

module.exports = {
    generateNurikabePuzzles
}

function sizeConversion(size) {
    switch (size) {
        case "small": return 5
        case "medium": return 7
        case "large": return 9
        default: return 5
    }
}

function wrapExtraProperties(puzzle) {
    puzzle.extra = {}
    puzzle.extra.islands = puzzle.islands
    delete puzzle.islands
}

function setDifficulty(puzzle, guesses, size) {
    switch (size) {
        case 'small': puzzle.difficulty = (guesses <= 2) ? 'medium' : 'hard'; break
        case 'medium': puzzle.difficulty = (guesses <= 3) ? 'medium' : 'hard'; break
        case 'large': puzzle.difficulty = (guesses <= 3) ? (puzzle.difficulty == 1 ? 'easy' : 'medium') : 'hard'; break
    }
}

function generatePuzzle(size) {

    const maxIterations = 1000
    const width = sizeConversion(size)
    const height = sizeConversion(size)

    for(let i = 0; i < maxIterations; i++) {

        //Generate random nonogram & remove boring puzzles
        let puzzle = null
        while(puzzle == null || isBoringPuzzle(puzzle)) {
            puzzle = {type:'nurikabe', size: size, height:height, width:width, layout: createPlainTemplate(height, width)}
            setSolution(puzzle)
        }

        let solution = createInitialDeterministicSolution(puzzle)

        if(finishedSolution(solution)) {
            puzzle.difficulty = "easy"
            wrapExtraProperties(puzzle)
            return puzzle
        }
        
        let solutionSet = solveNurikabe(puzzle, solution)
        if(solutionSet.length == 1) {
            setDifficulty(puzzle, solutionSet[0].guesses,size)
            wrapExtraProperties(puzzle)
            return puzzle
        }
    }
    return getDefaultPuzzle()
}

function createPlainTemplate(height, width) {
    let layout = []
    for(let i = 0; i < height; i++) {
        layout[i] = []
        for(let j = 0; j < width; j++) {
            layout[i][j] =  {isFilled: false, x:j, y:i}
        }
    }
    return layout
}

function createEmptySolution(height, width) {
    let layout = []
    const solution = {layout: layout,height:height, width:width}
    for(let i = 0; i < height; i++) {
        layout[i] = []
        for(let j = 0; j < width; j++) {
            layout[i][j] =  {fill: -1, x:j, y:i}
        }
    }
    return solution
}

function getAdjacentCells(puzzle, x, y) {

    let neighborList = []
    if(x > 0) {
        neighborList.push(puzzle.layout[y][x-1])  
    }
    if(x < puzzle.width - 1) {
        neighborList.push(puzzle.layout[y][x+1])  
    }
    if(y > 0) {
        neighborList.push(puzzle.layout[y-1][x])  
    }
    if(y < puzzle.height - 1) {
        neighborList.push(puzzle.layout[y+1][x])  
    }
    neighborList.sort((a,b) => 0.5 - Math.random())
    return neighborList
}

function createsPool(puzzle, x, y) {
    if(x > 0) {
        if(y > 0) {
            if(puzzle.layout[y-1][x-1].isFilled && puzzle.layout[y][x-1].isFilled && puzzle.layout[y-1][x].isFilled) {
                return true
            } 
        }
        if(y < puzzle.height - 1) {
            if(puzzle.layout[y][x-1].isFilled && puzzle.layout[y+1][x-1].isFilled && puzzle.layout[y+1][x].isFilled) {
                return true
            } 
        }
    }
    if(x < puzzle.width - 1) {
        if(y > 0) {
            if(puzzle.layout[y-1][x].isFilled && puzzle.layout[y-1][x+1].isFilled && puzzle.layout[y][x+1].isFilled) {
                return true
            } 
        }
        if(y < puzzle.height - 1) {
            if(puzzle.layout[y][x+1].isFilled && puzzle.layout[y+1][x].isFilled && puzzle.layout[y+1][x+1].isFilled) {
                return true
            } 
        }
    }
    return false
}

function findIsland(puzzle, islandCell) {

    let queue = [islandCell]
    let islands = [islandCell]
    islandCell.marked = true
    while(queue.length > 0) {
        let currentCell = queue[0]
        let neighbors = getAdjacentCells(puzzle, currentCell.x, currentCell.y)
        neighbors.forEach(cell => {
            if(!cell.isFilled && !cell.marked) {
                cell.marked = true
                islands.push(cell)
                queue.push(cell)
            }
        })
        queue.shift()
    }
    return islands
} 

function getCluster(solution, startingCell) {
    let queue = [startingCell]
    let river = [startingCell]
    startingCell.marked = true
    while(queue.length > 0) {
        let currentCell = queue[0]
        let neighbors = getAdjacentCells(solution, currentCell.x, currentCell.y)
        neighbors.forEach(cell => {
            if(cell.fill == startingCell.fill && !cell.hasOwnProperty('marked')) {
                cell.marked = true
                river.push(cell)
                queue.push(cell)
            }
        })
        queue.shift()
    }

    river.forEach(cell => {
        delete cell.marked
    })

    return river
}

function calcPlacementProbability(puzzle, x, y) {
    let score = 0
    let cellCount = 0
    for(let i = Math.max(0, y - 2); i < Math.min(puzzle.height, y + 2); i++) {
        for(let j = Math.max(0, x - 2); j < Math.min(puzzle.width, x + 2); j++) {
            if((i >= y - 1) && (i <= y + 1) && (j >= x - 1) && (j <= x + 1)) {
                cellCount += 2
                if(puzzle.layout[i][j].isFilled) {
                    score += 2
                }
            } else {
                cellCount += 1
                if(puzzle.layout[i][j].isFilled) {
                    score += 1
                }
            }
        }
    }

    const probability = 1 - (score/cellCount)
    return probability
}

function setSolution(puzzle) {

    //Release a river
    let size = puzzle.width * puzzle.height
    let riverSize = size - (Math.floor(Math.random()*(size/4)) + Math.floor(size/3))
    let riverFill = 1
    const maxIterations = 2000
    let iteration = 0
    let riverCells = [puzzle.layout[Math.floor(Math.random()*puzzle.height)][Math.floor(Math.random()*puzzle.width)]]
    riverCells[0].isFilled = true

    while(riverFill < riverSize && iteration <= maxIterations) {
        let riverCell = riverCells[Math.floor(Math.random()*riverCells.length)]
        let neighbors = getAdjacentCells(puzzle, riverCell.x, riverCell.y)
        let placedRiver = false
        neighbors.forEach(neighbor => {
            if(!placedRiver && !neighbor.isFilled && !createsPool(puzzle, neighbor.x, neighbor.y)) {
                let placementProbability = calcPlacementProbability(puzzle, neighbor.x, neighbor.y)
                if(placementProbability > Math.random()) {
                    neighbor.isFilled = true
                    riverCells.push(neighbor)
                    placedRiver = true
                    riverFill++ 
                }
            }
        })

        iteration++
    }

    //Place islands
    puzzle.islands = []
    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            let islandCell = puzzle.layout[i][j]
            if(!islandCell.isFilled && !islandCell.marked) {
                allIslandCells = findIsland(puzzle, islandCell)
                puzzle.islands.push(allIslandCells)
            }
        }
    }

    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            let cell = puzzle.layout[i][j]
            delete cell.marked
        }
    }

    puzzle.islands.forEach(island => {
        let numberCell = island[Math.floor(Math.random()*island.length)]
        numberCell.number = island.length
    })

}

function findSurroundingCells(solution, mainCells, target) {

    let resultList = []
    mainCells.forEach(cell => {
        let neighbors = getAdjacentCells(solution, cell.x, cell.y)
        neighbors.forEach(neighbor => {
            if(target.includes(neighbor.fill) && !neighbor.hasOwnProperty('dontCount')) {
                resultList.push(neighbor)
            }
        })
    })
    return resultList
}

function getLowerQuadrant(solution, x, y) {
    resultList = []
    resultList.push(solution.layout[x][y])
    resultList.push(solution.layout[x+1][y])
    resultList.push(solution.layout[x][y+1])
    resultList.push(solution.layout[x+1][y+1])
    return resultList
}

function finishedSolution(solution) {
    for(let i = 0; i < solution.height; i++) {
        for(j = 0; j < solution.width; j++) {
            if(solution.layout[i][j].fill == -1) {
                return false
            }
        }
    }
    return true
}

function placeCells(puzzle, solution) {
    let changesMade = false

    //Attempt to assign island ids
    let chaining = true
    while(chaining) {
        chaining = false
        for(let i = 0; i < puzzle.height; i++) {
            for(let j = 0; j < puzzle.width; j++) {
                if(solution.layout[i][j].fill == 0 && !solution.layout[i][j].hasOwnProperty('id')) {
                    let neighbors = getAdjacentCells(solution, j, i)
                    let hasIslandNeighbor = neighbors.some(cell => cell.hasOwnProperty('id'))
                    if(hasIslandNeighbor) {
                        let newID = neighbors.find(cell => cell.hasOwnProperty('id')).id
                        let island = solution.islands.find(island => island.id == newID)
                        solution.layout[i][j].id = newID
                        island.cells.push(solution.layout[i][j])
                        island.fill++
                        changesMade = true
                        chaining = true
                    }
                }
            }
        }
    }

    //Surround finished islands
    solution.islands.forEach(island => {
        if(!island.finished && island.fill == island.capacity) {
            island.finished = true
            let surroundingCells = findSurroundingCells(solution, island.cells, [-1])
            surroundingCells.forEach(cell => {
                cell.fill = 1
                solution.river.fill++
                changesMade = true
            })
        }
    })

    //Seperate different islands
    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            if(solution.layout[i][j].fill == -1) {
                let neighbors = getAdjacentCells(solution, j, i)
                let ids = []
                neighbors.forEach(cell => {
                    if(cell.hasOwnProperty('id') && !ids.includes(cell.id)) {
                        ids.push(cell.id)
                    }
                })
                if(ids.length > 1) {
                    solution.layout[i][j].fill = 1
                    solution.river.fill++
                    changesMade = true
                }  
            }
        }
    }

    //Expand islands
    solution.islands.forEach(island => {
        if(!island.finished) {
            let surroundingCells = findSurroundingCells(solution, island.cells, [-1])
            if(surroundingCells.length == 1) {
                surroundingCells[0].fill = 0
                surroundingCells[0].id = island.cells[0].id
                island.cells.push(surroundingCells[0])
                island.fill++
                changesMade = true
            }
        }
    })

    //Combine water
    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            if(solution.layout[i][j].fill == -1) {
                let neighbors = getAdjacentCells(solution, j, i)
                if(neighbors.every(cell => cell.fill == 1)) {
                    solution.layout[i][j].fill = 1
                    solution.river.fill++
                    changesMade = true
                }
            }
        }
    }

    //Expand water
    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            if(solution.layout[i][j].fill == 1) {
                let river = getCluster(solution, solution.layout[i][j])
                if(solution.river.fill < solution.river.capacity) {
                    let escapeRoutes = findSurroundingCells(solution, river, [-1])
                    if(escapeRoutes.length == 1) {
                        escapeRoutes[0].fill = 1
                        solution.river.fill++
                        changesMade = true
                    }
                }
            }
        }
    }

    //Avoid pools
    for(let i = 0; i < puzzle.height - 1; i++) {
        for(let j = 0; j < puzzle.width - 1; j++) {
            let cells = getLowerQuadrant(solution, j, i)
            let waterCells = cells.reduce((prev, curr) => prev + ((curr.fill == 1) ? 1 : 0),0)
            if(waterCells == 3) {
                let lastCell = cells.find(cell => cell.fill == -1)
                if(lastCell) {
                    lastCell.fill = 0
                    changesMade = true
                }
            }
        }
    }

    //Unreachable
    solution.islands.forEach(island => {
        if(island.fill < island.capacity) {
            let counter = island.fill
            let islandMass = island.cells
            while(counter < island.capacity) {
                let surroundingCells = findSurroundingCells(solution, islandMass, [-1])
                surroundingCells.forEach(cell => {
                    cell.dontCount = true
                })
                islandMass = islandMass.concat(surroundingCells)
                counter++
            }
            islandMass.forEach(cell => {
                delete cell.dontCount
                if(cell.fill == -1) {
                    cell.reachable = true
                }
            })
        }
    })

    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            if(solution.layout[i][j].fill == -1) {
                if(!solution.layout[i][j].hasOwnProperty('reachable')) {
                    solution.layout[i][j].fill = 1
                    solution.river.fill++
                    changesMade = true
                } else {
                    delete solution.layout[i][j].reachable
                }

            }
        }
    }

    return changesMade

}

function isValidSolution(solution) {

    //Check that the river is valid
    let riverCell = null
    let riverCount = 0
    for(let i = 0; i < solution.height; i++) {
        for(let j = 0; j < solution.width; j++) {
            if(solution.layout[i][j].fill == 1) {
                riverCount++
                if(riverCell == null) {
                    riverCell = solution.layout[i][j]
                }
            }
        }
    }
    let river = getCluster(solution, riverCell)

    if(riverCount != solution.river.capacity) {return false}
    if(river.length != riverCount) {return false}

    //Check for pools
    for(let i = 0; i < solution.height - 1; i++) {
        for(let j = 0; j < solution.width - 1; j++) {
            let cells = getLowerQuadrant(solution, j, i)
            let waterCells = cells.reduce((prev, curr) => prev + ((curr.fill == 1) ? 1 : 0),0)
            if(waterCells == 4) {
                return false
            }
        }
    }

    //Check islands are valid
    solution.islands.forEach(island => {
        let islandCells = getCluster(solution, island.cells[0])
        if(islandCells.length != island.capacity) {return false}
    })

    return true

}

function solveNurikabe(puzzle, prevSolution = null, currentNoOfSolutions = 0) {

    const maximumSolutionDepth = 2
    let solution = prevSolution
    solution.guesses = solution.hasOwnProperty('guesses') ? solution.guesses : 0
    let solutionList = []

    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            if(solution.layout[i][j].fill === -1) {
                for(let val = 1; val >= 0; val--) {

                    if(solutionList.length >= (maximumSolutionDepth-currentNoOfSolutions)) {
                        return solutionList
                    }

                    solution.layout[i][j].fill = val
                    solution.guesses++
                    if(val == 1) {
                        solution.river.fill++
                    }
                    const tempSolution = JSON.parse(JSON.stringify(solution))
                    let attemptSolve = true
                    while(attemptSolve) {
                        attemptSolve = placeCells(puzzle, tempSolution)
                    }
                    solutionList = solutionList.concat(solveNurikabe(puzzle, tempSolution, solutionList.length + currentNoOfSolutions))
                    solution.layout[i][j].fill = -1
                    solution.guesses--
                    if(val == 1) {
                        solution.river.fill--
                    }
                }
                return solutionList
            }
        }
    }

    if(isValidSolution(solution)) {
        solutionList.push(JSON.parse(JSON.stringify(solution)))
    }

    return solutionList
}

function createInitialDeterministicSolution(puzzle) {

    //Setup base solution
    let solution = createEmptySolution(puzzle.height,puzzle.width)
    let riverSize = (puzzle.width * puzzle.height) - puzzle.islands.reduce((prev, curr) => prev + curr.length, 0)
    solution.river = {capacity: riverSize, fill: 0}
    solution.islands = []

    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            if(puzzle.layout[i][j].number) {
                solution.layout[i][j].fill = 0
                solution.islands.push({finished: false, capacity: puzzle.layout[i][j].number, fill: 1, cells: [solution.layout[i][j]]})
            }
        }
    }

    solution.islands.forEach((island,index) => {
        island.id = index
        island.cells[0].id=index
    })

    //Loop to place cells by logic
    let attemptSolve = true
    while(attemptSolve) {
        attemptSolve = placeCells(puzzle, solution)
    }

    return solution
}

function isBoringPuzzle(puzzle) {

    //Calculate MassPerIsland
    let totalMass = 0
    puzzle.islands.forEach(island => {
        totalMass += island.length
    })
    let massPerIsland = totalMass/puzzle.islands.length

    //Calculate variation
    let variation = 0
    puzzle.islands.forEach(island => {
        variation += Math.pow(Math.abs(massPerIsland - island.length),2)
    })
    variation = variation/puzzle.islands.length

    //calculate stats
    const longestIsland = puzzle.islands.reduce((prev, curr) => Math.max(prev,curr.length),1)
    const oneIslands = puzzle.islands.reduce((prev, curr) => prev + (curr.length == 1), 0)
    const oneIslandsFraction = oneIslands/puzzle.islands.length

    //Removing annoying puzzles
    if(massPerIsland < 1.6 || massPerIsland >= 2.8 || variation >= 6 || longestIsland >= 8 || oneIslandsFraction >= 0.65) {
        return true
    }
    

    return false
}

function getDefaultPuzzle() {
    const puzzle = {height:7, width: 7, size:"medium", difficulty:"medium", type:'nurikabe'}
    const layout = [[{isFilled: true},{isFilled: true},{isFilled: true},{isFilled: false},{isFilled: false, number:2},{isFilled: true},{isFilled: false, number: 5}],
                    [{isFilled: true},{isFilled: false, number: 1},{isFilled: true},{isFilled: true},{isFilled: true},{isFilled: true},{isFilled: false}],
                    [{isFilled: true},{isFilled: true},{isFilled: false},{isFilled: false, number: 2},{isFilled: true},{isFilled: false},{isFilled: false}],
                    [{isFilled: false, number: 1},{isFilled: true},{isFilled: true},{isFilled: true},{isFilled: true},{isFilled: false},{isFilled: true}],
                    [{isFilled: true},{isFilled: true},{isFilled: false, number: 2},{isFilled: false},{isFilled: true},{isFilled: true},{isFilled: true}],
                    [{isFilled: false, number: 2},{isFilled: true},{isFilled: true},{isFilled: true},{isFilled: true},{isFilled: false},{isFilled: true}],
                    [{isFilled: false},{isFilled: true},{isFilled: false, number: 2},{isFilled: false},{isFilled: true},{isFilled: false, number: 2},{isFilled: true}]]
    puzzle.layout = layout
    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            puzzle.layout[i][j].x = j
            puzzle.layout[i][j].y = i
        }
    }

    puzzle.islands = []
    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            let islandCell = puzzle.layout[i][j]
            if(!islandCell.isFilled && !islandCell.marked) {
                allIslandCells = findIsland(puzzle, islandCell)
                puzzle.islands.push(allIslandCells)
            }
        }
    }

    for(let i = 0; i < puzzle.height; i++) {
        for(let j = 0; j < puzzle.width; j++) {
            let cell = puzzle.layout[i][j]
            delete cell.marked
        }
    }

    puzzle.extra = {islands: puzzle.islands}
    delete puzzle.islands

    return puzzle

}