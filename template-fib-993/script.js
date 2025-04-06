document.addEventListener("DOMContentLoaded", function () {
    let jsonData;
    let allAudios = [];

    fetch("data.json")
        .then(response => response.json())
        .then(data => {
            jsonData = data;
            initialize(jsonData);
        })
        .catch(error => console.error("Error loading JSON:", error));

    function initialize(data) {
        const instructionElement = document.getElementById("instructionText");
        const questionsContainer = document.getElementById("questions-container");
        const answersContainer = document.getElementById("answers-container");
        const feedbackElement = document.getElementById("feedback");

        instructionElement.textContent = data.instructionText || "";
        questionsContainer.innerHTML = "";
        answersContainer.innerHTML = "";
        feedbackElement.textContent = "";
        allAudios = [];

        let maxAnswerLength = Math.max(...data.answers.items.map(a => a.text.length));
        let blankWidth = `${maxAnswerLength}ch`;

        let shuffledQuestions = shuffleArray(data.questions.items);

        shuffledQuestions.forEach((q, index) => {
            let wrapper = document.createElement("div");
            wrapper.classList.add("question-wrapper");

            

            let audioBtn = document.createElement("div");
            audioBtn.classList.add("audio-toggle");
            audioBtn.innerHTML = '<i class="fa fa-volume-up"></i>';
            let audio = new Audio(q.audio);
            allAudios.push(audio);
            let isPlaying = false;

            audioBtn.addEventListener("click", () => {
                if (!isPlaying) {
                    stopAllAudio();
                    audio.play();
                    audioBtn.classList.add("active-audio");
                    audioBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                } else {
                    audio.pause();
                    audioBtn.classList.remove("active-audio");
                    audioBtn.innerHTML = '<i class="fa fa-volume-up"></i>';
                }
                isPlaying = !isPlaying;

                audio.onended = () => {
                    isPlaying = false;
                    audioBtn.classList.remove("active-audio");
                    audioBtn.innerHTML = '<i class="fa fa-volume-up"></i>';
                };
            });
            wrapper.appendChild(audioBtn);

            let numberDiv = document.createElement("div");
            numberDiv.classList.add("question-number");
            numberDiv.textContent = `${index + 1}`;
            wrapper.appendChild(numberDiv);

            let questionElement = document.createElement("div");
            questionElement.classList.add("question-text");
            const blankHTML = `<span class='blank' data-id='${q.id}' style='display:inline-block; width:${blankWidth}; border-bottom:1px solid black;'></span>`;
            questionElement.innerHTML = q.text.replace(/<blank>/gi, blankHTML);
            wrapper.appendChild(questionElement);

            questionsContainer.appendChild(wrapper);
        });

        let shuffledAnswers = shuffleArray(data.answers.items);
        shuffledAnswers.forEach(answer => {
            let answerElement = document.createElement("div");
            answerElement.classList.add("answer");
            answerElement.textContent = answer.text;
            answerElement.dataset.answer = answer.text;
            answersContainer.appendChild(answerElement);

            answerElement.addEventListener("click", () => selectAnswer(answer.text));
        });

        setupBlankClicks();
    }

    let selectedAnswer = null;

    function selectAnswer(answer) {
        selectedAnswer = answer;
    }

    function setupBlankClicks() {
        document.querySelectorAll(".blank").forEach(blank => {
            blank.addEventListener("click", function handler() {
                if (selectedAnswer) {
                    this.textContent = selectedAnswer;
                    this.dataset.selected = selectedAnswer;
    
                    const answer = jsonData.answers.items.find(a => a.id === this.dataset.id);
                    if (selectedAnswer === answer.text) {
                        // Correct immediately? Disable right away
                        this.classList.add("correct");
                        this.style.pointerEvents = "none";
                    }
    
                    selectedAnswer = null;
                }
            });
        });
    }

    function stopAllAudio() {
        allAudios.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        document.querySelectorAll(".audio-toggle").forEach(btn => {
            btn.innerHTML = '<i class="fa fa-volume-up"></i>';
            btn.classList.remove("active-audio");
        });
    }

    function shuffleArray(array) {
        return array.sort(() => Math.random() - 0.5);
    }

    document.getElementById("check-btn").addEventListener("click", () => {
        let correctAnswers = jsonData.answers.items;
        let blanks = document.querySelectorAll(".blank");
        let allCorrect = true;
    
        blanks.forEach(blank => {
            let correctAnswer = correctAnswers.find(a => a.id === blank.dataset.id);
            if (blank.dataset.selected === correctAnswer.text) {
                blank.classList.add("correct");
                blank.style.pointerEvents = "none";
            } else {
                allCorrect = false;
            }
        });
    
        document.getElementById("feedback").textContent = allCorrect
            ? jsonData.feedback.correct
            : jsonData.feedback.incorrect;
    });

    document.getElementById("reset-btn").addEventListener("click", () => {
        initialize(jsonData);
    });

    document.getElementById("show-answers-btn").addEventListener("click", () => {
        let correctAnswers = jsonData.answers.items;
        document.querySelectorAll(".blank").forEach(blank => {
            let answer = correctAnswers.find(a => a.id === blank.dataset.id);
            blank.textContent = answer.text;
            blank.dataset.selected = answer.text;
        });
    });
});