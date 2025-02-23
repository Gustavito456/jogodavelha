let humanSymbol = 'X';
let aiSymbol = 'O';
let aiMemory = JSON.parse(localStorage.getItem('ticTacToeAI')) || {};
const initialStates = [
    "---------",
    "X--------",
    "-X-------", 
    "--X------",
    "---X-----",
    "----X----"
];
initialStates.forEach(state => {
    if (!aiMemory[state]) {
        aiMemory[state] = new Array(9).fill(state === "----X----" ? 1 : 0);
    }
});
let currentGameMoves = [];
let isGameActive = true;
let stats = {
    playerWins: 0,
    iaWins: 0,
    draws: 0,
    learnedStates: 0
};
let isPlayerTurn = true;

const cells = document.querySelectorAll('.cell');
const resetButton = document.getElementById('resetButton');
const winCombinations = [
    [0, 1, 2], [3, 4, 5,], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]
];

cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
});

resetButton.addEventListener('click', resetBoard);

function startGame(symbol) {
    humanSymbol = symbol;
    aiSymbol = symbol === 'X' ? 'O' : 'X';

    isPlayerTurn = (symbol === 'X');

    document.getElementById('symbolModal').style.display = 'none';
    document.querySelector('.board').style.display = 'grid';

    isGameActive = true;
    currentGameMoves = [];

    if (!isPlayerTurn) {
        setTimeout(makeAIMove, 500); 
    }
}

document.getElementById('chooseX').addEventListener('click', () => startGame('X'));
document.getElementById('chooseO').addEventListener('click', () => startGame('O'));


function saveAIMemory() {
    localStorage.setItem('ticTacToeAI', JSON.stringify(aiMemory));
}

function handleCellClick(e) {
    const cell = e.target;
    const index = parseInt(cell.dataset.index);

    if (!isGameActive || !isPlayerTurn || cell.textContent !== '') {
        return;
    }

    toggleBoardInteraction(false);
    isPlayerTurn = false;

    makeMove(cell, index, humanSymbol);

    if (checkWin(humanSymbol)) {
        isGameActive = false;
        stats.playerWins++;
        analyzeMistakes();
        updateAIMemory(-1);
        updateStatsDisplay();
        setTimeout(() => alert('Jogador Venceu!'), 10);
    }
    else if (isBoardFull()) {
        stats.draws++;
        updateAIMemory(0);
        updateStatsDisplay();
        setTimeout(() => alert('Empate!'), 10);
    }
    else {
        setTimeout(() => {
            makeAIMove();
            toggleBoardInteraction(true);
        }, 500);
    }
}

function makeMove(cell, index, player) {
    cell.textContent = player;
    cell.classList.add(player.toLowerCase());
    if (player === aiSymbol) {
        currentGameMoves.push ({ state: getCurrentState(), move: index });
    }
}

function makeAIMove() {
    document.querySelector('.board').classList.add('disabled');
    const emptyCells = getEmptyCells();

    for (const move of emptyCells) {
        if (checkSimulatedWin(move, aiSymbol)) {
            const cell = document.querySelector(`[data-index="${move}"]`);
            makeMove(cell, move, aiSymbol);
            handleGameEnd(aiSymbol);
            return;
        }
    }

    for (const move of emptyCells) {
        if (checkSimulatedWin(move, humanSymbol)) {
            const cell = document.querySelector(`[data-index="${move}"]`);
            makeMove(cell, move, aiSymbol);

            if (checkWin(aiSymbol)) {
                handleGameEnd(aiSymbol);
            } else if (isBoardFull()) {
                stats.draws++;
                updateAIMemory(0);
                updateStatsDisplay();
                setTimeout(() => alert('Empate!'), 10);
            } else {
                isGameActive = true;
                isPlayerTurn = true;
                document.querySelector('.board').classList.remove('disabled');
            }
            return;
        }
    }

    const currentState = getCurrentState();
    const explorationRate = Math.max(0.1, 1 - (Object.keys(aiMemory).length / 700));
    let move;

    if (Math.random() < explorationRate && Object.keys(aiMemory).length < 500) {
        move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    } else {
        if (aiMemory[currentState]) {
            const possibleMoves = aiMemory[currentState]
                .map((score, index) => ({ score, index }))
                .filter(({ index }) => emptyCells.includes(index));

            const maxScore = Math.max(...possibleMoves.map(m => m.score));
            const bestMoves = possibleMoves.filter(m => m.score === maxScore);
            move = bestMoves[Math.floor(Math.random() * bestMoves.length)].index;
        } else {
            move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            stats.learnedStates++;
        }
    }

    const cell = document.querySelector(`[data-index="${move}"]`);
    makeMove(cell, move, aiSymbol);

    if (checkWin(aiSymbol)) {
        stats.iaWins++;
        updateAIMemory(1);
        updateStatsDisplay();
        isGameActive = false;
        setTimeout(() => alert('IA Venceu!'), 10);
    } else if (isBoardFull()) {
        stats.draws++;
        updateAIMemory(0);
        updateStatsDisplay();
        setTimeout(() => alert('Empate!'), 10);
    } else {
        isGameActive = true;
        isPlayerTurn = true;
        document.querySelector('.board').classList.remove('disabled');
    }
}

function updateAIMemory(result) {
    const multiplier = 2;
    currentGameMoves.forEach(({state, move}) => {
        if (!aiMemory[state]) {
            aiMemory[state] = new Array(9).fill(0);
        }
        aiMemory[state][move] += result * multiplier;
        aiMemory[state][move] = Math.max(aiMemory[state][move], -5);
    });
    saveAIMemory();
}

function getCurrentState() {
    return normalizeState(Array.from(cells).map(c => c.textContent || '-').join(''));
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
        cell.classList.remove('x', 'o');
    });

    isGameActive = true;
    currentGameMoves = [];

    isPlayerTurn = (humanSymbol === 'X'); 

    document.querySelector('.board').classList.remove('disabled');

    if (humanSymbol === 'O') {
        setTimeout(makeAIMove, 500);
    }
}

function updateStatsDisplay() {
    const statsDiv = document.getElementById('stats');
    statsDiv.innerHTML = `
        <h3>Estatísticas</h3>
        <p>Vitórias do Jogador: ${stats.playerWins}</p>
        <p>Vitórias da IA: ${stats.iaWins}</p>
        <p>Empates: ${stats.draws}</p>
        <p>Estados aprendidos: ${Object.keys(aiMemory).length}</p>
    `;
}

window.addEventListener('beforeunload', () => {
    saveAIMemory();
});

function checkSimulatedWin(board, player) {
    return winCombinations.some(combo =>
        combo.every(index => board[index] === player)
    );
}

function isLosingMove(state, move) {
    const board = state.split('');
    board[move] = aiSymbol;
    
    return board.some((cell, index) => {
        if (cell !== '-') return false;
        const tempBoard = [...board];
        tempBoard[index] = humanSymbol;
        return checkSimulatedWin(tempBoard, humanSymbol);
    });
}

function analyzeMistakes() {
    currentGameMoves.forEach(({state, move}) => {
        if (isLosingMove(state, move) && aiMemory[state]) {
            aiMemory[state][move] = Math.max(aiMemory[state][move] - 3, -5);
        }
    });
}

function checkSimulatedWin(move, player) {
    const tempBoard = Array.from(cells).map(c => c.textContent);
    tempBoard[move] = player;
    return winCombinations.some(combo =>
        combo.every(index => tempBoard[index] === player)
    );
}

function handleGameEnd(winner) {
    if (winner === aiSymbol) {
        stats.iaWins++;
        updateAIMemory(1);
        updateStatsDisplay();
        setTimeout(() => alert('IA Venceu!'), 10);
    }
    isGameActive = false;
}

function normalizeState(state) {
    const rotations = [
        state,
        state[6] + state[3] + state[0] + state[7] + state[4] + state[1] + state[8] + state[5] + state[2],
        state[8] + state[7] + state[6] + state[5] + state[4] + state[3] + state[2] + state[1] + state[0],
        state[2] + state[5] + state[8] + state[1] + state[4] + state[7] + state[0] + state[3] + state[6]
    ];
    return rotations.sort()[0];
}

function minimax(board, depth, isMaximizing) {
    if (checkWin(aiSymbol)) return 1;
    if (checkWin('X')) return -1;
    if (isBoardFull()) return 0;

    const scores = [];
    getEmptyCells().forEach(move => {
        board[move] = isMaximizing ? aiSymbol : humanSymbol;
        scores.push(minimax(board, depth + 1, !isMaximizing));
        board[move] = '-';
    });

    return isMaximizing ? Math.max(...scores) : Math.min(...scores);
}

function toggleBoardInteraction(enable) {
    document.querySelector('.board').classList.toggle('disabled', !enable);
}
