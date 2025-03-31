document.addEventListener('DOMContentLoaded', function() {
    // State
    let words = [];
    let selectedWords = [];
    let currentIndex = 0;

    // DOM Elements
    const selectionScreen = document.getElementById('selectionScreen');
    const displayScreen = document.getElementById('displayScreen');
    const wordList = document.querySelector('.word-list');
    const nextBtn = document.getElementById('nextBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextWordBtn = document.getElementById('nextWordBtn');
    const homeBtn = document.getElementById('homeBtn');
    const playAudioBtn = document.getElementById('playAudio');
    const paginationDots = document.querySelector('.pagination-dots');

    // Cache word display elements
    const wordTextElement = document.querySelector('.word-text');
    const wordMeaningElement = document.querySelector('.word-meaning');
    const exampleBoxElement = document.querySelector('.example-box');
    const currentIndexSpan = document.getElementById('currentIndex');
    const totalWordsSpan = document.getElementById('totalWords');

    // Load words from JSON
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
                <label for="word-${word.word}">${word.word}</label>
            `;
            wordList.appendChild(div);
        });

        // Add change event listeners to checkboxes
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
    }

    // Event Listeners
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
        showSelectionScreen();
    });

    playAudioBtn.addEventListener('click', playCurrentAudio);

    function showSelectionScreen() {
        displayScreen.classList.remove('active');
        selectionScreen.classList.add('active');
        // Reset selection
        document.querySelectorAll('.word-item input[type="checkbox"]').forEach(cb => cb.checked = false);
        updateNextButtonState();
    }

    function showDisplayScreen() {
        selectionScreen.classList.remove('active');
        displayScreen.classList.add('active');
    }

    function displayCurrentWord() {
        if (!selectedWords.length) return;
        
        const word = selectedWords[currentIndex];
        
        // Update word and meaning
        if (wordTextElement) wordTextElement.textContent = word.word;
        if (wordMeaningElement) wordMeaningElement.textContent = word.meaning;
        
        // Update example
        if (exampleBoxElement) exampleBoxElement.textContent = word.example;
        
        // Update navigation
        if (currentIndexSpan) currentIndexSpan.textContent = currentIndex + 1;
        if (totalWordsSpan) totalWordsSpan.textContent = selectedWords.length;
        
        // Update button states
        if (prevBtn) prevBtn.disabled = currentIndex === 0;
        if (nextWordBtn) nextWordBtn.disabled = currentIndex === selectedWords.length - 1;
    }

    function playCurrentAudio() {
        const word = selectedWords[currentIndex];
        if (word && word.audio) {
            const audio = new Audio(word.audio);
            audio.play().catch(error => {
                console.error('Error playing audio:', error);
            });
        }
    }
});