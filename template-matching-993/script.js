document.addEventListener('DOMContentLoaded', function() {
    let selectedItem = null;
    let connections = [];
    let correctAnswers = [];
    
    // Load data from JSON file
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            correctAnswers = data.correctAnswers;
            initializeGame(data);
        })
        .catch(error => console.error('Error loading data:', error));

    function initializeGame(data) {
        const columnA = document.getElementById('columnA');
        const columnB = document.getElementById('columnB');
        
        // Populate columns
        data.columnA.forEach((item, index) => {
            const div = createItem(item, 'A', index);
            columnA.appendChild(div);
        });
        
        data.columnB.forEach((item, index) => {
            const div = createItem(item, 'B', index);
            columnB.appendChild(div);
        });

        // Create SVG for lines
        createSvgContainer();
    }

    function createItem(text, column, index) {
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = `
            ${text}
            <div class="connection-dot" data-column="${column}" data-index="${index}"></div>
        `;
        
        div.addEventListener('click', handleItemClick);
        return div;
    }

    function createSvgContainer() {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.id = 'connection-lines';
        document.querySelector('.columns').appendChild(svg);
    }

    function handleItemClick(event) {
        const dot = event.currentTarget.querySelector('.connection-dot');
        const column = dot.dataset.column;
        const index = parseInt(dot.dataset.index);

        if (!selectedItem) {
            selectedItem = { column, index, element: event.currentTarget };
            event.currentTarget.classList.add('selected');
        } else {
            if (selectedItem.column !== column) {
                const connection = createConnection(selectedItem, { column, index, element: event.currentTarget });
                drawLine(connection);
                checkConnection(connection);
            }
            selectedItem.element.classList.remove('selected');
            selectedItem = null;
        }
    }

    function createConnection(item1, item2) {
        // Remove any existing connections for these items
        connections = connections.filter(conn => {
            if (
                (conn.from.column === item1.column && conn.from.index === item1.index) ||
                (conn.to.column === item2.column && conn.to.index === item2.index)
            ) {
                removeLine(conn);
                return false;
            }
            return true;
        });
        
        const connection = {
            from: item1,
            to: item2
        };
        
        connections.push(connection);
        return connection;
    }

    function drawLine(connection) {
        const fromDot = connection.from.element.querySelector('.connection-dot');
        const toDot = connection.to.element.querySelector('.connection-dot');
        
        const fromRect = fromDot.getBoundingClientRect();
        const toRect = toDot.getBoundingClientRect();
        const containerRect = document.querySelector('.columns').getBoundingClientRect();
        
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", fromRect.left + fromRect.width/2 - containerRect.left);
        line.setAttribute("y1", fromRect.top + fromRect.height/2 - containerRect.top);
        line.setAttribute("x2", toRect.left + toRect.width/2 - containerRect.left);
        line.setAttribute("y2", toRect.top + toRect.height/2 - containerRect.top);
        line.setAttribute("stroke", "#5c9bd1");
        line.setAttribute("stroke-width", "2");
        
        document.getElementById('connection-lines').appendChild(line);
        connection.line = line;
    }

    function removeLine(connection) {
        if (connection.line) {
            connection.line.remove();
        }
        connection.from.element.classList.remove('correct', 'incorrect');
        connection.to.element.classList.remove('correct', 'incorrect');
    }

    function checkConnection(connection) {
        const isCorrect = correctAnswers.some(answer => 
            (answer.from.column === connection.from.column && 
             answer.from.index === connection.from.index &&
             answer.to.column === connection.to.column && 
             answer.to.index === connection.to.index) ||
            (answer.from.column === connection.to.column && 
             answer.from.index === connection.to.index &&
             answer.to.column === connection.from.column && 
             answer.to.index === connection.from.index)
        );

        if (isCorrect) {
            connection.from.element.classList.add('correct');
            connection.to.element.classList.add('correct');
            connection.line.setAttribute("stroke", "#4caf50");
        } else {
            connection.from.element.classList.add('incorrect');
            connection.to.element.classList.add('incorrect');
            connection.line.setAttribute("stroke", "#f44336");
        }
    }
});