document.addEventListener('DOMContentLoaded', function() {
    
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

    function adjustRowHeights() {
        const leftItems = Array.from(document.querySelectorAll('#column-a .item'));
        const rightItems = Array.from(document.querySelectorAll('#column-b .item'));
        
        leftItems.forEach((item, index) => {
            if (rightItems[index]) {
                const height = Math.max(item.offsetHeight, rightItems[index].offsetHeight);
                item.style.height = `${height}px`;
                rightItems[index].style.height = `${height}px`;
            }
        });
    }

    function initializeGame() {
        let titleText = document.getElementById('titleTxt');
        titleText.textContent = gameData.titleText;
        const columnA = document.getElementById('column-a');
        const columnB = document.getElementById('column-b');

        
        while (columnA.children.length > 1) columnA.removeChild(columnA.lastChild);
        while (columnB.children.length > 1) columnB.removeChild(columnB.lastChild);

        
        const shuffledA = [...gameData.columnA.items].sort(() => Math.random() - 0.5);
        const shuffledB = [...gameData.columnB.items].sort(() => Math.random() - 0.5);

        shuffledA.forEach((item, index) => {
            columnA.appendChild(createItem(item.text, 'A', item.id.replace('item', '') - 1, 'left'));
        });

        shuffledB.forEach((item, index) => {
            columnB.appendChild(createItem(item.text, 'B', item.id.replace('item', '') - 1, 'right'));
        });

        // Adjust row heights after items are created
        setTimeout(adjustRowHeights, 0);
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
                // Add selected state to second item before checking answer
                item.classList.add('selected');
                
                // Small delay to show selected state before showing result
                setTimeout(() => {
                    createConnection(selectedItem, item);
                    // Remove selected state after connection is made
                    selectedItem.classList.remove('selected');
                    item.classList.remove('selected');
                    selectedItem = null;
                }, 200);
            } else {
                selectedItem.classList.remove('selected');
                selectedItem = null;
            }
        } else {
            selectedItem.classList.remove('selected');
            selectedItem = null;
        }
    }

    function createConnection(item1, item2) {
        const dot1 = item1.querySelector('.connection-dot');
        const dot2 = item2.querySelector('.connection-dot');

        
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

        // Add correct/incorrect classes to the items
        connection.item1.classList.remove('correct', 'incorrect');
        connection.item2.classList.remove('correct', 'incorrect');
        connection.item1.classList.add(isCorrect ? 'correct' : 'incorrect');
        connection.item2.classList.add(isCorrect ? 'correct' : 'incorrect');

        connection.line.setAttribute('stroke', isCorrect ? '#4caf50' : '#f44336');

        if (!isCorrect) {
            setTimeout(() => {
                connection.line.remove();
                connections = connections.filter(conn => conn !== connection);
                feedback.className = 'feedback';
                // Remove the incorrect class after timeout
                connection.item1.classList.remove('incorrect');
                connection.item2.classList.remove('incorrect');
            }, 1500);
        }
    }

    function showAnswer() {
        
        connections.forEach(conn => {
            conn.line.remove();
        });
        connections = [];

        
        document.querySelectorAll('.item').forEach(item => {
            item.classList.remove('selected', 'correct', 'incorrect');
        });

        
        const itemsA = Array.from(document.getElementById('column-a').querySelectorAll('.item'));
        const itemsB = Array.from(document.getElementById('column-b').querySelectorAll('.item'));

        gameData.columnA.items.forEach(itemData => {
            const itemA = itemsA.find(el => el.dataset.id === itemData.id);
            const itemB = itemsB.find(el => el.dataset.id === itemData.id);
            
            if (itemA && itemB) {
                // Add correct class to both items
                itemA.classList.add('correct');
                itemB.classList.add('correct');

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

        const feedback = document.getElementById('feedback');
        feedback.textContent = "Here are the correct answers!";
        feedback.className = 'feedback correct';
        setTimeout(() => {
            feedback.className = 'feedback';
        }, 220000);
    }

    function resetGame() {
        
        connections.forEach(conn => {
            conn.line.remove();
        });
        connections = [];

        
        document.querySelectorAll('.item').forEach(item => {
            item.classList.remove('selected', 'correct', 'incorrect');
        });

        
        initializeGame();

        
        const feedback = document.getElementById('feedback');
        feedback.textContent = "Game Reset!";
        feedback.className = 'feedback';
        setTimeout(() => {
            feedback.className = 'feedback';
        }, 1500);
    }

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