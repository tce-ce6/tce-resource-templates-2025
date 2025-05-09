document.addEventListener("DOMContentLoaded", function () {
    let jsonData;
    let currentVocabIndex = 0;
    let selectedAnswer = null;

    let vocabAudios = [];
    let practiceAudios = [];

    const vocabScreen = document.getElementById("screen1");
    const fillupScreen = document.getElementById("screen2");

    
    document.getElementById("practice-btn").addEventListener("click", () => {
        stopVocabAudio();
        showScreen2();
    });

    document.getElementById("home-btn").addEventListener("click", () => {
        stopPracticeAudio();
        showScreen1();
    });

    
    fetch("lib/data.json")
        .then(response => response.json())
        .then(data => {
            jsonData = data;
            initialize(data);
        })
        .catch(error => console.error("Error loading JSON:", error));

    function initialize(data) {
        setupVocabScreen(data.answers.items);
        setupFillupScreen(data);
    }

    
    function setupVocabScreen(vocabItems) {
        displayVocabItem(vocabItems[currentVocabIndex]);
        renderPagination(vocabItems);
        updateNavButtons(vocabItems);
        document.getElementById("nextPage").addEventListener("click", () => {
            stopVocabAudio();
            if (currentVocabIndex < vocabItems.length - 1) {
                currentVocabIndex++;
                displayVocabItem(vocabItems[currentVocabIndex]);
                updatePaginationHighlight();
                updateNavButtons(vocabItems);
            }
        });

        document.getElementById("prevPage").addEventListener("click", () => {
            stopVocabAudio();
            if (currentVocabIndex > 0) {
                currentVocabIndex--;
                displayVocabItem(vocabItems[currentVocabIndex]);
                updatePaginationHighlight();
                updateNavButtons(vocabItems);
            }
        });
    }
    function updateNavButtons(vocabItems) {
        const nextBtn = document.getElementById("nextPage");
        const prevBtn = document.getElementById("prevPage");
    
        prevBtn.disabled = currentVocabIndex === 0;
        nextBtn.disabled = currentVocabIndex === vocabItems.length - 1;
    
        
        prevBtn.classList.toggle("disabled", prevBtn.disabled);
        nextBtn.classList.toggle("disabled", nextBtn.disabled);
    }

    function displayVocabItem(item) {
        const container = document.getElementById("vocab-container");
        container.innerHTML = "";

        
        stopVocabAudio();
        vocabAudios = [];

        
        const matchingAnswer = jsonData.answers.items.find(a => a.text === item.word || a.text === item.text);
        const audioSrc = matchingAnswer?.audio;

        
        let audio = null;
        if (audioSrc) {
            audio = new Audio(audioSrc);
            vocabAudios.push(audio);
        }

        
        const audioBtn = document.createElement("div");
        audioBtn.classList.add("audio-toggle-screen1");
        audioBtn.innerHTML = '<i class="fa fa-volume-up"></i>';
        let isPlaying = false;

        if (audio) {
            audioBtn.addEventListener("click", () => {
                stopVocabAudio();
                if (!isPlaying) {
                    audio.play();
                    isPlaying = true;
                    audioBtn.classList.add("active-audio");
                    audioBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                } else {
                    audio.pause();
                    isPlaying = false;
                    audioBtn.classList.remove("active-audio");
                    audioBtn.innerHTML = '<i class="fa fa-volume-up"></i>';
                }

                audio.onended = () => {
                    isPlaying = false;
                    audioBtn.classList.remove("active-audio");
                    audioBtn.innerHTML = '<i class="fa fa-volume-up"></i>';
                };
            });
        }

        const wordDiv = document.createElement("div");
        wordDiv.classList.add("vocab-word");
        wordDiv.innerHTML = "<b>" + item.text + "</b> - " + item.meaning;

        container.appendChild(wordDiv);
        container.appendChild(audioBtn);
    }

    function renderPagination(items) {
        const pagination = document.getElementById("paginationSmall");
        pagination.innerHTML = "";
    
        items.forEach((_, index) => {
            const btn = document.createElement("div");
            btn.classList.add("page-button");
            btn.textContent = index + 1;
            if (index === currentVocabIndex) btn.classList.add("active-page");
            btn.addEventListener("click", () => {
                stopVocabAudio();
                currentVocabIndex = index;
                displayVocabItem(items[currentVocabIndex]);
                updatePaginationHighlight();
                updateNavButtons(items);
            });
            pagination.appendChild(btn);
        });
    
        const paginationLine = document.createElement("div");
        paginationLine.classList.add("pagination-line");
        pagination.appendChild(paginationLine);
    
        setTimeout(() => {
            const prevBtn = document.getElementById("prevPage");
            const nextBtn = document.getElementById("nextPage");
            const pageButtons = pagination.querySelectorAll(".page-button");
    
            let totalWidth = 0;
    
            if (prevBtn) totalWidth += prevBtn.offsetWidth;
            if (nextBtn) totalWidth += nextBtn.offsetWidth;
    
            pageButtons.forEach(btn => {
                totalWidth += btn.offsetWidth;
            });
    
            paginationLine.style.width = `${totalWidth+150}px`;
            paginationLine.style.margin = "0 auto";
        }, 0);
    
        updateNavButtons(items);
    }
    
    function OLD_renderPagination(items) {
        
        const pagination = document.getElementById("paginationSmall");
        pagination.innerHTML = "";
        
        const paginationLine = document.createElement("div");
        pagination.appendChild(paginationLine);
        paginationLine.classList.add("pagination-line");

        items.forEach((_, index) => {
            const btn = document.createElement("div");
            btn.classList.add("page-button");
            btn.textContent = index + 1;
            if (index === currentVocabIndex) btn.classList.add("active-page");
            btn.addEventListener("click", () => {
                stopVocabAudio();
                currentVocabIndex = index;
                displayVocabItem(items[currentVocabIndex]);
                updatePaginationHighlight();
                updateNavButtons(items);
            });
            pagination.appendChild(btn);
        });

    }
   
    

    function updatePaginationHighlight() {
        document.querySelectorAll(".page-button").forEach((btn, idx) => {
            btn.classList.toggle("active-page", idx === currentVocabIndex);
        });
    }

    function setupFillupScreen(data) {
        const instruction = document.getElementById("instructionText");
        const questions = document.getElementById("questions-container");
        const answers = document.getElementById("answers-container");
        const feedback = document.getElementById("feedback");

        instruction.textContent = data.instructionText || "";
        questions.innerHTML = "";
        answers.innerHTML = "";
        feedback.textContent = "";

        practiceAudios = [];
        selectedAnswer = null;

        const blankWidth = `${Math.max(...data.answers.items.map(a => a.text.length-2))}ch`;
        const shuffledQuestions = shuffleArray(data.questions.items);

        shuffledQuestions.forEach((q, index) => {
            const wrapper = document.createElement("div");
            wrapper.classList.add("question-wrapper");

            const audioBtn = document.createElement("div");
            audioBtn.classList.add("audio-toggle");
            audioBtn.innerHTML = '<i class="fa fa-volume-up"></i>';
            const audio = new Audio(q.audio);
            practiceAudios.push(audio);

            let isPlaying = false;
            audioBtn.addEventListener("click", () => {
                stopPracticeAudio();
                if (!isPlaying) {
                    audio.play();
                    audioBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                    audioBtn.classList.add("active-audio");
                } else {
                    audio.pause();
                    audioBtn.innerHTML = '<i class="fa fa-volume-up"></i>';
                    audioBtn.classList.remove("active-audio");
                }
                isPlaying = !isPlaying;

                audio.onended = () => {
                    isPlaying = false;
                    audioBtn.innerHTML = '<i class="fa fa-volume-up"></i>';
                    audioBtn.classList.remove("active-audio");
                };
            });

            wrapper.appendChild(audioBtn);

            const numberDiv = document.createElement("div");
            numberDiv.classList.add("question-number");
            numberDiv.textContent = `${index + 1}`;
            wrapper.appendChild(numberDiv);

            const questionElement = document.createElement("div");
            questionElement.classList.add("question-text");
            const blankHTML = `<span class='blank' data-id='${q.id}' style='display:inline-block; width:${blankWidth}; border-bottom:1px solid black;'></span>`;
            questionElement.innerHTML = q.text.replace(/<blank>/gi, blankHTML);
            wrapper.appendChild(questionElement);

            questions.appendChild(wrapper);
        });

        shuffleArray(data.answers.items).forEach(answer => {
            const answerEl = document.createElement("div");
            answerEl.classList.add("answer");
            answerEl.textContent = answer.text;
            answerEl.dataset.answer = answer.text;

            answerEl.addEventListener("click", () => selectAnswer(answer.text));
            answers.appendChild(answerEl);
        });

        setupBlankClicks();
    }

    function selectAnswer(answer) {
        selectedAnswer = answer;
        document.querySelectorAll(".answer").forEach(el => el.classList.remove("selected"));
        const selectedEl = document.querySelector(`.answer[data-answer="${CSS.escape(answer)}"]`);
        if (selectedEl) selectedEl.classList.add("selected");
    }

    function setupBlankClicks() {
        document.querySelectorAll(".blank").forEach(blank => {
            blank.addEventListener("click", function () {
                if (!selectedAnswer) return;

                this.textContent = selectedAnswer;
                this.dataset.selected = selectedAnswer;

                const correct = jsonData.answers.items.find(a => a.id === this.dataset.id);

                if (selectedAnswer === correct.text) {
                    this.classList.add("correct");
                    this.style.pointerEvents = "none";

                    const usedAnswer = document.querySelector(`.answer[data-answer="${CSS.escape(selectedAnswer)}"]`);
                    if (usedAnswer) {
                        usedAnswer.classList.add("disabled-answer");
                        usedAnswer.style.pointerEvents = "none";
                    }

                    const allCorrect = Array.from(document.querySelectorAll(".blank")).every(b => {
                        const a = jsonData.answers.items.find(x => x.id === b.dataset.id);
                        return b.dataset.selected === a.text;
                    });

                    if (allCorrect) document.getElementById("feedback").textContent = jsonData.feedback.correct;
                } else {
                    this.classList.add("flash-red");
                    document.getElementById("feedback").textContent = jsonData.feedback.incorrect;
                    setTimeout(() => {
                        this.textContent = "";
                        this.dataset.selected = "";
                        this.classList.remove("flash-red");
                        document.getElementById("feedback").textContent = "";
                    }, 1000);
                }

                document.querySelectorAll('.answer').forEach(el => el.classList.remove('selected'));
                selectedAnswer = null;
            });
        });
    }

    function stopVocabAudio() {
        vocabAudios.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        document.querySelectorAll(".audio-toggle-screen1").forEach(btn => {
            btn.innerHTML = '<i class="fa fa-volume-up"></i>';
            btn.classList.remove("active-audio");
        });
    }

    function stopPracticeAudio() {
        practiceAudios.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        document.querySelectorAll(".audio-toggle").forEach(btn => {
            btn.innerHTML = '<i class="fa fa-volume-up"></i>';
            btn.classList.remove("active-audio");
        });
    }

    function shuffleArray(arr) {
        return arr.slice().sort(() => Math.random() - 0.5);
    }

    document.getElementById("reset-btn").addEventListener("click", () => {
        stopPracticeAudio();
        setupFillupScreen(jsonData);
    });

    document.getElementById("show-answers-btn").addEventListener("click", () => {
        document.querySelectorAll(".blank").forEach(blank => {
            const a = jsonData.answers.items.find(ans => ans.id === blank.dataset.id);
            blank.textContent = a.text;
            blank.dataset.selected = a.text;
        });
    });

    function showScreen1() {
        stopPracticeAudio();
    
        fillupScreen.classList.remove("show");
        fillupScreen.classList.add("hide-left");
    

        vocabScreen.classList.remove("hidden", "hide-left");
        void vocabScreen.offsetWidth; // Force reflow
        vocabScreen.classList.add("show");
    

        setTimeout(() => {
            fillupScreen.classList.add("hidden");
        }, 500);
    }
    
    function showScreen2() {
        stopVocabAudio();
        vocabScreen.classList.remove("show");
        vocabScreen.classList.add("hide-left");
    
        
        fillupScreen.classList.remove("hidden");
        fillupScreen.classList.remove("hide-left");
    
        
        void fillupScreen.offsetWidth;
        fillupScreen.classList.add("show");
    
        setTimeout(() => {
            vocabScreen.classList.add("hidden");
        }, 500);
    }
    
    
    
});
