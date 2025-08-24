document.addEventListener('DOMContentLoaded', function() {
    
    fetch(folderName+'/data.json')
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

    // Base64 utility functions
    function isBase64String(str) {
        if (!str || typeof str !== 'string') return false;
        
        // Check for data URL format
        if (str.startsWith('data:')) {
            return str.includes('base64,');
        }
        
        // Check for raw base64 string
        try {
            return btoa(atob(str)) === str;
        } catch (err) {
            return false;
        }
    }

    function formatBase64Image(imageData) {
        if (!imageData) return null;
        
        // If it's already a proper data URL, return as is
        if (imageData.startsWith('data:image/')) {
            return imageData;
        }
        
        // If it's a raw base64 string, add the data URL prefix
        if (isBase64String(imageData)) {
            // Try to detect image type from base64 header
            const imageType = detectImageType(imageData);
            return `data:image/${imageType};base64,${imageData}`;
        }
        
        // If it's a regular file path, return as is
        return folderName + '/' + imageData;
    }

    function detectImageType(base64String) {
        // Remove data URL prefix if present
        const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
        
        try {
            // Decode first few bytes to check magic numbers
            const binaryString = atob(base64Data.substring(0, 16));
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Check magic numbers for common image formats
            if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'jpeg';
            if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'png';
            if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'gif';
            if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return 'webp';
            if (bytes[0] === 0x42 && bytes[1] === 0x4D) return 'bmp';
            
            return 'png'; // Default fallback
        } catch (e) {
            return 'png'; // Default fallback
        }
    }

    // Enhanced image loading with error handling
    function loadImage(imageSrc) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(imageSrc);
            img.onerror = () => {
                console.warn(`Failed to load image: ${imageSrc}`);
                resolve(null); // Continue without image rather than failing
            };
            img.src = imageSrc;
        });
    }

    function createItem(text, column, index, side) {
        console.log(text);
        const div = document.createElement('div');
        div.className = 'item';
        div.dataset.id = `${index + 1}`;
        
        const contentContainer = document.createElement('div');
        contentContainer.className = 'content-container';
        div.appendChild(contentContainer);

        const textSpan = document.createElement('span');
        textSpan.textContent = text.text;

        // Enhanced image handling with base64 support
        if (text.image) {
            const formattedImageSrc = formatBase64Image(text.image);
            
            if (formattedImageSrc) {
                contentContainer.style.gap = '10px';
                contentContainer.style.background = 'linear-gradient(45deg, #d7e6ef, transparent)';
                contentContainer.style.padding = '4px';
                
                const imgDiv = document.createElement('div');
                imgDiv.className = 'item-image';
                
                // Use loadImage to handle potential loading errors
                loadImage(formattedImageSrc).then(src => {
                    if (src) {
                        imgDiv.style.backgroundImage = `url(${src})`;
                        imgDiv.style.backgroundSize = 'cover';
                        imgDiv.style.backgroundPosition = 'center';
                        imgDiv.style.backgroundRepeat = 'no-repeat';
                    } else {
                        // Add a fallback placeholder if image fails to load
                        imgDiv.style.backgroundColor = '#f0f0f0';
                        imgDiv.style.border = '2px dashed #ccc';
                        imgDiv.innerHTML = '<span style="font-size: 12px; color: #666;">Image not available</span>';
                        imgDiv.style.display = 'flex';
                        imgDiv.style.alignItems = 'center';
                        imgDiv.style.justifyContent = 'center';
                    }
                });
                
                contentContainer.appendChild(imgDiv);
            }
        }

        const dot = document.createElement('div');
        dot.className = 'connection-dot';
        dot.dataset.column = side;
        dot.dataset.index = index;

        if (side === 'left') {
            contentContainer.appendChild(textSpan);
            div.appendChild(dot);
        } else {
            contentContainer.appendChild(textSpan);
            div.appendChild(dot);
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
        
        // Set column titles from JSON
        document.getElementById('column-a-title').textContent = gameData.columnA.title;
        document.getElementById('column-b-title').textContent = gameData.columnB.title;
        
        while (columnA.children.length > 1) columnA.removeChild(columnA.lastChild);
        while (columnB.children.length > 1) columnB.removeChild(columnB.lastChild);

        const shuffledA = [...gameData.columnA.items].sort(() => Math.random() - 0.5);
        const shuffledB = [...gameData.columnB.items].sort(() => Math.random() - 0.5);

        shuffledA.forEach((item, index) => {
            columnA.appendChild(createItem(item, 'A', item.id.replace('item', '') - 1, 'left'));
        });

        shuffledB.forEach((item, index) => {
            columnB.appendChild(createItem(item, 'B', item.id.replace('item', '') - 1, 'right'));
        });

        setTimeout(adjustRowHeights, 100); // Slightly longer delay to account for image loading
    }

    // Preload images function for better performance
    function preloadImages() {
        if (!gameData) return;
        
        const allImages = [];
        
        // Collect all image sources
        [...gameData.columnA.items, ...gameData.columnB.items].forEach(item => {
            if (item.image) {
                const formattedSrc = formatBase64Image(item.image);
                if (formattedSrc) {
                    allImages.push(formattedSrc);
                }
            }
        });
        
        // Preload all images
        Promise.all(allImages.map(src => loadImage(src)))
            .then(() => {
                console.log('All images preloaded');
                // Adjust heights again after all images are loaded
                setTimeout(adjustRowHeights, 50);
            })
            .catch(error => {
                console.warn('Some images failed to preload:', error);
            });
    }

    function handleItemClick(event) {
        const item = event.currentTarget;
        
        if (item.classList.contains('correct')) {
            return;
        }

        const dot = item.querySelector('.connection-dot');

        if (!selectedItem) {
            selectedItem = item;
            item.classList.add('selected');
        } else if (selectedItem !== item) {
            const selectedDot = selectedItem.querySelector('.connection-dot');
            
            if (selectedDot.dataset.column !== dot.dataset.column && !selectedItem.classList.contains('correct')) {
                item.classList.add('selected');
                
                setTimeout(() => {
                    createConnection(selectedItem, item);
                    
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
        line.setAttribute('stroke', '#5c8dad');
        line.setAttribute('stroke-width', '2');
        line.style.pointerEvents = 'none';

        line.setAttribute('x1', dot1.getBoundingClientRect().left + dot1.offsetWidth / 2);
        line.setAttribute('y1', dot1.getBoundingClientRect().top + dot1.offsetHeight / 2);
        line.setAttribute('x2', dot1.getBoundingClientRect().left + dot1.offsetWidth / 2);
        line.setAttribute('y2', dot1.getBoundingClientRect().top + dot1.offsetHeight / 2);

        svg.appendChild(line);

        line.getBoundingClientRect();

        requestAnimationFrame(() => {
            line.style.transition = 'all 0.3s ease-in-out';
            updateLinePosition(line, dot1, dot2);
        });

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

        const pairs = gameData.columnA.items.map(itemData => {
            const itemA = itemsA.find(el => el.dataset.id === itemData.id);
            const itemB = itemsB.find(el => el.dataset.id === itemData.id);
            
            if (itemA && itemB) {
                return {
                    itemA,
                    itemB,
                    yPosition: itemA.getBoundingClientRect().top
                };
            }
            return null;
        }).filter(pair => pair !== null);

        pairs.sort((a, b) => a.yPosition - b.yPosition);

        pairs.forEach((pair, index) => {
            setTimeout(() => {
                pair.itemA.classList.add('correct');
                pair.itemB.classList.add('correct');

                const dot1 = pair.itemA.querySelector('.connection-dot');
                const dot2 = pair.itemB.querySelector('.connection-dot');

                dot1.classList.add('blink');
                dot2.classList.add('blink');

                setTimeout(() => {
                    dot1.classList.remove('blink');
                    dot2.classList.remove('blink');
                }, 300);

                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('stroke', '#4caf50');
                line.setAttribute('stroke-width', '2');
                line.style.pointerEvents = 'none';

                line.setAttribute('x1', dot1.getBoundingClientRect().left + dot1.offsetWidth / 2);
                line.setAttribute('y1', dot1.getBoundingClientRect().top + dot1.offsetHeight / 2);
                line.setAttribute('x2', dot1.getBoundingClientRect().left + dot1.offsetWidth / 2);
                line.setAttribute('y2', dot1.getBoundingClientRect().top + dot1.offsetHeight / 2);

                svg.appendChild(line);

                line.getBoundingClientRect();

                requestAnimationFrame(() => {
                    line.style.transition = 'all 0.5s ease-in-out';
                    updateLinePosition(line, dot1, dot2);
                });

                connections.push({
                    line: line,
                    item1: pair.itemA,
                    item2: pair.itemB
                });
            }, index * 400);
        });

        const feedback = document.getElementById('feedback');
        feedback.textContent = "Here are the correct answers!";
        feedback.className = 'feedback correct';
        setTimeout(() => {
            feedback.className = 'feedback';
        }, pairs.length * 400 + 1000);
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

    // Initialize image preloading after game data is loaded
    const originalInitializeGame = initializeGame;
    initializeGame = function() {
        originalInitializeGame();
        preloadImages();
    };
});