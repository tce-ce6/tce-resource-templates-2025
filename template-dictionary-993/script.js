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
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            displayCurrentWord();
        }
    });

    nextWordBtn.addEventListener('click', () => {
        if (currentIndex < selectedWords.length - 1) {
            currentIndex++;
            displayCurrentWord();
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
        const word = selectedWords[currentIndex];
        
        // Update word and meaning
        document.querySelector('.word-text').textContent = word.word;
        document.querySelector('.word-meaning').textContent = word.meaning;
        
        // Update example
        document.querySelector('.example-box').textContent = word.example;
        
        // Update navigation
        currentIndexSpan.textContent = currentIndex + 1;
        totalWordsSpan.textContent = selectedWords.length;
        
        // Update button states
        prevBtn.disabled = currentIndex === 0;
        nextWordBtn.disabled = currentIndex === selectedWords.length - 1;
    }

    function playCurrentAudio() {
        const word = selectedWords[currentIndex];
        if (word.audio) {
            const audio = new Audio(word.audio);
            audio.play().catch(error => {
                console.error('Error playing audio:', error);
            });
        }
    }
});