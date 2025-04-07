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
    
        // Remove selection from all answers
        document.querySelectorAll('.answer').forEach(el => el.classList.remove('selected'));
    
        // Add selection to the clicked answer
        const selectedEl = document.querySelector(`.answer[data-answer="${CSS.escape(answer)}"]`);
        if (selectedEl) {
            selectedEl.classList.add("selected");
        }
    }

    function setupBlankClicks() {
        document.querySelectorAll(".blank").forEach(blank => {
            blank.addEventListener("click", function handler() {
                if (selectedAnswer) {
                    this.textContent = selectedAnswer;
                    this.dataset.selected = selectedAnswer;
    
                    const answer = jsonData.answers.items.find(a => a.id === this.dataset.id);
                    if (selectedAnswer === answer.text) {
                        this.classList.add("correct");
                        this.style.pointerEvents = "none";
    
                        const usedAnswer = document.querySelector(`.answer[data-answer="${CSS.escape(selectedAnswer)}"]`);
                        if (usedAnswer) {
                            usedAnswer.classList.add("disabled-answer");
                            usedAnswer.style.pointerEvents = "none";
                        }
    
                        // After correct, check if all are now correct
                        const correctAnswers = jsonData.answers.items;
                        const blanks = Array.from(document.querySelectorAll('.blank'));
    
                        const allCorrect = blanks.every(blank => {
                            const correctAnswer = correctAnswers.find(a => a.id === blank.dataset.id);
                            return blank.dataset.selected === correctAnswer.text;
                        });
    
                        if (allCorrect) {
                            document.getElementById("feedback").textContent = jsonData.feedback.correct;
                        }
    
                    } else {
                        // Incorrect attempt
                        this.classList.add("flash-red");
                        document.getElementById("feedback").textContent = jsonData.feedback.incorrect;
    
                        setTimeout(() => {
                            this.textContent = "";
                            this.dataset.selected = "";
                            this.classList.remove("flash-red");
                            document.getElementById("feedback").textContent  = "";
                        }, 1000);
                    }
    
                    // Clear selected state
                    document.querySelectorAll('.answer').forEach(el => el.classList.remove('selected'));
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