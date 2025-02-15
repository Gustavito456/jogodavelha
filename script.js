let aiMemory = {};
let currentGameMoves = [];
let isGameActive = true;

const cells = document.querySelectorAll('.cell');
const resetButton = document.getElementById('resetButton');
const winCombinations = [
    [0, 1, 2], [3, 4, 5,], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]
];

cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
});

resetButton.addEventListener('click', resetBoard);

function handleCellClick(e) {
    const cell = e.target;
    const index = parseInt(cell.dataset.index);

    if (!isGameActive || cell.textContent !== '') return;

    makeMove(cell, index, 'X');

    if (!checkWin('X') && !isBoardFull()) {
        setTimeout(makeAIMove, 500);
    }
}

function makeMove(cell, index, player) {
    cell.textContent = player;
    if (player === 'O') {
        currentGameMoves.push ({ state: getCurrentState(), move: index });
    }
}

function makeAIMove() {
    const currentState = getCurrentState();
    const emptyCells = getEmptyCells();
    
    if (emptyCells.length === 0) return;

    let move;
    if (aiMemory[currentState]) {
        const possibleMoves = aiMemory[currentState]
            .map((score, index) => ({score, index}))
            .filter(({index}) => emptyCells.includes(index));
        
        const maxScore = Math.max(...possibleMoves.map(m => m.score));
        const bestMoves = possibleMoves.filter(m => m.score === maxScore);
        move = bestMoves[Math.floor(Math.random() * bestMoves.length)].index;
    } else {
        move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    const cell = document.querySelector(`[data-index="${move}"]`);
    makeMove(cell, move, 'O');

    if (checkWin('O')) {
        updateAIMemory(1);
        isGameActive = false;
        setTimeout(() => alert('IA Venceu!'), 10);
    } else if (isBoardFull()) {
        updateAIMemory(0);
        setTimeout(() => alert('Empate!'), 10);
    }
}

function updateAIMemory(result) {
    currentGameMoves.forEach(({state, move}) => {
        if (!aiMemory[state]) {
            aiMemory[state] = new Array(9).fill(0);
        }
        aiMemory[state][move] += result;
        aiMemory[state][move] = Math.max(aiMemory[state][move], 0);
    });
    currentGameMoves = [];
}

function getCurrentState() {
    return Array.from(cells).map(cell => cell.textContent || '-').join('');
}

function getEmptyCells() {
    return Array.from(cells)
        .map((cell, index) => cell.textContent === '' ? index : null)
        .filter(index => index !== null);
}

function checkWin(player) {
    return winCombinations.some(combination =>
        combination.every(index =>
            cells[index].textContent === player
        )
    );
}

function isBoardFull() {
    return Array.from(cells).every(cell => cell.textContent !== '');
}

function resetBoard() {
    cells.forEach(cell => {
        cell.textContent = '';
    });
    isGameActive = true;
    currentGameMoves = [];
}