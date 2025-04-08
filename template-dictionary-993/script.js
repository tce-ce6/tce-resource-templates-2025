document.addEventListener('DOMContentLoaded', function () {
    
    let words = [];
    let selectedWords = [];
    let currentIndex = 0;
    let currentAudio = null;
    let isPlaying = false;

    
    const selectionScreen = document.getElementById('selectionScreen');
    const displayScreen = document.getElementById('displayScreen');
    const wordList = document.querySelector('.word-list');
    const nextBtn = document.getElementById('nextBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextWordBtn = document.getElementById('nextWordBtn');
    const homeBtn = document.getElementById('homeBtn');
    const playAudioBtn = document.getElementById('playAudio');
    const stopAudioBtn = document.getElementById('stopAudio');
    const paginationDots = document.querySelector('.pagination-dots');

    
    const wordImageElement = document.querySelector('.word-image');
    const wordTextElement = document.querySelector('.word-text');
    const wordMeaningElement = document.querySelector('.word-meaning');
    const exampleBoxElement = document.querySelector('.example-box');
    const currentIndexSpan = document.getElementById('currentIndex');
    const totalWordsSpan = document.getElementById('totalWords');

    
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            words = data.words;
            displayWordList();
        })
        .catch(error => {
            console.error('Error loading words:', error);
        });

        function displayWordList() {
            wordList.innerHTML = '';
            words.forEach(word => {
                const div = document.createElement('div');
                div.className = 'word-item';
                div.innerHTML = `
                    <input type="checkbox" id="word-${word.word}" value="${word.word}">
                    <div class="word-item-text">${word.word}</div>
                `;
                
                const checkbox = div.querySelector('input[type="checkbox"]');
        
            
                div.addEventListener('click', (event) => {
                    if (event.target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                        updateNextButtonState();
                    }
                });
        
                wordList.appendChild(div);
            });
        
            
            document.querySelectorAll('.word-item input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', updateNextButtonState);
            });
        }
        

    function updateNextButtonState() {
        const hasSelection = document.querySelector('.word-item input[type="checkbox"]:checked');
        nextBtn.disabled = !hasSelection;
    }

    function updatePaginationDots() {
        if (!paginationDots) return;
    
        paginationDots.innerHTML = '';
    
        
        const line = document.createElement('div');
        line.className = 'pagination-line';
        paginationDots.appendChild(line);
    
        selectedWords.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = `dot${index === currentIndex ? ' active' : ''}`;
            dot.textContent = index + 1;
            dot.addEventListener('click', () => {
                currentIndex = index;
                displayCurrentWord();
                updatePaginationDots();
            });
    
            paginationDots.appendChild(dot);
        });
    
        
        const dots = document.querySelectorAll('.dot');
        if (dots.length > 1) {
            const firstDot = dots[0];
            const lastDot = dots[dots.length - 1];
            const containerRect = paginationDots.getBoundingClientRect();
            const firstDotRect = firstDot.getBoundingClientRect();
            const lastDotRect = lastDot.getBoundingClientRect();
    
            const startX = firstDotRect.left - containerRect.left + firstDotRect.width / 2;
            const endX = lastDotRect.left - containerRect.left + lastDotRect.width / 2;
            line.style.width = `${endX - startX + 200}px`;
            //line.style.left = `${startX}px`;
        }
    }
    

    
    selectAllBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.word-item input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
        updateNextButtonState();
    });

    nextBtn.addEventListener('click', () => {
        const checkedBoxes = document.querySelectorAll('.word-item input[type="checkbox"]:checked');
        selectedWords = Array.from(checkedBoxes).map(cb => {
            return words.find(w => w.word === cb.value);
        });

        if (selectedWords.length > 0) {
            currentIndex = 0;
            showDisplayScreen();
            displayCurrentWord();
            updatePaginationDots();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            displayCurrentWord();
            updatePaginationDots();
        }
    });

    nextWordBtn.addEventListener('click', () => {
        if (currentIndex < selectedWords.length - 1) {
            currentIndex++;
            displayCurrentWord();
            updatePaginationDots();
        }
    });

    homeBtn.addEventListener('click', () => {
        stopAudio(); 
        showSelectionScreen();
    });

    playAudioBtn.addEventListener('click', toggleAudio);
    stopAudioBtn.addEventListener('click', replayAudio);

    function showSelectionScreen() {
        displayScreen.classList.remove('active');
        selectionScreen.classList.add('active');
        document.querySelectorAll('.word-item input[type="checkbox"]').forEach(cb => cb.checked = false);
        updateNextButtonState();
    }

    function showDisplayScreen() {
        selectionScreen.classList.remove('active');
        displayScreen.classList.add('active');
    }

    function displayCurrentWord() {
        if (!selectedWords.length) return;

        stopAudio(); 
        const word = selectedWords[currentIndex];

        if (wordTextElement) wordTextElement.textContent = word.word + " ";
        if (wordMeaningElement) wordMeaningElement.textContent = " - "+word.meaning;
        if (exampleBoxElement) exampleBoxElement.textContent = word.example;

        if (word.image) {
            wordImageElement.style.backgroundImage = `url('${word.image}')`;
            wordImageElement.style.display = 'block';
        } else {
            wordImageElement.style.display = 'none';
        }

        if (currentIndexSpan) currentIndexSpan.textContent = currentIndex + 1;
        if (totalWordsSpan) totalWordsSpan.textContent = selectedWords.length;

        prevBtn.disabled = currentIndex === 0;
        nextWordBtn.disabled = currentIndex === selectedWords.length - 1;
    }

    function toggleAudio() {
        const word = selectedWords[currentIndex];

        if (!word || !word.audio) return;

        if (!currentAudio) {
            currentAudio = new Audio(word.audio);
            currentAudio.play().then(() => {
                isPlaying = true;
                updatePlayButton();
            }).catch(error => console.error('Error playing audio:', error));

            currentAudio.onended = () => {
                isPlaying = false;
                updatePlayButton();
            };
        } else if (isPlaying) {
            currentAudio.pause();
            isPlaying = false;
            
            updatePlayButton();
            //stopAudio();
        } else {
            currentAudio.play().then(() => {
                isPlaying = true;
            }).catch(error => console.error('Error resuming audio:', error));
        }

        updatePlayButton();
    }

    function stopAudio() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
            isPlaying = false;
            updatePlayButton();
            
        }
    }

    function replayAudio() {
        currentAudio.currentTime = 0;
            currentAudio.play();
            isPlaying = true;
            updatePlayButton();
    }
    

    function updatePlayButton() {
        playAudioBtn.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    }
});
