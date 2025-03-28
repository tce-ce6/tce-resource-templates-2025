document.addEventListener('DOMContentLoaded', function() {
    // Fetch the game data
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            window.gameData = data;
            initializeGame();
        })
        .catch(error => console.error('Error loading game data:', error));

    let selectedItem = null;
    let connections = [];
    const svg = document.getElementById('svg-container');

    // Add event listeners to buttons
    document.querySelector('.show-answer-btn').addEventListener('click', showAnswer);
    document.querySelector('.reset-btn').addEventListener('click', resetGame);

    function createItem(text, column, index, side) {
        const div = document.createElement('div');
        div.className = 'item';
        div.dataset.id = `${index + 1}`;
        
        const textSpan = document.createElement('span');
        textSpan.textContent = text;

        const dot = document.createElement('div');
        dot.className = 'connection-dot';
        dot.dataset.column = side;
        dot.dataset.index = index;

        if (side === 'left') {
            div.appendChild(textSpan);
            div.appendChild(dot);
        } else {
            div.appendChild(dot);
            div.appendChild(textSpan);
        }

        div.addEventListener('click', handleItemClick);
        return div;
    }

    function initializeGame() {
        const columnA = document.getElementById('column-a');
        const columnB = document.getElementById('column-b');

        // Clear existing items
        while (columnA.children.length > 1) columnA.removeChild(columnA.lastChild);
        while (columnB.children.length > 1) columnB.removeChild(columnB.lastChild);

        // Create shuffled arrays
        const shuffledA = [...gameData.columnA.items].sort(() => Math.random() - 0.5);
        const shuffledB = [...gameData.columnB.items].sort(() => Math.random() - 0.5);

        shuffledA.forEach((item, index) => {
            columnA.appendChild(createItem(item.text, 'A', item.id.replace('item', '') - 1, 'left'));
        });

        shuffledB.forEach((item, index) => {
            columnB.appendChild(createItem(item.text, 'B', item.id.replace('item', '') - 1, 'right'));
        });
    }

    function handleItemClick(event) {
        const item = event.currentTarget;
        const dot = item.querySelector('.connection-dot');

        if (!selectedItem) {
            selectedItem = item;
            item.classList.add('selected');
        } else if (selectedItem !== item) {
            const selectedDot = selectedItem.querySelector('.connection-dot');
            if (selectedDot.dataset.column !== dot.dataset.column) {
                createConnection(selectedItem, item);
            }
            selectedItem.classList.remove('selected');
            selectedItem = null;
        } else {
            selectedItem.classList.remove('selected');
            selectedItem = null;
        }
    }

    function createConnection(item1, item2) {
        const dot1 = item1.querySelector('.connection-dot');
        const dot2 = item2.querySelector('.connection-dot');

        // Remove existing connections for these items
        removeConnectionsForItem(item1);
        removeConnectionsForItem(item2);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('stroke', '#5c9bd1');
        line.setAttribute('stroke-width', '2');
        line.style.pointerEvents = 'none';

        svg.appendChild(line);
        updateLinePosition(line, dot1, dot2);

        const connection = {
            line: line,
            item1: item1,
            item2: item2
        };

        connections.push(connection);
        checkAnswer(connection);
    }

    function updateLinePosition(line, dot1, dot2) {
        const rect1 = dot1.getBoundingClientRect();
        const rect2 = dot2.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();

        const x1 = rect1.left + rect1.width / 2 - svgRect.left;
        const y1 = rect1.top + rect1.height / 2 - svgRect.top;
        const x2 = rect2.left + rect2.width / 2 - svgRect.left;
        const y2 = rect2.top + rect2.height / 2 - svgRect.top;

        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
    }

    function removeConnectionsForItem(item) {
        connections = connections.filter(conn => {
            if (conn.item1 === item || conn.item2 === item) {
                conn.line.remove();
                return false;
            }
            return true;
        });
    }

    function checkAnswer(connection) {
        const item1Id = connection.item1.dataset.id;
        const item2Id = connection.item2.dataset.id;
        const isCorrect = item1Id === item2Id;

        const feedback = document.getElementById('feedback');
        feedback.textContent = isCorrect ? gameData.feedback.correct : gameData.feedback.incorrect;
        feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;

        connection.line.setAttribute('stroke', isCorrect ? '#4caf50' : '#f44336');

        if (!isCorrect) {
            setTimeout(() => {
                connection.line.remove();
                connections = connections.filter(conn => conn !== connection);
                feedback.className = 'feedback';
            }, 1500);
        }
    }

    function showAnswer() {
        // Clear existing connections
        connections.forEach(conn => {
            conn.line.remove();
        });
        connections = [];

        // Remove any selected state
        document.querySelectorAll('.item').forEach(item => {
            item.classList.remove('selected', 'correct', 'incorrect');
        });

        // Get all items from both columns
        const columnA = document.getElementById('column-a');
        const columnB = document.getElementById('column-b');
        const itemsA = Array.from(columnA.querySelectorAll('.item'));
        const itemsB = Array.from(columnB.querySelectorAll('.item'));

        // For each item in column A, find its match in column B and connect them
        gameData.columnA.items.forEach(itemData => {
            const itemA = itemsA.find(el => el.dataset.id === itemData.id);
            const itemB = itemsB.find(el => el.dataset.id === itemData.id);
            
            if (itemA && itemB) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('stroke', '#4caf50');
                line.setAttribute('stroke-width', '2');

                svg.appendChild(line);
                updateLinePosition(line, 
                    itemA.querySelector('.connection-dot'), 
                    itemB.querySelector('.connection-dot')
                );

                connections.push({
                    line: line,
                    item1: itemA,
                    item2: itemB
                });
            }
        });

        // Show correct feedback
        const feedback = document.getElementById('feedback');
        feedback.textContent = "Here are the correct answers!";
        feedback.className = 'feedback correct';
        setTimeout(() => {
            feedback.className = 'feedback';
        }, 2000);
    }

    function resetGame() {
        // Clear existing connections
        connections.forEach(conn => {
            conn.line.remove();
        });
        connections = [];

        // Remove any selected state
        document.querySelectorAll('.item').forEach(item => {
            item.classList.remove('selected', 'correct', 'incorrect');
        });

        // Reinitialize the game with shuffled items
        initializeGame();

        // Show feedback
        const feedback = document.getElementById('feedback');
        feedback.textContent = "Game Reset!";
        feedback.className = 'feedback';
        setTimeout(() => {
            feedback.className = 'feedback';
        }, 1500);
    }

    // Update line positions when window is resized
    window.addEventListener('resize', () => {
        connections.forEach(conn => {
            updateLinePosition(
                conn.line,
                conn.item1.querySelector('.connection-dot'),
                conn.item2.querySelector('.connection-dot')
            );
        });
    });
});